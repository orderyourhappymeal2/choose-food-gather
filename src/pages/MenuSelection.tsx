import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ShoppingCart, ChefHat } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedTopping, setSelectedTopping] = useState<string>("");
  const [orderNote, setOrderNote] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

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

    // Load existing selection from cache
    const orderCache = JSON.parse(localStorage.getItem('orderCache') || '{}');
    const mealKey = `${meal.meal_id}_${shop.shop_id}`;
    const existingOrder = orderCache[mealKey];
    
    if (existingOrder) {
      // Find the menu item that matches the cached selection
      // We'll set this after menu items are loaded
      console.log('Found existing order:', existingOrder);
    }
  }, [meal, shop]);

  // Load default selection after menu items are fetched
  useEffect(() => {
    if (menuItems.length > 0 && meal && shop) {
      const orderCache = JSON.parse(localStorage.getItem('orderCache') || '{}');
      const mealKey = `${meal.meal_id}_${shop.shop_id}`;
      const existingOrder = orderCache[mealKey];
      
      if (existingOrder) {
        // Find the menu item that matches the cached selection
        const cachedItem = menuItems.find(item => item.food_id === existingOrder.food_id);
        if (cachedItem) {
          setSelectedItem(cachedItem);
          // Handle both old array format and new string format
          const toppings = existingOrder.selected_toppings;
          if (Array.isArray(toppings)) {
            setSelectedTopping(toppings[0] || ""); // Take first item from old array format
          } else {
            setSelectedTopping(toppings || ""); // Use string format
          }
          setOrderNote(existingOrder.order_note || '');
          console.log('Restored selection:', cachedItem.food_name);
        }
      }
    }
  }, [menuItems, meal, shop]);

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
    // Reset toppings and note when changing item
    setSelectedTopping("");
    setOrderNote("");
    
    // Auto-scroll to confirm button after selection
    setTimeout(() => {
      if (confirmButtonRef.current) {
        confirmButtonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const handleToppingChange = (topping: string) => {
    setSelectedTopping(topping);
  };

  const getToppingsFromItem = (item: MenuItem): string[] => {
    if (!item.topping) return [];
    
    // ตรวจสอบว่า topping เป็น "-" ให้ถือว่าไม่มี topping
    if (item.topping.trim() === "-") return [];
    
    return item.topping
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0 && t !== "-");
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
      // Save to cache instead of database
      const orderCache = JSON.parse(localStorage.getItem('orderCache') || '{}');
      const mealKey = `${meal.meal_id}_${shop.shop_id}`;
      
      orderCache[mealKey] = {
        meal_id: meal.meal_id,
        meal_name: meal.meal_name,
        shop_id: shop.shop_id,
        shop_name: shop.shop_name,
        food_id: selectedItem.food_id,
        food_name: selectedItem.food_name,
        food_price: selectedItem.price,
        food_image: selectedItem.url_pic,
        selected_toppings: selectedTopping,
        order_note: orderNote,
        plan_id: userInfo.plan_id,
        person_id: userInfo.person_id,
        order_type: "custom"
      };

      localStorage.setItem('orderCache', JSON.stringify(orderCache));

      toast({
        title: "เพิ่มรายการสำเร็จ",
        description: `เลือก ${selectedItem.food_name} จาก ${shop.shop_name}`
      });

      navigate('/food-categories');
      
    } catch (error) {
      console.error('Error saving to cache:', error);
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
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Topping Selection */}
          {selectedItem && getToppingsFromItem(selectedItem).length > 0 && (
            <Card className="mb-4 bg-white/90 backdrop-blur-sm border-2 border-primary/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">เลือกท็อปปิ้ง (เลือกได้ 1 รายการ)</h3>
                <RadioGroup value={selectedTopping} onValueChange={handleToppingChange}>
                  {getToppingsFromItem(selectedItem).map((topping, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={topping} id={`topping-${index}`} />
                      <Label htmlFor={`topping-${index}`} className="text-sm font-medium">
                        {topping}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Order Note */}
          {selectedItem && (
            <Card className="mb-4 bg-white/90 backdrop-blur-sm border-2 border-primary/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">หมายเหตุ</h3>
                <Textarea
                  placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="bg-white border-brand-pink/50 focus:border-primary"
                />
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {selectedItem && (
            <Card className="mb-4 bg-white/90 backdrop-blur-sm border-2 border-primary/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  รายการที่เลือก
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>{selectedItem.food_name}</span>
                  </div>
                  {selectedTopping && (
                    <div className="text-sm text-muted-foreground">
                      ท็อปปิ้ง: {selectedTopping}
                    </div>
                  )}
                  {orderNote && (
                    <div className="text-sm text-muted-foreground">
                      หมายเหตุ: {orderNote}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirm Button */}
          <Button 
            ref={confirmButtonRef}
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