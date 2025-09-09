import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, MapPin, Calendar, Clock, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NavigationDropdown from "@/components/NavigationDropdown";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const Welcome = () => {
  const [formData, setFormData] = useState({
    nickname: "",
    code: ""
  });
  const [planData, setPlanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const fetchPlanData = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plan')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (error) throw error;
      
      setPlanData(data);
    } catch (error) {
      console.error('Error fetching plan data:', error);
      toast({
        title: "ไม่พบข้อมูลแผนการจอง",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Default event data for when no plan is loaded
  const defaultEventData = {
    title: "การประชุมประจำเดือน มกราคม 2024",
    location: "ห้องประชุม A ชั้น 5", 
    date: "15 มกราคม 2567",
    time: "09:00 - 16:00 น."
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

    // Validate password
    if (formData.code !== planData.plan_pwd) {
      toast({
        title: "โค้ดเข้างานไม่ถูกต้อง",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check current number of people in this plan
      const { data: currentPeople, error: countError } = await supabase
        .from('person')
        .select('person_id')
        .eq('plan_id', planData.plan_id);

      if (countError) throw countError;

      // Check if adding this person would exceed the limit
      if (currentPeople && currentPeople.length >= planData.plan_maxp) {
        toast({
          title: "จำนวนผู้เข้าร่วมเต็มแล้ว",
          description: `สามารถรองรับได้สูงสุด ${planData.plan_maxp} คน`,
          variant: "destructive"
        });
        return;
      }

      // Check if this person already exists (prevent duplicate entries)
      const { data: existingPerson } = await supabase
        .from('person')
        .select('person_id')
        .eq('plan_id', planData.plan_id)
        .eq('person_name', formData.nickname)
        .single();

      if (existingPerson) {
        toast({
          title: "ชื่อเล่นนี้ถูกใช้ไปแล้ว",
          description: "กรุณาใช้ชื่อเล่นอื่น",
          variant: "destructive"
        });
        return;
      }

      // Insert new person
      const { data: newPerson, error: insertError } = await supabase
        .from('person')
        .insert({
          person_name: formData.nickname,
          plan_id: planData.plan_id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Store user data and navigate to food categories
      const userData = {
        ...formData,
        person_id: newPerson.person_id,
        plan_id: planData.plan_id
      };
      
      localStorage.setItem('userInfo', JSON.stringify(userData));
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
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0 p-4 z-50">
          <NavigationDropdown />
        </div>

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
                <label className="block text-sm font-medium mb-2">ชื่อเล่น</label>
                <Input
                  placeholder="กรอกชื่อเล่นของคุณ"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="bg-white border-brand-pink/50 focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">รหัส</label>
                <Input
                  placeholder="กรอกรหัสเข้าร่วมงาน"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
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