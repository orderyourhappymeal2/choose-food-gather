import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import NavigationDropdown from "@/components/NavigationDropdown";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] p-4">
      <div className="max-w-md mx-auto pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0">
          <NavigationDropdown />
        </div>

        <div className="text-center mt-20">
          <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
          <p className="text-xl text-muted-foreground mb-4">หน้าที่คุณค้นหาไม่พบ</p>
          <a href="/" className="text-primary hover:text-primary/80 underline">
            กลับไปหน้าแรก
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
