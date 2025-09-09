import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, ChefHat } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NavigationDropdown from "@/components/NavigationDropdown";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  food_id: string;
  food_name: string;
  price: number;
  url_pic: string;
  description?: string;
  food_type?: string;
  topping?: string;
}

const MenuSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId } = useParams();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  const { meal, shop } = location.state || {};

  useEffect(() => {
    if (!meal || !shop) {
      navigate('/food-categories');
      return;
    }

    // Get user info from localStorage
    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) {
      navigate('/');
      return;
    }
    
    setUserInfo(JSON.parse(storedUserInfo));
    fetchMenuItems(shop.shop_id);
  }, [meal, shop]);

  const fetchMenuItems = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('food')
        .select('*')
        .eq('shop_id', shopId);

      if (error) throw error;
      
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "ไม่สามารถโหลดเมนูอาหารได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (item: MenuItem) => {
    // Single selection only
    setSelectedItem(prevSelected => 
      prevSelected?.food_id === item.food_id ? null : item
    );
  };

  const handleConfirm = async () => {
    if (!selectedItem) {
      toast({
        title: "กรุณาเลือกอาหารอย่างน้อย 1 รายการ",
        variant: "destructive"
      });
      return;
    }

    if (!userInfo) {
      toast({
        title: "ไม่พบข้อมูลผู้ใช้",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if order already exists for this person and meal
      const { data: existingOrder } = await supabase
        .from('order')
        .select('order_id')
        .eq('person_id', userInfo.person_id)
        .eq('plan_id', userInfo.plan_id)
        .eq('food_id', selectedItem.food_id)
        .single();

      let orderResult;
      
      if (existingOrder) {
        // Update existing order
        const { data, error } = await supabase
          .from('order')
          .update({
            food_id: selectedItem.food_id,
            topping: selectedItem.topping || null
          })
          .eq('order_id', existingOrder.order_id)
          .select()
          .single();
          
        if (error) throw error;
        orderResult = data;
      } else {
        // Create new order
        const { data, error } = await supabase
          .from('order')
          .insert({
            person_id: userInfo.person_id,
            food_id: selectedItem.food_id,
            plan_id: userInfo.plan_id,
            topping: selectedItem.topping || null
          })
          .select()
          .single();
          
        if (error) throw error;
        orderResult = data;
      }

      toast({
        title: "บันทึกรายการสำเร็จ",
        description: `เลือก ${selectedItem.food_name} จาก ${shop.shop_name}`
      });

      navigate('/food-categories');
      
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกรายการได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    }
  };

  if (!meal || !shop) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-welcome)] flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-foreground">กำลังโหลดเมนูอาหาร...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] relative">
      {/* Navigation Dropdown */}
      <div className="absolute top-0 right-0 p-4 z-50">
        <NavigationDropdown />
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-brand-pink/30 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-2 sm:px-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/food-categories')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{shop.shop_name}</h1>
              <p className="text-sm text-muted-foreground">{meal.meal_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 py-4 sm:p-4">
        <div className="max-w-2xl mx-auto px-0 sm:px-0">
          {/* Menu Grid */}
          {menuItems.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
              <CardContent className="p-6 text-center">
                <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">ยังไม่มีเมนูอาหารในร้านนี้</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {menuItems.map((item) => (
                <Card 
                  key={item.food_id} 
                  className={`cursor-pointer transition-all bg-white/80 backdrop-blur-sm border-2 ${
                    selectedItem?.food_id === item.food_id
                      ? 'border-primary bg-primary/10'
                      : 'border-brand-orange/30 hover:border-primary/50'
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  <CardContent className="p-4">
                    <img 
                      src={item.url_pic || '/placeholder.svg'} 
                      alt={item.food_name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-sm mb-1">{item.food_name}</h3>
                    <p className="text-primary font-semibold">฿{item.price}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {selectedItem && (
            <Card className="mb-4 bg-white/90 backdrop-blur-sm border-2 border-primary/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  รายการที่เลือก
                </h3>
                <div className="flex justify-between items-center">
                  <span>{selectedItem.food_name}</span>
                  <span className="font-semibold">฿{selectedItem.price}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirm}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
          >
            ยืนยันรายการ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuSelection;