import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Home, Heart, ShoppingCart } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavigationDropdown from "@/components/NavigationDropdown";

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [finalOrder, setFinalOrder] = useState<any>(null);

  // Mock thank you message (customizable by admin)
  const thankYouMessage = "รับออร์เดอร์แล้วค่า ขอให้เป็นวันที่ดีนะคะ";

  useEffect(() => {
    console.log('ThankYou: useEffect called');
    const orderData = localStorage.getItem('finalOrder');
    console.log('ThankYou: orderData from localStorage:', orderData);
    
    if (!orderData) {
      console.log('ThankYou: No finalOrder data found, redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('ThankYou: Setting finalOrder data');
    setFinalOrder(JSON.parse(orderData));
  }, []);

  const handleBackToHome = () => {
    // Clear all stored data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('orderItems');
    localStorage.removeItem('finalOrder');
    
    // Get plan_id and navigate to the correct plan page
    const planId = finalOrder?.userInfo?.plan_id || searchParams.get('planId');
    if (planId) {
      navigate(`/welcome?planId=${planId}`);
    } else {
      navigate('/');
    }
  };

  const handleOrderMore = () => {
    // Keep user context but clear order cache
    localStorage.removeItem('orderCache');
    localStorage.removeItem('finalOrder');
    
    // Get plan_id from finalOrder or URL params
    const planId = finalOrder?.userInfo?.plan_id || searchParams.get('planId');
    if (planId) {
      navigate(`/welcome?planId=${planId}`);
    } else {
      navigate('/');
    }
  };

  if (!finalOrder) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] px-0 py-4 sm:p-4">
      <div className="max-w-md mx-auto pt-4 sm:pt-8 relative px-2 sm:px-0">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0 p-4 z-50">
          <NavigationDropdown />
        </div>

        {/* Success Icon */}
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">สั่งอาหารสำเร็จ!</h1>
        </div>

        {/* Thank You Message */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardContent className="p-6 text-center">
            <Heart className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-4">{thankYouMessage}</p>
            {finalOrder?.planData && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>แล้วพบกันที่ <span className="font-medium text-foreground">{finalOrder.planData.plan_location}</span></p>
                <p>วันที่ <span className="font-medium text-foreground">{finalOrder.planData.plan_date}</span></p>
                <p>เวลา <span className="font-medium text-foreground">{finalOrder.planData.plan_time}</span></p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-orange/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">สรุปรายการสั่งอาหาร</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ผู้สั่ง:</span>
                <span className="font-medium">{finalOrder.userInfo.nickname}</span>
              </div>
              <div className="flex justify-between">
                <span>จำนวนรายการ:</span>
                <span className="font-medium">{finalOrder.orderItems.length} รายการ</span>
              </div>
              <div className="flex justify-between">
                <span>ยอดรวม:</span>
                <span className="font-medium text-primary">฿{finalOrder.totalPrice}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={handleOrderMore}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            ต้องการสั่งเพิ่มอีกรายการ
          </Button>
          
          <Button 
            onClick={handleBackToHome}
            variant="outline"
            className="w-full h-12 text-lg font-semibold border-2 border-primary text-primary hover:bg-primary/10"
          >
            <Home className="w-5 h-5 mr-2" />
            กลับไปหน้าแรก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;