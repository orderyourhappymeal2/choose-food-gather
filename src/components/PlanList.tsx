import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Eye, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
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

export const PlanList = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);

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
      const { data, error } = await supabase
        .from('plan')
        .select('*')
        .order('created_at', { ascending: false });

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
    <div className="w-full overflow-hidden">
      {plans.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          ยังไม่มีแผนการจองอาหาร
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full">
          {plans.map((plan) => (
            <div key={plan.plan_id} className="w-full min-w-0">
              <Card className="bg-gradient-to-r from-brand-cream/20 to-transparent border border-brand-pink/10 h-full">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">ชื่องาน</Label>
                          <div className="text-sm font-semibold text-foreground break-words">{plan.plan_name}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">สถานที่</Label>
                          <div className="text-sm text-foreground break-words">{plan.plan_location}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1 min-w-0">
                            <Label className="text-xs font-medium text-muted-foreground">วันที่</Label>
                            <div className="text-sm text-foreground break-words">{formatThaiDate(plan.plan_date)}</div>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <Label className="text-xs font-medium text-muted-foreground">เวลา</Label>
                            <div className="text-sm text-foreground break-words">{plan.plan_time}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1 min-w-0">
                            <Label className="text-xs font-medium text-muted-foreground">รหัส</Label>
                            <div className="text-sm text-foreground break-words">{plan.plan_pwd}</div>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <Label className="text-xs font-medium text-muted-foreground">จำนวนคน</Label>
                            <div className="text-sm text-foreground">{plan.plan_maxp} คน</div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">ผู้สร้าง</Label>
                          <div className="text-sm text-foreground break-words">{plan.plan_editor}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 pt-2 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-8 h-8 p-0" 
                          title="เพิ่มร้านอาหาร"
                          onClick={() => {}}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-8 h-8 p-0"
                          title="ดูรายการร้าน"
                          onClick={() => {}}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-8 h-8 p-0"
                          title="แก้ไข"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-8 h-8 p-0"
                          title="ลบ"
                          onClick={() => handleDelete(plan)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">แก้ไขแผนการจอง</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="space-y-4">
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
                                format(field.value, "d MMMM yyyy", { locale: th })
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
    </div>
  );
};