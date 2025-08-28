import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Home, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavigationDropdown from "@/components/NavigationDropdown";

const ThankYou = () => {
  const navigate = useNavigate();
  const [finalOrder, setFinalOrder] = useState<any>(null);

  // Mock event data (would come from admin settings)
  const eventData = {
    location: "ห้องประชุม A ชั้น 5",
    date: "15 มกราคม 2567",
    time: "09:00 น."
  };

  // Mock thank you message (customizable by admin)
  const thankYouMessage = "รับออร์เดอร์แล้วค่า ขอให้เป็นวันที่ดีนะคะ";

  useEffect(() => {
    const orderData = localStorage.getItem('finalOrder');
    if (!orderData) {
      navigate('/');
      return;
    }
    setFinalOrder(JSON.parse(orderData));
  }, []);

  const handleBackToHome = () => {
    // Clear all stored data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('orderItems');
    localStorage.removeItem('finalOrder');
    navigate('/');
  };

  if (!finalOrder) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-brand-cream to-brand-yellow p-4">
      <div className="max-w-md mx-auto pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0">
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
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>แล้วพบกันที่ <span className="font-medium text-foreground">{eventData.location}</span></p>
              <p>วันที่ <span className="font-medium text-foreground">{eventData.date}</span></p>
              <p>เวลา <span className="font-medium text-foreground">{eventData.time}</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-orange/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">สรุปรายการสั่งอาหาร</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ผู้สั่ง:</span>
                <span className="font-medium">{finalOrder.userInfo.name} ({finalOrder.userInfo.nickname})</span>
              </div>
              <div className="flex justify-between">
                <span>จำนวนรายการ:</span>
                <span className="font-medium">
                  {finalOrder.orderItems.reduce((total: number, order: any) => total + order.items.length, 0)} รายการ
                </span>
              </div>
              <div className="flex justify-between">
                <span>ยอดรวม:</span>
                <span className="font-medium text-primary">฿{finalOrder.totalPrice}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home Button */}
        <Button 
          onClick={handleBackToHome}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
        >
          <Home className="w-5 h-5 mr-2" />
          กลับไปหน้าแรก
        </Button>
      </div>
    </div>
  );
};

export default ThankYou;