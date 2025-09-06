import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChefHat, Store, FileText, Clock, CheckCircle, Plus, FilePlus, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, UtensilsCrossed, Upload, X, Edit, Eye, Trash2, Calendar as CalendarIcon, Send, Power, Link, ShoppingCart, Receipt } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import NavigationDropdown from "@/components/NavigationDropdown";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
// Plan form schema
const planFormSchema = z.object({
  plan_name: z.string().min(1, "กรุณากรอกชื่องาน"),
  plan_location: z.string().min(1, "กรุณากรอกสถานที่"),
  plan_date: z.date({ required_error: "กรุณาเลือกวันที่" }),
  plan_time_start: z.string().min(1, "กรุณาเลือกเวลาเริ่มต้น"),
  plan_time_end: z.string().min(1, "กรุณาเลือกเวลาสิ้นสุด"),
  plan_pwd: z.string().min(1, "กรุณากรอกรหัส"),
  plan_maxp: z.string().min(1, "กรุณากรอกจำนวนผู้เข้าร่วม"),
  plan_editor: z.string().min(1, "กรุณากรอกชื่อผู้สร้างฟอร์ม"),
});

type PlanFormData = z.infer<typeof planFormSchema>;

// PlanList component
const PlanList = ({ filterState }: { filterState?: string }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishingPlan, setPublishingPlan] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedPlanForOrder, setSelectedPlanForOrder] = useState<any>(null);

  // Edit form
  const editForm = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
  });

  // Format date to Thai format
  const formatThaiDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "d MMM yyyy", { locale: th }).replace(/\d{4}/, (year) => (parseInt(year) + 543).toString());
    } catch {
      return dateString;
    }
  };

  // Fetch plans
  const fetchPlans = async () => {
    try {
      let query = supabase
        .from('plan')
        .select('*');

      if (filterState) {
        query = query.eq('plan_state', filterState);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลแผน');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle edit
  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    const [startTime, endTime] = plan.plan_time.includes('-') ? plan.plan_time.split(' - ') : [plan.plan_time, plan.plan_time];
    editForm.reset({
      plan_name: plan.plan_name,
      plan_location: plan.plan_location,
      plan_date: new Date(plan.plan_date),
      plan_time_start: startTime,
      plan_time_end: endTime,
      plan_pwd: plan.plan_pwd,
      plan_maxp: plan.plan_maxp.toString(),
      plan_editor: plan.plan_editor,
    });
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = (plan: any) => {
    setDeletingPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  // Handle publish
  const handlePublish = (plan: any) => {
    setPublishingPlan(plan);
    setIsPublishDialogOpen(true);
  };

  // Confirm publish
  const confirmPublish = async () => {
    if (!publishingPlan) return;

    try {
      // Generate link to welcome page with plan ID
      const welcomeUrl = `${window.location.origin}/welcome?plan=${publishingPlan.plan_id}`;
      
      const { error } = await supabase
        .from('plan')
        .update({ 
          plan_state: 'published',
          url_portal: welcomeUrl,
          is_open: 1
        })
        .eq('plan_id', publishingPlan.plan_id);

      if (error) throw error;

      toast.success('เผยแพร่แผนสำเร็จ');
      setIsPublishDialogOpen(false);
      setPublishingPlan(null);
      fetchPlans();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเผยแพร่แผน');
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingPlan) return;

    try {
      const { error } = await supabase
        .from('plan')
        .delete()
        .eq('plan_id', deletingPlan.plan_id);

      if (error) throw error;

      toast.success('ลบแผนสำเร็จ');
      setPlans(plans.filter(p => p.plan_id !== deletingPlan.plan_id));
      setIsDeleteDialogOpen(false);
      setDeletingPlan(null);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบแผน');
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (data: PlanFormData) => {
    if (!editingPlan) return;

    try {
      const planTime = `${data.plan_time_start} - ${data.plan_time_end}`;
      
      const { error } = await supabase
        .from('plan')
        .update({
          plan_name: data.plan_name,
          plan_location: data.plan_location,
          plan_date: data.plan_date.toISOString().split('T')[0],
          plan_time: planTime,
          plan_pwd: data.plan_pwd,
          plan_maxp: parseInt(data.plan_maxp),
          plan_editor: data.plan_editor,
        })
        .eq('plan_id', editingPlan.plan_id);

      if (error) throw error;

      toast.success('แก้ไขแผนสำเร็จ');
      setIsEditModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการแก้ไขแผน');
    }
  };

  // Handle toggle switch (is_open)
  const handleToggleOpen = async (plan: any, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('plan')
        .update({ is_open: newValue ? 1 : 0 } as any)
        .eq('plan_id', plan.plan_id);

      if (error) throw error;

      toast.success('อัปเดตสถานะการเปิดรับสำเร็จ');
      fetchPlans();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Handle finish plan
  const handleFinishPlan = async (plan: any) => {
    try {
      const { error } = await supabase
        .from('plan')
        .update({ plan_state: 'finished' })
        .eq('plan_id', plan.plan_id);

      if (error) throw error;

      toast.success('ดำเนินการเสร็จสิ้นแล้ว');
      fetchPlans();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Handle copy link
  const handleCopyLink = async (plan: any) => {
    if (!plan.url_portal) {
      toast.error('ไม่พบลิงก์ในแผนนี้');
      return;
    }

    try {
      await navigator.clipboard.writeText(plan.url_portal);
      toast.success('คัดลอกลิงก์สำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการคัดลอกลิงก์');
    }
  };

  // Handle show orders
  const handleShowOrders = (plan: any) => {
    setSelectedPlanForOrder(plan);
    setIsOrderModalOpen(true);
  };

  // Generate time options
  const timeOptions = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-4">
      {plans.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          ยังไม่มีแผนการจองอาหาร
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.plan_id} className="bg-gradient-to-r from-brand-cream/20 to-transparent border border-brand-pink/10 overflow-hidden">
              <CardContent className="p-4 min-w-0">
                <div className="space-y-3 min-w-0">
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-1 min-w-0">
                      <Label className="text-xs font-medium text-muted-foreground">ชื่องาน</Label>
                      <div className="text-sm font-semibold text-foreground truncate">{plan.plan_name}</div>
                    </div>
                    
                    <div className="flex flex-col space-y-1 min-w-0">
                      <Label className="text-xs font-medium text-muted-foreground">สถานที่</Label>
                      <div className="text-sm text-foreground truncate">{plan.plan_location}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex flex-col space-y-1 min-w-0">
                        <Label className="text-xs font-medium text-muted-foreground">วันที่</Label>
                        <div className="text-sm text-foreground truncate">{formatThaiDate(plan.plan_date)}</div>
                      </div>
                      <div className="flex flex-col space-y-1 min-w-0">
                        <Label className="text-xs font-medium text-muted-foreground">เวลา</Label>
                        <div className="text-sm text-foreground truncate">{plan.plan_time}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex flex-col space-y-1 min-w-0">
                        <Label className="text-xs font-medium text-muted-foreground">รหัส</Label>
                        <div className="text-sm text-foreground truncate">{plan.plan_pwd}</div>
                      </div>
                      <div className="flex flex-col space-y-1 min-w-0">
                        <Label className="text-xs font-medium text-muted-foreground">จำนวนคน</Label>
                        <div className="text-sm text-foreground truncate">{plan.plan_maxp} คน</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1 min-w-0">
                      <Label className="text-xs font-medium text-muted-foreground">ผู้สร้าง</Label>
                      <div className="text-sm text-foreground truncate">{plan.plan_editor}</div>
                    </div>
                  </div>
                  
                  {filterState === 'published' && (
                    <div className="flex items-center justify-between pt-2 border-t border-brand-pink/10">
                      <div className="flex items-center space-x-2">
                        <Label className="text-xs font-medium text-muted-foreground">เปิดรับ:</Label>
                        <Switch
                          checked={plan.is_open === 1}
                          onCheckedChange={(checked) => handleToggleOpen(plan, checked)}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2 overflow-hidden justify-center">
                    {filterState === 'waiting' && (
                      <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-green-600 hover:bg-green-600 hover:border-green-600" onClick={() => {}}>
                        <Plus className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {filterState === 'finished' && (
                      <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => {}}>
                        <FileText className="h-4 w-4 text-gray-800" />
                      </Button>
                    )}
                    {filterState === 'waiting' && (
                      <>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleEdit(plan)}>
                          <Edit className="h-4 w-4 text-gray-800" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handlePublish(plan)}>
                          <Send className="h-4 w-4 text-gray-800" />
                        </Button>
                      </>
                    )}
                    {filterState === 'published' && (
                      <>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleFinishPlan(plan)}>
                          <CheckCircle className="h-4 w-4 text-gray-800" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleShowOrders(plan)}>
                          <ShoppingCart className="h-4 w-4 text-gray-800" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleCopyLink(plan)}>
                          <Link className="h-4 w-4 text-gray-800" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-red-600 hover:bg-red-600 hover:border-red-600" onClick={() => handleDelete(plan)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">แก้ไขแผนการจอง</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={editForm.control}
                  name="plan_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่องาน</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="กรอกชื่องาน" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="plan_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานที่</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="กรอกสถานที่" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="plan_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันที่</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                `${format(field.value, "d MMMM", { locale: th })} ${field.value.getFullYear() + 543}`
                              ) : (
                                <span>เลือกวันที่</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={editForm.control}
                    name="plan_time_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เวลาเริ่ม</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกเวลาเริ่ม" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="plan_time_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เวลาจบ</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกเวลาจบ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="plan_pwd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัส</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="กรอกรหัส" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="plan_maxp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนผู้เข้าร่วม</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="กรอกจำนวนผู้เข้าร่วม" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="plan_editor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อผู้สร้างฟอร์ม</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="กรอกชื่อผู้สร้างฟอร์ม" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 sm:flex-none"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                >
                  บันทึกการแก้ไข
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบแผน</AlertDialogTitle>
            <AlertDialogDescription>
              หากลบแผน "{deletingPlan?.plan_name}" แผนการสั่งจองทั้งหมดจะถูกลบออกไปด้วย
              <br />
              คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              ลบแผน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation */}
      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการเผยแพร่แผน</AlertDialogTitle>
            <AlertDialogDescription>
              หากเผยแพร่แผน "{publishingPlan?.plan_name}" แล้ว จะไม่สามารถย้อนกลับมาแก้ไขได้อีก
              <br />
              คุณแน่ใจหรือไม่ที่จะเผยแพร่แผนนี้?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} className="bg-primary hover:bg-primary/90">
              เผยแพร่แผน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              แสดงการสั่งซื้ออาหาร - {selectedPlanForOrder?.plan_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Two dropdowns at the top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">เลือกร้านอาหาร</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="-- เลือกร้านอาหาร --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant1">ร้านอาหารไทย</SelectItem>
                    <SelectItem value="restaurant2">ร้านอาหารจีน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">เลือกมื้อ</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="-- เลือกมื้อ --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">มื้อเช้า</SelectItem>
                    <SelectItem value="lunch">มื้อกลางวัน</SelectItem>
                    <SelectItem value="dinner">มื้อเย็น</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Orders content area */}
            <div className="min-h-[400px] border border-brand-pink/10 rounded-lg bg-white/30 p-4">
              <div className="text-center text-muted-foreground py-8">
                เลือกร้านอาหารและมื้ออาหารเพื่อดูรายการสั่งซื้อ
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Admin = () => {
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [progressSortOrder, setProgressSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [completedSortOrder, setCompletedSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [expandedRestaurants, setExpandedRestaurants] = useState<{ [key: string]: boolean }>({});
  const [isPlanSubmitting, setIsPlanSubmitting] = useState(false);

  // Restaurant form states
  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    open_day: '',
    open_time: '',
    food_type_1: '',
    food_type_2: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restaurant data and modals
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewMenuModalOpen, setIsViewMenuModalOpen] = useState(false);
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const foodTypes = ['จานหลัก', 'เครื่องดื่ม', 'ของหวาน'];

  // Plan form
  const planForm = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      plan_name: '',
      plan_location: '',
      plan_time_start: '',
      plan_time_end: '',
      plan_pwd: '',
      plan_maxp: '',
      plan_editor: '',
    },
  });

  // Generate time options (06:00 to 21:00)
  const timeOptions = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  // Fetch restaurants data
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shop')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลร้านอาหาร');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setFormData({
      shop_name: restaurant.shop_name,
      description: restaurant.description,
      open_day: restaurant.open_day,
      open_time: restaurant.open_time,
      food_type_1: restaurant.food_type_1,
      food_type_2: restaurant.food_type_2 || '',
    });
    if (restaurant.url_pic) {
      setImagePreview(restaurant.url_pic);
    }
    setIsEditModalOpen(true);
  };

  const handleUpdateRestaurant = async () => {
    if (!selectedRestaurant || !validateForm()) return;
    
    setIsSubmitting(true);
    try {
      let imageUrl = selectedRestaurant.url_pic;
      
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `shop/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('shop')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('shop')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('shop')
        .update({
          shop_name: formData.shop_name,
          description: formData.description,
          open_day: formData.open_day,
          open_time: formData.open_time,
          food_type_1: formData.food_type_1,
          food_type_2: formData.food_type_2 || null,
          url_pic: imageUrl,
        })
        .eq('shop_id', selectedRestaurant.shop_id);

      if (error) throw error;

      toast.success('แก้ไขร้านอาหารสำเร็จ!');
      resetForm();
      setIsEditModalOpen(false);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('เกิดข้อผิดพลาดในการแก้ไขร้านอาหาร');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!selectedRestaurant) return;
    
    try {
      const { error } = await supabase
        .from('shop')
        .delete()
        .eq('shop_id', selectedRestaurant.shop_id);

      if (error) throw error;

      toast.success('ลบร้านอาหารสำเร็จ!');
      setIsDeleteConfirmOpen(false);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('เกิดข้อผิดพลาดในการลบร้านอาหาร');
    }
  };

  const resetForm = () => {
    setFormData({
      shop_name: '',
      description: '',
      open_day: '',
      open_time: '',
      food_type_1: '',
      food_type_2: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const requiredFields = ['shop_name', 'description', 'open_day', 'open_time', 'food_type_1'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`กรุณากรอก${field === 'shop_name' ? 'ชื่อร้านอาหาร' : 
          field === 'description' ? 'รายละเอียด' :
          field === 'open_day' ? 'วันที่เปิด' :
          field === 'open_time' ? 'เวลาเปิด' :
          field === 'food_type_1' ? 'ประเภทร้าน' : field}`);
        return false;
      }
    }
    if (!selectedImage) {
      toast.error('กรุณาเลือกรูปภาพ');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      let imageUrl = '';
      
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `shop/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('shop')
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('shop')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('shop')
        .insert([{
          shop_name: formData.shop_name,
          description: formData.description,
          open_day: formData.open_day,
          open_time: formData.open_time,
          food_type_1: formData.food_type_1,
          food_type_2: formData.food_type_2 || null,
          url_pic: imageUrl,
        }]);

      if (error) {
        throw error;
      }

      toast.success('เพิ่มร้านอาหารสำเร็จ!');
      resetForm();
      setIsRestaurantModalOpen(false);
    } catch (error) {
      console.error('Error adding restaurant:', error);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มร้านอาหาร');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProgressSort = () => {
    setProgressSortOrder(prev => 
      prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'
    );
  };

  const toggleCompletedSort = () => {
    setCompletedSortOrder(prev => 
      prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'
    );
  };

  const toggleRestaurantMenu = (restaurantId: string) => {
    setExpandedRestaurants(prev => ({
      ...prev,
      [restaurantId]: !prev[restaurantId]
    }));
  };

  const getSortIcon = (sortOrder: 'none' | 'asc' | 'desc') => {
    switch (sortOrder) {
      case 'asc': return ArrowUp;
      case 'desc': return ArrowDown;
      default: return ArrowUpDown;
    }
  };

  // Handle plan form submission
  const handlePlanSubmit = async (data: PlanFormData) => {
    setIsPlanSubmitting(true);
    try {
      // Store date in CE format for database (same as update function)
      const timeRange = `${data.plan_time_start} - ${data.plan_time_end}`;

      const { error } = await (supabase as any)
        .from('plan')
        .insert([{
          plan_name: data.plan_name,
          plan_location: data.plan_location,
          plan_date: data.plan_date.toISOString().split('T')[0], // Store as CE format like update function
          plan_time: timeRange,
          plan_pwd: data.plan_pwd,
          plan_maxp: parseInt(data.plan_maxp),
          plan_editor: data.plan_editor,
        }]);

      if (error) throw error;

      toast.success('เพิ่มใบสั่งอาหารสำเร็จ!');
      planForm.reset();
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มใบสั่งอาหาร');
    } finally {
      setIsPlanSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-[var(--gradient-welcome)] px-0 py-4 sm:p-6">
      <div className="max-w-6xl mx-auto pt-4 sm:pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0 p-6 z-50">
          <NavigationDropdown />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChefHat className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Choose food</h1>
          <p className="text-lg text-muted-foreground mb-1">by GSB</p>
          <p className="text-base text-foreground font-medium">ระบบจองอาหารล่วงหน้า (แอดมิน)</p>
        </div>

        {/* Main Admin Container */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30 mx-2 sm:mx-4">
          <CardContent className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-center text-foreground mb-8">ระบบจัดการ</h2>
            
            <Tabs defaultValue="restaurants" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-brand-pink/20 via-brand-cream/30 to-brand-yellow/20 border border-brand-pink/30">
                <TabsTrigger value="restaurants" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-primary">
                  <Store className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm hidden sm:block">รายชื่อร้านอาหาร</span>
                </TabsTrigger>
                <TabsTrigger value="drafts" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-primary">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm hidden sm:block">แบบร่างใบจองอาหาร</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-primary">
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm hidden sm:block">กำลังดำเนินการ</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-primary">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm hidden sm:block">เสร็จสิ้น</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="restaurants" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-foreground">รายชื่อร้านอาหาร</h3>
                      <Dialog open={isRestaurantModalOpen} onOpenChange={setIsRestaurantModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">เพิ่มร้านอาหาร</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] p-0 overflow-hidden">
                          <DialogHeader className="p-4 pb-2 border-b bg-white/90">
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              เพิ่มร้านอาหาร
                            </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="flex-1 max-h-[calc(90vh-10rem)] px-4">
                            <div className="py-4 space-y-6">
                              {/* Shop Name */}
                              <div>
                                <Label htmlFor="shop_name" className="text-sm font-medium text-foreground">
                                  ชื่อร้านอาหาร *
                                </Label>
                                <Input
                                  id="shop_name"
                                  type="text"
                                  value={formData.shop_name}
                                  onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                                  placeholder="กรุณากรอกชื่อร้านอาหาร"
                                  className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary"
                                />
                              </div>

                              {/* Description */}
                              <div>
                                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                                  รายละเอียด *
                                </Label>
                                <Textarea
                                  id="description"
                                  value={formData.description}
                                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="กรุณากรอกรายละเอียดร้านอาหาร"
                                  rows={3}
                                  className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary resize-none"
                                />
                              </div>

                              {/* Open Day and Time */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="open_day" className="text-sm font-medium text-foreground">
                                    วันที่เปิด *
                                  </Label>
                                  <Input
                                    id="open_day"
                                    type="text"
                                    value={formData.open_day}
                                    onChange={(e) => setFormData(prev => ({ ...prev, open_day: e.target.value }))}
                                    placeholder="เช่น จันทร์-ศุกร์"
                                    className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="open_time" className="text-sm font-medium text-foreground">
                                    เวลาเปิด *
                                  </Label>
                                  <Input
                                    id="open_time"
                                    type="text"
                                    value={formData.open_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, open_time: e.target.value }))}
                                    placeholder="เช่น 08:00-17:00"
                                    className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary"
                                  />
                                </div>
                              </div>

                              {/* Food Types */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="food_type_1" className="text-sm font-medium text-foreground">
                                    ประเภทร้าน *
                                  </Label>
                                  <Select 
                                    value={formData.food_type_1} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, food_type_1: value }))}
                                  >
                                    <SelectTrigger className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary">
                                      <SelectValue placeholder="เลือกประเภทร้าน" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {foodTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="food_type_2" className="text-sm font-medium text-foreground">
                                    ประเภทร้าน (ถ้ามี)
                                  </Label>
                                  <Select 
                                    value={formData.food_type_2} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, food_type_2: value === "none" ? "" : value }))}
                                  >
                                    <SelectTrigger className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary">
                                      <SelectValue placeholder="เลือกประเภทร้าน (ไม่บังคับ)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">ไม่เลือก</SelectItem>
                                      {foodTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Image Upload */}
                              <div>
                                <Label htmlFor="image" className="text-sm font-medium text-foreground">
                                  รูปภาพ *
                                </Label>
                                <div className="mt-1">
                                  <div className="border-2 border-dashed border-brand-pink/30 rounded-lg p-4 bg-white/50">
                                    <input
                                      id="image"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageChange}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor="image"
                                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                                    >
                                      {imagePreview ? (
                                        <div className="relative">
                                          <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full max-w-[200px] h-32 object-cover rounded-lg"
                                          />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setSelectedImage(null);
                                              setImagePreview(null);
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <Upload className="h-8 w-8 text-muted-foreground" />
                                          <div className="text-center">
                                            <span className="text-sm text-foreground">คลิกเพื่อเลือกรูปภาพ</span>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              รองรับไฟล์ JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
                                            </p>
                                          </div>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                          
                          <DialogFooter className="p-4 border-t bg-white/90 mt-auto">
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  resetForm();
                                  setIsRestaurantModalOpen(false);
                                }}
                                className="flex-1 sm:flex-none border-brand-pink/30 hover:bg-brand-pink/10"
                                disabled={isSubmitting}
                              >
                                ยกเลิก
                              </Button>
                              <Button 
                                variant="default" 
                                onClick={handleSubmit}
                                className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
                              </Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-4">
                      {/* Restaurant Grid */}
                      {isLoading ? (
                        <Card className="bg-white/60 border border-brand-pink/10">
                          <CardContent className="p-6 text-center">
                            <div className="text-muted-foreground">กำลังโหลดข้อมูล...</div>
                          </CardContent>
                        </Card>
                      ) : restaurants.length === 0 ? (
                        <Card className="bg-white/60 border border-brand-pink/10">
                          <CardContent className="p-6 text-center">
                            <div className="text-muted-foreground">ยังไม่มีร้านอาหาร</div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {restaurants.map((restaurant) => (
                            <Card key={restaurant.shop_id} className="bg-white/60 border border-brand-pink/10 overflow-hidden">
                              <CardContent className="p-0">
                                <div className="flex flex-col">
                                  {/* Restaurant Image */}
                                  <div className="w-full h-48 bg-gradient-to-br from-brand-cream/20 to-brand-pink/10 relative overflow-hidden">
                                    {restaurant.url_pic ? (
                                      <img
                                        src={restaurant.url_pic}
                                        alt={restaurant.shop_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Store className="h-16 w-16 text-muted-foreground/40" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Restaurant Info */}
                                  <div className="p-4 space-y-3">
                                    {/* Name and Description Container */}
                                    <div className="space-y-2">
                                      <h4 className="text-lg font-bold text-foreground line-clamp-2">
                                        {restaurant.shop_name}
                                      </h4>
                                      <p className="text-sm text-muted-foreground line-clamp-3">
                                        {restaurant.description}
                                      </p>
                                    </div>

                                    {/* Details Container */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-primary" />
                                          <span className="font-medium text-foreground">วันเปิด:</span>
                                        </div>
                                        <p className="text-muted-foreground ml-6">{restaurant.open_day}</p>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-primary" />
                                          <span className="font-medium text-foreground">เวลา:</span>
                                        </div>
                                        <p className="text-muted-foreground ml-6">{restaurant.open_time}</p>
                                      </div>
                                    </div>

                                    {/* Food Types Container */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-foreground text-sm">ประเภทอาหาร:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2 ml-6">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                          {restaurant.food_type_1}
                                        </span>
                                        {restaurant.food_type_2 && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                            {restaurant.food_type_2}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons Container */}
                                    <div className="flex justify-center pt-3 border-t border-brand-pink/10">
                                      <div className="flex gap-2">
                                        {/* Add Menu Button */}
                                         <Button
                                           size="sm"
                                           variant="outline"
                                           className="h-9 w-9 p-0 border-green-600 hover:bg-green-600 hover:border-green-600"
                                           onClick={() => {
                                             setSelectedRestaurant(restaurant);
                                             setIsAddMenuModalOpen(true);
                                           }}
                                         >
                                           <Plus className="h-4 w-4 text-green-600" />
                                         </Button>

                                         {/* Edit Button */}
                                         <Button
                                           size="sm"
                                           variant="outline"
                                           className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800"
                                           onClick={() => handleEditRestaurant(restaurant)}
                                         >
                                           <Edit className="h-4 w-4 text-gray-800" />
                                         </Button>

                                         {/* View Menu Button */}
                                         <Button
                                           size="sm"
                                           variant="outline"
                                           className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800"
                                           onClick={() => {
                                             setSelectedRestaurant(restaurant);
                                             setIsViewMenuModalOpen(true);
                                           }}
                                         >
                                           <Eye className="h-4 w-4 text-gray-800" />
                                         </Button>

                                         {/* Delete Button */}
                                         <AlertDialog open={isDeleteConfirmOpen && selectedRestaurant?.shop_id === restaurant.shop_id} onOpenChange={setIsDeleteConfirmOpen}>
                                           <AlertDialogTrigger asChild>
                                             <Button
                                               size="sm"
                                               variant="outline"
                                               className="h-9 w-9 p-0 border-red-600 hover:bg-red-600 hover:border-red-600"
                                               onClick={() => {
                                                 setSelectedRestaurant(restaurant);
                                                 setIsDeleteConfirmOpen(true);
                                               }}
                                             >
                                               <Trash2 className="h-4 w-4 text-red-600" />
                                             </Button>
                                           </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>ยืนยันการลบร้านอาหาร</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                คุณแน่ใจหรือไม่ที่จะลบร้าน "{restaurant.shop_name}"? 
                                                <br />
                                                <span className="text-red-600 font-medium">
                                                  หากลบร้านอาหาร รายการอาหารทั้งหมดในร้านนี้จะถูกลบออกไปด้วย
                                                </span>
                                                <br />
                                                การกระทำนี้ไม่สามารถย้อนกลับได้
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel 
                                                onClick={() => {
                                                  setIsDeleteConfirmOpen(false);
                                                  setSelectedRestaurant(null);
                                                }}
                                              >
                                                ยกเลิก
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={handleDeleteRestaurant}
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                ลบร้านอาหาร
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Edit Restaurant Modal */}
                      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] p-0 overflow-hidden">
                          <DialogHeader className="p-4 pb-2 border-b bg-white/90">
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              แก้ไขร้านอาหาร
                            </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="flex-1 max-h-[calc(90vh-10rem)] px-4">
                            <div className="py-4 space-y-6">
                              {/* Shop Name */}
                              <div>
                                <Label htmlFor="edit_shop_name" className="text-sm font-medium text-foreground">
                                  ชื่อร้านอาหาร *
                                </Label>
                                <Input
                                  id="edit_shop_name"
                                  type="text"
                                  value={formData.shop_name}
                                  onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                                  placeholder="กรุณากรอกชื่อร้านอาหาร"
                                  className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary"
                                />
                              </div>

                              {/* Description */}
                              <div>
                                <Label htmlFor="edit_description" className="text-sm font-medium text-foreground">
                                  รายละเอียด *
                                </Label>
                                <Textarea
                                  id="edit_description"
                                  value={formData.description}
                                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="กรุณากรอกรายละเอียดร้านอาหาร"
                                  rows={3}
                                  className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary resize-none"
                                />
                              </div>

                              {/* Open Day and Time */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit_open_day" className="text-sm font-medium text-foreground">
                                    วันที่เปิด *
                                  </Label>
                                  <Input
                                    id="edit_open_day"
                                    type="text"
                                    value={formData.open_day}
                                    onChange={(e) => setFormData(prev => ({ ...prev, open_day: e.target.value }))}
                                    placeholder="เช่น จันทร์-ศุกร์"
                                    className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit_open_time" className="text-sm font-medium text-foreground">
                                    เวลาเปิด *
                                  </Label>
                                  <Input
                                    id="edit_open_time"
                                    type="text"
                                    value={formData.open_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, open_time: e.target.value }))}
                                    placeholder="เช่น 08:00-17:00"
                                    className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary"
                                  />
                                </div>
                              </div>

                              {/* Food Types */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit_food_type_1" className="text-sm font-medium text-foreground">
                                    ประเภทร้าน *
                                  </Label>
                                  <Select 
                                    value={formData.food_type_1} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, food_type_1: value }))}
                                  >
                                    <SelectTrigger className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary">
                                      <SelectValue placeholder="เลือกประเภทร้าน" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {foodTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit_food_type_2" className="text-sm font-medium text-foreground">
                                    ประเภทร้าน (ถ้ามี)
                                  </Label>
                                  <Select 
                                    value={formData.food_type_2} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, food_type_2: value === "none" ? "" : value }))}
                                  >
                                    <SelectTrigger className="mt-1 bg-white/80 border-brand-pink/20 focus:border-primary">
                                      <SelectValue placeholder="เลือกประเภทร้าน (ไม่บังคับ)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">ไม่เลือก</SelectItem>
                                      {foodTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Image Upload */}
                              <div>
                                <Label htmlFor="edit_image" className="text-sm font-medium text-foreground">
                                  รูปภาพ
                                </Label>
                                <div className="mt-1">
                                  <div className="border-2 border-dashed border-brand-pink/30 rounded-lg p-4 bg-white/50">
                                    <input
                                      id="edit_image"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageChange}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor="edit_image"
                                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                                    >
                                      {imagePreview ? (
                                        <div className="relative">
                                          <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full max-w-[200px] h-32 object-cover rounded-lg"
                                          />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setSelectedImage(null);
                                              setImagePreview(null);
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <Upload className="h-8 w-8 text-muted-foreground" />
                                          <div className="text-center">
                                            <span className="text-sm text-foreground">คลิกเพื่อเลือกรูปภาพใหม่</span>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              รองรับไฟล์ JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
                                            </p>
                                          </div>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                          
                          <DialogFooter className="p-4 border-t bg-white/90 mt-auto">
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  resetForm();
                                  setIsEditModalOpen(false);
                                  setSelectedRestaurant(null);
                                }}
                                className="flex-1 sm:flex-none border-brand-pink/30 hover:bg-brand-pink/10"
                                disabled={isSubmitting}
                              >
                                ยกเลิก
                              </Button>
                              <Button 
                                variant="default" 
                                onClick={handleUpdateRestaurant}
                                className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'กำลังบันทึก...' : 'อัปเดต'}
                              </Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Add Menu Modal (Placeholder) */}
                      <Dialog open={isAddMenuModalOpen} onOpenChange={setIsAddMenuModalOpen}>
                        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              เพิ่มรายการอาหาร - {selectedRestaurant?.shop_name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="p-4 text-center text-muted-foreground">
                            ฟีเจอร์นี้จะพัฒนาในอนาคต
                          </div>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsAddMenuModalOpen(false);
                                setSelectedRestaurant(null);
                              }}
                            >
                              ปิด
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* View Menu Modal (Placeholder) */}
                      <Dialog open={isViewMenuModalOpen} onOpenChange={setIsViewMenuModalOpen}>
                        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              รายการอาหาร - {selectedRestaurant?.shop_name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="p-4 text-center text-muted-foreground">
                            ฟีเจอร์นี้จะพัฒนาในอนาคต
                          </div>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsViewMenuModalOpen(false);
                                setSelectedRestaurant(null);
                              }}
                            >
                              ปิด
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="drafts" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-foreground">แบบร่างใบจองอาหาร</h3>
                      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                            <FilePlus className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">เพิ่มใบสั่งอาหาร</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              เพิ่มใบสั่งอาหาร
                            </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="flex-1 max-h-[calc(90vh-12rem)] overflow-auto">
                            <Form {...planForm}>
                              <form onSubmit={planForm.handleSubmit(handlePlanSubmit)} className="space-y-6 p-4">
                                
                                {/* Plan Name */}
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            ชื่องาน *
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              placeholder="กรุณากรอกชื่องาน"
                                              className="bg-white/80 border-brand-pink/20 focus:border-primary"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Location */}
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_location"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            สถานที่ *
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              placeholder="กรุณากรอกสถานที่"
                                              className="bg-white/80 border-brand-pink/20 focus:border-primary"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Date */}
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_date"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            วันที่ *
                                          </FormLabel>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <FormControl>
                                                <Button
                                                  variant="outline"
                                                  className={cn(
                                                    "w-full pl-3 text-left font-normal bg-white/80 border-brand-pink/20 focus:border-primary",
                                                    !field.value && "text-muted-foreground"
                                                  )}
                                                >
                                                  {field.value ? (
                                                    `${format(field.value, "dd MMMM", { locale: th })} ${field.value.getFullYear() + 543}`
                                                  ) : (
                                                    <span>เลือกวันที่</span>
                                                  )}
                                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                              </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                               <Calendar
                                                 mode="single"
                                                 selected={field.value}
                                                 onSelect={field.onChange}
                                                 initialFocus
                                                 className="pointer-events-auto"
                                               />
                                            </PopoverContent>
                                          </Popover>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Time Range */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_time_start"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            เวลาเริ่มต้น *
                                          </FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                                                <SelectValue placeholder="เลือกเวลาเริ่มต้น" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                              {timeOptions.map((time) => (
                                                <SelectItem key={time} value={time}>
                                                  {time}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_time_end"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            เวลาสิ้นสุด *
                                          </FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                                                <SelectValue placeholder="เลือกเวลาสิ้นสุด" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                              {timeOptions.map((time) => (
                                                <SelectItem key={time} value={time}>
                                                  {time}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Password and Max Participants */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_pwd"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            รหัส *
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              placeholder="กรุณากรอกรหัส"
                                              className="bg-white/80 border-brand-pink/20 focus:border-primary"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_maxp"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            จำนวนผู้เข้าร่วม *
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              type="number"
                                              min="1"
                                              placeholder="จำนวนคน"
                                              className="bg-white/80 border-brand-pink/20 focus:border-primary"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Editor Name */}
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <FormField
                                      control={planForm.control}
                                      name="plan_editor"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-foreground">
                                            ชื่อผู้สร้างฟอร์ม *
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              placeholder="กรุณากรอกชื่อผู้สร้างฟอร์ม"
                                              className="bg-white/80 border-brand-pink/20 focus:border-primary"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                              </form>
                            </Form>
                          </ScrollArea>
                          
                          <DialogFooter className="gap-2 p-4 border-t bg-white/90">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                planForm.reset();
                                setIsOrderModalOpen(false);
                              }}
                              className="flex-1 sm:flex-none border-brand-pink/30 hover:bg-brand-pink/10"
                              disabled={isPlanSubmitting}
                            >
                              ยกเลิก
                            </Button>
                            <Button 
                              onClick={planForm.handleSubmit(handlePlanSubmit)}
                              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                              disabled={isPlanSubmitting}
                            >
                              {isPlanSubmitting ? "กำลังบันทึก..." : "ยืนยัน"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-4">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-4">
                          <PlanList filterState="waiting" />
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-foreground">รายการที่กำลังดำเนินการ</h3>
                      <div className="border border-brand-pink/20 rounded-lg p-1 bg-white/60">
                        <Button
                          variant="ghost" 
                          size="sm" 
                          onClick={toggleProgressSort}
                          className="hover:bg-brand-pink/10"
                        >
                          {(() => {
                            const SortIcon = getSortIcon(progressSortOrder);
                            return <SortIcon className="h-4 w-4" />;
                          })()}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-4">
                          <PlanList filterState="published" />
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-foreground">รายการที่ดำเนินการเสร็จสิ้น</h3>
                      <div className="border border-brand-pink/20 rounded-lg p-1 bg-white/60">
                        <Button
                          variant="ghost" 
                          size="sm" 
                          onClick={toggleCompletedSort}
                          className="hover:bg-brand-pink/10"
                        >
                          {(() => {
                            const SortIcon = getSortIcon(completedSortOrder);
                            return <SortIcon className="h-4 w-4" />;
                          })()}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-4">
                          <PlanList filterState="finished" />
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Admin;