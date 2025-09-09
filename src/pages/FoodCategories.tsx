import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChefHat, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavigationDropdown from "@/components/NavigationDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FoodCategories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);

  useEffect(() => {
    // Check if user info exists
    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) {
      navigate('/');
      return;
    }
    
    const parsedUserInfo = JSON.parse(storedUserInfo);
    setUserInfo(parsedUserInfo);
    
    if (parsedUserInfo.plan_id) {
      fetchMeals(parsedUserInfo.plan_id);
    }
  }, []);

  const fetchMeals = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('meal')
        .select(`
          *,
          shop:shop_id (
            shop_id,
            shop_name,
            url_pic,
            description,
            food_type_1,
            food_type_2
          ),
          food:food_id (
            food_id,
            food_name,
            url_pic,
            price,
            description,
            food_type
          )
        `)
        .eq('plan_id', planId)
        .order('meal_index');

      if (error) throw error;
      
      setMeals(data || []);
    } catch (error) {
      console.error('Error fetching meals:', error);
      toast({
        title: "ไม่สามารถโหลดข้อมูลมื้ออาหารได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealClick = (meal: any) => {
    if (meal.shop_id) {
      // Navigate to menu selection for this specific meal
      navigate(`/menu/${meal.shop_id}`, { 
        state: { 
          meal,
          shop: meal.shop,
          userInfo
        }
      });
    }
  };

  const handleFinalSubmit = () => {
    // Navigate to order summary
    navigate('/order-summary');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-welcome)] flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-foreground">กำลังโหลดข้อมูลมื้ออาหาร...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] px-0 py-4 sm:p-4">
      <div className="max-w-2xl mx-auto pt-4 sm:pt-8 relative px-2 sm:px-0">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0 p-4 z-50">
          <NavigationDropdown />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">เลือกอาหารตามมื้อ</h1>
          <p className="text-muted-foreground">กรุณาเลือกอาหารสำหรับแต่ละมื้อ</p>
          {userInfo && (
            <p className="text-sm text-foreground/80 mt-2">สวัสดี {userInfo.nickname}</p>
          )}
        </div>

        {/* Meal Categories */}
        <div className="space-y-4 mb-8">
          {meals.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
              <CardContent className="p-6 text-center">
                <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">ยังไม่มีมื้ออาหารที่กำหนดไว้</p>
              </CardContent>
            </Card>
          ) : (
            meals.map((meal, index) => (
              <Card key={meal.meal_id} className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {meal.meal_index}
                    </div>
                    <h3 className="text-xl font-semibold">{meal.meal_name}</h3>
                  </div>
                  
                  {meal.shop ? (
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-brand-orange/30">
                      <div className="flex items-center gap-3">
                        <img 
                          src={meal.shop.url_pic || '/placeholder.svg'} 
                          alt={meal.shop.shop_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-medium block">{meal.shop.shop_name}</span>
                          <span className="text-sm text-muted-foreground">{meal.shop.food_type_1}</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleMealClick(meal)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 p-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-100 rounded-lg text-center text-muted-foreground">
                      ให้ผู้ใช้เลือกเอง
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleFinalSubmit}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
        >
          ดูสรุปการสั่งอาหาร
        </Button>
      </div>
    </div>
  );
};

export default FoodCategories;