import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, Home, Shield, Utensils, ClipboardList, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NavigationDropdown = () => {
  const navigate = useNavigate();

  const navigationItems = [
    { name: "หน้าแรก", path: "/", icon: Home },
    { name: "แอดมิน", path: "/admin", icon: Shield },
    { name: "หมวดหมู่อาหาร", path: "/food-categories", icon: Utensils },
    { name: "สรุปคำสั่งซื้อ", path: "/order-summary", icon: ClipboardList },
    { name: "ขอบคุณ", path: "/thank-you", icon: CheckCircle },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-white/80 hover:bg-white border-brand-pink/50 hover:border-primary"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white/95 backdrop-blur-sm border-brand-pink/30"
        sideOffset={5}
      >
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <DropdownMenuItem
              key={item.path}
              onClick={() => navigate(item.path)}
              className="cursor-pointer hover:bg-brand-cream/50 focus:bg-brand-cream/50"
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {item.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavigationDropdown;