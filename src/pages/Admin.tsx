import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ChefHat, Store, FileText, Clock, CheckCircle, Plus, FilePlus } from "lucide-react";
import NavigationDropdown from "@/components/NavigationDropdown";
import { useState } from "react";
const Admin = () => {
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  return <div className="min-h-screen bg-[var(--gradient-welcome)] p-4">
      <div className="max-w-6xl mx-auto pt-8 relative">
        {/* Navigation Dropdown */}
        <div className="absolute top-0 right-0 p-4 z-50">
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
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-pink/30">
          <CardContent className="p-2 md:p-8">
            <h2 className="text-3xl font-bold text-center text-foreground mb-6">ระบบจัดการ</h2>
            
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
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden mx-4">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              เพิ่มร้านอาหาร
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="flex-1 overflow-auto py-4">
                            <Card className="bg-white/60 border border-brand-pink/10">
                              <CardContent className="p-4">
                                {/* Content will be added here */}
                              </CardContent>
                            </Card>
                          </div>
                          
                          <DialogFooter className="gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsRestaurantModalOpen(false)}
                              className="flex-1 sm:flex-none"
                            >
                              ยกเลิก
                            </Button>
                            <Button 
                              variant="default" 
                              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                            >
                              ยืนยัน
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-foreground mb-2">รายการร้านอาหาร</h4>
                          <ScrollArea className="h-[300px] w-full">
                            <div className="space-y-2">
                              <div className="p-3 bg-gradient-to-r from-brand-cream/20 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">ร้านอาหารตัวอย่าง 1</div>
                                <div className="text-xs text-muted-foreground">ประเภท: อาหารไทย</div>
                              </div>
                              <div className="p-3 bg-gradient-to-r from-brand-cream/20 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">ร้านอาหารตัวอย่าง 2</div>
                                <div className="text-xs text-muted-foreground">ประเภท: อาหารจีน</div>
                              </div>
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
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
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden mx-4">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-center text-foreground">
                              เพิ่มใบสั่งอาหาร
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="flex-1 overflow-auto py-4">
                            <Card className="bg-white/60 border border-brand-pink/10">
                              <CardContent className="p-4">
                                {/* Content will be added here */}
                              </CardContent>
                            </Card>
                          </div>
                          
                          <DialogFooter className="gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsOrderModalOpen(false)}
                              className="flex-1 sm:flex-none"
                            >
                              ยกเลิก
                            </Button>
                            <Button 
                              variant="default" 
                              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                            >
                              ยืนยัน
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-foreground mb-2">รายการแบบร่าง</h4>
                          <ScrollArea className="h-[300px] w-full">
                            <div className="space-y-2">
                              <div className="p-3 bg-gradient-to-r from-brand-cream/20 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">แบบร่างใบจอง #001</div>
                                <div className="text-xs text-muted-foreground">วันที่สร้าง: 30/08/2025 | สถานะ: รอการอนุมัติ</div>
                              </div>
                              <div className="p-3 bg-gradient-to-r from-brand-cream/20 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">แบบร่างใบจอง #002</div>
                                <div className="text-xs text-muted-foreground">วันที่สร้าง: 29/08/2025 | สถานะ: รอการแก้ไข</div>
                              </div>
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <h3 className="text-xl font-semibold text-foreground mb-4">กำลังดำเนินการ</h3>
                    <div className="space-y-2">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-foreground mb-2">รายการที่กำลังดำเนินการ</h4>
                          <ScrollArea className="h-[300px] w-full">
                            <div className="space-y-2">
                              <div className="p-3 bg-gradient-to-r from-brand-yellow/20 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">ใบจอง #101</div>
                                <div className="text-xs text-muted-foreground">ร้าน: ร้านอาหารไทย | สถานะ: กำลังเตรียม</div>
                              </div>
                              <div className="p-3 bg-gradient-to-r from-brand-yellow/20 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">ใบจอง #102</div>
                                <div className="text-xs text-muted-foreground">ร้าน: ร้านอาหารจีน | สถานะ: กำลังปรุง</div>
                              </div>
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <Card className="bg-gradient-to-br from-white/80 to-brand-cream/20 border border-brand-pink/20">
                  <CardContent className="p-4">
                    <h3 className="text-xl font-semibold text-foreground mb-4">ดำเนินการเสร็จสิ้น</h3>
                    <div className="space-y-2">
                      <Card className="bg-white/60 border border-brand-pink/10">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-foreground mb-2">รายการที่ดำเนินการเสร็จสิ้น</h4>
                          <ScrollArea className="h-[300px] w-full">
                            <div className="space-y-2">
                              <div className="p-3 bg-gradient-to-r from-green-100/80 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">ใบจอง #099</div>
                                <div className="text-xs text-muted-foreground">ร้าน: ร้านอาหารไทย | สถานะ: เสร็จสิ้น | เวลา: 12:30</div>
                              </div>
                              <div className="p-3 bg-gradient-to-r from-green-100/80 to-transparent rounded-lg border border-brand-pink/10">
                                <div className="text-sm font-medium text-foreground">ใบจอง #098</div>
                                <div className="text-xs text-muted-foreground">ร้าน: ร้านอาหารจีน | สถานะ: เสร็จสิ้น | เวลา: 12:15</div>
                              </div>
                            </div>
                          </ScrollArea>
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