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
import { useToast } from "@/components/ui/use-toast";
import { Shield, Users, History, Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NavigationDropdown from "@/components/NavigationDropdown";

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
      const { error } = await supabase
        .from("admin")
        .delete()
        .eq("user_id", adminId);

      if (error) throw error;

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
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              จัดการผู้ใช้ระดับสูง
            </h1>
            <p className="text-muted-foreground mt-2">
              สำหรับการจัดการบัญชีผู้ใช้และตรวจสอบการใช้งานระบบ
            </p>
          </div>
          <NavigationDropdown />
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
                <form onSubmit={createUser} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="username">ชื่อผู้ใช้</Label>
                    <Input
                      id="username"
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="กรอกชื่อผู้ใช้"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">รหัสผ่าน</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="กรอกรหัสผ่าน"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
                  </Button>
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
                        <TableHead>ชื่อผู้ใช้</TableHead>
                        <TableHead>ชื่อเอเจนต์</TableHead>
                        <TableHead>บทบาท</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>วันที่สร้าง</TableHead>
                        <TableHead>การจัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.user_id}>
                          <TableCell className="font-medium">{admin.username}</TableCell>
                          <TableCell>{admin.agent_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{admin.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={admin.state === "enable" ? "default" : "secondary"}
                              className={
                                admin.state === "enable" 
                                  ? "bg-green-100 text-green-800 border-green-300" 
                                  : "bg-gray-100 text-gray-800 border-gray-300"
                              }
                            >
                              {admin.state === "enable" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(admin.created_at).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(admin)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAdminState(admin.user_id, admin.state)}
                              >
                                {admin.state === "enable" ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAdmin(admin.user_id)}
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
                        <TableHead>ลำดับที่</TableHead>
                        <TableHead>ผู้เรียก</TableHead>
                        <TableHead>รายละเอียด</TableHead>
                        <TableHead>เวลา</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log, index) => (
                        <TableRow key={log.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {admins.find(admin => admin.user_id === log.user_id)?.username || "ระบบ"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.action}</div>
                              {log.details && (
                                <div className="text-sm text-muted-foreground">{log.details}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
              <DialogDescription>
                แก้ไขชื่อเอเจนต์และบทบาทของผู้ใช้
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-agent-name">ชื่อเอเจนต์</Label>
                <Input
                  id="edit-agent-name"
                  value={editForm.agent_name}
                  onChange={(e) => setEditForm({ ...editForm, agent_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">บทบาท</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">ผู้ใช้</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                    <SelectItem value="superuser">ผู้ดูแลระบบระดับสูง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={updateAdmin} disabled={loading}>
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