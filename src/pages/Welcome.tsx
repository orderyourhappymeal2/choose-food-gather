import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Welcome = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error("กรุณากรอกรหัsผ่าน");
      return;
    }

    setIsLoading(true);
    
    // Simulate a brief loading delay for better UX
    setTimeout(() => {
      if (password === "innovation-ai") {
        toast.success("เข้าสู่ระบบสำเร็จ!");
        navigate("/food-categories");
      } else {
        toast.error("รหัสผ่านไม่ถูกต้อง");
      }
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-6">
            ระบบสั่งอาหาร
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            ระบบจัดการการสั่งอาหารสำหรับองค์กร
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">สำหรับผู้ใช้ทั่วไป</h2>
              <p className="text-slate-600 mb-6">เข้าสู่ระบบเพื่อสั่งอาหารและจัดการออเดอร์ของคุณ</p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white"
                size="lg"
              >
                เข้าสู่ระบบ
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">สำหรับแอดมิน</h2>
              <p className="text-slate-600 mb-6">เข้าสู่ระบบเพื่อจัดการร้านอาหารและออเดอร์</p>
              <Button 
                onClick={() => navigate("/admin-login")}
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                size="lg"
              >
                เข้าสู่ระบบแอดมิน
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold text-slate-800">
              เข้าสู่ระบบ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                รหัสผ่าน
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="กรุณากรอกรหัสผ่าน"
                className="border-slate-300 focus:border-slate-500"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handlePasswordSubmit}
              disabled={isLoading}
              className="w-full bg-slate-700 hover:bg-slate-800 text-white"
            >
              {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Welcome;