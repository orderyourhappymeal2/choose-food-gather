import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Circle, Sunrise, Coffee, Sun, Cookie, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavigationDropdown from "@/components/NavigationDropdown";

const FoodCategories = () => {
  const navigate = useNavigate();
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);

  useEffect(() => {
    // Check if user info exists
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
      return;
    }
  }, []);

  // Mock restaurant data for each meal type
  const mealCategories = [
    {
      id: 'breakfast',
      name: 'อาหารเช้า',
      icon: Sunrise,
      restaurants: [
        { id: 'rest1', name: 'ร้านอาหารเช้าดีๆ', image: '/placeholder.svg', hasOptions: true }
      ]
    },
    {
      id: 'morning-break',
      name: 'เบรคเช้า',
      icon: Coffee,
      restaurants: [
        { id: 'rest2', name: 'ร้านกาแฟสดใส', image: '/placeholder.svg', hasOptions: false }
      ]
    },
    {
      id: 'lunch',
      name: 'อาหารกลางวัน',
      icon: Sun,
      restaurants: [
        { id: 'rest3', name: 'ร้านข้าวราดแกง', image: '/placeholder.svg', hasOptions: true },
        { id: 'rest4', name: 'ร้านก๋วยเตี๋ยว', image: '/placeholder.svg', hasOptions: true }
      ]
    },
    {
      id: 'afternoon-break',
      name: 'เบรคบ่าย',
      icon: Cookie,
      restaurants: [
        { id: 'rest5', name: 'ร้านของหวาน', image: '/placeholder.svg', hasOptions: false }
      ]
    },
    {
      id: 'dinner',
      name: 'อาหารเย็น',
      icon: Moon,
      restaurants: [
        { id: 'rest6', name: 'ร้านอาหารตามสั่ง', image: '/placeholder.svg', hasOptions: true }
      ]
    }
  ];

  const handleRestaurantClick = (categoryId: string, restaurant: any) => {
    if (restaurant.hasOptions) {
      // Navigate to menu selection
      navigate(`/menu/${restaurant.id}`, { 
        state: { 
          restaurant, 
          category: mealCategories.find(cat => cat.id === categoryId) 
        }
      });
    }
  };

  const handleFinalSubmit = () => {
    // Navigate to order summary
    navigate('/order-summary');
  };

  const allRequiredMealsSelected = () => {
    const requiredMeals = mealCategories.filter(cat => 
      cat.restaurants.some(rest => rest.hasOptions)
    );
    return requiredMeals.every(meal => 
      selectedMeals.includes(meal.id) || 
      meal.restaurants.every(rest => !rest.hasOptions)
    );
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] p-4">
      <div className="max-w-2xl mx-auto pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0">
          <NavigationDropdown />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">เลือกอาหารตามมื้อ</h1>
          <p className="text-muted-foreground">กรุณาเลือกร้านอาหารสำหรับแต่ละมื้อ</p>
        </div>

        {/* Meal Categories */}
        <div className="space-y-4 mb-8">
          {mealCategories.map((category) => (
            <Card key={category.id} className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <category.icon className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                </div>
                
                <div className="space-y-3">
                  {category.restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-brand-orange/30">
                      <div className="flex items-center gap-3">
                        <img 
                          src={restaurant.image} 
                          alt={restaurant.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <span className="font-medium">{restaurant.name}</span>
                      </div>
                      
                      {restaurant.hasOptions ? (
                        <Button
                          onClick={() => handleRestaurantClick(category.id, restaurant)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 p-0"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Circle className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        {allRequiredMealsSelected() && (
          <Button 
            onClick={handleFinalSubmit}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
          >
            ยืนยันออร์เดอร์
          </Button>
        )}
      </div>
    </div>
  );
};

export default FoodCategories;