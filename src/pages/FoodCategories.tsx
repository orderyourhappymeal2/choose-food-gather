import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChefHat, Receipt, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NavigationDropdown from "@/components/NavigationDropdown";
import { supabase } from "@/integrations/supabase/client";

interface Meal {
  meal_id: string;
  meal_name: string;
  meal_index: number;
  plan_id: string;
}

interface Shop {
  shop_id: string;
  shop_name: string;
  url_pic: string;
  description: string;
  food_type_1: string;
  food_type_2: string;
}

const FoodCategories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [orderCache, setOrderCache] = useState<any>({});

  useEffect(() => {
    // Check if user info exists
    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) {
      navigate('/');
      return;
    }
    
    setUserInfo(JSON.parse(storedUserInfo));
    fetchMealsAndShops(JSON.parse(storedUserInfo).plan_id);
    
    // Load order cache
    const cachedOrders = localStorage.getItem('orderCache');
    if (cachedOrders) {
      setOrderCache(JSON.parse(cachedOrders));
    }
  }, []);

  const fetchMealsAndShops = async (planId: string) => {
    try {
      // Fetch meals for this plan
      const { data: mealsData, error: mealsError } = await supabase
        .from('meal')
        .select('*')
        .eq('plan_id', planId)
        .order('meal_index');

      if (mealsError) throw mealsError;

      // Fetch all shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shop')
        .select('*');

      if (shopsError) throw shopsError;
      
      setMeals(mealsData || []);
      setShops(shopsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShopSelect = (meal: Meal, shop: Shop) => {
    navigate(`/menu/${shop.shop_id}`, {
      state: { meal, shop }
    });
  };

  const getSelectedFood = (mealId: string, shopId: string) => {
    const key = `${mealId}_${shopId}`;
    return orderCache[key];
  };

  const hasAnyOrders = () => {
    return Object.keys(orderCache).length > 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-welcome)] flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-foreground">กำลังโหลดข้อมูล...</p>
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <ChefHat className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">เลือกอาหารตามมื้อ</h1>
          <p className="text-muted-foreground">กรุณาเลือกร้านและอาหารสำหรับแต่ละมื้อ</p>
          {userInfo && (
            <p className="text-sm text-foreground/80 mt-2">สวัสดี {userInfo.nickname}</p>
          )}
        </div>

        {/* Meals */}
        <div className="space-y-6 mb-8">
          {meals.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
              <CardContent className="p-6 text-center">
                <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">ยังไม่มีมื้ออาหารที่กำหนดไว้</p>
              </CardContent>
            </Card>
          ) : (
            meals.map((meal) => (
              <Card key={meal.meal_id} className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-orange/30">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-center">{meal.meal_name}</h2>
                  
                  {shops.length === 0 ? (
                    <div className="text-center py-8">
                      <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">ยังไม่มีร้านอาหารสำหรับมื้อนี้</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {shops.map((shop) => {
                        const selectedFood = getSelectedFood(meal.meal_id, shop.shop_id);
                        return (
                          <Card 
                            key={shop.shop_id} 
                            className={`cursor-pointer transition-all hover:scale-[1.02] border-2 ${
                              selectedFood 
                                ? 'border-primary bg-primary/5' 
                                : 'border-brand-pink/30 hover:border-primary/50'
                            }`}
                            onClick={() => handleShopSelect(meal, shop)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={shop.url_pic || '/placeholder.svg'} 
                                  alt={shop.shop_name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-lg">{shop.shop_name}</h3>
                                    {selectedFood && (
                                      <Check className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{shop.description}</p>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-brand-pink/20 text-primary px-2 py-1 rounded">
                                      {shop.food_type_1}
                                    </span>
                                    {shop.food_type_2 && (
                                      <span className="text-xs bg-brand-orange/20 text-secondary px-2 py-1 rounded">
                                        {shop.food_type_2}
                                      </span>
                                    )}
                                  </div>
                                  {selectedFood && (
                                    <div className="mt-2 p-2 bg-white/60 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={selectedFood.food_image || '/placeholder.svg'} 
                                          alt={selectedFood.food_name}
                                          className="w-8 h-8 rounded object-cover"
                                        />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{selectedFood.food_name}</p>
                                          {selectedFood.selected_toppings.length > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                              ท็อปปิ้ง: {selectedFood.selected_toppings.join(', ')}
                                            </p>
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-primary">฿{selectedFood.food_price}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Order Summary Button */}
        {hasAnyOrders() && (
          <Button 
            onClick={() => navigate('/order-summary')}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
          >
            <Receipt className="w-5 h-5 mr-2" />
            ดูสรุปรายการ ({Object.keys(orderCache).length})
          </Button>
        )}
      </div>
    </div>
  );
};

export default FoodCategories;