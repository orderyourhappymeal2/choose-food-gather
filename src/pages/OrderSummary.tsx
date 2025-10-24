import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Check, Receipt, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";

interface CachedOrder {
  meal_id: string;
  meal_name: string;
  shop_id: string;
  shop_name: string;
  food_id: string;
  food_name: string;
  food_price: number;
  food_image: string;
  selected_toppings: string[] | string;
  order_note: string;
  plan_id: string;
  person_id: string;
}

interface PreDefinedMeal {
  meal_id: string;
  meal_name: string;
  meal_index: number;
  food_id: string;
  food_name: string;
  price: number;
  url_pic: string;
  shop_id: string;
  shop_name: string;
}

const OrderSummary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderCache, setOrderCache] = useState<Record<string, CachedOrder>>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [preDefinedMeals, setPreDefinedMeals] = useState<PreDefinedMeal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load user info and order cache with plan isolation
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (!userInfoStr) {
      navigate('/');
      return;
    }

    const userInfo = JSON.parse(userInfoStr);
    setUserInfo(userInfo);
    
    // Load cache specific to this plan
    const cacheKey = `orderCache_${userInfo.plan_id}`;
    const orderCacheStr = localStorage.getItem(cacheKey);
    
    if (orderCacheStr) {
      const allCachedOrders = JSON.parse(orderCacheStr);
      // Filter to only show orders for current plan (extra safety check)
      const filteredOrders: Record<string, CachedOrder> = {};
      Object.entries(allCachedOrders).forEach(([key, value]) => {
        const order = value as CachedOrder;
        if (order.plan_id === userInfo.plan_id) {
          filteredOrders[key] = order;
        }
      });
      setOrderCache(filteredOrders);
    }

    // Fetch plan data and pre-defined meals
    fetchPlanData(userInfo.plan_id);
    fetchPreDefinedMeals(userInfo.plan_id);
  }, []);

  const fetchPlanData = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plan')
        .select('plan_name, plan_editor, plan_location, plan_date, plan_time')
        .eq('plan_id', planId)
        .maybeSingle();

      if (error) throw error;
      setPlanData(data);
    } catch (error) {
      console.error('Error fetching plan data:', error);
    }
  };

  const fetchPreDefinedMeals = async (planId: string) => {
    try {
      // First get meals with food_id
      const { data: mealData, error: mealError } = await supabase
        .from('meal')
        .select('meal_id, meal_name, meal_index, food_id, shop_id')
        .eq('plan_id', planId)
        .not('food_id', 'is', null)
        .order('meal_index');

      if (mealError) throw mealError;

      if (!mealData || mealData.length === 0) {
        setPreDefinedMeals([]);
        return;
      }

      // Get food details for each meal
      const foodIds = mealData.map(meal => meal.food_id);
      const { data: foodData, error: foodError } = await supabase
        .from('food')
        .select('food_id, food_name, price, url_pic, shop_id')
        .in('food_id', foodIds);

      if (foodError) throw foodError;

      // Get shop details
      const shopIds = [...new Set([...mealData.map(meal => meal.shop_id), ...foodData.map(food => food.shop_id)])];
      const { data: shopData, error: shopError } = await supabase
        .from('shop')
        .select('shop_id, shop_name')
        .in('shop_id', shopIds);

      if (shopError) throw shopError;

      // Combine all data
      const formattedMeals = mealData.map(meal => {
        const food = foodData.find(f => f.food_id === meal.food_id);
        const shop = shopData.find(s => s.shop_id === meal.shop_id || s.shop_id === food?.shop_id);

        return {
          meal_id: meal.meal_id,
          meal_name: meal.meal_name,
          meal_index: meal.meal_index,
          food_id: meal.food_id,
          food_name: food?.food_name || '',
          price: food?.price || 0,
          url_pic: food?.url_pic || '',
          shop_id: shop?.shop_id || '',
          shop_name: shop?.shop_name || ''
        };
      });

      setPreDefinedMeals(formattedMeals);
    } catch (error) {
      console.error('Error fetching pre-defined meals:', error);
    }
  };

  const orderItems = Object.values(orderCache);

  const handleEdit = () => {
    navigate('/food-categories');
  };

  const handleConfirm = async () => {
    if (!userInfo || (orderItems.length === 0 && preDefinedMeals.length === 0)) {
      toast({
        title: "ไม่มีรายการสั่งอาหาร",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create person record if it doesn't exist
      let personId = userInfo.person_id;
      
      if (!personId) {
        // Check if person already exists (in case of page refresh)
        const { data: existingPerson } = await supabase
          .from('person')
          .select('person_id')
          .eq('plan_id', userInfo.plan_id)
          .eq('person_name', userInfo.nickname)
          .maybeSingle();

        if (existingPerson) {
          personId = existingPerson.person_id;
        } else {
          // Create new person record
          const { data: newPerson, error: insertError } = await supabase
            .from('person')
            .insert({
              person_name: userInfo.nickname,
              plan_id: userInfo.plan_id,
              contact: userInfo.contact
            })
            .select('person_id')
            .single();

          if (insertError) throw insertError;
          personId = newPerson.person_id;
        }

        // Update userInfo and localStorage with person_id
        const updatedUserInfo = { ...userInfo, person_id: personId };
        setUserInfo(updatedUserInfo);
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      }
      // Save pre-defined meal orders to database
      for (const meal of preDefinedMeals) {
        // Check if order already exists for this person, meal, food, and order_type
        const { data: existingOrder } = await (supabase as any)
          .from('order')
          .select('order_id')
          .eq('person_id', personId)
          .eq('plan_id', userInfo.plan_id)
          .eq('food_id', meal.food_id)
          .eq('meal_id', meal.meal_id)
          .eq('order_type', 'predefined')
          .maybeSingle();

        const orderData: any = {
          person_id: personId,
          food_id: meal.food_id,
          plan_id: userInfo.plan_id,
          meal_id: meal.meal_id,
          order_type: 'predefined',
          topping: null,
          order_note: null
        };

        if (existingOrder) {
          // Update existing order
          const { error } = await (supabase as any)
            .from('order')
            .update(orderData)
            .eq('order_id', existingOrder.order_id);
            
          if (error) throw error;
        } else {
          // Create new order
          const { error } = await (supabase as any)
            .from('order')
            .insert(orderData);
            
          if (error) throw error;
        }
      }

      // Save user-selected orders to database
      for (const item of orderItems) {
        // Check if order already exists for this person, meal, food, and order_type
        const { data: existingOrder } = await (supabase as any)
          .from('order')
          .select('order_id')
          .eq('person_id', personId)
          .eq('plan_id', item.plan_id)
          .eq('food_id', item.food_id)
          .eq('meal_id', item.meal_id)
          .eq('order_type', 'custom')
          .maybeSingle();

        const orderData: any = {
          person_id: personId,
          food_id: item.food_id,
          plan_id: item.plan_id,
          meal_id: item.meal_id,
          order_type: 'custom',
          topping: Array.isArray(item.selected_toppings) 
            ? (item.selected_toppings.length > 0 ? item.selected_toppings.join(', ') : null)
            : (item.selected_toppings || null),
          order_note: item.order_note || null
        };

        if (existingOrder) {
          // Update existing order
          const { error } = await (supabase as any)
            .from('order')
            .update(orderData)
            .eq('order_id', existingOrder.order_id);
            
          if (error) throw error;
        } else {
          // Create new order
          const { error } = await (supabase as any)
            .from('order')
            .insert(orderData);
            
          if (error) throw error;
        }
      }

      // Clear cache after successful submission (plan-specific)
      const cacheKey = `orderCache_${userInfo.plan_id}`;
      localStorage.removeItem(cacheKey);

      // Store final order data for ThankYou page
      const finalOrderData = {
        userInfo,
        planData,
        orderItems,
        preDefinedMeals
      };
      localStorage.setItem('finalOrder', JSON.stringify(finalOrderData));

      toast({
        title: "บันทึกรายการสำเร็จ",
        description: "รายการสั่งอาหารของคุณได้รับการบันทึกแล้ว"
      });

      navigate('/thank-you');
      
    } catch (error) {
      console.error('Error saving orders:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกรายการได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] px-0 py-4 sm:p-4">
      <div className="max-w-2xl mx-auto pt-4 sm:pt-8 relative px-2 sm:px-0">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Receipt className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">สรุปรายการสั่งอาหาร</h1>
          <p className="text-muted-foreground">กรุณาตรวจสอบรายการก่อนยืนยัน</p>
        </div>

        {/* User Info */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">รายละเอียดผู้สั่ง</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ชื่อเล่น:</span>
                <span className="font-medium">{userInfo.nickname}</span>
              </div>
              {planData && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ชื่องาน:</span>
                    <span className="font-medium">{planData.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สถานที่:</span>
                    <span className="font-medium">{planData.plan_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันที่:</span>
                    <span className="font-medium">{planData.plan_date}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pre-defined Meals */}
        {preDefinedMeals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 px-2">อาหารที่กำหนดไว้แล้ว</h2>
            <div className="space-y-4">
              {preDefinedMeals.map((meal, index) => (
                <Card key={meal.meal_id} className="bg-white/80 backdrop-blur-sm border-2 border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{meal.meal_name}</h3>
                        <p className="text-sm text-muted-foreground">{meal.shop_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                      <img 
                        src={meal.url_pic || '/placeholder.svg'} 
                        alt={meal.food_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-lg">{meal.food_name}</p>
                        <p className="text-sm text-green-600 font-medium">รายการที่กำหนดไว้แล้ว</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* User Selected Orders */}
        {orderItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 px-2">อาหารที่เลือกเพิ่ม</h2>
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-2 border-brand-orange/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.meal_name}</h3>
                        <p className="text-sm text-muted-foreground">{item.shop_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg mb-3">
                      <img 
                        src={item.food_image || '/placeholder.svg'} 
                        alt={item.food_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-lg">{item.food_name}</p>
                        {((Array.isArray(item.selected_toppings) && item.selected_toppings.length > 0) || 
                          (!Array.isArray(item.selected_toppings) && item.selected_toppings)) && (
                          <div className="mt-1">
                            <span className="text-sm text-muted-foreground">ท็อปปิ้ง: </span>
                            <span className="text-sm font-medium">
                              {Array.isArray(item.selected_toppings) 
                                ? item.selected_toppings.join(', ') 
                                : item.selected_toppings}
                            </span>
                          </div>
                        )}
                        {item.order_note && (
                          <div className="mt-1">
                            <span className="text-sm text-muted-foreground">หมายเหตุ: </span>
                            <span className="text-sm">{item.order_note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Orders Message */}
        {orderItems.length === 0 && preDefinedMeals.length === 0 && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">ยังไม่มีรายการสั่งอาหาร</p>
              <Button 
                onClick={() => navigate('/food-categories')}
                variant="outline"
              >
                เริ่มสั่งอาหาร
              </Button>
            </CardContent>
          </Card>
        )}


        {/* Action Buttons */}
        {(orderItems.length > 0 || preDefinedMeals.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleEdit}
              variant="outline"
              className="h-14 text-lg font-semibold border-2 border-primary text-primary hover:bg-primary/10"
              disabled={isSubmitting}
            >
              <Edit className="w-5 h-5 mr-2" />
              แก้ไข
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
                  disabled={isSubmitting}
                >
                  <Check className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการสั่งอาหาร</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการยืนยันรายการสั่งอาหารทั้งหมด {preDefinedMeals.length + orderItems.length} รายการ หรือไม่?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
                    {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;