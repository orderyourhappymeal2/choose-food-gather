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
import { ChefHat, Store, FileText, Clock, CheckCircle, Plus, FilePlus, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, UtensilsCrossed, Upload, X, Edit, Eye, Trash2, Calendar as CalendarIcon } from "lucide-react";
import NavigationDropdown from "@/components/NavigationDropdown";
import { PlanList } from "@/components/PlanList";
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

  const handlePlanSubmit = async (data: PlanFormData) => {
    setIsPlanSubmitting(true);
    try {
      const planTime = `${data.plan_time_start} - ${data.plan_time_end}`;
      
      const { error } = await supabase.from('plan').insert({
        plan_name: data.plan_name,
        plan_location: data.plan_location,
        plan_date: data.plan_date.toISOString().split('T')[0],
        plan_time: planTime,
        plan_pwd: data.plan_pwd,
        plan_maxp: parseInt(data.plan_maxp),
        plan_editor: data.plan_editor,
      });

      if (error) throw error;

      toast.success('เพิ่มใบสั่งอาหารสำเร็จ');
      planForm.reset();
      setIsOrderModalOpen(false);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มใบสั่งอาหาร');
    } finally {
      setIsPlanSubmitting(false);
    }
  };

  // Restaurant functions
  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('shop')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลร้านอาหาร');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `shop/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shop')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('shop')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shop_name || !formData.open_day || !formData.open_time || !formData.food_type_1) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const { error } = await supabase.from('shop').insert({
        shop_name: formData.shop_name,
        description: formData.description,
        open_day: formData.open_day,
        open_time: formData.open_time,
        food_type_1: formData.food_type_1,
        food_type_2: formData.food_type_2,
        url_pic: imageUrl,
      });

      if (error) throw error;

      toast.success('เพิ่มร้านอาหารสำเร็จ');
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
      setIsRestaurantModalOpen(false);
      fetchRestaurants();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มร้านอาหาร');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRestaurantExpanded = (shopId: string) => {
    setExpandedRestaurants(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }));
  };

  const handleSort = (type: 'progress' | 'completed') => {
    if (type === 'progress') {
      const nextOrder = progressSortOrder === 'none' ? 'asc' : progressSortOrder === 'asc' ? 'desc' : 'none';
      setProgressSortOrder(nextOrder);
    } else {
      const nextOrder = completedSortOrder === 'none' ? 'asc' : completedSortOrder === 'asc' ? 'desc' : 'none';
      setCompletedSortOrder(nextOrder);
    }
  };

  const getSortIcon = (sortOrder: 'none' | 'asc' | 'desc') => {
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortOrder === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-pink/10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ผู้ดูแลระบบ</h1>
            <p className="text-gray-600">จัดการร้านอาหาร ใบสั่งอาหาร และติดตามสถานะคำสั่งซื้อ</p>
          </div>
          <NavigationDropdown />
        </div>

        <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
          <CardContent className="p-6">
            <Tabs defaultValue="restaurants" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="restaurants" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  ร้านอาหาร
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ใบสั่งอาหาร
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  กำลังดำเนินการ
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  เสร็จสิ้น
                </TabsTrigger>
              </TabsList>

              <TabsContent value="restaurants" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-foreground">จัดการร้านอาหาร</h3>
                      <Dialog open={isRestaurantModalOpen} onOpenChange={setIsRestaurantModalOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มร้านอาหาร
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-foreground">เพิ่มร้านอาหารใหม่</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label htmlFor="shop_name">ชื่อร้าน *</Label>
                                <Input
                                  id="shop_name"
                                  value={formData.shop_name}
                                  onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                                  placeholder="กรอกชื่อร้านอาหาร"
                                  required
                                />
                              </div>

                              <div>
                                <Label htmlFor="description">รายละเอียด</Label>
                                <Textarea
                                  id="description"
                                  value={formData.description}
                                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                                  placeholder="รายละเอียดร้านอาหาร"
                                />
                              </div>

                              <div>
                                <Label htmlFor="open_day">วันที่เปิด *</Label>
                                <Input
                                  id="open_day"
                                  value={formData.open_day}
                                  onChange={(e) => setFormData({...formData, open_day: e.target.value})}
                                  placeholder="เช่น จันทร์-ศุกร์"
                                  required
                                />
                              </div>

                              <div>
                                <Label htmlFor="open_time">เวลาเปิด *</Label>
                                <Input
                                  id="open_time"
                                  value={formData.open_time}
                                  onChange={(e) => setFormData({...formData, open_time: e.target.value})}
                                  placeholder="เช่น 08:00-17:00"
                                  required
                                />
                              </div>

                              <div>
                                <Label htmlFor="food_type_1">ประเภทอาหารหลัก *</Label>
                                <Select value={formData.food_type_1} onValueChange={(value) => setFormData({...formData, food_type_1: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกประเภทอาหาร" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {foodTypes.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="food_type_2">ประเภทอาหารรอง</Label>
                                <Select value={formData.food_type_2} onValueChange={(value) => setFormData({...formData, food_type_2: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกประเภทอาหาร (ไม่บังคับ)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {foodTypes.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="image">รูปภาพร้าน</Label>
                                <Input
                                  id="image"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                />
                                {imagePreview && (
                                  <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="mt-2 w-full h-32 object-cover rounded"
                                  />
                                )}
                              </div>
                            </div>

                            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsRestaurantModalOpen(false)}
                                className="flex-1 sm:flex-none"
                              >
                                ยกเลิก
                              </Button>
                              <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <ScrollArea className="h-[600px] w-full">
                      <div className="space-y-4">
                        {isLoading ? (
                          <div className="text-center py-8">กำลังโหลด...</div>
                        ) : restaurants.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            ยังไม่มีร้านอาหารในระบบ
                          </div>
                        ) : (
                          restaurants.map((restaurant) => (
                            <Card key={restaurant.shop_id} className="bg-white/60 border border-brand-pink/10">
                              <CardContent className="p-4">
                                <Collapsible open={expandedRestaurants[restaurant.shop_id]} onOpenChange={() => toggleRestaurantExpanded(restaurant.shop_id)}>
                                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                      {restaurant.url_pic && (
                                        <img
                                          src={restaurant.url_pic}
                                          alt={restaurant.shop_name}
                                          className="w-12 h-12 rounded-lg object-cover"
                                        />
                                      )}
                                      <div className="text-left">
                                        <h4 className="font-semibold text-foreground">{restaurant.shop_name}</h4>
                                        <p className="text-sm text-muted-foreground">{restaurant.food_type_1}{restaurant.food_type_2 && `, ${restaurant.food_type_2}`}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      {expandedRestaurants[restaurant.shop_id] ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-brand-cream/10 rounded-lg">
                                      <div>
                                        <p className="text-sm font-medium">รายละเอียด:</p>
                                        <p className="text-sm text-muted-foreground">{restaurant.description || 'ไม่มีรายละเอียด'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">วันที่เปิด:</p>
                                        <p className="text-sm text-muted-foreground">{restaurant.open_day}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">เวลาเปิด:</p>
                                        <p className="text-sm text-muted-foreground">{restaurant.open_time}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">ประเภทอาหาร:</p>
                                        <p className="text-sm text-muted-foreground">
                                          {restaurant.food_type_1}{restaurant.food_type_2 && `, ${restaurant.food_type_2}`}
                                        </p>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-foreground">จัดการใบสั่งอาหาร</h3>
                      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-primary hover:bg-primary/90">
                            <FilePlus className="h-4 w-4 mr-2" />
                            เพิ่มใบสั่งอาหาร
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-brand-pink/20 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-foreground">เพิ่มใบสั่งอาหาร</DialogTitle>
                          </DialogHeader>
                          
                          <Form {...planForm}>
                            <form onSubmit={planForm.handleSubmit(handlePlanSubmit)} className="space-y-4">
                              <div className="space-y-4">
                                <FormField
                                  control={planForm.control}
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
                                  control={planForm.control}
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
                                  control={planForm.control}
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
                                    control={planForm.control}
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
                                    control={planForm.control}
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
                                  control={planForm.control}
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
                                  control={planForm.control}
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
                                  control={planForm.control}
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
                                  onClick={() => setIsOrderModalOpen(false)}
                                  className="flex-1 sm:flex-none"
                                >
                                  ยกเลิก
                                </Button>
                                <Button
                                  type="submit"
                                  onClick={planForm.handleSubmit(handlePlanSubmit)}
                                  className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                                  disabled={isPlanSubmitting}
                                >
                                  {isPlanSubmitting ? "กำลังบันทึก..." : "ยืนยัน"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-4">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-4">
                          <PlanList />
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
                      <Button
                        variant="outline"
                        onClick={() => handleSort('progress')}
                        className="flex items-center gap-2"
                      >
                        เรียงลำดับ
                        {getSortIcon(progressSortOrder)}
                      </Button>
                    </div>
                    <ScrollArea className="h-[500px] w-full">
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">งานเลี้ยงบริษัท ABC</h4>
                              <p className="text-sm text-gray-600">วันที่: 15 ก.ย. 2567 | เวลา: 12:00-14:00</p>
                              <p className="text-sm text-gray-600">สถานที่: ห้องประชุมใหญ่</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">กำลังดำเนินการ</span>
                              <p className="text-xs text-gray-500 mt-1">50 คน</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-foreground">รายการที่เสร็จสิ้น</h3>
                      <Button
                        variant="outline"
                        onClick={() => handleSort('completed')}
                        className="flex items-center gap-2"
                      >
                        เรียงลำดับ
                        {getSortIcon(completedSortOrder)}
                      </Button>
                    </div>
                    <ScrollArea className="h-[500px] w-full">
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">งานสัมมนาประจำปี</h4>
                              <p className="text-sm text-gray-600">วันที่: 10 ก.ย. 2567 | เวลา: 09:00-17:00</p>
                              <p className="text-sm text-gray-600">สถานที่: โรงแรม XYZ</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">เสร็จสิ้น</span>
                              <p className="text-xs text-gray-500 mt-1">100 คน</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;