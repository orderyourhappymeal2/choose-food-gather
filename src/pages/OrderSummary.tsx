import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Check, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavigationDropdown from "@/components/NavigationDropdown";

interface OrderItem {
  restaurantId: string;
  restaurantName: string;
  categoryId: string;
  categoryName: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
}

const OrderSummary = () => {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Load user info and order items
    const userInfoStr = localStorage.getItem('userInfo');
    const orderItemsStr = localStorage.getItem('orderItems');
    
    if (!userInfoStr) {
      navigate('/');
      return;
    }

    setUserInfo(JSON.parse(userInfoStr));
    
    if (orderItemsStr) {
      setOrderItems(JSON.parse(orderItemsStr));
    }
  }, []);

  const totalPrice = orderItems.reduce((total, order) => 
    total + order.items.reduce((sum, item) => sum + item.price, 0), 0
  );

  const handleEdit = () => {
    navigate('/food-categories');
  };

  const handleConfirm = () => {
    console.log('OrderSummary: handleConfirm called');
    console.log('OrderSummary: userInfo:', userInfo);
    console.log('OrderSummary: orderItems:', orderItems);
    
    // Store final order data
    const finalOrder = {
      userInfo,
      orderItems,
      totalPrice,
      timestamp: new Date().toISOString()
    };
    
    console.log('OrderSummary: finalOrder created:', finalOrder);
    localStorage.setItem('finalOrder', JSON.stringify(finalOrder));
    console.log('OrderSummary: finalOrder saved to localStorage');
    console.log('OrderSummary: navigating to /thank-you');
    navigate('/thank-you');
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] p-4">
      <div className="max-w-2xl mx-auto pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0 p-4 z-50">
          <NavigationDropdown />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Receipt className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">สรุปรายการสั่งอาหาร</h1>
          <p className="text-muted-foreground">กรุณาตรวจสอบรายการก่อนยืนยัน</p>
        </div>

        {/* User Info */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">ข้อมูลผู้สั่ง</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ชื่อ:</span>
                <p className="font-medium">{userInfo.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">ชื่อเล่น:</span>
                <p className="font-medium">{userInfo.nickname}</p>
              </div>
              <div>
                <span className="text-muted-foreground">รหัส:</span>
                <p className="font-medium">{userInfo.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        {orderItems.length === 0 ? (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">ยังไม่มีรายการสั่งอาหาร</p>
              <Button 
                onClick={() => navigate('/food-categories')}
                className="mt-4"
                variant="outline"
              >
                เริ่มสั่งอาหาร
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-6">
            {orderItems.map((order, orderIndex) => (
              <Card key={orderIndex} className="bg-white/80 backdrop-blur-sm border-2 border-brand-orange/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">{order.restaurantName}</h3>
                      <p className="text-sm text-muted-foreground">{order.categoryName}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {order.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <p className="font-semibold text-primary">฿{item.price}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t mt-4 pt-3 flex justify-between font-semibold">
                    <span>รวมต่อร้าน</span>
                    <span>฿{order.items.reduce((sum, item) => sum + item.price, 0)}</span>
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
            >
              <Edit className="w-5 h-5 mr-2" />
              แก้ไข
            </Button>
            
            <Button 
              onClick={handleConfirm}
              className="h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
            >
              <Check className="w-5 h-5 mr-2" />
              ยืนยัน
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;