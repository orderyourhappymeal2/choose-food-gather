import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    contact: string | null;
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
  persons: {
    name: string;
    contact: string | null;
  }[];
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
            person_name,
            contact
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
          variant.persons.push({
            name: order.person.person_name,
            contact: order.person.contact
          });
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
      <div className="w-full overflow-x-auto">
        <Table className="border border-brand-pink/60">
          <TableHeader>
            <TableRow className="bg-brand-pink/20 hover:bg-brand-pink/20 border-b-2 border-brand-pink/60">
              <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">มื้อ</TableHead>
              <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">มื้ออาหาร - ร้าน</TableHead>
              <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">จำนวนรายการ</TableHead>
              <TableHead className="text-gray-800 dark:text-gray-100 font-bold text-center w-16">แสดง</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {mealGroups.map((meal, mealIndex) => (
            <React.Fragment key={meal.meal_index}>
              {/* Add meal separator */}
              {mealIndex > 0 && (
                <TableRow className="border-none">
                  <TableCell colSpan={4} className="p-0">
                    <div className="bg-gradient-to-r from-brand-pink/30 via-brand-orange/30 to-brand-pink/30 h-3 border-y-2 border-brand-pink/60 shadow-inner"></div>
                  </TableCell>
                </TableRow>
              )}
              {meal.restaurants.map((restaurant) => {
              const restaurantKey = `${meal.meal_index}-${restaurant.shop_name}`;
              const isOpen = openRestaurants.has(restaurantKey);

              return (
                <React.Fragment key={restaurantKey}>
                  <TableRow 
                    className="border-b border-brand-pink/40 hover:bg-brand-pink/10 cursor-pointer"
                    onClick={() => toggleRestaurant(restaurantKey)}
                  >
                    <TableCell className="border-r border-brand-pink/40 text-center">
                      <span className="bg-brand-pink text-white font-bold px-3 py-1 rounded-full text-sm">
                        {meal.meal_index}
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-brand-pink/40">
                      <div className="flex items-center gap-3">
                        {restaurant.shop_url_pic && (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={restaurant.shop_url_pic} alt={restaurant.shop_name} />
                            <AvatarFallback className="bg-brand-orange/20">
                              <Store className="h-4 w-4 text-brand-orange" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-gray-800 dark:text-gray-100 text-base">
                            {meal.meal_name} - {restaurant.shop_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-orange-600 text-orange-600 font-bold text-xs">
                              {restaurant.food_variants.length} เมนู
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-brand-pink/40 text-center">
                      <Badge variant="destructive" className="bg-brand-pink text-white font-bold">
                        {restaurant.total_items} รายการ
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-brand-orange mx-auto" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-brand-orange mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {/* Collapsible Content Row */}
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <div className="bg-brand-pink/5 border-t border-brand-pink/40">
                          <Table className="border-none">
                            <TableHeader>
                              <TableRow className="bg-brand-pink/10 hover:bg-brand-pink/10 border-b border-brand-pink/40">
                                <TableHead className="text-gray-700 dark:text-gray-200 font-semibold border-r border-brand-pink/30 w-16">ลำดับ</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-semibold border-r border-brand-pink/30 w-20">รูป</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-semibold border-r border-brand-pink/30">ชื่ออาหาร</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-semibold border-r border-brand-pink/30 w-24">จำนวน</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-semibold border-r border-brand-pink/30">เพิ่มเติม</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-semibold">ผู้สั่ง</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {restaurant.food_variants.map((variant, index) => (
                                <TableRow key={index} className="border-b border-brand-pink/30 hover:bg-brand-pink/5">
                                  <TableCell className="border-r border-brand-pink/30 text-center">
                                    <span className="bg-brand-pink text-white font-bold px-2 py-1 rounded-full text-xs">
                                      {meal.meal_index}.{variant.index}
                                    </span>
                                  </TableCell>
                                  <TableCell className="border-r border-brand-pink/30">
                                    {variant.food_url_pic ? (
                                      <div className="w-16 h-16 relative overflow-hidden rounded-lg border border-brand-pink/20">
                                        <img 
                                          src={variant.food_url_pic} 
                                          alt={variant.food_name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <UtensilsCrossed className="h-6 w-6 text-gray-400" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="border-r border-brand-pink/30">
                                    <div className="font-bold text-gray-800 dark:text-gray-100 text-base">
                                      {variant.food_name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="border-r border-brand-pink/30 text-center">
                                    <Badge variant="destructive" className="bg-brand-orange text-white font-bold">
                                      {variant.count}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="border-r border-brand-pink/30">
                                    {(variant.topping || variant.order_note) && (
                                      <div className="space-y-1 text-sm">
                                        {variant.topping && variant.topping !== "-" && (
                                          <div>
                                            <span className="font-semibold text-brand-orange">เพิ่ม:</span>
                                            <span className="ml-1 text-gray-700 dark:text-gray-200">{variant.topping}</span>
                                          </div>
                                        )}
                                        {variant.order_note && (
                                          <div>
                                            <span className="font-semibold text-brand-orange">หมายเหตุ:</span>
                                            <span className="ml-1 text-gray-700 dark:text-gray-200">{variant.order_note}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                     <div className="flex flex-wrap gap-1">
                                        {variant.persons.map((person, personIndex) => (
                                          <div key={personIndex} className="bg-orange-600/30 border border-orange-600/50 rounded px-2 py-1 text-xs">
                                            <div className="font-bold text-orange-700">{person.name}</div>
                                            {person.contact && (
                                              <div className="text-orange-600 text-[10px] mt-0.5">
                                                {person.contact}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                     </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                   )}
                </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
          </TableBody>
        </Table>
      </div>
    </div>
   );
};

export default MealOrdersModal;