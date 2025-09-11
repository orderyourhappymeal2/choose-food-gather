import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChefHat, Store, FileText, Clock, CheckCircle, Plus, FilePlus, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, UtensilsCrossed, Upload, X, Edit, Eye, Trash2, Calendar as CalendarIcon, Send, Power, Link, ShoppingCart, Receipt, GripVertical, Filter, FileSpreadsheet, User, UtensilsCrossed as UtensilsIcon } from "lucide-react";
import * as XLSX from 'xlsx';
import { Switch } from "@/components/ui/switch";

import { useState, useEffect, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// Sortable Meal Item Component
const SortableMealItem = ({ meal, index, shops, foods, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  meal: any;
  index: number;
  shops: any[];
  foods: any[];
  onUpdate: (id: string, updates: any) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const isMobile = useIsMobile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: meal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [selectedShop, setSelectedShop] = useState(meal.shopId || '');
  const [selectedFood, setSelectedFood] = useState(meal.foodId || 'user-choice');
  const [mealName, setMealName] = useState(meal.name || '');

  const filteredFoods = foods.filter(food => food.shop_id === selectedShop);

  const handleShopChange = (shopId: string) => {
    setSelectedShop(shopId);
    setSelectedFood('user-choice');
    onUpdate(meal.id, { shopId, foodId: '' });
  };

  const handleFoodChange = (foodId: string) => {
    setSelectedFood(foodId);
    const actualFoodId = foodId === 'user-choice' ? '' : foodId;
    onUpdate(meal.id, { shopId: selectedShop, foodId: actualFoodId });
  };

  const handleMealNameChange = (name: string) => {
    setMealName(name);
    const actualFoodId = selectedFood === 'user-choice' ? '' : selectedFood;
    onUpdate(meal.id, { name, shopId: selectedShop, foodId: actualFoodId });
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white/50 border border-brand-pink/20 rounded-lg p-4 mb-3">
      {isMobile ? (
        <div className="flex flex-col">
          {/* Mobile: Index and Controls at Top */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-sm">
              {index + 1}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isFirst}
                onClick={() => onMoveUp(meal.id)}
                className="p-1 h-8 w-8"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isLast}
                onClick={() => onMoveDown(meal.id)}
                className="p-1 h-8 w-8"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white p-1 h-8 w-8"
                onClick={() => onRemove(meal.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Mobile: Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">ชื่อมื้ออาหาร</Label>
              <Input
                placeholder="ใส่ชื่อมื้ออาหาร"
                value={mealName}
                onChange={(e) => handleMealNameChange(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">เลือกร้านอาหาร</Label>
              <Select value={selectedShop} onValueChange={handleShopChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกร้านอาหาร" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <ScrollArea className="h-full">
                    {shops.slice(0, 5).map((shop) => (
                      <SelectItem key={shop.shop_id} value={shop.shop_id} className="flex items-center gap-2 p-2">
                        <div className="flex items-center gap-2 w-full">
                          {shop.url_pic && (
                            <img 
                              src={shop.url_pic} 
                              alt={shop.shop_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          )}
                          <span className="truncate">{shop.shop_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">เลือกเมนูอาหาร</Label>
              {!selectedShop ? (
                <div className="w-full p-2 text-sm text-muted-foreground bg-muted/30 rounded-md border">
                  กรุณาเลือกร้านอาหารก่อน
                </div>
              ) : (
                <Select value={selectedFood} onValueChange={handleFoodChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="ให้ผู้ใช้เลือกเอง" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <ScrollArea className="h-full">
                      <SelectItem value="user-choice" className="p-2">
                        <span>ให้ผู้ใช้เลือกเอง</span>
                      </SelectItem>
                      {filteredFoods.slice(0, 5).map((food) => (
                        <SelectItem key={food.food_id} value={food.food_id} className="flex items-center gap-2 p-2">
                          <div className="flex items-center gap-2 w-full">
                            {food.url_pic && (
                              <img 
                                src={food.url_pic} 
                                alt={food.food_name}
                                className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            )}
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <span className="truncate font-medium">{food.food_name}</span>
                              <span className="text-xs text-muted-foreground">฿{food.price}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-black font-bold text-lg mb-2 shadow-sm">
              {index + 1}
            </div>
            <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing p-1">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Meal Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">ชื่อมื้ออาหาร</Label>
                <Input
                  placeholder="ใส่ชื่อมื้ออาหาร"
                  value={mealName}
                  onChange={(e) => handleMealNameChange(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Restaurant Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">เลือกร้านอาหาร</Label>
                <Select value={selectedShop} onValueChange={handleShopChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกร้านอาหาร" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <ScrollArea className="h-full">
                      {shops.slice(0, 5).map((shop) => (
                        <SelectItem key={shop.shop_id} value={shop.shop_id} className="flex items-center gap-2 p-2">
                          <div className="flex items-center gap-2 w-full">
                            {shop.url_pic && (
                              <img 
                                src={shop.url_pic} 
                                alt={shop.shop_name}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            )}
                            <span className="truncate">{shop.shop_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {/* Food Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">เลือกเมนูอาหาร</Label>
                {!selectedShop ? (
                  <div className="w-full p-2 text-sm text-muted-foreground bg-muted/30 rounded-md border">
                    กรุณาเลือกร้านอาหารก่อน
                  </div>
                ) : (
                  <Select value={selectedFood} onValueChange={handleFoodChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="ให้ผู้ใช้เลือกเอง" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <ScrollArea className="h-full">
                        <SelectItem value="user-choice" className="p-2">
                          <span>ให้ผู้ใช้เลือกเอง</span>
                        </SelectItem>
                        {filteredFoods.slice(0, 5).map((food) => (
                          <SelectItem key={food.food_id} value={food.food_id} className="flex items-center gap-2 p-2">
                            <div className="flex items-center gap-2 w-full">
                              {food.url_pic && (
                                <img 
                                  src={food.url_pic} 
                                  alt={food.food_name}
                                  className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                              )}
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="truncate font-medium">{food.food_name}</span>
                                <span className="text-xs text-muted-foreground">฿{food.price}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
            onClick={() => onRemove(meal.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// PlanList component
const PlanList = ({ filterState, restaurants = [], refreshRef }: { filterState?: string; restaurants?: any[]; refreshRef?: React.MutableRefObject<(() => void) | undefined> }) => {
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
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isMealListModalOpen, setIsMealListModalOpen] = useState(false);
  const [selectedPlanForMeal, setSelectedPlanForMeal] = useState<any>(null);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [finishingPlan, setFinishingPlan] = useState<any>(null);

  // Delete confirmation states
  const [planDeleteConfirmName, setPlanDeleteConfirmName] = useState('');

  // Meal management states
  const [meals, setMeals] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [isLoadingMealData, setIsLoadingMealData] = useState(false);

  // Order management states
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [orderPersons, setOrderPersons] = useState<any[]>([]);
  const [orderMeals, setOrderMeals] = useState<any[]>([]);
  const [orderShops, setOrderShops] = useState<any[]>([]);
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>("all");
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>("all");
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>("all");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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

  // Export to Excel function
  const exportToExcel = async (plan: any) => {
    try {
      setIsLoadingOrders(true);
      
      // Fetch orders for the plan
      const { data: ordersData, error: ordersError } = await supabase
        .from('order')
        .select(`
          *,
          person:person_id (person_name, person_agent),
          food:food_id (food_name, price, url_pic, shop_id),
          meal:meal_id (meal_name),
          shop:food(shop:shop_id(shop_name))
        `)
        .eq('plan_id', plan.plan_id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Format data for Excel
      const excelData = ordersData.map((order: any, index: number) => ({
        'ลำดับ': index + 1,
        'ผู้สั่งอาหาร': order.person?.person_name || '-',
        'ตัวแทน': order.person?.person_agent || '-',
        'มื้ออาหาร': order.meal?.meal_name || '-',
        'ชื่ออาหาร': order.food?.food_name || '-',
        'ราคา': order.food?.price || 0,
        'ร้านอาหาร': order.food?.shop_name || '-',
        'ท็อปปิ้ง': order.topping || '-',
        'หมายเหตุ': order.order_note || '-',
        'เวลาสั่ง': formatThaiDateTime(order.created_at),
        'ประเภท': order.order_type === 'custom' ? 'สั่งเพิ่ม' : 'กำหนดไว้'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 20 },  // ผู้สั่งอาหาร
        { wch: 15 },  // ตัวแทน
        { wch: 20 },  // มื้ออาหาร
        { wch: 30 },  // ชื่ออาหาร
        { wch: 10 },  // ราคา
        { wch: 25 },  // ร้านอาหาร
        { wch: 20 },  // ท็อปปิ้ง
        { wch: 30 },  // หมายเหตุ
        { wch: 20 },  // เวลาสั่ง
        { wch: 15 }   // ประเภท
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'รายการสั่งอาหาร');

      // Generate filename with plan name and date
      const currentDate = new Date().toLocaleDateString('th-TH');
      const filename = `รายการสั่งอาหาร_${plan.plan_name}_${currentDate}.xlsx`;

      // Export file
      XLSX.writeFile(wb, filename);
      
      toast.success('ส่งออกไฟล์ Excel สำเร็จ');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    } finally {
      setIsLoadingOrders(false);
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

  // Expose fetchPlans to parent component
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = fetchPlans;
    }
  }, [refreshRef]);

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
    setFinishingPlan(plan);
    setIsFinishDialogOpen(true);
  };

  // Confirm finish plan
  const confirmFinishPlan = async () => {
    if (!finishingPlan) return;

    try {
      const { error } = await supabase
        .from('plan')
        .update({ plan_state: 'finished' })
        .eq('plan_id', finishingPlan.plan_id);

      if (error) throw error;

      toast.success('ดำเนินการเสร็จสิ้นแล้ว');
      setIsFinishDialogOpen(false);
      setFinishingPlan(null);
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
  const handleShowOrders = async (plan: any) => {
    setSelectedPlanForOrder(plan);
    setIsOrderModalOpen(true);
    await fetchOrders(plan.plan_id);
  };

  // Fetch orders data
  const fetchOrders = async (planId: string) => {
    setIsLoadingOrders(true);
    try {
      // Fetch orders with related data
      const { data: ordersData, error: ordersError } = await supabase
        .from('order')
        .select(`
          *,
          person:person_id (person_id, person_name, person_agent),
          food:food_id (food_id, food_name, shop_id)
        `)
        .eq('plan_id', planId);

      if (ordersError) throw ordersError;

      // Fetch persons for filter
      const { data: personsData, error: personsError } = await supabase
        .from('person')
        .select('*')
        .eq('plan_id', planId);

      if (personsError) throw personsError;

      // Fetch meals for filter
      const { data: mealsData, error: mealsError } = await supabase
        .from('meal')
        .select('*')
        .eq('plan_id', planId);

      if (mealsError) throw mealsError;

      // Fetch shops that have orders
      const shopIds = [...new Set(ordersData?.map(order => order.food?.shop_id).filter(Boolean))];
      const { data: shopsData, error: shopsError } = await supabase
        .from('shop')
        .select('*')
        .in('shop_id', shopIds);

      if (shopsError) throw shopsError;

      // Process and enrich orders data
      const enrichedOrders = ordersData?.map(order => {
        const shop = shopsData?.find(s => s.shop_id === order.food?.shop_id);
        
        // Find the correct meal using meal_id directly from the order
        const finalMeal = mealsData?.find(m => m.meal_id === order.meal_id);
        
        return {
          ...order,
          shop_name: shop?.shop_name || 'ไม่ระบุ',
          food_name: order.food?.food_name || 'ไม่ระบุ',
          person_name: order.person?.person_name || 'ไม่ระบุ',
          person_agent: order.person?.person_agent || '',
          shop_id: order.food?.shop_id || '',
          meal_name: finalMeal?.meal_name || 'ไม่ระบุ',
          meal_id: finalMeal?.meal_id || '',
          is_custom: (order as any).order_type === 'custom'
        };
      }) || [];

      setOrders(enrichedOrders);
      setFilteredOrders(enrichedOrders);
      setOrderPersons(personsData || []);
      setOrderMeals(mealsData || []);
      setOrderShops(shopsData || []);
      
      // Reset filters
      setSelectedPersonFilter("all");
      setSelectedMealFilter("all");
      setSelectedShopFilter("all");

    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Filter orders based on selected filters
  const filterOrders = () => {
    let filtered = [...orders];

    if (selectedPersonFilter !== "all") {
      filtered = filtered.filter(order => order.person_id === selectedPersonFilter);
    }

    if (selectedMealFilter !== "all") {
      filtered = filtered.filter(order => order.meal_id === selectedMealFilter);
    }

    if (selectedShopFilter !== "all") {
      filtered = filtered.filter(order => order.shop_id === selectedShopFilter);
    }

    setFilteredOrders(filtered);
  };

  // Apply filters when filter values change
  useEffect(() => {
    filterOrders();
  }, [selectedPersonFilter, selectedMealFilter, selectedShopFilter, orders]);

  // Format Thai Buddhist date
  const formatThaiDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate();
      const month = format(date, "MMM", { locale: th });
      const year = date.getFullYear() + 543;
      
      return `${hours}:${minutes} น. ${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch shops and foods data
  const fetchMealData = async () => {
    setIsLoadingMealData(true);
    try {
      const [shopsResponse, foodsResponse] = await Promise.all([
        supabase.from('shop').select('*').order('shop_name'),
        supabase.from('food').select('*').order('food_name')
      ]);

      if (shopsResponse.error) throw shopsResponse.error;
      if (foodsResponse.error) throw foodsResponse.error;

      setShops(shopsResponse.data || []);
      setFoods(foodsResponse.data || []);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลร้านอาหาร');
    } finally {
      setIsLoadingMealData(false);
    }
  };

  // Load existing meals for a plan
  const loadPlanMeals = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('meal')
        .select('*')
        .eq('plan_id', planId)
        .order('meal_index');

      if (error) throw error;

      const formattedMeals = (data || []).map((meal, index) => ({
        id: meal.meal_id,
        name: meal.meal_name,
        shopId: meal.shop_id || '',
        foodId: meal.food_id || '',
        customFoodText: 'ให้ผู้ใช้เลือกเอง', // Default text, could be stored in DB if needed
        index: meal.meal_index
      }));

      setMeals(formattedMeals);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลมื้ออาหาร');
    }
  };

  // Add new meal
  const addNewMeal = () => {
    const newMeal = {
      id: `meal-${Date.now()}`,
      name: '',
      shopId: '',
      foodId: '',
      customFoodText: 'ให้ผู้ใช้เลือกเอง',
      index: meals.length
    };
    setMeals([...meals, newMeal]);
  };

  // Update meal
  const updateMeal = (id: string, updates: any) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, ...updates } : meal
    ));
  };

  // Remove meal
  const removeMeal = (id: string) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  // Move meal up
  const moveMealUp = (id: string) => {
    const index = meals.findIndex(meal => meal.id === id);
    if (index > 0) {
      const newMeals = [...meals];
      [newMeals[index], newMeals[index - 1]] = [newMeals[index - 1], newMeals[index]];
      setMeals(newMeals);
    }
  };

  // Move meal down
  const moveMealDown = (id: string) => {
    const index = meals.findIndex(meal => meal.id === id);
    if (index < meals.length - 1) {
      const newMeals = [...meals];
      [newMeals[index], newMeals[index + 1]] = [newMeals[index + 1], newMeals[index]];
      setMeals(newMeals);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setMeals((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Save meals to database
  const saveMeals = async () => {
    if (!selectedPlanForMeal) return;

    // Validation: Check if all meals have complete data
    const incompleteItems = [];
    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      if (!meal.name.trim()) {
        incompleteItems.push(`มื้อที่ ${i + 1}: ไม่มีชื่อมื้ออาหาร`);
      }
      if (!meal.shopId) {
        incompleteItems.push(`มื้อที่ ${i + 1}: ไม่ได้เลือกร้านอาหาร`);
      }
      if (!meal.foodId && meal.foodId !== '') {
        incompleteItems.push(`มื้อที่ ${i + 1}: ไม่ได้เลือกเมนูอาหาร`);
      }
    }

    if (incompleteItems.length > 0) {
      toast.error(`กรุณากรอกข้อมูลให้ครบถ้วน:\n${incompleteItems.join('\n')}`);
      return;
    }

    try {
      // Delete existing meals for this plan
      await supabase
        .from('meal')
        .delete()
        .eq('plan_id', selectedPlanForMeal.plan_id);

      // Insert new meals
      const mealsToInsert = meals.map((meal, index) => ({
        plan_id: selectedPlanForMeal.plan_id,
        shop_id: meal.shopId || null,
        food_id: meal.foodId || null,
        meal_name: meal.name,
        meal_index: index + 1
      })).filter(meal => meal.meal_name.trim() !== '');

      if (mealsToInsert.length > 0) {
        const { error } = await supabase
          .from('meal')
          .insert(mealsToInsert);

        if (error) throw error;
      }

      toast.success('บันทึกมื้ออาหารสำเร็จ');
      setIsAddMealModalOpen(false);
      setMeals([]);
      
      // Refresh the plans data to show updated information
      fetchPlans();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกมื้ออาหาร');
    }
  };

  // Handle add meal
  const handleAddMeal = (plan: any) => {
    setSelectedPlanForMeal(plan);
    setMeals([]);
    setIsAddMealModalOpen(true);
    fetchMealData();
    loadPlanMeals(plan.plan_id);
  };

  // Handle show meal list
  const handleShowMealList = (plan: any) => {
    setSelectedPlanForMeal(plan);
    setIsMealListModalOpen(true);
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
                    <TooltipProvider>
                      {filterState === 'waiting' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-green-600 hover:bg-green-600 hover:border-green-600" onClick={() => handleAddMeal(plan)}>
                                <Plus className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>เพิ่มมื้ออาหาร</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {filterState === 'finished' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-green-600 hover:bg-green-600 hover:text-white" onClick={() => exportToExcel(plan)}>
                                <FileSpreadsheet className="h-4 w-4 text-green-600 hover:text-white" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ส่งออก Excel</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleShowMealList(plan)}>
                                <FileText className="h-4 w-4 text-gray-800" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ดูรายการมื้ออาหาร</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleShowOrders(plan)}>
                                <ShoppingCart className="h-4 w-4 text-gray-800" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ดูรายการสั่งอาหาร</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {filterState === 'waiting' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleEdit(plan)}>
                                <Edit className="h-4 w-4 text-gray-800" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>แก้ไขใบสั่งอาหาร</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handlePublish(plan)}>
                                <Send className="h-4 w-4 text-gray-800" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>เผยแพร่ใบสั่งอาหาร</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                       {filterState === 'published' && (
                         <>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-green-600 hover:bg-green-600 hover:text-white" onClick={() => exportToExcel(plan)}>
                                 <FileSpreadsheet className="h-4 w-4 text-green-600 hover:text-white" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>ส่งออก Excel</p>
                             </TooltipContent>
                           </Tooltip>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-blue-600 hover:bg-blue-600 hover:border-blue-600" onClick={() => handleFinishPlan(plan)}>
                                 <CheckCircle className="h-4 w-4 text-blue-600" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>ปิดใบสั่งอาหาร</p>
                             </TooltipContent>
                           </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleShowMealList(plan)}>
                                <FileText className="h-4 w-4 text-gray-800" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ดูรายการมื้ออาหาร</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleShowOrders(plan)}>
                                <ShoppingCart className="h-4 w-4 text-gray-800" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ดูรายการสั่งอาหาร</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800" onClick={() => handleCopyLink(plan)}>
                                <Link className="h-4 w-4 text-gray-800" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>คัดลอกลิงก์</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-red-600 hover:bg-red-600 hover:border-red-600" onClick={() => handleDelete(plan)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ลบใบสั่งอาหาร</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">แก้ไขแผนการจอง</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
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
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบแผน</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-red-600 font-medium">
                ⚠️ การดำเนินการนี้มีผลกระทบสูง
              </span>
              <br />
              หากลบแผน "{deletingPlan?.plan_name}" แผนการสั่งจองทั้งหมดจะถูกลบออกไปด้วย
              <br />
              <span className="text-red-600 font-medium">
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </span>
              <br /><br />
              พิมพ์ชื่องาน <strong>"{deletingPlan?.plan_name}"</strong> เพื่อยืนยันการลบ:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <Input
              value={planDeleteConfirmName}
              onChange={(e) => setPlanDeleteConfirmName(e.target.value)}
              placeholder={`พิมพ์ "${deletingPlan?.plan_name}" เพื่อยืนยัน`}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanDeleteConfirmName('')}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={planDeleteConfirmName !== deletingPlan?.plan_name}
              className="bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
        <DialogContent className="w-[95vw] max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg h-[90vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b bg-white/90 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground text-center">
              รายการอาหารที่ถูกสั่ง - {selectedPlanForOrder?.plan_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full p-4 gap-4 min-h-0">
            {/* Filter Container */}
            <div className="flex-shrink-0">
              {/* Mobile Filter Icons */}
              <div className="md:hidden flex gap-2 mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="p-2">
                      <User className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-white border border-brand-pink/20 shadow-lg" align="start">
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      ผู้สั่งอาหาร
                    </Label>
                    <Select value={selectedPersonFilter} onValueChange={setSelectedPersonFilter}>
                      <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                        <SelectValue placeholder="เลือกผู้สั่งอาหาร" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 border border-brand-pink/20 shadow-lg">
                        <SelectItem value="all">เลือกทั้งหมด</SelectItem>
                        <div className="border-t border-brand-pink/10 my-1"></div>
                        {orderPersons.map((person) => (
                          <SelectItem key={person.person_id} value={person.person_id}>
                            {person.person_name}{person.person_agent ? ` (${person.person_agent})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="p-2">
                      <UtensilsIcon className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-white border border-brand-pink/20 shadow-lg" align="start">
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      มื้ออาหาร
                    </Label>
                    <Select value={selectedMealFilter} onValueChange={setSelectedMealFilter}>
                      <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                        <SelectValue placeholder="เลือกมื้ออาหาร" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 border border-brand-pink/20 shadow-lg">
                        <SelectItem value="all">เลือกทั้งหมด</SelectItem>
                        <div className="border-t border-brand-pink/10 my-1"></div>
                        {orderMeals.map((meal) => (
                          <SelectItem key={meal.meal_id} value={meal.meal_id}>
                            {meal.meal_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="p-2">
                      <Store className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-white border border-brand-pink/20 shadow-lg" align="start">
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      ร้านอาหาร
                    </Label>
                    <Select value={selectedShopFilter} onValueChange={setSelectedShopFilter}>
                      <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                        <SelectValue placeholder="เลือกร้านอาหาร" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 border border-brand-pink/20 shadow-lg">
                        <SelectItem value="all">เลือกทั้งหมด</SelectItem>
                        <div className="border-t border-brand-pink/10 my-1"></div>
                        {orderShops.map((shop) => (
                          <SelectItem key={shop.shop_id} value={shop.shop_id}>
                            {shop.shop_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Desktop Filter Grid */}
              <div className="hidden md:grid grid-cols-3 gap-4">
                {/* ผู้สั่งอาหาร Filter */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    ผู้สั่งอาหาร
                  </Label>
                  <Select value={selectedPersonFilter} onValueChange={setSelectedPersonFilter}>
                    <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                      <SelectValue placeholder="เลือกผู้สั่งอาหาร" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 border border-brand-pink/20 shadow-lg">
                      <SelectItem value="all">เลือกทั้งหมด</SelectItem>
                      <div className="border-t border-brand-pink/10 my-1"></div>
                      {orderPersons.map((person) => (
                        <SelectItem key={person.person_id} value={person.person_id}>
                          {person.person_name}{person.person_agent ? ` (${person.person_agent})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* มื้ออาหาร Filter */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    มื้ออาหาร
                  </Label>
                  <Select value={selectedMealFilter} onValueChange={setSelectedMealFilter}>
                    <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                      <SelectValue placeholder="เลือกมื้ออาหาร" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 border border-brand-pink/20 shadow-lg">
                      <SelectItem value="all">เลือกทั้งหมด</SelectItem>
                      <div className="border-t border-brand-pink/10 my-1"></div>
                      {orderMeals.map((meal) => (
                        <SelectItem key={meal.meal_id} value={meal.meal_id}>
                          {meal.meal_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ร้านอาหาร Filter */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    ร้านอาหาร
                  </Label>
                  <Select value={selectedShopFilter} onValueChange={setSelectedShopFilter}>
                    <SelectTrigger className="bg-white/80 border-brand-pink/20 focus:border-primary">
                      <SelectValue placeholder="เลือกร้านอาหาร" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 border border-brand-pink/20 shadow-lg">
                      <SelectItem value="all">เลือกทั้งหมด</SelectItem>
                      <div className="border-t border-brand-pink/10 my-1"></div>
                      {orderShops.map((shop) => (
                        <SelectItem key={shop.shop_id} value={shop.shop_id}>
                          {shop.shop_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Orders content area */}
            <div className="flex-1 min-h-0">
              {isLoadingOrders ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-muted-foreground">
                    กำลังโหลดข้อมูล...
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-muted-foreground">
                    ไม่พบรายการอาหารที่ถูกสั่ง
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full border border-brand-pink/10 rounded-lg bg-white/30">
                  <div className="p-4 space-y-3">
                    {/* Header - Hidden on mobile */}
                    <div className="hidden lg:grid grid-cols-7 gap-4 p-3 bg-white/50 rounded-lg font-medium text-sm text-foreground border-b border-brand-pink/20">
                      <div>ผู้สั่ง</div>
                      <div>มื้ออาหาร</div>
                      <div>ร้านอาหาร</div>
                      <div>เมนู</div>
                      <div>หมายเหตุ</div>
                      <div>ท็อปปิ้ง</div>
                      <div>เวลาสั่ง</div>
                    </div>
                    
                    {/* Order Items */}
                    {filteredOrders.map((order, index) => (
                      <div key={order.order_id} className={`grid grid-cols-1 lg:grid-cols-7 gap-2 lg:gap-4 p-3 rounded-lg ${index % 2 === 0 ? 'bg-white/40' : 'bg-white/60'} hover:bg-white/70 transition-colors border border-white/50`}>
                        <div className="lg:col-span-1">
                          <div className="lg:hidden font-medium text-xs text-muted-foreground mb-1">ผู้สั่ง:</div>
                          <div className="text-sm font-medium">
                            {order.person_name}
                            {order.person_agent && (
                              <div className="text-xs text-muted-foreground">({order.person_agent})</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="lg:hidden font-medium text-xs text-muted-foreground mb-1">มื้ออาหาร:</div>
                          <div className="text-sm font-medium text-primary flex items-center gap-2">
                            {order.meal_name}
                            {!order.is_custom && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="lg:hidden font-medium text-xs text-muted-foreground mb-1">ร้านอาหาร:</div>
                          <div className="text-sm font-medium text-brand-orange">{order.shop_name}</div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="lg:hidden font-medium text-xs text-muted-foreground mb-1">เมนู:</div>
                          <div className="text-sm font-medium">{order.food_name}</div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="lg:hidden font-medium text-xs text-muted-foreground mb-1">หมายเหตุ:</div>
                          <div className="text-sm">{order.order_note || '-'}</div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="lg:hidden font-medium text-xs text-muted-foreground mb-1">ท็อปปิ้ง:</div>
                          <div className="text-sm">{order.topping || '-'}</div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="lg:hidden font-medium text-xs text-muted-foreground mb-1">เวลาสั่ง:</div>
                          <div className="text-xs text-muted-foreground">
                            {formatThaiDateTime(order.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* Summary */}
            {!isLoadingOrders && filteredOrders.length > 0 && (
              <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg flex-shrink-0">
                <div className="text-sm text-muted-foreground">
                  แสดง {filteredOrders.length} รายการ จากทั้งหมด {orders.length} รายการ
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-4 border-t bg-white/90">
            <Button variant="outline" onClick={() => setIsOrderModalOpen(false)} className="w-full sm:w-auto">
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Meal Modal */}
      <Dialog open={isAddMealModalOpen} onOpenChange={setIsAddMealModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg h-[90vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b bg-white/90 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground text-center">
              เพิ่มมื้ออาหาร - {selectedPlanForMeal?.plan_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-auto p-4">
            {isLoadingMealData ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center text-muted-foreground">
                  กำลังโหลดข้อมูล...
                </div>
              </div>
            ) : (
              <>
                {/* Add meal button */}
                <div className="flex justify-center mb-6 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                  <Button
                    onClick={addNewMeal}
                    className="bg-brand-primary hover:bg-brand-primary/90 text-black px-6 py-2 rounded-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มช่วงเวลา
                  </Button>
                </div>

                {/* Meals list with drag and drop */}
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={meals.map(meal => meal.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4 pb-4">
                      {meals.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 bg-white/20 rounded-lg border border-dashed border-brand-pink/30">
                          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p>ยังไม่มีมื้ออาหาร</p>
                          <p className="text-sm">กดปุ่ม "+ เพิ่มช่วงเวลา" เพื่อเริ่มต้น</p>
                        </div>
                      ) : (
                        meals.map((meal, index) => (
                          <SortableMealItem
                            key={meal.id}
                            meal={meal}
                            index={index}
                            shops={shops}
                            foods={foods}
                            onUpdate={updateMeal}
                            onRemove={removeMeal}
                            onMoveUp={moveMealUp}
                            onMoveDown={moveMealDown}
                            isFirst={index === 0}
                            isLast={index === meals.length - 1}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 p-4 border-t bg-white/90">
            <Button variant="outline" onClick={() => setIsAddMealModalOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">
              ยกเลิก
            </Button>
            <Button 
              onClick={saveMeals}
              className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto order-1 sm:order-2"
              disabled={meals.length === 0 || meals.every(meal => !meal.name.trim())}
            >
              บันทึกมื้ออาหาร
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meal List Modal */}
      <Dialog open={isMealListModalOpen} onOpenChange={setIsMealListModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg h-[90vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b bg-white/90 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground text-center">
              รายการมื้ออาหาร - {selectedPlanForMeal?.plan_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden p-4">
            <ScrollArea className="h-full border border-brand-pink/10 rounded-lg bg-white/30 p-4">
              <div className="text-center text-muted-foreground py-8">
                รายการมื้ออาหารจะมาตรงนี้
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter className="p-4 border-t bg-white/90">
            <Button variant="outline" onClick={() => setIsMealListModalOpen(false)} className="w-full sm:w-auto">
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Confirmation */}
      <AlertDialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการดำเนินการให้เสร็จสิ้น</AlertDialogTitle>
            <AlertDialogDescription>
              หากดำเนินการแผน "{finishingPlan?.plan_name}" ให้เสร็จสิ้นแล้ว จะไม่สามารถย้อนกลับได้
              <br />
              คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinishPlan} className="bg-blue-600 hover:bg-blue-700">
              ยืนยันการดำเนินการ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  // Create refs to access refresh functions from child components
  const waitingPlansRefreshRef = useRef<() => void>();
  const publishedPlansRefreshRef = useRef<() => void>();
  const finishedPlansRefreshRef = useRef<() => void>();

  // Meal management states for plan creation
  const [meals, setMeals] = useState<any[]>([]);

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
  const [isEditFoodModalOpen, setIsEditFoodModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete confirmation states
  const [restaurantDeleteConfirmName, setRestaurantDeleteConfirmName] = useState('');
  const [planDeleteConfirmName, setPlanDeleteConfirmName] = useState('');
  const [isFoodDeleteConfirmOpen, setIsFoodDeleteConfirmOpen] = useState(false);
  const [deletingFood, setDeletingFood] = useState<any>(null);
  
  // Food items for view menu modal
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [isFoodLoading, setIsFoodLoading] = useState(false);

  // Add Menu Form state
  const [menuFormData, setMenuFormData] = useState({
    foodCategory: '',
    menuName: '',
    description: '',
    addOns: '',
    price: ''
  });
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null);
  const [isMenuSubmitting, setIsMenuSubmitting] = useState(false);

  // Edit Food Form state
  const [editFoodFormData, setEditFoodFormData] = useState({
    foodCategory: '',
    menuName: '',
    description: '',
    addOns: '',
    price: ''
  });
  const [selectedMenuImage, setSelectedMenuImage] = useState<File | null>(null);

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

  // Fetch food items for a specific restaurant
  const fetchFoodItems = async (shopId: string) => {
    try {
      setIsFoodLoading(true);
      const { data, error } = await supabase
        .from('food')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching food items:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายการอาหาร');
      setFoodItems([]);
    } finally {
      setIsFoodLoading(false);
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
    // ตรวจสอบรูปภาพ - บังคับเฉพาะเมื่อเพิ่มใหม่ หรือแก้ไขแต่ไม่มีรูปเดิม
    if (!selectedImage && (!selectedRestaurant || !selectedRestaurant.url_pic)) {
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

      // First, insert the plan
      const { data: planData, error: planError } = await supabase
        .from('plan')
        .insert([{
          plan_name: data.plan_name,
          plan_location: data.plan_location,
          plan_date: data.plan_date.toISOString().split('T')[0], // Store as CE format like update function
          plan_time: timeRange,
          plan_pwd: data.plan_pwd,
          plan_maxp: parseInt(data.plan_maxp),
          plan_editor: data.plan_editor,
        }])
        .select()
        .single();

      if (planError) throw planError;

      // Then, insert all meals for this plan
      if (meals.length > 0) {
        const mealInserts = meals.map((meal, index) => ({
          plan_id: planData.plan_id,
          meal_name: meal.name,
          meal_index: index + 1,
          shop_id: meal.shopId || null,
          food_id: meal.foodId || null
        }));

        const { error: mealsError } = await supabase
          .from('meal')
          .insert(mealInserts);

        if (mealsError) throw mealsError;
      }

      toast.success('เพิ่มใบสั่งอาหารสำเร็จ!');
      planForm.reset();
      setMeals([]); // Reset meals after successful submission
      setIsOrderModalOpen(false);
      
      // Refresh all plan lists to show the new plan
      if (waitingPlansRefreshRef.current) waitingPlansRefreshRef.current();
      if (publishedPlansRefreshRef.current) publishedPlansRefreshRef.current();
      if (finishedPlansRefreshRef.current) finishedPlansRefreshRef.current();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มใบสั่งอาหาร');
    } finally {
      setIsPlanSubmitting(false);
    }
  };

  // Menu form handlers
  const resetMenuForm = () => {
    setMenuFormData({
      foodCategory: '',
      menuName: '',
      description: '',
      addOns: '',
      price: ''
    });
    setMenuImage(null);
    setMenuImagePreview(null);
  };

  // Edit Food form handlers
  const resetEditFoodForm = () => {
    setEditFoodFormData({
      foodCategory: '',
      menuName: '',
      description: '',
      addOns: '',
      price: ''
    });
    setSelectedMenuImage(null);
    setMenuImagePreview(null);
  };

  const handleEditFood = (food: any) => {
    setSelectedFood(food);
    setEditFoodFormData({
      foodCategory: food.food_type || '',
      menuName: food.food_name || '',
      description: food.description || '',
      addOns: food.topping || '',
      price: food.price?.toString() || ''
    });
    setMenuImagePreview(food.url_pic || null);
    setSelectedMenuImage(null);
    setIsEditFoodModalOpen(true);
  };

  const handleDeleteFood = (food: any) => {
    setDeletingFood(food);
    setIsFoodDeleteConfirmOpen(true);
  };

  const confirmDeleteFood = async () => {
    if (!deletingFood) return;

    try {
      const { error } = await supabase
        .from('food')
        .delete()
        .eq('food_id', deletingFood.food_id);

      if (error) throw error;

      toast.success('ลบรายการอาหารสำเร็จ');
      setIsFoodDeleteConfirmOpen(false);
      setDeletingFood(null);
      
      // Refresh food items list
      if (selectedRestaurant) {
        fetchFoodItems(selectedRestaurant.shop_id);
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      toast.error('เกิดข้อผิดพลาดในการลบรายการอาหาร');
    }
  };

  const handleMenuImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMenuImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMenuImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMenuSubmit = async () => {
    // Validation
    if (!menuFormData.foodCategory.trim()) {
      toast.error('กรุณากรอกหมวดอาหาร');
      return;
    }
    if (!menuFormData.menuName.trim()) {
      toast.error('กรุณากรอกชื่อเมนูอาหาร');
      return;
    }
    if (!menuFormData.description.trim()) {
      toast.error('กรุณากรอกรายละเอียด');
      return;
    }
    if (!menuFormData.price.trim()) {
      toast.error('กรุณากรอกราคา');
      return;
    }
    if (!menuImage) {
      toast.error('กรุณาเลือกรูปภาพ');
      return;
    }

    setIsMenuSubmitting(true);
    try {
      // Upload image
      let imageUrl = '';
      if (menuImage) {
        const fileExt = menuImage.name.split('.').pop();
        const fileName = `menu_${Date.now()}.${fileExt}`;
        const filePath = `menu/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('shop')
          .upload(filePath, menuImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('shop')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      // Insert food data into Supabase
      const { error: insertError } = await supabase
        .from('food')
        .insert([{
          shop_id: selectedRestaurant?.shop_id,
          food_type: menuFormData.foodCategory,
          food_name: menuFormData.menuName,
          description: menuFormData.description,
          topping: menuFormData.addOns,
          price: parseFloat(menuFormData.price),
          url_pic: imageUrl
        }]);

      if (insertError) throw insertError;

      toast.success('เพิ่มรายการอาหารสำเร็จ!');
      resetMenuForm();
      setIsAddMenuModalOpen(false);
      setSelectedRestaurant(null);
    } catch (error) {
      console.error('Error adding menu:', error);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มรายการอาหาร');
    } finally {
      setIsMenuSubmitting(false);
    }
  };

  const handleEditFoodSubmit = async () => {
    // Validation
    if (!editFoodFormData.foodCategory.trim()) {
      toast.error('กรุณากรอกหมวดอาหาร');
      return;
    }
    if (!editFoodFormData.menuName.trim()) {
      toast.error('กรุณากรอกชื่อเมนูอาหาร');
      return;
    }
    if (!editFoodFormData.description.trim()) {
      toast.error('กรุณากรอกรายละเอียด');
      return;
    }
    if (!editFoodFormData.price.trim()) {
      toast.error('กรุณากรอกราคา');
      return;
    }

    setIsMenuSubmitting(true);
    try {
      let imageUrl = selectedFood?.url_pic || null;

      // Upload new image if selected
      if (selectedMenuImage) {
        const fileExt = selectedMenuImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `shop/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('shop')
          .upload(filePath, selectedMenuImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('shop')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Update food item
      const { error: updateError } = await supabase
        .from('food')
        .update({
          food_type: editFoodFormData.foodCategory,
          food_name: editFoodFormData.menuName,
          description: editFoodFormData.description,
          topping: editFoodFormData.addOns,
          price: parseFloat(editFoodFormData.price),
          url_pic: imageUrl
        })
        .eq('food_id', selectedFood?.food_id);

      if (updateError) throw updateError;

      toast.success('แก้ไขรายการอาหารสำเร็จ!');
      resetEditFoodForm();
      setIsEditFoodModalOpen(false);
      setSelectedFood(null);
      // Refresh food items list
      if (selectedRestaurant) {
        fetchFoodItems(selectedRestaurant.shop_id);
      }
    } catch (error) {
      console.error('Error updating food:', error);
      toast.error('เกิดข้อผิดพลาดในการแก้ไขรายการอาหาร');
    } finally {
      setIsMenuSubmitting(false);
    }
  };
  const isMobile = useIsMobile();
  
  return <div className={`min-h-screen bg-[var(--gradient-welcome)] py-4 ${isMobile ? 'px-0' : 'px-0 sm:p-6'}`}>
      <div className={`max-w-6xl mx-auto pt-4 sm:pt-8 relative ${isMobile ? 'px-0' : ''}`}>

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
                                         <TooltipProvider>
                                           {/* Add Menu Button */}
                                           <Tooltip>
                                             <TooltipTrigger asChild>
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
                                             </TooltipTrigger>
                                             <TooltipContent>
                                               <p>เพิ่มรายการอาหาร</p>
                                             </TooltipContent>
                                           </Tooltip>

                                           {/* Edit Button */}
                                           <Tooltip>
                                             <TooltipTrigger asChild>
                                               <Button
                                                 size="sm"
                                                 variant="outline"
                                                 className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800"
                                                 onClick={() => handleEditRestaurant(restaurant)}
                                               >
                                                 <Edit className="h-4 w-4 text-gray-800" />
                                               </Button>
                                             </TooltipTrigger>
                                             <TooltipContent>
                                               <p>แก้ไขร้านอาหาร</p>
                                             </TooltipContent>
                                           </Tooltip>

                                           {/* View Menu Button */}
                                           <Tooltip>
                                             <TooltipTrigger asChild>
                                               <Button
                                                 size="sm"
                                                 variant="outline"
                                                 className="h-9 w-9 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800"
                                                 onClick={() => {
                                                   setSelectedRestaurant(restaurant);
                                                   setIsViewMenuModalOpen(true);
                                                   fetchFoodItems(restaurant.shop_id);
                                                 }}
                                               >
                                                 <Eye className="h-4 w-4 text-gray-800" />
                                               </Button>
                                             </TooltipTrigger>
                                             <TooltipContent>
                                               <p>ดูรายการอาหาร</p>
                                             </TooltipContent>
                                           </Tooltip>

                                           {/* Delete Button */}
                                           <AlertDialog open={isDeleteConfirmOpen && selectedRestaurant?.shop_id === restaurant.shop_id} onOpenChange={setIsDeleteConfirmOpen}>
                                             <Tooltip>
                                               <TooltipTrigger asChild>
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
                                               </TooltipTrigger>
                                               <TooltipContent>
                                                 <p>ลบร้านอาหาร</p>
                                               </TooltipContent>
                                             </Tooltip>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>ยืนยันการลบร้านอาหาร</AlertDialogTitle>
                                               <AlertDialogDescription>
                                                 <span className="text-red-600 font-medium">
                                                   ⚠️ การดำเนินการนี้มีผลกระทบสูง
                                                 </span>
                                                 <br />
                                                 หากลบร้าน "{restaurant.shop_name}" แล้ว รายการอาหารทั้งหมดในร้านนี้จะถูกลบออกไปด้วย
                                                 <br />
                                                 <span className="text-red-600 font-medium">
                                                   การกระทำนี้ไม่สามารถย้อนกลับได้
                                                 </span>
                                                 <br /><br />
                                                 พิมพ์ชื่อร้าน <strong>"{restaurant.shop_name}"</strong> เพื่อยืนยันการลบ:
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <div className="px-6 pb-4">
                                               <Input
                                                 value={restaurantDeleteConfirmName}
                                                 onChange={(e) => setRestaurantDeleteConfirmName(e.target.value)}
                                                 placeholder={`พิมพ์ "${restaurant.shop_name}" เพื่อยืนยัน`}
                                                 className="mt-2"
                                               />
                                             </div>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel 
                                                 onClick={() => {
                                                   setIsDeleteConfirmOpen(false);
                                                   setSelectedRestaurant(null);
                                                   setRestaurantDeleteConfirmName('');
                                                 }}
                                               >
                                                 ยกเลิก
                                               </AlertDialogCancel>
                                               <AlertDialogAction
                                                 onClick={handleDeleteRestaurant}
                                                 disabled={restaurantDeleteConfirmName !== restaurant.shop_name}
                                                 className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                               >
                                                 ลบร้านอาหาร
                                               </AlertDialogAction>
                                             </AlertDialogFooter>
                                            </AlertDialogContent>
                                         </AlertDialog>
                                         </TooltipProvider>
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
                                  รูปภาพร้าน {selectedRestaurant?.url_pic && imagePreview === selectedRestaurant.url_pic && "(รูปปัจจุบัน)"}
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
                                            alt="รูปภาพร้าน"
                                            className="w-full max-w-[200px] h-32 object-cover rounded-lg border"
                                          />
                                          {imagePreview === selectedRestaurant?.url_pic && (
                                            <div className="absolute -top-1 -left-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                              รูปปัจจุบัน
                                            </div>
                                          )}
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setSelectedImage(null);
                                              // Reset กลับไปรูปเดิมถ้ามี หรือ null ถ้าไม่มี
                                              setImagePreview(selectedRestaurant?.url_pic || null);
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
                                  {selectedRestaurant?.url_pic && imagePreview === selectedRestaurant.url_pic && (
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                      ไม่จำเป็นต้องเลือกรูปใหม่ หากต้องการใช้รูปเดิม
                                    </p>
                                  )}
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

                      {/* Add Menu Modal */}
                      <Dialog open={isAddMenuModalOpen} onOpenChange={setIsAddMenuModalOpen}>
                        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              เพิ่มรายการอาหาร - {selectedRestaurant?.shop_name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="max-h-[70vh] pr-4">
                            <div className="space-y-4 p-1">
                              {/* Food Category */}
                              <div className="space-y-2">
                                <Label htmlFor="foodCategory" className="text-sm font-medium text-foreground">
                                  หมวดอาหาร
                                </Label>
                                <Select 
                                  value={menuFormData.foodCategory} 
                                  onValueChange={(value) => setMenuFormData(prev => ({ ...prev, foodCategory: value }))}
                                >
                                  <SelectTrigger className="bg-muted/50 border-muted">
                                    <SelectValue placeholder="เลือกหมวดอาหาร" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border shadow-lg z-50">
                                    <SelectItem value="จานหลัก">จานหลัก</SelectItem>
                                    <SelectItem value="เครื่องดื่ม">เครื่องดื่ม</SelectItem>
                                    <SelectItem value="ของหวาน">ของหวาน</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Image Upload */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">รูปภาพอาหาร</Label>
                                <div className="flex flex-col items-center space-y-4">
                                  <div 
                                    className="w-48 h-48 border-2 border-dashed border-muted rounded-lg flex flex-col items-center justify-center bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => document.getElementById('menuImageInput')?.click()}
                                  >
                                    {menuImagePreview ? (
                                      <div className="relative w-full h-full">
                                        <img 
                                          src={menuImagePreview} 
                                          alt="Preview" 
                                          className="w-full h-full object-cover rounded-lg"
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-2 right-2 w-8 h-8 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuImage(null);
                                            setMenuImagePreview(null);
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground text-center px-2">
                                          คลิกเพื่ออัปโหลดรูปภาพ<br />
                                          (รูปสี่เหลี่ยมจตุรัส)
                                        </p>
                                      </>
                                    )}
                                  </div>
                                  
                                  <Input
                                    id="menuImageInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleMenuImageChange}
                                    className="hidden"
                                  />
                                </div>
                              </div>

                              {/* Menu Name */}
                              <div className="space-y-2">
                                <Label htmlFor="menuName" className="text-sm font-medium text-foreground">
                                  ชื่อเมนูอาหาร
                                </Label>
                                <Input
                                  id="menuName"
                                  type="text"
                                  placeholder="กรอกชื่อเมนูอาหาร"
                                  value={menuFormData.menuName}
                                  onChange={(e) => setMenuFormData(prev => ({ ...prev, menuName: e.target.value }))}
                                  className="bg-muted/50 border-muted"
                                />
                              </div>

                              {/* Description */}
                              <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                                  รายละเอียด
                                </Label>
                                <Textarea
                                  id="description"
                                  placeholder="กรอกรายละเอียดอาหาร"
                                  value={menuFormData.description}
                                  onChange={(e) => setMenuFormData(prev => ({ ...prev, description: e.target.value }))}
                                  className="bg-muted/50 border-muted min-h-[80px]"
                                />
                              </div>

                              {/* Add-ons Section */}
                              <div className="space-y-2 border-t pt-4">
                                <Label htmlFor="addOns" className="text-sm font-medium text-foreground">ส่วนเสริม</Label>
                                <Input
                                  id="addOns"
                                  type="text"
                                  placeholder="กรอกส่วนเสริม"
                                  value={menuFormData.addOns || ''}
                                  onChange={(e) => setMenuFormData(prev => ({ ...prev, addOns: e.target.value }))}
                                  className="bg-muted/50 border-muted"
                                />
                              </div>

                              {/* Price */}
                              <div className="space-y-2">
                                <Label htmlFor="price" className="text-sm font-medium text-foreground">
                                  ราคา (บาท)
                                </Label>
                                <Input
                                  id="price"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="กรอกราคา"
                                  value={menuFormData.price}
                                  onChange={(e) => setMenuFormData(prev => ({ ...prev, price: e.target.value }))}
                                  className="bg-muted/50 border-muted"
                                />
                              </div>
                            </div>
                          </ScrollArea>

                          <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                resetMenuForm();
                                setIsAddMenuModalOpen(false);
                                setSelectedRestaurant(null);
                              }}
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              ยกเลิก
                            </Button>
                            <Button 
                              onClick={handleMenuSubmit}
                              disabled={isMenuSubmitting}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isMenuSubmitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* View Menu Modal */}
                      <Dialog open={isViewMenuModalOpen} onOpenChange={setIsViewMenuModalOpen}>
                        <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              รายการอาหาร - {selectedRestaurant?.shop_name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="max-h-[70vh] pr-4">
                            <div className="space-y-4">
                              {isFoodLoading ? (
                                <div className="text-center py-8">
                                  <div className="text-muted-foreground">กำลังโหลด...</div>
                                </div>
                              ) : foodItems.length === 0 ? (
                                <div className="text-center py-8">
                                  <div className="text-muted-foreground">ยังไม่มีรายการอาหาร</div>
                                </div>
                              ) : (
                                <div className="grid gap-4">
                                  {foodItems.map((food) => (
                                    <div 
                                      key={food.food_id} 
                                      className="flex gap-4 p-4 bg-white/50 border border-brand-pink/10 rounded-lg hover:bg-white/70 transition-colors"
                                    >
                                      {/* Food Image */}
                                      <div className="flex-shrink-0">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-muted/30 border border-muted/50 rounded-lg overflow-hidden flex items-center justify-center">
                                          {food.url_pic ? (
                                            <img
                                              src={food.url_pic}
                                              alt={food.food_name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                              }}
                                            />
                                          ) : null}
                                          <div className={`text-muted-foreground text-xs text-center p-2 ${food.url_pic ? 'hidden' : ''}`}>
                                            ไม่มีรูป
                                          </div>
                                        </div>
                                      </div>
                                      
                                       {/* Food Info */}
                                       <div className="flex-1 min-w-0 space-y-2">
                                         <div>
                                           <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                                             {food.food_name}
                                           </h3>
                                           <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-1">
                                             <span className="inline-block px-2 py-1 bg-brand-pink/20 text-brand-pink text-xs rounded-full text-center whitespace-nowrap">
                                               {food.food_type}
                                             </span>
                                             <span className="font-bold text-green-600 text-sm sm:text-base mt-1 sm:mt-0">
                                               ฿{food.price?.toLocaleString() || '0'}
                                             </span>
                                           </div>
                                         </div>
                                         
                                         {food.description && (
                                           <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                                             {food.description}
                                           </p>
                                         )}
                                         
                                         {food.topping && (
                                           <p className="text-muted-foreground text-xs">
                                             <span className="font-medium">ส่วนเสริม:</span> {food.topping}
                                           </p>
                                         )}
                                       </div>
                                       
                                        {/* Action Buttons */}
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                          <TooltipProvider>
                                            {/* Edit Button */}
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-8 w-8 p-0 border-gray-800 hover:bg-gray-800 hover:border-gray-800"
                                                  onClick={() => handleEditFood(food)}
                                                >
                                                  <Edit className="h-3 w-3 text-gray-800" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>แก้ไขรายการอาหาร</p>
                                              </TooltipContent>
                                            </Tooltip>
                                            
                                            {/* Delete Food Button */}
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-8 w-8 p-0 border-red-600 hover:bg-red-600 hover:border-red-600"
                                                  onClick={() => handleDeleteFood(food)}
                                                >
                                                  <Trash2 className="h-3 w-3 text-red-600" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>ลบรายการอาหาร</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                          
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsViewMenuModalOpen(false);
                                setSelectedRestaurant(null);
                                setFoodItems([]);
                              }}
                            >
                              ปิด
                            </Button>
                          </DialogFooter>
                         </DialogContent>
                       </Dialog>

                        {/* Edit Food Modal */}
                         <Dialog open={isEditFoodModalOpen} onOpenChange={setIsEditFoodModalOpen}>
                           <DialogContent className="w-[95vw] max-w-[700px] p-0 overflow-hidden">
                             <DialogHeader className="p-4 pb-2 border-b bg-white/90">
                               <DialogTitle className="text-xl font-semibold text-center text-foreground">
                                 แก้ไขรายการอาหาร - {selectedRestaurant?.shop_name}
                               </DialogTitle>
                             </DialogHeader>
                             
                             <ScrollArea className="max-h-[calc(90vh-10rem)] px-4">
                               <div className="space-y-6 py-4">
                               {/* Food Category */}
                               <div>
                                 <Label htmlFor="edit_food_category" className="text-sm font-medium text-foreground">
                                   หมวดอาหาร *
                                 </Label>
                                 <Select 
                                   value={editFoodFormData.foodCategory} 
                                   onValueChange={(value) => setEditFoodFormData(prev => ({ ...prev, foodCategory: value }))}
                                 >
                                   <SelectTrigger className="bg-muted/50 border-muted">
                                     <SelectValue placeholder="เลือกหมวดอาหาร" />
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

                               {/* Menu Name */}
                               <div>
                                 <Label htmlFor="edit_menu_name" className="text-sm font-medium text-foreground">
                                   ชื่อเมนูอาหาร *
                                 </Label>
                                 <Input
                                   id="edit_menu_name"
                                   type="text"
                                   placeholder="กรอกชื่อเมนูอาหาร"
                                   value={editFoodFormData.menuName}
                                   onChange={(e) => setEditFoodFormData(prev => ({ ...prev, menuName: e.target.value }))}
                                   className="bg-muted/50 border-muted"
                                 />
                               </div>

                               {/* Description */}
                               <div>
                                 <Label htmlFor="edit_description" className="text-sm font-medium text-foreground">
                                   รายละเอียด *
                                 </Label>
                                 <Textarea
                                   id="edit_description"
                                   placeholder="กรอกรายละเอียดอาหาร"
                                   value={editFoodFormData.description}
                                   onChange={(e) => setEditFoodFormData(prev => ({ ...prev, description: e.target.value }))}
                                   className="bg-muted/50 border-muted min-h-[80px]"
                                 />
                               </div>

                               {/* Add-ons */}
                               <div>
                                 <Label htmlFor="edit_add_ons" className="text-sm font-medium text-foreground">
                                   ส่วนเสริม
                                 </Label>
                                 <Input
                                   id="edit_add_ons"
                                   type="text"
                                   placeholder="กรอกส่วนเสริม"
                                   value={editFoodFormData.addOns || ''}
                                   onChange={(e) => setEditFoodFormData(prev => ({ ...prev, addOns: e.target.value }))}
                                   className="bg-muted/50 border-muted"
                                 />
                               </div>

                               {/* Price */}
                               <div>
                                 <Label htmlFor="edit_price" className="text-sm font-medium text-foreground">
                                   ราคา (บาท) *
                                 </Label>
                                 <Input
                                   id="edit_price"
                                   type="number"
                                   step="0.01"
                                   placeholder="กรอกราคา"
                                   value={editFoodFormData.price}
                                   onChange={(e) => setEditFoodFormData(prev => ({ ...prev, price: e.target.value }))}
                                   className="bg-muted/50 border-muted"
                                 />
                               </div>

                               {/* Image Upload */}
                               <div>
                                 <Label htmlFor="edit_menu_image" className="text-sm font-medium text-foreground">
                                   รูปภาพอาหาร {selectedFood?.url_pic && menuImagePreview === selectedFood.url_pic && "(รูปปัจจุบัน)"}
                                 </Label>
                                 <div className="mt-1">
                                   <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/20">
                                     <input
                                       id="edit_menu_image"
                                       type="file"
                                       accept="image/*"
                                       onChange={handleMenuImageChange}
                                       className="hidden"
                                     />
                                     <label
                                       htmlFor="edit_menu_image"
                                       className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                                     >
                                       {menuImagePreview ? (
                                         <div className="relative">
                                           <img
                                             src={menuImagePreview}
                                             alt="รูปภาพอาหาร"
                                             className="w-full max-w-[200px] h-32 object-cover rounded-lg border"
                                           />
                                           {menuImagePreview === selectedFood?.url_pic && (
                                             <div className="absolute -top-1 -left-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                               รูปปัจจุบัน
                                             </div>
                                           )}
                                           <Button
                                             type="button"
                                             variant="destructive"
                                             size="sm"
                                             className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                             onClick={(e) => {
                                               e.preventDefault();
                                               setSelectedMenuImage(null);
                                               setMenuImagePreview(selectedFood?.url_pic || null);
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
                           
                            <DialogFooter className="flex flex-col sm:flex-row gap-2 p-4 border-t bg-white/90">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  resetEditFoodForm();
                                  setIsEditFoodModalOpen(false);
                                  setSelectedFood(null);
                                }}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 w-full sm:w-auto order-2 sm:order-1"
                              >
                                ยกเลิก
                              </Button>
                              <Button 
                                onClick={handleEditFoodSubmit}
                                disabled={isMenuSubmitting}
                                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto order-1 sm:order-2"
                              >
                                {isMenuSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                              </Button>
                            </DialogFooter>
                         </DialogContent>
                         </Dialog>

                         {/* Delete Food Confirmation Dialog */}
                         <AlertDialog open={isFoodDeleteConfirmOpen} onOpenChange={setIsFoodDeleteConfirmOpen}>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>ยืนยันการลบรายการอาหาร</AlertDialogTitle>
                               <AlertDialogDescription>
                                 คุณแน่ใจหรือไม่ที่จะลบรายการอาหาร "{deletingFood?.food_name}" 
                                 <br />
                                 การกระทำนี้ไม่สามารถย้อนกลับได้
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel onClick={() => {
                                 setIsFoodDeleteConfirmOpen(false);
                                 setDeletingFood(null);
                               }}>
                                 ยกเลิก
                               </AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={confirmDeleteFood}
                                 className="bg-red-600 hover:bg-red-700"
                               >
                                 ลบรายการอาหาร
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
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
                        <DialogContent className="w-[95vw] max-w-[500px] p-0 overflow-hidden">
                          <DialogHeader className="p-4 pb-2 border-b bg-white/90">
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              เพิ่มใบสั่งอาหาร
                            </DialogTitle>
                          </DialogHeader>
                          
                          <ScrollArea className="max-h-[calc(90vh-10rem)] px-4">
                            <div className="space-y-6 p-4">
                              <Form {...planForm}>
                                <form onSubmit={planForm.handleSubmit(handlePlanSubmit)} className="space-y-6">
                                
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
                            </div>
                          </ScrollArea>
                          
                          <DialogFooter className="gap-2 p-4 border-t bg-white/90 mt-auto">
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
                          <PlanList filterState="waiting" restaurants={restaurants} refreshRef={waitingPlansRefreshRef} />
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
                          <PlanList filterState="published" restaurants={restaurants} refreshRef={publishedPlansRefreshRef} />
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
                          <PlanList filterState="finished" restaurants={restaurants} refreshRef={finishedPlansRefreshRef} />
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