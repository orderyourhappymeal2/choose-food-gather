import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ChevronDown, ChevronUp, UtensilsCrossed, Store, ChefHat } from "lucide-react";
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
interface MealSection {
  meal_name: string;
  shop_name: string;
  shop_url_pic: string | null;
  meal_index: number;
  food_variants: FoodVariant[];
}
const MealOrdersModal = ({
  plan
}: MealOrdersModalProps) => {
  const [mealSections, setMealSections] = useState<MealSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
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
      const {
        data: orders,
        error
      } = await supabase.from('order').select(`
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
        `).eq('plan_id', plan.plan_id);
      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('ไม่สามารถดึงข้อมูลรายการสั่งอาหารได้');
        return;
      }
      if (!orders || orders.length === 0) {
        setMealSections([]);
        return;
      }

      // Group orders by meal and shop
      const groupedData = groupOrdersByMealAndShop(orders as OrderData[]);
      setMealSections(groupedData);

      // Open first section by default
      if (groupedData.length > 0) {
        const firstSectionKey = `${groupedData[0].meal_index}-${groupedData[0].meal_name}-${groupedData[0].shop_name}`;
        setOpenSections(new Set([firstSectionKey]));
      }
    } catch (error) {
      console.error('Error in fetchMealOrders:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };
  const groupOrdersByMealAndShop = (orders: OrderData[]): MealSection[] => {
    // First, get unique meal-shop combinations
    const mealShopMap = new Map<string, {
      meal_name: string;
      shop_name: string;
      shop_url_pic: string | null;
      meal_index: number;
      orders: OrderData[];
    }>();
    orders.forEach(order => {
      if (!order.meal || !order.meal.shop?.shop_name || !order.food) return;
      const key = `${order.meal.meal_index}-${order.meal.meal_name}-${order.meal.shop.shop_name}`;
      if (!mealShopMap.has(key)) {
        mealShopMap.set(key, {
          meal_name: order.meal.meal_name,
          shop_name: order.meal.shop.shop_name,
          shop_url_pic: order.meal.shop.url_pic,
          meal_index: order.meal.meal_index,
          orders: []
        });
      }
      mealShopMap.get(key)!.orders.push(order);
    });

    // Convert to array and group food variants
    const sections: MealSection[] = Array.from(mealShopMap.values()).map(section => {
      const foodVariantMap = new Map<string, FoodVariant>();
      section.orders.forEach(order => {
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
      const sortedVariants = Array.from(foodVariantMap.values()).sort((a, b) => a.food_name.localeCompare(b.food_name, 'th'));

      // Add index to each food variant
      sortedVariants.forEach((variant, index) => {
        variant.index = index + 1;
      });
      return {
        meal_name: section.meal_name,
        shop_name: section.shop_name,
        shop_url_pic: section.shop_url_pic,
        meal_index: section.meal_index,
        food_variants: sortedVariants
      };
    });

    // Sort by meal_index then by shop_name
    return sections.sort((a, b) => {
      if (a.meal_index !== b.meal_index) {
        return a.meal_index - b.meal_index;
      }
      return a.shop_name.localeCompare(b.shop_name, 'th');
    });
  };
  const toggleSection = (sectionKey: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionKey)) {
      newOpenSections.delete(sectionKey);
    } else {
      newOpenSections.add(sectionKey);
    }
    setOpenSections(newOpenSections);
  };
  if (isLoading) {
    return <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <UtensilsCrossed className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
          <div className="text-muted-foreground">กำลังโหลดรายการมื้ออาหาร...</div>
        </div>
      </div>;
  }
  if (mealSections.length === 0) {
    return <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="text-muted-foreground">ยังไม่มีรายการสั่งอาหาร</div>
        </div>
      </div>;
  }
  return <div className={isMobile ? "w-full max-w-none -mx-2" : "w-full max-w-none"}>
      <div className="grid gap-4 md:gap-6">
        {mealSections.map(section => {
        const sectionKey = `${section.meal_index}-${section.meal_name}-${section.shop_name}`;
        const isOpen = openSections.has(sectionKey);
        return <Card key={sectionKey} className={`border border-brand-pink/20 bg-white/80 ${isMobile ? 'relative' : ''}`}>
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(sectionKey)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-brand-pink/5 transition-colors pb-3 border-b border-brand-pink/10">
                    <CardTitle className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {section.shop_url_pic && <Avatar className={isMobile ? "h-10 w-10 flex-shrink-0" : "h-12 w-12 flex-shrink-0"}>
                            <AvatarImage src={section.shop_url_pic} alt={section.shop_name} />
                            <AvatarFallback>
                              <Store className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>}
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          {isMobile ? <div className="space-y-1">
                              <div className="text-sm font-semibold text-foreground">
                                มื้อ: {section.meal_name}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>ร้าน: {section.shop_name}</span>
                                <Badge variant="destructive" className="text-xs px-2">
                                  {section.food_variants.reduce((total, variant) => total + variant.count, 0)} รายการ
                                </Badge>
                              </div>
                            </div> : <div className="flex flex-col gap-2">
                              <span className="font-semibold text-lg text-foreground">
                                {section.meal_name}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {section.shop_name}
                                </span>
                                <Badge variant="destructive" className="text-sm font-bold">
                                  รวม {section.food_variants.reduce((total, variant) => total + variant.count, 0)} รายการ
                                </Badge>
                              </div>
                            </div>}
                        </div>
                      </div>
                      <div className={`flex-shrink-0 ${isMobile ? 'absolute top-2 right-2' : ''}`}>
                        {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {section.food_variants.map((variant, index) => {
                    // Calculate global index across all sections
                    let globalIndex = 0;
                    for (let i = 0; i < mealSections.indexOf(section); i++) {
                      globalIndex += mealSections[i].food_variants.length;
                    }
                    globalIndex += index + 1;
                    return <div key={index} className="bg-gradient-to-r from-white via-white to-brand-pink/5 border-2 border-brand-pink/15 rounded-lg p-4 shadow-sm">
                            <div className={isMobile ? "flex flex-col gap-3" : "flex gap-4"}>
                              {variant.food_url_pic && <div className={`flex-shrink-0 ${isMobile ? 'w-12 h-12 self-start' : 'w-16 h-16'}`}>
                                  
                                </div>}
                              <div className="flex-1">
                                {/* Header Section with Index and Name */}
                                <div className="bg-brand-pink/10 rounded-lg p-3 mb-3 border-l-4 border-brand-pink/60">
                                  <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-2' : ''}`}>
                                    <div className="flex items-center gap-3">
                                      <span className="bg-brand-pink/80 text-white font-bold px-3 py-1 rounded-full text-sm min-w-[32px] text-center">
                                        {globalIndex}
                                      </span>
                                      <div className={`font-semibold text-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                                        {variant.food_name}
                                      </div>
                                    </div>
                                    <div className="bg-brand-orange/20 border border-brand-orange/40 rounded-lg px-3 py-2">
                                      <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                        <div className="font-bold text-brand-orange text-xl">{variant.count}</div>
                                        <div className="text-xs text-muted-foreground font-medium">จำนวน</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Details Section */}
                                {(variant.topping || variant.order_note) && <div className="bg-muted/30 rounded-lg p-3 mb-3 space-y-2">
                                    {variant.topping && variant.topping !== "-" && <div className={`flex items-start gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                        <span className="font-medium text-brand-orange min-w-fit">add-on:</span>
                                        <span className="text-foreground">{variant.topping}</span>
                                      </div>}
                                    
                                    {variant.order_note && <div className={`flex items-start gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                        <span className="font-medium text-brand-orange min-w-fit">หมายเหตุ:</span>
                                        <span className="text-foreground">{variant.order_note}</span>
                                      </div>}
                                  </div>}
                                
                                {/* Persons Section */}
                                <div className="bg-brand-pink/5 border border-brand-pink/20 rounded-lg p-3">
                                  <div className={`flex flex-col gap-2 ${isMobile ? 'text-xs' : ''}`}>
                                    <div className="flex items-center gap-2 pb-2 border-b border-brand-pink/20">
                                      <span className={`font-bold text-brand-pink ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                        ผู้สั่ง ({variant.count} คน):
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {variant.persons.map((person, personIndex) => <Badge key={personIndex} variant="secondary" className={`${isMobile ? "text-xs px-2 py-1" : "text-sm px-3 py-1"} bg-white border border-brand-pink/30 text-foreground font-medium hover:bg-brand-pink/10 transition-colors`}>
                                          {person}
                                        </Badge>)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>;
                  })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>;
      })}
      </div>
    </div>;
};
export default MealOrdersModal;