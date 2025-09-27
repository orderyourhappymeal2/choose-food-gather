import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Link } from "lucide-react";
import { toast } from "sonner";

interface PortalLinkModalProps {
  url: string;
  trigger: React.ReactNode;
}

const PortalLinkModal = ({ url, trigger }: PortalLinkModalProps) => {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('คัดลอกลิงก์สำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการคัดลอกลิงก์');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            ลิ้ง Portal
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            value={url}
            readOnly
            className="flex-1"
          />
          <Button 
            size="sm" 
            onClick={handleCopyLink}
            className="px-3"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PortalLinkModal;