import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChefHat, Receipt, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";

interface Meal {
  meal_id: string;
  meal_name: string;
  meal_index: number;
  plan_id: string;
  shop_id: string | null;
  food_id: string | null;
}

interface Shop {
  shop_id: string;
  shop_name: string;
  url_pic: string;
  description: string;
  food_type_1: string;
  food_type_2: string;
}

interface Food {
  food_id: string;
  food_name: string;
  price: number;
  url_pic: string;
}

const FoodCategories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealShops, setMealShops] = useState<Record<string, Shop>>({});
  const [mealFoods, setMealFoods] = useState<Record<string, Food>>({});
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
    
    const parsedUserInfo = JSON.parse(storedUserInfo);
    setUserInfo(parsedUserInfo);
    fetchMealsAndShops(parsedUserInfo.plan_id);
    
    // Load order cache with plan isolation
    const cacheKey = `orderCache_${parsedUserInfo.plan_id}`;
    const cachedOrders = localStorage.getItem(cacheKey);
    if (cachedOrders) {
      const allCachedOrders = JSON.parse(cachedOrders);
      // Filter to only show orders for current plan
      const filteredOrders: any = {};
      Object.entries(allCachedOrders).forEach(([key, value]) => {
        const order = value as any;
        if (order.plan_id === parsedUserInfo.plan_id) {
          filteredOrders[key] = order;
        }
      });
      setOrderCache(filteredOrders);
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

      const shops: Record<string, Shop> = {};
      const foods: Record<string, Food> = {};

      // For each meal, fetch shop and food data if they exist
      for (const meal of mealsData || []) {
        if (meal.shop_id && !shops[meal.shop_id]) {
          const { data: shopData } = await supabase
            .from('shop')
            .select('*')
            .eq('shop_id', meal.shop_id)
            .maybeSingle();
          
          if (shopData) {
            shops[meal.shop_id] = shopData;
          }
        }

        if (meal.food_id && !foods[meal.food_id]) {
          const { data: foodData } = await supabase
            .from('food')
            .select('food_id, food_name, price, url_pic')
            .eq('food_id', meal.food_id)
            .maybeSingle();
          
          if (foodData) {
            foods[meal.food_id] = foodData;
          }
        }
      }
      
      setMeals(mealsData || []);
      setMealShops(shops);
      setMealFoods(foods);
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
    console.log('🔍 handleShopSelect called:', { 
      meal_name: meal.meal_name,
      has_food_id: !!meal.food_id,
      shop_name: shop.shop_name 
    });
    
    // Pre-defined meals (with food_id) should not allow navigation
    // This is already handled by UI (!isPreSelected check), but adding safety here
    if (meal.food_id) {
      console.log('❌ Navigation blocked: Meal is pre-defined');
      return;
    }
    
    console.log('✅ Navigating to menu selection');
    navigate(`/menu/${shop.shop_id}`, {
      state: { meal, shop }
    });
  };

  const getSelectedFood = (mealId: string, shopId: string) => {
    if (!userInfo) return null;
    const key = `${userInfo.plan_id}_${mealId}_${shopId}`;
    return orderCache[key];
  };

  const hasAnyOrders = () => {
    return Object.keys(orderCache).length > 0;
  };

  const hasCompletedAllRequiredSelections = () => {
    // Check all meals to see if they are properly selected
    for (const meal of meals) {
      // Pre-defined meals (have food_id) are already complete
      if (meal.food_id) {
        continue;
      }
      
      // Custom meals (have shop_id but no food_id) must have selection in orderCache
      if (meal.shop_id && !meal.food_id) {
        const selectedFood = getSelectedFood(meal.meal_id, meal.shop_id);
        if (!selectedFood) {
          return false; // This meal is not selected
        }
      }
    }
    return true;
  };

  const getMissingSelections = () => {
    return meals.filter(meal => {
      if (meal.food_id) return false; // Pre-defined meals are complete
      if (meal.shop_id && !meal.food_id) {
        const selectedFood = getSelectedFood(meal.meal_id, meal.shop_id);
        return !selectedFood; // Return true if not selected
      }
      return false;
    });
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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
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
            meals.map((meal) => {
              const shop = meal.shop_id ? mealShops[meal.shop_id] : null;
              const preSelectedFood = meal.food_id ? mealFoods[meal.food_id] : null;
              const selectedFood = getSelectedFood(meal.meal_id, meal.shop_id || '');
              const isPreSelected = !!meal.food_id;
              const isSelected = isPreSelected || !!selectedFood;
              
              return (
                <div key={meal.meal_id} className="mb-6">
                  {/* Meal Name - Centered above container */}
                  <h2 className="text-xl font-semibold mb-3 text-center text-foreground">{meal.meal_name}</h2>
                  
                  <Card 
                    className={`bg-white/80 backdrop-blur-sm transition-all border-2 ${
                      isSelected 
                        ? 'border-green-500 shadow-md' 
                        : 'border-red-400 shadow-sm'
                    }`}
                  >
                    <CardContent className="p-6">
                      {!shop ? (
                      <div className="text-center py-8">
                        <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">ยังไม่มีร้านอาหารสำหรับมื้อนี้</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        <Card 
                          className={`transition-all border ${
                            isPreSelected 
                              ? 'border-green-200 bg-green-50/30' 
                              : selectedFood 
                                ? 'border-green-200 bg-white' 
                                : 'border-gray-200 bg-white/50'
                          }`}
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
                                  {isSelected && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                  {isPreSelected && (
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                      กำหนดแล้ว
                                    </span>
                                   )}
                                 </div>
                                 <p className="text-sm text-muted-foreground">{shop.description}</p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs bg-gradient-to-r from-brand-pink/20 to-brand-orange/20 text-primary px-2 py-1 rounded">
                                    {shop.food_type_1}
                                  </span>
                                  {shop.food_type_2 && (
                                    <span className="text-xs bg-brand-orange/20 text-secondary px-2 py-1 rounded">
                                      {shop.food_type_2}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Show pre-selected food */}
                                {preSelectedFood && (
                                  <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={preSelectedFood.url_pic || '/placeholder.svg'} 
                                        alt={preSelectedFood.food_name}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                       <div className="flex-1">
                                         <p className="text-sm font-medium">{preSelectedFood.food_name}</p>
                                       </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Show user-selected food */}
                                {selectedFood && !isPreSelected && (
                                  <div className="mt-2 p-2 bg-white/60 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={selectedFood.food_image || '/placeholder.svg'} 
                                        alt={selectedFood.food_name}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{selectedFood.food_name}</p>
                                         {selectedFood.selected_toppings && (
                                           <p className="text-xs text-muted-foreground">
                                             ท็อปปิ้ง: {Array.isArray(selectedFood.selected_toppings) 
                                               ? selectedFood.selected_toppings.join(', ')
                                               : selectedFood.selected_toppings}
                                           </p>
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                 )}
                                 
                                 {/* Select Food Button - Only show when not selected */}
                                 {!isPreSelected && !selectedFood && (
                                   <Button 
                                     onClick={() => handleShopSelect(meal, shop)}
                                     className="mt-3 ml-auto bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-200"
                                     variant="outline"
                                   >
                                     เลือกอาหาร
                                   </Button>
                                 )}
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                      </div>
                    )}
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        {/* Order Summary Button */}
        {hasCompletedAllRequiredSelections() && (
          <Button 
            onClick={() => navigate('/order-summary')}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
          >
            <Receipt className="w-5 h-5 mr-2" />
            ดูสรุปรายการ
          </Button>
        )}
        
        {/* Show message if not all selections are complete */}
        {!hasCompletedAllRequiredSelections() && getMissingSelections().length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm font-semibold text-center mb-2">
              กรุณาเลือกอาหารให้ครบทุกมื้อก่อนดูสรุปรายการ
            </p>
            <p className="text-red-500 text-xs text-center mb-2">
              ยังต้องเลือกอีก {getMissingSelections().length} มื้อ
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-red-600 text-xs font-medium">มื้อที่ยังไม่ได้เลือก:</p>
              {getMissingSelections().map((meal) => (
                <p key={meal.meal_id} className="text-red-500 text-xs ml-4">
                  • {meal.meal_name}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodCategories;