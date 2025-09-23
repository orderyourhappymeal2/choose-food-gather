import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Home, Heart } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { parse, format } from "date-fns";
import { th } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [finalOrder, setFinalOrder] = useState<any>(null);

  // Mock thank you message (customizable by admin)
  const thankYouMessage = "รับออร์เดอร์แล้วค่า ขอให้เป็นวันที่ดีนะคะ";

  // Function to format date in Thai format
  const formatThaiDate = (dateString: string) => {
    try {
      // Parse the date assuming it's in format like "2024-09-19" or "19/09/2024"
      let dateObj: Date;
      
      if (dateString.includes('-')) {
        dateObj = parse(dateString, 'yyyy-MM-dd', new Date());
      } else if (dateString.includes('/')) {
        // Try different formats
        try {
          dateObj = parse(dateString, 'dd/MM/yyyy', new Date());
        } catch {
          dateObj = parse(dateString, 'MM/dd/yyyy', new Date());
        }
      } else {
        return dateString; // Return original if can't parse
      }

      // Format in Thai with Buddhist Era (add 543 to year)
      const day = format(dateObj, 'd');
      const month = format(dateObj, 'MMM', { locale: th });
      const year = (dateObj.getFullYear() + 543).toString();
      
      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if parsing fails
    }
  };

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

  const handleBackToHome = async () => {
    try {
      // Get plan_id from finalOrder
      const planId = finalOrder?.userInfo?.plan_id;
      
      // Clear all stored data first
      localStorage.removeItem('userInfo');
      localStorage.removeItem('orderItems');
      localStorage.removeItem('finalOrder');
      localStorage.removeItem('orderCache');

      if (!planId) {
        navigate('/');
        return;
      }

      // Fetch plan data to get url_portal
      const { data: planData, error } = await supabase
        .from('plan')
        .select('url_portal')
        .eq('plan_id', planId)
        .single();

      if (error) throw error;

      // Handle url_portal navigation
      if (planData?.url_portal) {
        try {
          const url = new URL(planData.url_portal);
          // Extract path and search params from the URL
          const pathWithParams = url.pathname + url.search;
          
          // Use React Router navigation instead of full page reload
          navigate(pathWithParams);
        } catch (urlError) {
          console.error('Invalid URL format:', urlError);
          // Fallback to home with plan parameter
          navigate(`/?plan=${planId}`);
        }
      } else {
        // No url_portal, go to home with plan parameter
        navigate(`/?plan=${planId}`);
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
      // Clear data and fallback to home page
      localStorage.removeItem('userInfo');
      localStorage.removeItem('orderItems');
      localStorage.removeItem('finalOrder');
      localStorage.removeItem('orderCache');
      navigate('/');
    }
  };

  if (!finalOrder) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] px-0 py-4 sm:p-4">
      <div className="max-w-md mx-auto pt-4 sm:pt-8 relative px-2 sm:px-0">

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
                <p>วันที่ <span className="font-medium text-foreground">{formatThaiDate(finalOrder.planData.plan_date)}</span></p>
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
                <span className="font-medium">{finalOrder.orderItems.length + finalOrder.preDefinedMeals.length} รายการ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div>
          <Button 
            onClick={handleBackToHome}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
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