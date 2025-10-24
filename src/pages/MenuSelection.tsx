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
  
  // States for handling direct links
  const [loadedShop, setLoadedShop] = useState<any>(null);
  const [loadedMeal, setLoadedMeal] = useState<any>(null);

  const { meal, shop } = location.state || {};
  
  // Use meal/shop from either navigation state or loaded state
  const currentMeal = meal || loadedMeal;
  const currentShop = shop || loadedShop;

  useEffect(() => {
    // Get user info from localStorage first
    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) {
      navigate('/');
      return;
    }
    
    const parsedUserInfo = JSON.parse(storedUserInfo);
    setUserInfo(parsedUserInfo);

    // Case 1: Has meal and shop from navigation state (normal flow)
    if (meal && shop) {
      console.log('✅ Has meal and shop from navigation state');
      fetchMenuItems(shop.shop_id);
      return;
    }

    // Case 2: Direct link with restaurantId - fetch data
    if (restaurantId && !meal && !shop) {
      console.log('🔄 Direct link detected, fetching data for:', restaurantId);
      fetchShopAndMealsData(restaurantId, parsedUserInfo.plan_id);
      return;
    }

    // Case 3: No data available - redirect
    console.log('❌ Missing required data, redirecting');
    navigate('/food-categories');
  }, [meal, shop, restaurantId]);

  // Load default selection after menu items are fetched
  useEffect(() => {
    if (menuItems.length > 0 && currentMeal && currentShop && userInfo) {
      const cacheKey = `orderCache_${userInfo.plan_id}`;
      const orderCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      const mealKey = `${userInfo.plan_id}_${currentMeal.meal_id}_${currentShop.shop_id}`;
      const existingOrder = orderCache[mealKey];
      
      if (existingOrder) {
        const cachedItem = menuItems.find(item => item.food_id === existingOrder.food_id);
        if (cachedItem) {
          setSelectedItem(cachedItem);
          const toppings = existingOrder.selected_toppings;
          if (Array.isArray(toppings)) {
            setSelectedTopping(toppings[0] || "");
          } else {
            setSelectedTopping(toppings || "");
          }
          setOrderNote(existingOrder.order_note || '');
        }
      }
    }
  }, [menuItems, currentMeal, currentShop, userInfo]);

  const fetchShopAndMealsData = async (shopId: string, planId: string) => {
    try {
      console.log('🔍 Fetching shop and meals for:', { shopId, planId });
      
      // Fetch shop data
      const { data: shopData, error: shopError } = await supabase
        .from('shop')
        .select('*')
        .eq('shop_id', shopId)
        .maybeSingle();

      if (shopError) throw shopError;
      
      if (!shopData) {
        toast({
          title: "ไม่พบข้อมูลร้านอาหาร",
          variant: "destructive"
        });
        navigate('/food-categories');
        return;
      }

      console.log('✅ Shop loaded:', shopData.shop_name);
      setLoadedShop(shopData);

      // Fetch meals that use this shop and don't have pre-defined food
      const { data: mealsData, error: mealsError } = await supabase
        .from('meal')
        .select('*')
        .eq('plan_id', planId)
        .eq('shop_id', shopId)
        .is('food_id', null) // Only meals that need food selection
        .order('meal_index');

      if (mealsError) throw mealsError;

      if (!mealsData || mealsData.length === 0) {
        toast({
          title: "ไม่พบมื้ออาหารที่ใช้ร้านนี้",
          description: "กรุณาเลือกจากหน้ารายการมื้ออาหาร",
          variant: "destructive"
        });
        navigate('/food-categories');
        return;
      }

      // Use the first meal found
      const selectedMeal = mealsData[0];
      console.log('✅ Meal loaded:', selectedMeal.meal_name);
      setLoadedMeal(selectedMeal);

      // Now fetch menu items
      await fetchMenuItems(shopId);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive"
      });
      navigate('/food-categories');
    }
  };

  const fetchMenuItems = async (shopId: string) => {
    try {
      console.log('🔍 Fetching menu items for shop:', shopId);
      const { data, error } = await supabase
        .from('food')
        .select('*')
        .eq('shop_id', shopId);

      if (error) throw error;
      
      console.log('✅ Loaded', data?.length || 0, 'menu items');
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
    const isDeselecting = selectedItem?.food_id === item.food_id;
    
    // Single selection only
    setSelectedItem(prevSelected => 
      prevSelected?.food_id === item.food_id ? null : item
    );
    // Reset toppings and note when changing item
    setSelectedTopping("");
    setOrderNote("");
    
    // Auto-scroll to confirm button only when selecting (not deselecting)
    if (!isDeselecting) {
      setTimeout(() => {
        if (confirmButtonRef.current) {
          confirmButtonRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
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
      // Save to cache with plan isolation
      const cacheKey = `orderCache_${userInfo.plan_id}`;
      const orderCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      const mealKey = `${userInfo.plan_id}_${currentMeal.meal_id}_${currentShop.shop_id}`;
      
      orderCache[mealKey] = {
        meal_id: currentMeal.meal_id,
        meal_name: currentMeal.meal_name,
        shop_id: currentShop.shop_id,
        shop_name: currentShop.shop_name,
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

      localStorage.setItem(cacheKey, JSON.stringify(orderCache));

      toast({
        title: "เพิ่มรายการสำเร็จ",
        description: `เลือก ${selectedItem.food_name} จาก ${currentShop.shop_name}`
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

  if (!currentMeal || !currentShop) {
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
              <h1 className="text-xl font-bold">{currentShop.shop_name}</h1>
              <p className="text-sm text-muted-foreground">{currentMeal.meal_name}</p>
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