import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithUsername } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน",
        variant: "destructive"
      });
      return;
    }

    setIsLoggingIn(true);
    
    try {
      const result = await signInWithUsername(username, password);
      
      if (result.success) {
        // Don't navigate here - let the auth context handle it
        // The useEffect in AuthContext will redirect appropriately
      } else {
        toast({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          description: result.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-welcome)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChefHat className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Choose food</h1>
          <p className="text-lg text-muted-foreground mb-1">by GSB</p>
          <p className="text-base text-foreground font-medium">ระบบจองอาหารล่วงหน้า</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardHeader className="text-center">
            <CardTitle>เข้าสู่ระบบแอดมิน</CardTitle>
            <CardDescription>
              กรุณาเข้าสู่ระบบเพื่อเข้าไปยังหน้าจัดการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="ชื่อผู้ใช้"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white border-brand-pink/50 focus:border-primary"
                  disabled={isLoggingIn}
                />
              </div>
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-brand-pink/50 focus:border-primary pr-10"
                    disabled={isLoggingIn}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink/90 hover:to-brand-orange/90 text-foreground border-0"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;