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
          className="bg-popover/90 hover:bg-popover border-border hover:border-ring shadow-lg"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-popover/95 backdrop-blur-md border-border shadow-xl z-50"
        sideOffset={5}
      >
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <DropdownMenuItem
              key={item.path}
              onClick={() => navigate(item.path)}
              className="cursor-pointer hover:bg-accent focus:bg-accent text-popover-foreground"
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