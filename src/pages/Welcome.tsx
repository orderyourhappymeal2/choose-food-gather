import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, MapPin, Calendar, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NavigationDropdown from "@/components/NavigationDropdown";

const Welcome = () => {
  const [formData, setFormData] = useState({
    nickname: "",
    code: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock event data (would come from admin in real app)
  const eventData = {
    title: "การประชุมประจำเดือน มกราคม 2024",
    location: "ห้องประชุม A ชั้น 5",
    date: "15 มกราคม 2567",
    time: "09:00 - 16:00 น."
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.nickname || !formData.code) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }
    
    // Store user data and navigate to food categories
    localStorage.setItem('userInfo', JSON.stringify(formData));
    navigate('/food-categories');
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] p-4">
      <div className="max-w-md mx-auto pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0">
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