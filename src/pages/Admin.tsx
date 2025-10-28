import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChefHat, Store, FileText, Clock, CheckCircle, Plus, FilePlus, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, UtensilsCrossed, Upload, X, Edit, Eye, Trash2, Calendar as CalendarIcon, Send, Power, Link, ShoppingCart, Receipt, GripVertical, Filter, FileSpreadsheet, User, UtensilsCrossed as UtensilsIcon, UserMinus, UserCog, LogOut, Settings } from "lucide-react";
import * as XLSX from 'xlsx';
import { Switch } from "@/components/ui/switch";

import { useState, useEffect, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import MealOrdersModal from "@/components/MealOrdersModal";
import PortalLinkModal from "@/components/PortalLinkModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
                    {shops.map((shop) => (
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
                      {filteredFoods.map((food) => (
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
                      {shops.map((shop) => (
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
                        {filteredFoods.map((food) => (
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
const PlanList = ({ filterState, restaurants = [], refreshRef, admin }: { filterState?: string; restaurants?: any[]; refreshRef?: React.MutableRefObject<(() => void) | undefined>; admin?: any }) => {
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
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportingPlan, setExportingPlan] = useState<any>(null);
  const [revertingPlan, setRevertingPlan] = useState<any>(null);

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
  
  // Delete individual orders states
  const [isDeleteOrdersModalOpen, setIsDeleteOrdersModalOpen] = useState(false);
  const [selectedPlanForDeleteOrders, setSelectedPlanForDeleteOrders] = useState<any>(null);
  const [personsWithOrders, setPersonsWithOrders] = useState<any[]>([]);
  const [isLoadingPersonsWithOrders, setIsLoadingPersonsWithOrders] = useState(false);

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

  // Export to Excel function - Full format
  const exportToExcel = async (plan: any) => {
    try {
      setIsLoadingOrders(true);
      
      // Fetch orders for the plan
      const { data: ordersData, error: ordersError } = await supabase
        .from('order')
        .select(`
          *,
          person:person_id (person_name, person_agent),
          food:food_id (
            food_name, 
            price, 
            url_pic, 
            shop:shop_id (shop_name)
          ),
          meal:meal_id (meal_name)
        `)
        .eq('plan_id', plan.plan_id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Format data for Excel
      const excelData = ordersData.map((order: any, index: number) => ({
        'ลำดับ': index + 1,
        'ชื่อผู้สั่ง': order.person?.person_name || '-',
        'กลุ่ม': order.person?.person_agent || '-',
        'มื้อ': order.meal?.meal_name || '-',
        'ร้าน': order.food?.shop?.shop_name || '-',
        'เมนู': order.food?.food_name || '-',
        'ส่วนเสริม': order.topping || '-',
        'หมายเหตุ': order.order_note || '-',
        'ราคา': order.food?.price || 0,
        'เวลาสั่ง': formatThaiDateTime(order.created_at),
        'ประเภทเลือก': order.order_type === 'custom' ? 'ผู้สั่งเลือก' : 'กำหนด'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 20 },  // ชื่อผู้สั่ง
        { wch: 15 },  // กลุ่ม
        { wch: 15 },  // มื้อ
        { wch: 25 },  // ร้าน
        { wch: 30 },  // เมนู
        { wch: 20 },  // ส่วนเสริม
        { wch: 30 },  // หมายเหตุ
        { wch: 10 },  // ราคา
        { wch: 20 },  // เวลาสั่ง
        { wch: 15 }   // ประเภทเลือก
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

  // Export to Excel function - Compact format
  const exportToExcelCompact = async (plan: any) => {
    try {
      setIsLoadingOrders(true);
      
      // Fetch orders for the plan
      const { data: ordersData, error: ordersError } = await supabase
        .from('order')
        .select(`
          *,
          person:person_id (person_name, person_agent),
          food:food_id (food_name),
          meal:meal_id (meal_name, meal_index, shop:shop_id (shop_name))
        `)
        .eq('plan_id', plan.plan_id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get all unique meals ordered by meal_index
      const mealsMap = new Map();
      ordersData.forEach((order: any) => {
        if (order.meal) {
          const mealKey = order.meal.meal_name;
          if (!mealsMap.has(mealKey)) {
            mealsMap.set(mealKey, {
              meal_name: order.meal.meal_name,
              shop_name: order.meal.shop?.shop_name || '',
              meal_index: order.meal.meal_index || 0
            });
          }
        }
      });

      // Sort meals by index
      const sortedMeals = Array.from(mealsMap.values()).sort((a, b) => a.meal_index - b.meal_index);

      // Group orders by person
      const personOrdersMap = new Map();
      ordersData.forEach((order: any) => {
        const personName = order.person?.person_name || '-';
        if (!personOrdersMap.has(personName)) {
          personOrdersMap.set(personName, []);
        }
        personOrdersMap.get(personName).push(order);
      });

      // Create Excel data structure
      const excelData = [];
      let rowIndex = 1;
      
      personOrdersMap.forEach((orders, personName) => {
        const row: any = { 
          'ลำดับที่': rowIndex++,
          'ชื่อผู้สั่ง': personName 
        };
        
        // For each meal, find if this person ordered from it
        sortedMeals.forEach((meal) => {
          const mealOrders = orders.filter((o: any) => 
            o.meal?.meal_name === meal.meal_name
          );
          
          const mealColumnName = `${meal.meal_name} (${meal.shop_name})`;
          const noteColumnName = `หมายเหตุ ${meal.meal_name}`;
          
          if (mealOrders.length > 0) {
            // Combine all food names for this meal
            const foodNames = mealOrders.map((o: any) => o.food?.food_name || '-').join(', ');
            row[mealColumnName] = foodNames;
            
            // Combine all toppings and notes
            const notes = mealOrders
              .map((o: any) => {
                const parts = [];
                if (o.topping) parts.push(o.topping);
                if (o.order_note) parts.push(o.order_note);
                return parts.join(', ');
              })
              .filter(n => n.length > 0)
              .join('; ');
            row[noteColumnName] = notes || '-';
          } else {
            row[mealColumnName] = '-';
            row[noteColumnName] = '-';
          }
        });
        
        excelData.push(row);
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 10 }, // ลำดับที่
        { wch: 20 }  // ชื่อผู้สั่ง
      ];
      sortedMeals.forEach(() => {
        colWidths.push({ wch: 30 }); // ชื่อร้านอาหาร
        colWidths.push({ wch: 35 }); // หมายเหตุ
      });
      ws['!cols'] = colWidths;

      // Freeze first row (header)
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };

      // Apply alternating background colors for meal pairs
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const lightGrayFill = { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } };
      
      // Apply background color to alternating meal pairs (2 columns per meal)
      for (let R = range.s.r; R <= range.e.r; R++) {
        let mealPairIndex = 0;
        for (let C = 2; C <= range.e.c; C += 2) { // Start from column 2 (after ลำดับที่ and ชื่อผู้สั่ง)
          const shouldApplyGray = mealPairIndex % 2 === 0;
          
          if (shouldApplyGray) {
            // Apply to both columns of the meal pair
            for (let col = C; col < C + 2 && col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: R, c: col });
              if (!ws[cellAddress]) continue;
              
              if (!ws[cellAddress].s) ws[cellAddress].s = {};
              ws[cellAddress].s.fill = lightGrayFill;
            }
          }
          
          mealPairIndex++;
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'รายการสั่งอาหาร');

      // Generate filename with plan name and date
      const currentDate = new Date().toLocaleDateString('th-TH');
      const filename = `รายการสั่งอาหาร_แบบย่อ_${plan.plan_name}_${currentDate}.xlsx`;

      // Export file
      XLSX.writeFile(wb, filename);
      
      toast.success('ส่งออกไฟล์ Excel แบบย่อสำเร็จ');
    } catch (error) {
      console.error('Error exporting to Excel (compact):', error);
      toast.error('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleExportClick = (plan: any) => {
    setExportingPlan(plan);
    setIsExportDialogOpen(true);
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
      
      // Fetch meals, shops, and order count for each plan
      const plansWithMeals = await Promise.all(
        (data || []).map(async (plan) => {
          const { data: mealsData } = await supabase
            .from('meal')
            .select(`
              meal_id,
              meal_name,
              meal_index,
              shop:shop_id (
                shop_id,
                shop_name,
                url_pic
              )
            `)
            .eq('plan_id', plan.plan_id)
            .order('meal_index', { ascending: true });
          
          // Fetch unique person count for published plans
          let orderCount = 0;
          if (filterState === 'published') {
            const { data: ordersData } = await supabase
              .from('order')
              .select('person_id')
              .eq('plan_id', plan.plan_id);
            
            // Count unique persons
            const uniquePersons = new Set(ordersData?.map(o => o.person_id) || []);
            orderCount = uniquePersons.size;
          }
          
          return {
            ...plan,
            meals: mealsData || [],
            orderCount
          };
        })
      );
      
      setPlans(plansWithMeals);
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
          plan_editor: admin?.username || 'admin',
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

  // Handle revert to draft
  const handleRevertToDraft = async (plan: any) => {
    setRevertingPlan(plan);
    setIsRevertDialogOpen(true);
  };

  // Confirm revert to draft
  const confirmRevertToDraft = async () => {
    if (!revertingPlan) return;

    try {
      const { error } = await supabase
        .from('plan')
        .update({ plan_state: 'waiting', is_open: 0 })
        .eq('plan_id', revertingPlan.plan_id);

      if (error) throw error;

      toast.success('ย้อนกลับเป็นแบบร่างสำเร็จ');
      setIsRevertDialogOpen(false);
      setRevertingPlan(null);
      fetchPlans();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการย้อนกลับ');
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

      // Get unique persons who have orders, sorted by latest created_at
      const uniquePersons = ordersData?.reduce((acc, order) => {
        const personId = order.person?.person_id;
        if (personId && !acc.find(p => p.person_id === personId)) {
          acc.push({
            person_id: personId,
            person_name: order.person?.person_name,
            person_agent: order.person?.person_agent,
            created_at: order.created_at
          });
        }
        return acc;
      }, [])
      // Sort by created_at descending (latest first)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

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
      setOrderPersons(uniquePersons);
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

  // Handle delete individual orders
  const handleDeleteIndividualOrders = async (plan: any) => {
    setSelectedPlanForDeleteOrders(plan);
    setIsDeleteOrdersModalOpen(true);
    await fetchPersonsWithOrders(plan.plan_id);
  };

  // Fetch persons with orders
  const fetchPersonsWithOrders = async (planId: string) => {
    setIsLoadingPersonsWithOrders(true);
    try {
      // First get all person_ids who have orders in this plan
      const { data: ordersData, error: ordersError } = await supabase
        .from('order')
        .select('person_id')
        .eq('plan_id', planId);

      if (ordersError) throw ordersError;

      // Count orders per person
      const orderCounts = new Map();
      ordersData?.forEach(order => {
        const personId = order.person_id;
        orderCounts.set(personId, (orderCounts.get(personId) || 0) + 1);
      });

      // Get unique person IDs
      const uniquePersonIds = Array.from(orderCounts.keys());

      if (uniquePersonIds.length === 0) {
        setPersonsWithOrders([]);
        return;
      }

      // Fetch person details for those IDs
      const { data: personsData, error: personsError } = await supabase
        .from('person')
        .select('person_id, person_name, person_agent, contact')
        .in('person_id', uniquePersonIds);

      if (personsError) throw personsError;

      // Combine person data with order counts
      const personsWithOrderCounts = personsData?.map(person => ({
        person_id: person.person_id,
        person_name: person.person_name,
        person_agent: person.person_agent,
        contact: person.contact, // Use actual contact field
        orderCount: orderCounts.get(person.person_id) || 0
      })) || [];

      setPersonsWithOrders(personsWithOrderCounts);

    } catch (error) {
      console.error('Error fetching persons with orders:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายชื่อผู้สั่งอาหาร');
    } finally {
      setIsLoadingPersonsWithOrders(false);
    }
  };

  // Delete person and their orders
  const handleDeletePersonAndOrders = async (personId: string, personName: string) => {
    if (!selectedPlanForDeleteOrders) return;

    const planId = selectedPlanForDeleteOrders.plan_id;

    try {
      // Delete all orders for this person in this plan
      const { error: ordersError } = await supabase
        .from('order')
        .delete()
        .eq('plan_id', planId)
        .eq('person_id', personId);

      if (ordersError) throw ordersError;

      // Delete the person record
      const { error: personError } = await supabase
        .from('person')
        .delete()
        .eq('person_id', personId)
        .eq('plan_id', planId);

      if (personError) throw personError;

      toast.success(`ลบรายการสั่งอาหารของ ${personName} สำเร็จ`);
      
      // Refresh the persons list
      await fetchPersonsWithOrders(planId);

    } catch (error) {
      console.error('Error deleting person and orders:', error);
      toast.error('เกิดข้อผิดพลาดในการลบรายการสั่งอาหาร');
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
        meal_id: meal.meal_id, // Keep the actual meal_id for updates
        name: meal.meal_name,
        shopId: meal.shop_id || '',
        foodId: meal.food_id || '',
        customFoodText: 'ให้ผู้ใช้เลือกเอง',
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
      // Fetch existing meals to compare
      const { data: existingMeals, error: fetchError } = await supabase
        .from('meal')
        .select('meal_id')
        .eq('plan_id', selectedPlanForMeal.plan_id);

      if (fetchError) throw fetchError;

      const existingMealIds = new Set(existingMeals?.map(m => m.meal_id) || []);

      // Process each meal - update if exists, insert if new
      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        const mealData = {
          plan_id: selectedPlanForMeal.plan_id,
          shop_id: meal.shopId || null,
          food_id: meal.foodId || null,
          meal_name: meal.name,
          meal_index: i + 1
        };

        if (meal.meal_id && existingMealIds.has(meal.meal_id)) {
          // Update existing meal
          const { error: updateError } = await supabase
            .from('meal')
            .update(mealData)
            .eq('meal_id', meal.meal_id);

          if (updateError) throw updateError;
        } else {
          // Insert new meal
          const { error: insertError } = await supabase
            .from('meal')
            .insert(mealData);

          if (insertError) throw insertError;
        }
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
        <div className="grid gap-2 md:gap-4 grid-cols-1 px-0 md:px-4">
          {plans.map((plan) => {
            const getStateInfo = () => {
              switch(filterState) {
                case 'waiting': 
                  return {
                    bgClass: 'bg-gradient-to-br from-yellow-50 to-amber-50',
                    borderClass: 'border-yellow-200',
                    iconBgClass: 'bg-yellow-100',
                    iconTextClass: 'text-yellow-700',
                    icon: Clock,
                    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  };
                case 'published': 
                  return {
                    bgClass: 'bg-gradient-to-br from-orange-50 to-pink-50',
                    borderClass: 'border-orange-200',
                    iconBgClass: 'bg-orange-100',
                    iconTextClass: 'text-orange-700',
                    icon: Store,
                    badge: 'bg-orange-100 text-orange-800 border-orange-200'
                  };
                case 'finished': 
                  return {
                    bgClass: 'bg-gradient-to-br from-green-50 to-emerald-50',
                    borderClass: 'border-green-200',
                    iconBgClass: 'bg-green-100',
                    iconTextClass: 'text-green-700',
                    icon: CheckCircle,
                    badge: 'bg-green-100 text-green-800 border-green-200'
                  };
                default: 
                  return {
                    bgClass: 'bg-white/80',
                    borderClass: 'border-gray-200',
                    iconBgClass: 'bg-gray-100',
                    iconTextClass: 'text-gray-700',
                    icon: FileText,
                    badge: 'bg-gray-100 text-gray-800 border-gray-200'
                  };
              }
            };
            
            const stateInfo = getStateInfo();
            const StateIcon = stateInfo.icon;
            
            return (
            <Card key={plan.plan_id} className={`${stateInfo.bgClass} backdrop-blur-sm shadow-md hover:shadow-lg transition-all border-2 ${stateInfo.borderClass} overflow-hidden relative group`}>
              <CardContent className="p-3">
                {/* Dropdown menu - top right */}
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 px-2 bg-white/90 border-primary hover:bg-primary hover:text-primary-foreground">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-popover border shadow-lg" align="end">
                      {filterState === 'waiting' && (
                        <>
                          <DropdownMenuItem onClick={() => handleAddMeal(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <Plus className="h-4 w-4 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">เพิ่มมื้ออาหาร</span>
                              <span className="text-xs text-muted-foreground">เพิ่มเมนูอาหารใหม่</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <Edit className="h-4 w-4 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">แก้ไขใบสั่งอาหาร</span>
                              <span className="text-xs text-muted-foreground">แก้ไขรายละเอียด</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePublish(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <Send className="h-4 w-4 text-purple-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">เผยแพร่ใบสั่งอาหาร</span>
                              <span className="text-xs text-muted-foreground">เปิดให้สั่งอาหาร</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
                      {filterState === 'published' && (
                        <>
                          <DropdownMenuItem onClick={() => handleExportClick(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ส่งออก Excel</span>
                              <span className="text-xs text-muted-foreground">ดาวน์โหลดไฟล์รายงาน</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRevertToDraft(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <FileText className="h-4 w-4 text-orange-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ย้อนกลับเป็นแบบร่าง</span>
                              <span className="text-xs text-muted-foreground">เปลี่ยนสถานะเป็นแบบร่าง</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFinishPlan(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ปิดใบสั่งอาหาร</span>
                              <span className="text-xs text-muted-foreground">ปิดการรับออเดอร์</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleShowMealList(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ดูรายการมื้ออาหาร</span>
                              <span className="text-xs text-muted-foreground">แสดงเมนูทั้งหมด</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShowOrders(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <ShoppingCart className="h-4 w-4 text-gray-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ดูรายการสั่งอาหาร</span>
                              <span className="text-xs text-muted-foreground">แสดงออเดอร์ทั้งหมด</span>
                            </div>
                          </DropdownMenuItem>
                          {plan.url_portal && (
                            <PortalLinkModal
                              url={plan.url_portal}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                  <Link className="h-4 w-4 text-indigo-600" />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">ลิ้ง Portal</span>
                                    <span className="text-xs text-muted-foreground">แชร์ลิ้งให้ผู้ใช้</span>
                                  </div>
                                </DropdownMenuItem>
                              }
                            />
                          )}
                          <DropdownMenuItem onClick={() => handleDeleteIndividualOrders(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <UserCog className="h-4 w-4 text-orange-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">จัดการผู้สั่งออเดอร์</span>
                              <span className="text-xs text-muted-foreground">แก้ไขรายการผู้สั่ง</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
                      {filterState === 'finished' && (
                        <>
                          <DropdownMenuItem onClick={() => handleExportClick(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ส่งออก Excel</span>
                              <span className="text-xs text-muted-foreground">ดาวน์โหลดไฟล์รายงาน</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShowMealList(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ดูรายการมื้ออาหาร</span>
                              <span className="text-xs text-muted-foreground">แสดงเมนูทั้งหมด</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShowOrders(plan)} className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <ShoppingCart className="h-4 w-4 text-gray-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">ดูรายการสั่งอาหาร</span>
                              <span className="text-xs text-muted-foreground">แสดงออเดอร์ทั้งหมด</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
                      <DropdownMenuItem onClick={() => handleDelete(plan)} className="gap-3 py-2.5 px-3 hover:bg-destructive hover:text-destructive-foreground cursor-pointer">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">ลบใบสั่งอาหาร</span>
                          <span className="text-xs text-muted-foreground">ลบถาวร</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Card content - Responsive Layout */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left Section - Plan Info */}
                  <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
                    {/* Icon section */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${stateInfo.iconBgClass} flex items-center justify-center`}>
                      <StateIcon className={`w-6 h-6 ${stateInfo.iconTextClass}`} />
                    </div>
                    
                    {/* Info section */}
                    <div className="flex-1 space-y-1.5 pr-8 sm:pr-10 lg:pr-0">
                      {/* Title and badge */}
                      <div className="pb-1.5 border-b border-gray-200/60">
                        <h3 className="text-base font-bold text-foreground mb-1">{plan.plan_name}</h3>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${stateInfo.badge} font-medium`}>
                          {filterState === 'waiting' ? 'กำลังเตรียม' : filterState === 'published' ? 'เปิดรับสั่ง' : 'เสร็จสิ้น'}
                        </span>
                      </div>
                      
                      {/* Details - Inline layout */}
                      <div className="space-y-1 text-sm">
                        {/* Location */}
                        <div className="flex items-center gap-2 py-0.5 border-b border-gray-100">
                          <span className="text-sm">📍</span>
                          <span className="text-xs text-muted-foreground">สถานที่:</span>
                          <span className="text-sm text-foreground font-medium break-words flex-1">{plan.plan_location}</span>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center gap-2 py-0.5 border-b border-gray-100">
                          <span className="text-sm">📅</span>
                          <span className="text-xs text-muted-foreground">วันที่:</span>
                          <span className="text-sm text-foreground font-medium break-words flex-1">{formatThaiDate(plan.plan_date)}</span>
                        </div>
                        
                        {/* Time */}
                        <div className="flex items-center gap-2 py-0.5 border-b border-gray-100">
                          <span className="text-sm">⏰</span>
                          <span className="text-xs text-muted-foreground">เวลา:</span>
                          <span className="text-sm text-foreground font-medium break-words flex-1">{plan.plan_time}</span>
                        </div>
                        
                        {/* People count */}
                        <div className="flex items-center gap-2 py-0.5 border-b border-gray-100">
                          <span className="text-sm">👥</span>
                          <span className="text-xs text-muted-foreground">จำนวนคน:</span>
                          <span className="text-sm text-foreground font-medium">{plan.plan_maxp} คน</span>
                        </div>
                        
                        {/* Order count - only show for published plans */}
                        {filterState === 'published' && (
                          <div className="flex items-center gap-2 py-0.5 border-b border-gray-100">
                            <span className="text-sm">📝</span>
                            <span className="text-xs text-muted-foreground">มีผู้สั่งแล้ว:</span>
                            <span className="text-sm text-foreground font-medium">{plan.orderCount || 0} คน</span>
                          </div>
                        )}
                        
                        {/* Password */}
                        <div className="flex items-center gap-2 py-0.5 border-b border-gray-100">
                          <span className="text-sm">🔑</span>
                          <span className="text-xs text-muted-foreground">รหัส:</span>
                          <span className="text-sm text-foreground font-medium font-mono">{plan.plan_pwd}</span>
                        </div>
                        
                        {/* Creator */}
                        <div className="flex items-center gap-2 py-0.5 border-b border-gray-100">
                          <span className="text-sm">✍️</span>
                          <span className="text-xs text-muted-foreground">ผู้สร้าง:</span>
                          <span className="text-sm text-foreground font-medium break-words flex-1">{plan.plan_editor}</span>
                        </div>
                      </div>
                      
                      {/* Toggle for published state */}
                      {filterState === 'published' && (
                        <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-gray-200/60">
                          <Power className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-sm font-medium text-foreground flex-1">เปิดรับออเดอร์</Label>
                          <Switch
                            checked={plan.is_open === 1}
                            onCheckedChange={(checked) => handleToggleOpen(plan, checked)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Section - Meals (Desktop Only) */}
                  {plan.meals && plan.meals.length > 0 && (
                    <div className="hidden lg:block lg:w-80 border-l border-gray-200/60 pl-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                          <UtensilsIcon className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold text-foreground">รายการมื้ออาหาร</h4>
                          <span className="text-xs text-muted-foreground">({plan.meals.length} มื้อ)</span>
                        </div>
                        <ScrollArea className="h-[280px] pr-1">
                          <div className="space-y-2 pr-2">
                            {plan.meals.map((meal: any, index: number) => (
                              <div key={meal.meal_id} className="flex items-start gap-2 p-2.5 bg-white/60 rounded-md border border-gray-200/50 hover:bg-white/80 hover:border-gray-300/60 transition-colors">
                                <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{meal.meal_name}</p>
                                  {meal.shop ? (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {meal.shop.url_pic && (
                                        <img 
                                          src={meal.shop.url_pic} 
                                          alt={meal.shop.shop_name}
                                          className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                          onError={(e) => {
                                            e.currentTarget.src = '/placeholder.svg';
                                          }}
                                        />
                                      )}
                                      <p className="text-xs text-muted-foreground truncate font-medium">{meal.shop.shop_name}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground/70 italic mt-1">ยังไม่เลือกร้านอาหาร</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </div>
               </CardContent>
            </Card>
            );
          })}
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
                              onSelect={(date) => {
                                if (date) {
                                  // Create a date with Thailand timezone to prevent 1-day rollback
                                  const thailandDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                                  field.onChange(thailandDate);
                                } else {
                                  field.onChange(date);
                                }
                              }}
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

      {/* Delete Orders Modal */}
      <Dialog open={isDeleteOrdersModalOpen} onOpenChange={setIsDeleteOrdersModalOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>จัดการผู้สั่งออเดอร์</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {isLoadingPersonsWithOrders ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">กำลังโหลดรายชื่อผู้สั่ง...</div>
              </div>
            ) : personsWithOrders.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">ไม่มีรายการสั่งอาหารในแผนนี้</div>
              </div>
            ) : (
              <div className="space-y-3">
                {personsWithOrders.map((person) => (
                  <div key={person.person_id} className="flex items-center justify-between p-4 border border-brand-pink/20 rounded-lg bg-white/50">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{person.person_name}</p>
                       <p className="text-sm text-muted-foreground">
                         {person.contact || 'ไม่มีข้อมูลติดต่อ'}
                       </p>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="ml-3">
                          <Trash2 className="h-4 w-4 mr-2" />
                          ลบ
                        </Button>
                      </AlertDialogTrigger>
                      
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการลบคำสั่งซื้อ</AlertDialogTitle>
                          <AlertDialogDescription>
                            คุณต้องการลบคำสั่งซื้อทั้งหมดของ <strong>"{person.person_name}"</strong> หรือไม่?
                            <br />
                            <span className="text-red-600 font-medium mt-2 block">
                              การกระทำนี้ไม่สามารถย้อนกลับได้
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeletePersonAndOrders(person.person_id, person.person_name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            ลบคำสั่งซื้อ
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOrdersModalOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="w-[98vw] max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg h-[95vh] md:w-[95vw] md:h-[90vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b bg-white/90 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground text-center">
              รายการอาหารที่ถูกสั่ง - {selectedPlanForOrder?.plan_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full p-2 md:p-4 gap-2 md:gap-4 min-h-0">
            {/* Filter Container */}
            <div className="flex-shrink-0">
              {/* Mobile Filter Icons */}
              <div className="md:hidden flex gap-2 mb-4 justify-center">
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
                         {orderPersons.map((person, index) => (
                           <SelectItem key={person.person_id} value={person.person_id}>
                             {index + 1}. {person.person_name}{person.person_agent ? ` (${person.person_agent})` : ''}
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
                       {orderPersons.map((person, index) => (
                         <SelectItem key={person.person_id} value={person.person_id}>
                           {index + 1}. {person.person_name}{person.person_agent ? ` (${person.person_agent})` : ''}
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
                <div className="h-full overflow-auto border border-brand-pink/10 rounded-lg bg-white/30">
                  <div className="min-w-[1000px]">
                    <Table className="border border-brand-pink/60">
                      <TableHeader>
                        <TableRow className="bg-brand-pink/20 hover:bg-brand-pink/20 border-b-2 border-brand-pink/60">
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40 text-center">#</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">ผู้สั่ง</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">มื้ออาหาร</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">ร้านอาหาร</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">เมนู</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">หมายเหตุ</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold border-r border-brand-pink/40">ท็อปปิ้ง</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-100 font-bold">เวลาสั่ง</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order, index) => (
                          <TableRow key={order.order_id} className="border-b border-brand-pink/40 hover:bg-brand-pink/10">
                            <TableCell className="border-r border-brand-pink/40 text-center">
                              <span className="bg-brand-pink text-white font-bold px-2 py-1 rounded-full text-xs">
                                {index + 1}
                              </span>
                            </TableCell>
                            <TableCell className="border-r border-brand-pink/40">
                              <div className="text-gray-800 dark:text-gray-100 font-medium">
                                {order.person_name}
                                {order.person_agent && (
                                  <div className="text-xs text-gray-600 dark:text-gray-300">({order.person_agent})</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="border-r border-brand-pink/40">
                              <div className="text-gray-800 dark:text-gray-100 font-medium flex items-center gap-2">
                                {order.meal_name}
                                {!order.is_custom && <Check className="h-4 w-4 text-green-600" />}
                              </div>
                            </TableCell>
                            <TableCell className="border-r border-brand-pink/40">
                              <div className="text-gray-800 dark:text-gray-100 font-medium">{order.shop_name}</div>
                            </TableCell>
                            <TableCell className="border-r border-brand-pink/40">
                              <div className="text-gray-700 dark:text-gray-200">{order.food_name}</div>
                            </TableCell>
                            <TableCell className="border-r border-brand-pink/40">
                              <div className="text-gray-700 dark:text-gray-200">{order.order_note || '-'}</div>
                            </TableCell>
                            <TableCell className="border-r border-brand-pink/40">
                              <div className="text-gray-700 dark:text-gray-200">{order.topping || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                {formatThaiDateTime(order.created_at)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
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
        <DialogContent className="w-[98vw] max-w-5xl mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg h-[92vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b bg-white/90 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground text-center">
              รายการมื้ออาหาร - {selectedPlanForMeal?.plan_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden px-2 md:px-4 py-2">
            <div className="h-full border border-brand-pink/10 rounded-lg bg-white/30 p-2 md:p-4 overflow-auto">
              <MealOrdersModal plan={selectedPlanForMeal} />
            </div>
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

      {/* Revert to Draft Confirmation */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการย้อนกลับเป็นแบบร่าง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการย้อนกลับแผน "{revertingPlan?.plan_name}" เป็นสถานะแบบร่างหรือไม่?
              <br />
              การรับออเดอร์จะถูกปิดและสถานะจะเปลี่ยนเป็นแบบร่าง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevertToDraft} className="bg-orange-600 hover:bg-orange-700">
              ยืนยันการย้อนกลับ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Excel Format Selection Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกรูปแบบการส่งออก Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button 
              onClick={() => {
                exportToExcel(exportingPlan);
                setIsExportDialogOpen(false);
              }}
              className="w-full h-auto py-4 px-4 flex flex-col items-start gap-2 hover:bg-primary/90"
            >
              <div className="flex items-center gap-2 w-full">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="font-semibold text-base">แบบเต็ม</span>
              </div>
              <span className="text-xs text-left opacity-90">
                แสดงข้อมูลทุกคอลัมน์ รวมราคา เวลาสั่ง และประเภทการเลือก
              </span>
            </Button>
            
            <Button 
              onClick={() => {
                exportToExcelCompact(exportingPlan);
                setIsExportDialogOpen(false);
              }}
              variant="outline"
              className="w-full h-auto py-4 px-4 flex flex-col items-start gap-2 hover:bg-accent"
            >
              <div className="flex items-center gap-2 w-full">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="font-semibold text-base">แบบย่อ</span>
              </div>
              <span className="text-xs text-left text-muted-foreground">
                จัดเรียงตามชื่อคน และมื้ออาหาร เหมาะสำหรับการดูแบบสรุป
              </span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsExportDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Admin = () => {
  const { signOut, admin } = useAuth();
  const navigate = useNavigate();
  
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [progressSortOrder, setProgressSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [completedSortOrder, setCompletedSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [expandedRestaurants, setExpandedRestaurants] = useState<{ [key: string]: boolean }>({});
  const [isPlanSubmitting, setIsPlanSubmitting] = useState(false);

  // Create refs to access refresh functions from child components
  const waitingPlansRefreshRef = useRef<() => void>();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
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
          plan_editor: admin?.username || 'admin',
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
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white/90"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
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
                            <Card key={restaurant.shop_id} className="bg-white/60 border border-brand-pink/10 overflow-hidden relative">
                              <CardContent className="p-0">
                                {/* Dropdown menu - top right */}
                                <div className="absolute top-2 right-2 z-10">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-8 px-2 bg-white/90 border-primary hover:bg-primary hover:text-primary-foreground">
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-popover border shadow-lg" align="end">
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedRestaurant(restaurant);
                                          setIsAddMenuModalOpen(true);
                                        }}
                                        className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                      >
                                        <Plus className="h-4 w-4 text-green-600" />
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">เพิ่มรายการอาหาร</span>
                                          <span className="text-xs text-muted-foreground">เพิ่มเมนูในร้าน</span>
                                        </div>
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem 
                                        onClick={() => handleEditRestaurant(restaurant)}
                                        className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                      >
                                        <Edit className="h-4 w-4 text-blue-600" />
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">แก้ไขร้าน</span>
                                          <span className="text-xs text-muted-foreground">แก้ไขข้อมูลร้านอาหาร</span>
                                        </div>
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedRestaurant(restaurant);
                                          setIsViewMenuModalOpen(true);
                                          fetchFoodItems(restaurant.shop_id);
                                        }}
                                        className="gap-3 py-2.5 px-3 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                      >
                                        <Eye className="h-4 w-4 text-gray-600" />
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">รายการอาหาร</span>
                                          <span className="text-xs text-muted-foreground">ดูเมนูทั้งหมด</span>
                                        </div>
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuSeparator />
                                      
                                      <AlertDialog open={isDeleteConfirmOpen && selectedRestaurant?.shop_id === restaurant.shop_id} onOpenChange={setIsDeleteConfirmOpen}>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault();
                                              setSelectedRestaurant(restaurant);
                                              setIsDeleteConfirmOpen(true);
                                            }}
                                            className="gap-3 py-2.5 px-3 hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                            <div className="flex flex-col">
                                              <span className="font-medium text-sm">ลบร้านอาหาร</span>
                                              <span className="text-xs text-muted-foreground">ลบถาวร</span>
                                            </div>
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
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
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setIsDeleteConfirmOpen(false)}>ยกเลิก</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteRestaurant()}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              ยืนยันการลบ
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Restaurant Content - Image on left, details on right */}
                                <div className="flex flex-col sm:flex-row">
                                  {/* Restaurant Image */}
                                  <div className="w-full sm:w-48 h-48 bg-gradient-to-br from-brand-cream/20 to-brand-pink/10 relative overflow-hidden flex-shrink-0">
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
                                  <div className="flex-1 p-4 space-y-3">
                                    {/* Name and Description Container */}
                                    <div className="space-y-2 pr-8 sm:pr-10">
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
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Edit Restaurant Modal */}

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
                                      className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-white/50 border border-brand-pink/10 rounded-lg hover:bg-white/70 transition-colors"
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
                                       <div className="min-w-0 space-y-2 overflow-hidden">
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
                                           <div className="space-y-2">
                                             <p className="text-xs font-medium text-foreground">ส่วนเสริม:</p>
                                             <div className="flex flex-col gap-2">
                                               {food.topping.split(',').map((topping, index) => (
                                                 <div key={index} className="flex items-center gap-2">
                                                   <Checkbox 
                                                     id={`topping-${food.food_id}-${index}`}
                                                     disabled 
                                                     checked={false}
                                                     className="h-3.5 w-3.5"
                                                   />
                                                   <label 
                                                     htmlFor={`topping-${food.food_id}-${index}`}
                                                     className="text-xs text-muted-foreground cursor-default"
                                                   >
                                                     {topping.trim()}
                                                   </label>
                                                 </div>
                                               ))}
                                             </div>
                                           </div>
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
                                                  onSelect={(date) => {
                                                    if (date) {
                                                      // Create a date with Thailand timezone to prevent 1-day rollback
                                                      const thailandDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                                                      field.onChange(thailandDate);
                                                    } else {
                                                      field.onChange(date);
                                                    }
                                                  }}
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
                          <PlanList filterState="waiting" restaurants={restaurants} refreshRef={waitingPlansRefreshRef} admin={admin} />
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
                          <PlanList filterState="published" restaurants={restaurants} refreshRef={publishedPlansRefreshRef} admin={admin} />
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
                          <PlanList filterState="finished" restaurants={restaurants} refreshRef={finishedPlansRefreshRef} admin={admin} />
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