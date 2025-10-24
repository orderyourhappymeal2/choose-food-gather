import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChefHat, MapPin, Calendar, Clock, Users, Info } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const Welcome = () => {
  const [formData, setFormData] = useState({
    nickname: "",
    code: "",
    contact: ""
  });
  const [planData, setPlanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin } = useAuth();
  const [searchParams] = useSearchParams();

  // Format date to Thai format with Buddhist Era
  const formatThaiDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "d MMMM yyyy", { locale: th }).replace(/\d{4}/, (year) => (parseInt(year) + 543).toString());
    } catch {
      return dateString;
    }
  };

  // Fetch plan data from URL parameter
  useEffect(() => {
    const planId = searchParams.get('plan');
    if (planId) {
      fetchPlanData(planId);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  // Redirect authenticated users to appropriate page (only if no plan parameter)
  useEffect(() => {
    const planId = searchParams.get('plan');
    // Don't redirect if accessing via plan link - allow public access
    if (admin && !planId) {
      if (admin.role === 'admin') {
        navigate('/super-user');
      } else if (admin.role === 'user') {
        navigate('/admin');
      }
    }
  }, [admin, navigate, searchParams]);

  const fetchPlanData = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plan')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (error) throw error;
      
      // Check if plan is in a valid state for public access
      if (data && data.plan_state !== "published") {
        // Redirect to admin login if plan is not published
        navigate('/', { replace: true });
        return;
      }
      
      setPlanData(data);
    } catch (error) {
      console.error('Error fetching plan data:', error);
      // Redirect to admin login if plan not found or other error
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Default event data for when no plan is loaded
  const defaultEventData = {
    title: "(เข้าหน้าแอดมิน เพื่อสร้างแบบฟอร์ม)",
    location: "สถานที่จัดงาน", 
    date: "วัน เดือน ปี ที่จัดงาน",
    time: "เวลาที่จัดงาน"
  };

  // Use plan data if available, otherwise use default
  const eventData = planData ? {
    title: planData.plan_name,
    location: planData.plan_location,
    date: formatThaiDate(planData.plan_date),
    time: planData.plan_time + " น."
  } : defaultEventData;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nickname || !formData.code) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    if (!planData) {
      toast({
        title: "ไม่พบข้อมูลแผนการจอง",
        variant: "destructive"
      });
      return;
    }

    // Validate plan state
    if (planData.plan_state !== "published") {
      toast({
        title: "ยังไม่เปิดรับการลงทะเบียน",
        description: "งานยังไม่เปิดรับการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
      return;
    }

    // Validate password
    if (formData.code !== planData.plan_pwd) {
      toast({
        title: "โค้ดเข้างานไม่ถูกต้อง",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check current number of people who have actually placed orders in this plan
      const { data: currentOrderedPeople, error: countError } = await supabase
        .from('person')
        .select(`
          person_id,
          order!inner(person_id)
        `)
        .eq('plan_id', planData.plan_id);

      if (countError) throw countError;

      // Count unique people who have placed orders
      const uniqueOrderedPeople = currentOrderedPeople ? 
        [...new Set(currentOrderedPeople.map(p => p.person_id))].length : 0;

      // Check if adding this person would exceed the limit
      if (uniqueOrderedPeople >= planData.plan_maxp) {
        toast({
          title: "จำนวนผู้เข้าร่วมเต็มแล้ว",
          description: `สามารถรองรับได้สูงสุด ${planData.plan_maxp} คน`,
          variant: "destructive"
        });
        return;
      }

      // Check if this person name already exists among people who have placed orders
      const { data: existingPerson } = await supabase
        .from('person')
        .select('person_id, person_name')
        .eq('plan_id', planData.plan_id)
        .eq('person_name', formData.nickname);

      // Check if any of these people have actual orders
      if (existingPerson && existingPerson.length > 0) {
        const personIds = existingPerson.map(p => p.person_id);
        const { data: existingOrders } = await supabase
          .from('order')
          .select('person_id')
          .in('person_id', personIds)
          .limit(1);

        if (existingOrders && existingOrders.length > 0) {
          toast({
            title: "ชื่อนี้ถูกใช้ไปแล้ว",
            description: "อาจมีผู้เข้าร่วมมีชื่อที่ซ้ำกัน อาจรบกวนให้ (กลุ่ม/หน่วยงาน) ในชื่อของท่านด้วยค่ะ",
            variant: "destructive"
          });
          return;
        }
      }

      // Store user data without person_id (will be created when order is confirmed)
      const userData = {
        ...formData,
        plan_id: planData.plan_id
      };
      
      localStorage.setItem('userInfo', JSON.stringify(userData));
      
      // Clear order cache for this plan to start fresh
      const cacheKey = `orderCache_${planData.plan_id}`;
      localStorage.removeItem(cacheKey);
      
      navigate('/food-categories');
      
    } catch (error) {
      console.error('Error creating person:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] px-0 py-4 sm:p-4">
      <div className="max-w-md mx-auto pt-4 sm:pt-8 relative px-2 sm:px-0">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChefHat className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Choose food</h1>
          <p className="text-lg text-muted-foreground mb-1">by GSB</p>
          <p className="text-base text-foreground font-medium">ระบบจองอาหารล่วงหน้า</p>
        </div>

        {/* Event Info Card */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">{eventData.title}</h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{eventData.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{eventData.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{eventData.time}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-orange/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">กรอกชื่อของท่าน</label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="bg-white border-brand-pink/50 focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">รหัสเข้างาน</label>
                <Input
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="bg-white border-brand-pink/50 focus:border-primary"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium">ช่องทางติดต่อ</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">ติดต่อในกรณีอาหารหมด ทางร้านเกิดปัญหา หรือ อื่นๆ</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.contact}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange('contact', value);
                  }}
                  className="bg-white border-brand-pink/50 focus:border-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button 
          onClick={handleSubmit}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
        >
          <ChefHat className="w-5 h-5 mr-2" />
          เริ่มสั่งอาหารกัน!
        </Button>
      </div>
    </div>
  );
};

export default Welcome;