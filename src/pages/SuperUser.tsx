import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Users, History, Plus, Edit, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NavigationDropdown from "@/components/NavigationDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Admin {
  user_id: string;
  username: string;
  agent_name: string;
  role: string;
  state: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

const SuperUser = () => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Create User form state
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    agent_name: "",
    role: "",
  });

  useEffect(() => {
    fetchAdmins();
    fetchAuditLogs();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("admin")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติการใช้งานได้",
        variant: "destructive",
      });
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use a realistic fake email domain to avoid validation issues
      const fakeEmail = `${newUser.username}@internal.system`;
      
      const { error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "สร้างผู้ใช้ใหม่เรียบร้อยแล้ว",
      });

      setNewUser({ username: "", password: "" });
      fetchAdmins();
      fetchAuditLogs();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างผู้ใช้ได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditForm({
      agent_name: admin.agent_name,
      role: admin.role,
    });
    setIsEditDialogOpen(true);
  };

  const updateAdmin = async () => {
    if (!editingAdmin) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("admin")
        .update({
          agent_name: editForm.agent_name,
          role: editForm.role,
        })
        .eq("user_id", editingAdmin.user_id);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "อัพเดทข้อมูลผู้ใช้เรียบร้อยแล้ว",
      });

      setIsEditDialogOpen(false);
      fetchAdmins();
      fetchAuditLogs();
    } catch (error: any) {
      console.error("Error updating admin:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminState = async (adminId: string, currentState: string) => {
    const newState = currentState === "enable" ? "disable" : "enable";
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("admin")
        .update({ state: newState })
        .eq("user_id", adminId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `${newState === "enable" ? "เปิด" : "ปิด"}สิทธิ์การเข้าถึงเรียบร้อยแล้ว`,
      });

      fetchAdmins();
      fetchAuditLogs();
    } catch (error: any) {
      console.error("Error toggling admin state:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเปลี่ยนสิทธิ์การเข้าถึงได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return;

    setLoading(true);
    try {
      // First delete from admin table
      const { error: adminError } = await supabase
        .from("admin")
        .delete()
        .eq("user_id", adminId);

      if (adminError) throw adminError;

      // Then delete from auth.users using admin API
      const { error: authError } = await supabase.auth.admin.deleteUser(adminId);
      
      if (authError) {
        console.error("Error deleting from auth.users:", authError);
        // Don't throw here - admin record is already deleted
      }

      toast({
        title: "สำเร็จ",
        description: "ลบผู้ใช้เรียบร้อยแล้ว",
      });

      fetchAdmins();
      fetchAuditLogs();
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-slate-800">
              จัดการผู้ใช้ระดับสูง
            </h1>
            <p className="text-slate-600 mt-2">
              สำหรับการจัดการบัญชีผู้ใช้และตรวจสอบการใช้งานระบบ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
            <NavigationDropdown />
          </div>
        </div>

        <Tabs defaultValue="create-user" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create-user" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              สร้างผู้ใช้
            </TabsTrigger>
            <TabsTrigger value="manage-users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              จัดการผู้ใช้
            </TabsTrigger>
            <TabsTrigger value="usage-history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              ประวัติการใช้งาน
            </TabsTrigger>
          </TabsList>

          {/* Create User Tab */}
          <TabsContent value="create-user">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  สร้างบัญชีผู้ใช้ใหม่
                </CardTitle>
                <CardDescription>
                  สร้างบัญชีผู้ใช้สำหรับการเข้าถึงระบบจัดการ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createUser} className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-center block">ชื่อผู้ใช้</Label>
                    <Input
                      id="username"
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="กรอกชื่อผู้ใช้"
                      className="bg-white border-slate-300 text-center"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-center block">รหัสผ่าน</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="กรอกรหัสผ่าน"
                      className="bg-white border-slate-300 text-center"
                      required
                    />
                  </div>
                  <div className="text-center">
                    <Button type="submit" disabled={loading} className="bg-slate-700 hover:bg-slate-800">
                      {loading ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Users Tab */}
          <TabsContent value="manage-users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  จัดการผู้ใช้
                </CardTitle>
                <CardDescription>
                  แก้ไขข้อมูลผู้ใช้และควบคุมสิทธิ์การเข้าถึง
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">ชื่อผู้ใช้</TableHead>
                        <TableHead className="text-center">ชื่อเอเจนต์</TableHead>
                        <TableHead className="text-center">บทบาท</TableHead>
                        <TableHead className="text-center">สถานะ</TableHead>
                        <TableHead className="text-center">วันที่สร้าง</TableHead>
                        <TableHead className="text-center">การจัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.user_id}>
                          <TableCell className="font-medium text-center">{admin.username}</TableCell>
                          <TableCell className="text-center">{admin.agent_name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300">{admin.role}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={admin.state === "enable"}
                                onCheckedChange={() => toggleAdminState(admin.user_id, admin.state)}
                                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-slate-300"
                              />
                              <span className="text-sm">
                                {admin.state === "enable" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {new Date(admin.created_at).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(admin)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAdmin(admin.user_id)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage History Tab */}
          <TabsContent value="usage-history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  ประวัติการใช้งาน
                </CardTitle>
                <CardDescription>
                  บันทึกการเปลี่ยนแปลงและกิจกรรมของผู้ใช้
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">ลำดับที่</TableHead>
                        <TableHead className="text-center">ผู้เรียก</TableHead>
                        <TableHead className="text-center">รายละเอียด</TableHead>
                        <TableHead className="text-center">เวลา</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log, index) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="text-center">
                            {admins.find(admin => admin.user_id === log.user_id)?.username || "ระบบ"}
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <div className="font-medium">{log.action}</div>
                              {log.details && (
                                <div className="text-sm text-slate-600">{log.details}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {new Date(log.created_at).toLocaleString('th-TH')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader className="text-center">
              <DialogTitle className="text-center">แก้ไขข้อมูลผู้ใช้</DialogTitle>
              <DialogDescription className="text-center">
                แก้ไขชื่อเอเจนต์และบทบาทของผู้ใช้
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-agent-name" className="text-center block">ชื่อเอเจนต์</Label>
                <Input
                  id="edit-agent-name"
                  value={editForm.agent_name}
                  onChange={(e) => setEditForm({ ...editForm, agent_name: e.target.value })}
                  className="bg-white border-slate-300 text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-center block">บทบาท</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue className="text-center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">ผู้ใช้</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                    <SelectItem value="superuser">ผู้ดูแลระบบระดับสูง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={updateAdmin} disabled={loading} className="bg-slate-700 hover:bg-slate-800">
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperUser;