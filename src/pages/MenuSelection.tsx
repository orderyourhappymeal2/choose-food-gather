import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trash2, ShoppingCart } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NavigationDropdown from "@/components/NavigationDropdown";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

const MenuSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId } = useParams();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);

  const { restaurant, categoryId, categoryName } = location.state || {};

  // Mock menu items (would come from API in real app)
  const menuItems: MenuItem[] = [
    { id: 'item1', name: 'ข้าวผัดกุ้ง', price: 45, image: '/placeholder.svg' },
    { id: 'item2', name: 'ข้าวผัดหมู', price: 40, image: '/placeholder.svg' },
    { id: 'item3', name: 'ข้าวผัดไก่', price: 40, image: '/placeholder.svg' },
    { id: 'item4', name: 'ข้าวผัดปู', price: 55, image: '/placeholder.svg' },
    { id: 'item5', name: 'ข้าวผัดเขียวหวาน', price: 45, image: '/placeholder.svg' },
    { id: 'item6', name: 'ข้าวผัดพริกแกง', price: 40, image: '/placeholder.svg' }
  ];

  useEffect(() => {
    if (!restaurant || !categoryId || !categoryName) {
      navigate('/food-categories');
    }
  }, [restaurant, categoryId, categoryName]);

  const handleItemSelect = (item: MenuItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(selected => selected.id === item.id);
      if (exists) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "กรุณาเลือกอาหารอย่างน้อย 1 รายการ",
        variant: "destructive"
      });
      return;
    }

    // Save selected items to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('orderItems') || '[]');
    const orderData = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      categoryId,
      categoryName,
      items: selectedItems,
      timestamp: new Date().toISOString()
    };
    
    // Remove any existing order for this restaurant
    const filteredOrders = existingOrders.filter((order: any) => order.restaurantId !== restaurant.id);
    filteredOrders.push(orderData);
    
    localStorage.setItem('orderItems', JSON.stringify(filteredOrders));

    toast({
      title: "เพิ่มรายการสำเร็จ",
      description: `เลือก ${selectedItems.length} รายการจาก ${restaurant.name}`
    });

    navigate('/food-categories');
  };

  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);

  if (!restaurant || !categoryId || !categoryName) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] relative">
      {/* Navigation Dropdown */}
      <div className="absolute top-0 right-0 p-4 z-50">
        <NavigationDropdown />
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-brand-pink/30 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
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
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
              <p className="text-sm text-muted-foreground">{categoryName}</p>
            </div>
          </div>
          
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            ล้าง
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          {/* Menu Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {menuItems.map((item) => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-all bg-white/80 backdrop-blur-sm border-2 ${
                  selectedItems.find(selected => selected.id === item.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-brand-orange/30 hover:border-primary/50'
                }`}
                onClick={() => handleItemSelect(item)}
              >
                <CardContent className="p-4">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                  <p className="text-primary font-semibold">฿{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          {selectedItems.length > 0 && (
            <Card className="mb-4 bg-white/90 backdrop-blur-sm border-2 border-primary/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  รายการที่เลือก ({selectedItems.length} รายการ)
                </h3>
                <div className="space-y-1 text-sm mb-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>฿{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>รวม</span>
                  <span>฿{totalPrice}</span>
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