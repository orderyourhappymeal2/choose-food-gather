import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Check, Receipt, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NavigationDropdown from "@/components/NavigationDropdown";
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
  selected_toppings: string[];
  order_note: string;
  plan_id: string;
  person_id: string;
}

const OrderSummary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderCache, setOrderCache] = useState<Record<string, CachedOrder>>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load user info and order cache
    const userInfoStr = localStorage.getItem('userInfo');
    const orderCacheStr = localStorage.getItem('orderCache');
    
    if (!userInfoStr) {
      navigate('/');
      return;
    }

    const userInfo = JSON.parse(userInfoStr);
    setUserInfo(userInfo);
    
    if (orderCacheStr) {
      setOrderCache(JSON.parse(orderCacheStr));
    }

    // Fetch plan data
    fetchPlanData(userInfo.plan_id);
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

  const orderItems = Object.values(orderCache);
  const totalPrice = orderItems.reduce((sum, item) => sum + item.food_price, 0);

  const handleEdit = () => {
    navigate('/food-categories');
  };

  const handleConfirm = async () => {
    if (!userInfo || orderItems.length === 0) {
      toast({
        title: "ไม่มีรายการสั่งอาหาร",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save all orders to database
      for (const item of orderItems) {
        // Check if order already exists for this person and meal
        const { data: existingOrder } = await supabase
          .from('order')
          .select('order_id')
          .eq('person_id', item.person_id)
          .eq('plan_id', item.plan_id)
          .eq('food_id', item.food_id)
          .maybeSingle();

        const orderData = {
          person_id: item.person_id,
          food_id: item.food_id,
          plan_id: item.plan_id,
          topping: item.selected_toppings.length > 0 ? item.selected_toppings.join(', ') : null,
          order_note: item.order_note || null
        };

        if (existingOrder) {
          // Update existing order
          const { error } = await supabase
            .from('order')
            .update(orderData)
            .eq('order_id', existingOrder.order_id);
            
          if (error) throw error;
        } else {
          // Create new order
          const { error } = await supabase
            .from('order')
            .insert(orderData);
            
          if (error) throw error;
        }
      }

      // Clear cache after successful submission
      localStorage.removeItem('orderCache');

      // Store final order data for ThankYou page
      const finalOrderData = {
        userInfo,
        planData,
        orderItems,
        totalPrice
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
              onClick={() => navigate('/food-categories')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Receipt className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">สรุปรายการสั่งอาหาร</h1>
          <p className="text-muted-foreground">กรุณาตรวจสอบรายการก่อนยืนยัน</p>
        </div>

        {/* User Info */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">ข้อมูลผู้สั่งและงาน</h3>
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
                    <span className="text-muted-foreground">ผู้จัด:</span>
                    <span className="font-medium">{planData.plan_editor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สถานที่:</span>
                    <span className="font-medium">{planData.plan_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันที่:</span>
                    <span className="font-medium">{planData.plan_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เวลา:</span>
                    <span className="font-medium">{planData.plan_time}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        {orderItems.length === 0 ? (
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
        ) : (
          <div className="space-y-4 mb-6">
            {orderItems.map((item, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-2 border-brand-orange/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{item.meal_name}</h3>
                      <p className="text-sm text-muted-foreground">{item.shop_name}</p>
                    </div>
                    <span className="font-bold text-primary text-lg">฿{item.food_price}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg mb-3">
                    <img 
                      src={item.food_image || '/placeholder.svg'} 
                      alt={item.food_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-lg">{item.food_name}</p>
                      {item.selected_toppings.length > 0 && (
                        <div className="mt-1">
                          <span className="text-sm text-muted-foreground">ท็อปปิ้ง: </span>
                          <span className="text-sm font-medium">{item.selected_toppings.join(', ')}</span>
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
        )}

        {/* Total Price */}
        {orderItems.length > 0 && (
          <Card className="mb-6 bg-white/90 backdrop-blur-sm border-2 border-primary/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>ยอดรวมทั้งหมด</span>
                <span className="text-primary">฿{totalPrice}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {orderItems.length > 0 && (
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
                    คุณต้องการยืนยันรายการสั่งอาหารทั้งหมด {orderItems.length} รายการ 
                    ยอดรวม ฿{totalPrice} หรือไม่?
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