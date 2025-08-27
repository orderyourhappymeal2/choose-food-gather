import { Card, CardContent } from "@/components/ui/card";
import { ChefHat } from "lucide-react";
import NavigationDropdown from "@/components/NavigationDropdown";

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-brand-cream to-brand-yellow p-4">
      <div className="max-w-6xl mx-auto pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0">
          <NavigationDropdown />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChefHat className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Choose food</h1>
          <p className="text-lg text-muted-foreground mb-1">by GSB</p>
          <p className="text-base text-foreground font-medium">ระบบจองอาหารล่วงหน้า</p>
        </div>

        {/* Main Admin Container */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center text-foreground mb-6">ระบบจัดการ</h2>
            
            {/* Admin content will go here */}
            <div className="min-h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Admin functionality coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;