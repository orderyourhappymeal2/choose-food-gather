import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ChevronDown, ChevronUp, UtensilsCrossed, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface MealOrdersModalProps {
  plan: any;
}

interface OrderData {
  order_id: string;
  food_id: string;
  topping: string | null;
  order_note: string | null;
  person: {
    person_name: string;
  };
  food: {
    food_name: string;
    url_pic: string | null;
  };
  meal: {
    meal_name: string;
    meal_index: number;
    shop: {
      shop_name: string;
      url_pic: string | null;
    };
  };
}

interface FoodVariant {
  food_name: string;
  food_url_pic: string | null;
  topping: string | null;
  order_note: string | null;
  persons: string[];
  count: number;
  index: number;
}

interface RestaurantSection {
  shop_name: string;
  shop_url_pic: string | null;
  food_variants: FoodVariant[];
  total_items: number;
}

interface MealGroup {
  meal_name: string;
  meal_index: number;
  restaurants: RestaurantSection[];
  total_items: number;
}

const MealOrdersModal = ({ plan }: MealOrdersModalProps) => {
  const [mealGroups, setMealGroups] = useState<MealGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openRestaurants, setOpenRestaurants] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  useEffect(() => {
    if (plan?.plan_id) {
      fetchMealOrders();
    }
  }, [plan?.plan_id]);

  const fetchMealOrders = async () => {
    try {
      setIsLoading(true);
      
      // Fetch orders with related data
      const { data: orders, error } = await supabase
        .from('order')
        .select(`
          order_id,
          food_id,
          topping,
          order_note,
          person:person_id (
            person_name
          ),
          food:food_id (
            food_name,
            url_pic
          ),
          meal:meal_id (
            meal_name,
            meal_index,
            shop:shop_id (
              shop_name,
              url_pic
            )
          )
        `)
        .eq('plan_id', plan.plan_id);

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('ไม่สามารถดึงข้อมูลรายการสั่งอาหารได้');
        return;
      }

      if (!orders || orders.length === 0) {
        setMealGroups([]);
        return;
      }

      // Group orders by meal first, then by restaurant
      const groupedData = groupOrdersByMeal(orders as OrderData[]);
      setMealGroups(groupedData);
      
      // Open first restaurant in first meal by default
      if (groupedData.length > 0 && groupedData[0].restaurants.length > 0) {
        const firstRestaurantKey = `${groupedData[0].meal_index}-${groupedData[0].restaurants[0].shop_name}`;
        setOpenRestaurants(new Set([firstRestaurantKey]));
      }

    } catch (error) {
      console.error('Error in fetchMealOrders:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const groupOrdersByMeal = (orders: OrderData[]): MealGroup[] => {
    // First, group by meal
    const mealMap = new Map<string, {
      meal_name: string;
      meal_index: number;
      restaurants: Map<string, {
        shop_name: string;
        shop_url_pic: string | null;
        orders: OrderData[];
      }>;
    }>();

    orders.forEach(order => {
      if (!order.meal || !order.meal.shop?.shop_name || !order.food) return;
      
      const mealKey = `${order.meal.meal_index}-${order.meal.meal_name}`;
      
      if (!mealMap.has(mealKey)) {
        mealMap.set(mealKey, {
          meal_name: order.meal.meal_name,
          meal_index: order.meal.meal_index,
          restaurants: new Map()
        });
      }
      
      const meal = mealMap.get(mealKey)!;
      const restaurantKey = order.meal.shop.shop_name;
      
      if (!meal.restaurants.has(restaurantKey)) {
        meal.restaurants.set(restaurantKey, {
          shop_name: order.meal.shop.shop_name,
          shop_url_pic: order.meal.shop.url_pic,
          orders: []
        });
      }
      
      meal.restaurants.get(restaurantKey)!.orders.push(order);
    });

    // Convert to final structure
    const mealGroups: MealGroup[] = Array.from(mealMap.values()).map(meal => {
      const restaurants: RestaurantSection[] = Array.from(meal.restaurants.values()).map(restaurant => {
        const foodVariantMap = new Map<string, FoodVariant>();
        
        restaurant.orders.forEach(order => {
          if (!order.food || !order.person) return;
          
          const variantKey = `${order.food.food_name}|${order.topping || ''}|${order.order_note || ''}`;
          
          if (!foodVariantMap.has(variantKey)) {
            foodVariantMap.set(variantKey, {
              food_name: order.food.food_name,
              food_url_pic: order.food.url_pic,
              topping: order.topping,
              order_note: order.order_note,
              persons: [],
              count: 0,
              index: 0
            });
          }
          
          const variant = foodVariantMap.get(variantKey)!;
          variant.persons.push(order.person.person_name);
          variant.count++;
        });

        const sortedVariants = Array.from(foodVariantMap.values()).sort((a, b) => 
          a.food_name.localeCompare(b.food_name, 'th')
        );
        
        // Add index to each food variant
        sortedVariants.forEach((variant, index) => {
          variant.index = index + 1;
        });

        const totalItems = sortedVariants.reduce((sum, variant) => sum + variant.count, 0);

        return {
          shop_name: restaurant.shop_name,
          shop_url_pic: restaurant.shop_url_pic,
          food_variants: sortedVariants,
          total_items: totalItems
        };
      });

      // Sort restaurants by name
      restaurants.sort((a, b) => a.shop_name.localeCompare(b.shop_name, 'th'));

      const totalItems = restaurants.reduce((sum, restaurant) => sum + restaurant.total_items, 0);

      return {
        meal_name: meal.meal_name,
        meal_index: meal.meal_index,
        restaurants: restaurants,
        total_items: totalItems
      };
    });

    // Sort by meal_index
    return mealGroups.sort((a, b) => a.meal_index - b.meal_index);
  };

  const toggleRestaurant = (restaurantKey: string) => {
    const newOpenRestaurants = new Set(openRestaurants);
    if (newOpenRestaurants.has(restaurantKey)) {
      newOpenRestaurants.delete(restaurantKey);
    } else {
      newOpenRestaurants.add(restaurantKey);
    }
    setOpenRestaurants(newOpenRestaurants);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <UtensilsCrossed className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
          <div className="text-muted-foreground">กำลังโหลดรายการมื้ออาหาร...</div>
        </div>
      </div>
    );
  }

  if (mealGroups.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="text-muted-foreground">ยังไม่มีรายการสั่งอาหาร</div>
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? "w-full max-w-none -mx-2" : "w-full max-w-none"}>
      <div className="grid gap-6 md:gap-8">
        {mealGroups.map((meal) => (
          <div key={`meal-${meal.meal_index}`} className="space-y-4">
            {/* Combined Meal + Restaurant Sections */}
            {meal.restaurants.map((restaurant) => {
              const restaurantKey = `${meal.meal_index}-${restaurant.shop_name}`;
              const isOpen = openRestaurants.has(restaurantKey);

              return (
                <Card key={restaurantKey} className="border-2 border-brand-pink/30 bg-gradient-to-br from-white via-white to-brand-pink/5 shadow-lg">
                  <Collapsible open={isOpen} onOpenChange={() => toggleRestaurant(restaurantKey)}>
                    {/* Combined Meal + Restaurant Header */}
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-brand-pink/10 transition-colors bg-gradient-to-r from-brand-pink/10 to-brand-orange/10 border-b-2 border-brand-pink/20">
                        <CardTitle>
                          {/* Grid Layout for Better Responsive Design */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
                            {/* Left Section: Index + Image + Info */}
                            <div className="md:col-span-10 flex items-center gap-3 md:gap-4 min-w-0">
                              {/* Meal Index Badge */}
                              <span className="bg-brand-pink text-white font-bold px-3 py-2 md:px-4 md:py-2 rounded-full text-base md:text-lg min-w-[40px] md:min-w-[50px] text-center flex-shrink-0">
                                {meal.meal_index}
                              </span>
                              
                              {/* Restaurant Image */}
                              {restaurant.shop_url_pic && (
                                <Avatar className="h-10 w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 flex-shrink-0">
                                  <AvatarImage src={restaurant.shop_url_pic} alt={restaurant.shop_name} />
                                  <AvatarFallback className="bg-brand-orange/20">
                                    <Store className="h-4 w-4 md:h-6 md:w-6 lg:h-8 lg:w-8 text-brand-orange" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              {/* Combined Info */}
                              <div className="flex flex-col gap-2 min-w-0 flex-1">
                                <div className="font-bold text-foreground text-sm md:text-base lg:text-lg leading-tight">
                                  {meal.meal_name} - {restaurant.shop_name}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="destructive" className="bg-brand-pink text-white font-bold text-xs md:text-sm">
                                    {meal.total_items} รายการ
                                  </Badge>
                                  <Badge variant="outline" className="border-brand-orange text-brand-orange font-bold text-xs md:text-sm">
                                    {restaurant.food_variants.length} เมนู
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right Section: Expand Button */}
                            <div className="md:col-span-2 flex justify-end">
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 md:h-6 md:w-6 text-brand-orange" />
                              ) : (
                                <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-brand-orange" />
                              )}
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>

                    {/* Food Items with Proper Container Layout */}
                    <CollapsibleContent>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {restaurant.food_variants.map((variant, index) => (
                            <Card key={index} className="bg-gradient-to-r from-white to-brand-pink/5 border-l-4 border-brand-pink/60 shadow-sm overflow-hidden">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  {/* Food Header with Image and Info */}
                                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
                                    {/* Image Container - Separate and Fixed */}
                                    {variant.food_url_pic && (
                                      <div className="lg:col-span-2 flex justify-center lg:justify-start">
                                        <div className={`relative overflow-hidden rounded-lg border-2 border-brand-pink/20 ${isMobile ? 'w-20 h-20' : 'w-24 h-24'} flex-shrink-0`}>
                                          <img 
                                            src={variant.food_url_pic} 
                                            alt={variant.food_name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Food Info Container */}
                                    <div className={`space-y-3 ${variant.food_url_pic ? 'lg:col-span-10' : 'lg:col-span-12'}`}>
                                      <div className="flex items-center flex-wrap gap-2">
                                        <span className="bg-brand-pink text-white font-bold px-3 py-1 rounded-full text-sm flex-shrink-0">
                                          {meal.meal_index}.{variant.index}
                                        </span>
                                        <h4 className={`font-bold text-foreground ${isMobile ? 'text-base' : 'text-lg'} flex-1 min-w-0`}>
                                          {variant.food_name}
                                        </h4>
                                        <Badge variant="destructive" className="bg-brand-orange text-white font-bold flex-shrink-0">
                                          {variant.count} รายการ
                                        </Badge>
                                      </div>
                                      
                                      {/* Toppings and Notes */}
                                      {(variant.topping || variant.order_note) && (
                                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                          {variant.topping && variant.topping !== "-" && (
                                            <div className={`flex gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                                              <span className="font-semibold text-brand-orange flex-shrink-0">เพิ่ม:</span>
                                              <span className="text-foreground break-words">{variant.topping}</span>
                                            </div>
                                          )}
                                          {variant.order_note && (
                                            <div className={`flex gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                                              <span className="font-semibold text-brand-orange flex-shrink-0">หมายเหตุ:</span>
                                              <span className="text-foreground break-words">{variant.order_note}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* People List */}
                                  <div className="bg-brand-pink/10 rounded-lg p-4 border border-brand-pink/20">
                                    <div className="space-y-3">
                                      <div className={`font-bold text-brand-pink ${isMobile ? 'text-sm' : 'text-base'} border-b border-brand-pink/20 pb-2`}>
                                        รายชื่อผู้สั่ง ({variant.count} คน):
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {variant.persons.map((person, personIndex) => (
                                          <Badge 
                                            key={personIndex} 
                                            variant="secondary" 
                                            className={`${isMobile ? "text-sm px-3 py-1.5" : "text-base px-4 py-2"} bg-white border border-brand-pink/40 text-foreground font-medium hover:bg-brand-pink/20 transition-colors`}
                                          >
                                            {person}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealOrdersModal;