
"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import type { ColumnDef, Row, SortingState, PaginationState, RowSelectionState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ArrowUpDown, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Loader2, MoreHorizontal, PlusCircle, Trash2, Save, X, AlertTriangle, Undo2, CalendarDays, Users, FileText, CheckCircle2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { MaintenancePlan, MaintenanceTask, taskTypes, type Equipment } from "@/lib/data"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AddMaintenancePlanDialog } from "@/components/add-maintenance-plan-dialog"
import { EditMaintenancePlanDialog } from "@/components/edit-maintenance-plan-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { AddTasksDialog } from "@/components/add-tasks-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { BulkScheduleDialog } from "@/components/bulk-schedule-dialog"
import { useMaintenancePlans, useCreateMaintenancePlan, useUpdateMaintenancePlan, useDeleteMaintenancePlan, maintenanceKeys } from "@/hooks/use-cached-maintenance"
import { useQueryClient } from "@tanstack/react-query"

export default function MaintenancePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()

  // ✅ Use cached hooks for data fetching, keep manual mutations for now
  const { data: plans = [], isLoading: isLoadingPlans, refetch: refetchPlans } = useMaintenancePlans()
  // TODO: Migrate to cached mutations later
  // const createMaintenancePlan = useCreateMaintenancePlan()
  // const updateMaintenancePlan = useUpdateMaintenancePlan()
  // const deleteMaintenancePlan = useDeleteMaintenancePlan()
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = React.useState(false)
  const [planSorting, setPlanSorting] = React.useState<SortingState>([])
  const [editingPlan, setEditingPlan] = React.useState<MaintenancePlan | null>(null)
  const [planToDelete, setPlanToDelete] = React.useState<MaintenancePlan | null>(null)
  const [isDeletingPlan, setIsDeletingPlan] = React.useState(false)
  const [planToApprove, setPlanToApprove] = React.useState<MaintenancePlan | null>(null)
  const [isApprovingPlan, setIsApprovingPlan] = React.useState(false);
  const [planPagination, setPlanPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // State for tasks
  const [activeTab, setActiveTab] = React.useState("plans");
  const [selectedPlan, setSelectedPlan] = React.useState<MaintenancePlan | null>(null);
  const [tasks, setTasks] = React.useState<MaintenanceTask[]>([]); // Original from DB
  const [draftTasks, setDraftTasks] = React.useState<MaintenanceTask[]>([]); // Working copy
  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false);
  const [isAddTasksDialogOpen, setIsAddTasksDialogOpen] = React.useState(false)
  const [taskPagination, setTaskPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [taskRowSelection, setTaskRowSelection] = React.useState<RowSelectionState>({});

  // State for inline editing
  const [editingTaskId, setEditingTaskId] = React.useState<number | null>(null);
  const [editingTaskData, setEditingTaskData] = React.useState<Partial<MaintenanceTask> | null>(null);
  
  // State for task deletion
  const [taskToDelete, setTaskToDelete] = React.useState<MaintenanceTask | null>(null);
  const [isDeletingTasks, setIsDeletingTasks] = React.useState(false); // Used for single/bulk deletion from DRAFT
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = React.useState(false);
  
  // State for bulk editing
  const [isBulkScheduleOpen, setIsBulkScheduleOpen] = React.useState(false);

  // State for global save/cancel
  const [isSavingAll, setIsSavingAll] = React.useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = React.useState(false);

  // State for completion status
  const [completionStatus, setCompletionStatus] = React.useState<Record<string, { historyId: number }>>({});
  const [isLoadingCompletion, setIsLoadingCompletion] = React.useState(false);
  const [isCompletingTask, setIsCompletingTask] = React.useState<string | null>(null);

  const getDraftCacheKey = React.useCallback((planId: number) => `maintenance_draft_${planId}`, []);

  const hasChanges = React.useMemo(() => {
    return JSON.stringify(tasks) !== JSON.stringify(draftTasks);
  }, [tasks, draftTasks]);

  // ✅ Remove manual fetchPlans - now handled by cached hook

  const fetchPlanDetails = React.useCallback(async (plan: MaintenancePlan) => {
    if (!supabase) return;
    setIsLoadingTasks(true);
    setCompletionStatus({}); // Reset on new plan select

    // 1. Fetch tasks
    const cacheKey = getDraftCacheKey(plan.id);
    const cachedDraft = localStorage.getItem(cacheKey);

    const { data, error } = await supabase
      .from('cong_viec_bao_tri')
      .select(`
        *, 
        thiet_bi(*),
        thang_1_hoan_thanh, thang_2_hoan_thanh, thang_3_hoan_thanh, thang_4_hoan_thanh,
        thang_5_hoan_thanh, thang_6_hoan_thanh, thang_7_hoan_thanh, thang_8_hoan_thanh,
        thang_9_hoan_thanh, thang_10_hoan_thanh, thang_11_hoan_thanh, thang_12_hoan_thanh,
        ngay_hoan_thanh_1, ngay_hoan_thanh_2, ngay_hoan_thanh_3, ngay_hoan_thanh_4,
        ngay_hoan_thanh_5, ngay_hoan_thanh_6, ngay_hoan_thanh_7, ngay_hoan_thanh_8,
        ngay_hoan_thanh_9, ngay_hoan_thanh_10, ngay_hoan_thanh_11, ngay_hoan_thanh_12
      `)
      .eq('ke_hoach_id', plan.id)
      .order('id', { ascending: true });

    if (error) {
      toast({ variant: "destructive", title: "Lỗi tải công việc", description: error.message });
      setTasks([]);
      setDraftTasks([]);
    } else {
      const dbTasks = data as MaintenanceTask[];
      setTasks(dbTasks);
      if (cachedDraft) {
        try {
          setDraftTasks(JSON.parse(cachedDraft));
          toast({ title: "Thông báo", description: "Đã tải lại bản nháp chưa lưu của bạn." });
        } catch (e) {
          setDraftTasks(dbTasks);
        }
      } else {
        setDraftTasks(dbTasks);
      }
    }
    setIsLoadingTasks(false);

    // 2. If plan is approved, fetch completion status
    if (plan.trang_thai === 'Đã duyệt') {
      setIsLoadingCompletion(true);
      const taskIds = data?.map(t => t.id) ?? [];
      
      if (taskIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from('lich_su_thiet_bi')
          .select('id, chi_tiet')
          .eq('loai_su_kien', plan.loai_cong_viec)
          .in('chi_tiet->>cong_viec_id', taskIds);

        if (historyError) {
          toast({ variant: "destructive", title: "Lỗi tải trạng thái hoàn thành", description: historyError.message });
        } else if (historyData) {
          const statusMap: Record<string, { historyId: number }> = {};
          historyData.forEach((item: any) => {
            if (item.chi_tiet && item.chi_tiet.cong_viec_id && item.chi_tiet.thang) {
              const key = `${item.chi_tiet.cong_viec_id}-${item.chi_tiet.thang}`;
              statusMap[key] = { historyId: item.id };
            }
          });
          setCompletionStatus(statusMap);
        }
      }
      setIsLoadingCompletion(false);
    }
  }, [toast, getDraftCacheKey]);
  
  React.useEffect(() => {
    if (selectedPlan && hasChanges) {
      const cacheKey = getDraftCacheKey(selectedPlan.id);
      localStorage.setItem(cacheKey, JSON.stringify(draftTasks));
    }
    if (selectedPlan && !hasChanges) {
       const cacheKey = getDraftCacheKey(selectedPlan.id);
       localStorage.removeItem(cacheKey);
    }
  }, [draftTasks, selectedPlan, hasChanges, getDraftCacheKey]);

  // ✅ Remove useEffect for fetchPlans - data loaded automatically by cached hook

  React.useEffect(() => {
    if (selectedPlan) {
      fetchPlanDetails(selectedPlan);
      setTaskRowSelection({});
    } else {
      setTasks([]);
      setDraftTasks([]);
    }
  }, [selectedPlan, fetchPlanDetails]);

  // Handle URL parameters for navigation from Dashboard
  React.useEffect(() => {
    const planIdParam = searchParams.get('planId')
    const tabParam = searchParams.get('tab')
    const actionParam = searchParams.get('action')
    
    // Handle quick action to create new plan
    if (actionParam === 'create') {
      setIsAddPlanDialogOpen(true)
      // Clear URL params after opening dialog
      window.history.replaceState({}, '', '/maintenance')
      return
    }
    
    if (planIdParam && plans.length > 0) {
      const planId = parseInt(planIdParam, 10)
      const targetPlan = plans.find(p => p.id === planId)
      
      if (targetPlan) {
        setSelectedPlan(targetPlan)
        if (tabParam === 'tasks') {
          setActiveTab('tasks')
        }
        // Clear URL params after processing
        window.history.replaceState({}, '', '/maintenance')
      }
    }
  }, [searchParams, plans])

  const handleStartEdit = React.useCallback((task: MaintenanceTask) => {
    setEditingTaskId(task.id);
    setEditingTaskData({ ...task });
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setEditingTaskId(null);
    setEditingTaskData(null);
  }, []);
  
  const handleTaskDataChange = React.useCallback((field: keyof MaintenanceTask, value: any) => {
    setEditingTaskData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleSaveTask = React.useCallback(() => {
    if (!editingTaskId || !editingTaskData) return;
    
    setDraftTasks(currentDrafts => 
        currentDrafts.map(task => 
            task.id === editingTaskId ? { ...task, ...editingTaskData } : task
        )
    );
    handleCancelEdit();
  }, [editingTaskId, editingTaskData, handleCancelEdit]);

  const handleApprovePlan = React.useCallback(async (planToApprove: MaintenancePlan) => {
    if (!supabase || !planToApprove) return;
    setIsApprovingPlan(true);

    const { error } = await supabase
      .from('ke_hoach_bao_tri')
      .update({ trang_thai: 'Đã duyệt', ngay_phe_duyet: new Date().toISOString() })
      .eq('id', planToApprove.id);

    if (error) {
      toast({ variant: "destructive", title: "Lỗi duyệt kế hoạch", description: error.message, });
    } else {
      toast({ title: "Thành công", description: "Kế hoạch đã được duyệt." });
      refetchPlans(); // ✅ Use cached hook refetch
      if (selectedPlan && selectedPlan.id === planToApprove.id) {
        const updatedPlan = { ...selectedPlan, trang_thai: 'Đã duyệt' as const, ngay_phe_duyet: new Date().toISOString() };
        setSelectedPlan(updatedPlan);
      }
    }
    setPlanToApprove(null);
    setIsApprovingPlan(false);
  }, [toast, refetchPlans, selectedPlan]); // ✅ Use refetchPlans


  const handleDeletePlan = React.useCallback(async () => {
    if (!planToDelete || !supabase) return;
    setIsDeletingPlan(true);

    const { error } = await supabase
      .from('ke_hoach_bao_tri')
      .delete()
      .eq('id', planToDelete.id);

    if (error) {
      toast({ variant: "destructive", title: "Lỗi xóa kế hoạch", description: error.message });
    } else {
      toast({ title: "Đã xóa", description: "Kế hoạch đã được xóa thành công." });
      localStorage.removeItem(getDraftCacheKey(planToDelete.id));
      refetchPlans(); // ✅ Use cached hook refetch
      if (selectedPlan && selectedPlan.id === planToDelete.id) {
        setSelectedPlan(null);
        setActiveTab("plans");
      }
    }

    setIsDeletingPlan(false);
    setPlanToDelete(null);
  }, [planToDelete, toast, refetchPlans, selectedPlan, getDraftCacheKey]); // ✅ Use refetchPlans

  const handleCancelAllChanges = React.useCallback(() => {
    setDraftTasks(tasks);
    if(selectedPlan) {
      localStorage.removeItem(getDraftCacheKey(selectedPlan.id));
    }
    setIsConfirmingCancel(false);
    toast({ title: "Đã hủy", description: "Mọi thay đổi chưa lưu đã được hủy bỏ." });
  }, [tasks, selectedPlan, getDraftCacheKey, toast]);

  const handleSelectPlan = React.useCallback((plan: MaintenancePlan) => {
    if (hasChanges && selectedPlan) {
        if (confirm(`Bạn có các thay đổi chưa lưu trong kế hoạch "${selectedPlan.ten_ke_hoach}". Bạn có muốn hủy các thay đổi và chuyển sang kế hoạch khác không?`)) {
            handleCancelAllChanges();
            setSelectedPlan(plan);
            setActiveTab("tasks");
        } else {
            setActiveTab("tasks");
            return;
        }
    } else {
    setSelectedPlan(plan);
    setActiveTab("tasks");
    }
  }, [hasChanges, selectedPlan, handleCancelAllChanges]);

  const getStatusVariant = (status: MaintenancePlan["trang_thai"]) => {
    switch (status) {
      case "Bản nháp":
        return "secondary"
      case "Đã duyệt":
        return "default"
      default:
        return "outline"
    }
  }

  // Mobile card rendering function
  const renderMobileCards = () => {
    if (isLoadingPlans) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="mobile-card-spacing">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (!planTable.getRowModel().rows?.length) {
      return (
        <Card className="mobile-card-spacing">
          <CardContent className="flex items-center justify-center h-24">
            <p className="text-muted-foreground text-center">Chưa có kế hoạch nào.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {planTable.getRowModel().rows.map((row) => {
          const plan = row.original;
          const canManage = user && (user.role === 'admin' || user.role === 'to_qltb');

          return (
            <Card
              key={plan.id}
              className="mobile-card-spacing cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectPlan(plan)}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-4 mobile-interactive">
                <div className="max-w-[calc(100%-40px)]">
                  <CardTitle className="heading-responsive-h4 font-bold leading-tight truncate">
                    {plan.ten_ke_hoach}
                  </CardTitle>
                  <CardDescription className="body-responsive-sm">
                    Năm {plan.nam} • {plan.khoa_phong || "Tổng thể"}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0 touch-target-sm">
                      <span className="sr-only">Mở menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleSelectPlan(plan)}>
                      Xem chi tiết công việc
                    </DropdownMenuItem>
                    {plan.trang_thai === 'Bản nháp' && (
                      <>
                        <DropdownMenuSeparator />
                        {canManage && (
                          <DropdownMenuItem onSelect={() => setPlanToApprove(plan)}>
                            <Check className="mr-2 h-4 w-4" />
                            Duyệt
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => setEditingPlan(plan)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setPlanToDelete(plan)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="body-responsive-sm space-y-3 mobile-interactive">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Loại công việc:</span>
                  <Badge variant="outline">{plan.loai_cong_viec}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge variant={getStatusVariant(plan.trang_thai)}>{plan.trang_thai}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ngày phê duyệt:</span>
                  <span className="text-right">
                    {plan.ngay_phe_duyet
                      ? format(parseISO(plan.ngay_phe_duyet), 'dd/MM/yyyy HH:mm', { locale: vi })
                      : <span className="text-muted-foreground italic">Chưa duyệt</span>
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    )
  }

  const existingEquipmentIdsInDraft = React.useMemo(() => draftTasks.map(task => task.thiet_bi_id).filter((id): id is number => id !== null), [draftTasks]);

  const handleAddTasksFromDialog = React.useCallback((newlySelectedEquipment: Equipment[]) => {
    if (!selectedPlan) return;
    
    let tempIdCounter = Math.min(-1, ...draftTasks.map(t => t.id).filter(id => id < 0), 0) - 1;

    const tasksToAdd: MaintenanceTask[] = newlySelectedEquipment.map((equipment) => {
        const newTask: MaintenanceTask = {
            id: tempIdCounter--,
            ke_hoach_id: selectedPlan.id,
            thiet_bi_id: equipment.id,
            loai_cong_viec: selectedPlan.loai_cong_viec,
            diem_hieu_chuan: null,
            don_vi_thuc_hien: null,
            thang_1: false, thang_2: false, thang_3: false, thang_4: false,
            thang_5: false, thang_6: false, thang_7: false, thang_8: false,
            thang_9: false, thang_10: false, thang_11: false, thang_12: false,
            ghi_chu: null,
            thiet_bi: {
                ma_thiet_bi: equipment.ma_thiet_bi,
                ten_thiet_bi: equipment.ten_thiet_bi,
                khoa_phong_quan_ly: equipment.khoa_phong_quan_ly,
            },
        };
        return newTask;
    });
    
    setDraftTasks(currentDrafts => [...currentDrafts, ...tasksToAdd]);
    setIsAddTasksDialogOpen(false);
    toast({
        title: "Đã thêm vào bản nháp",
        description: `Đã thêm ${newlySelectedEquipment.length} thiết bị. Nhấn "Lưu thay đổi" để xác nhận.`
    });
  }, [selectedPlan, draftTasks, toast]);

  const confirmDeleteSingleTask = React.useCallback(() => {
    if (!taskToDelete) return;
    setIsDeletingTasks(true);
    setDraftTasks(currentDrafts => currentDrafts.filter(task => task.id !== taskToDelete.id));
    setTaskToDelete(null);
    setIsDeletingTasks(false);
    toast({ title: "Đã xóa khỏi bản nháp" });
  }, [taskToDelete, toast]);

  const planColumns: ColumnDef<MaintenancePlan>[] = React.useMemo(() => [
    {
      accessorKey: "ten_ke_hoach",
      header: "Tên kế hoạch",
      cell: ({ row }) => <div className="font-medium">{row.getValue("ten_ke_hoach")}</div>,
    },
    {
      accessorKey: "nam",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Năm
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-center">{row.getValue("nam")}</div>
    },
    {
      accessorKey: "khoa_phong",
      header: "Khoa/Phòng",
      cell: ({ row }) => row.getValue("khoa_phong") || <span className="text-muted-foreground italic">Tổng thể</span>,
    },
    {
      accessorKey: "loai_cong_viec",
      header: "Loại CV",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("loai_cong_viec")}</Badge>,
    },
    {
      accessorKey: "trang_thai",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("trang_thai") as MaintenancePlan["trang_thai"]
        return <Badge variant={getStatusVariant(status)}>{status}</Badge>
      },
    },
    {
      accessorKey: "ngay_phe_duyet",
      header: "Ngày phê duyệt",
      cell: ({ row }) => {
        const date = row.getValue("ngay_phe_duyet") as string | null
        return date ? format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: vi }) : <span className="text-muted-foreground italic">Chưa duyệt</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const plan = row.original
        const canManage = user && (user.role === 'admin' || user.role === 'to_qltb');
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => handleSelectPlan(plan)}>
                Xem chi tiết công việc
              </DropdownMenuItem>
              {plan.trang_thai === 'Bản nháp' && (
                <>
                  <DropdownMenuSeparator />
                  {canManage && (
                    <DropdownMenuItem onSelect={() => setPlanToApprove(plan)}>
                      <Check className="mr-2 h-4 w-4" />
                      Duyệt
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => setEditingPlan(plan)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setPlanToDelete(plan)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xoá
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [user, handleSelectPlan, setEditingPlan, setPlanToDelete, setPlanToApprove]);

  const planTable = useReactTable({
    data: plans,
    columns: planColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setPlanSorting,
    onPaginationChange: setPlanPagination,
    state: {
      sorting: planSorting,
      pagination: planPagination,
    },
  })

  const isPlanApproved = selectedPlan?.trang_thai === 'Đã duyệt';
  const canCompleteTask = user && (user.role === 'admin' || user.role === 'to_qltb');
  
  const handleMarkAsCompleted = React.useCallback(async (task: MaintenanceTask, month: number) => {
      console.log('handleMarkAsCompleted called:', { taskId: task.id, month, canCompleteTask, user: user?.role });
      
      if (!supabase || !selectedPlan || !user || !canCompleteTask) {
          console.log('Permission denied:', { supabase: !!supabase, selectedPlan: !!selectedPlan, user: !!user, canCompleteTask });
          toast({
              variant: "destructive",
              title: "Không có quyền",
              description: "Bạn không có quyền thực hiện hành động này."
          });
          return;
      }

      const completionKey = `${task.id}-${month}`;
      if (completionStatus[completionKey] || isCompletingTask) return;

      setIsCompletingTask(completionKey);

      try {
          const completionDate = new Date().toISOString();
          
          // 1. Cập nhật trạng thái hoàn thành trong bảng cong_viec_bao_tri
          const completionFieldName = `thang_${month}_hoan_thanh`;
          const completionDateFieldName = `ngay_hoan_thanh_${month}`;
          
          const { error: taskUpdateError } = await supabase
              .from('cong_viec_bao_tri')
              .update({
                  [completionFieldName]: true,
                  [completionDateFieldName]: completionDate,
                  updated_at: completionDate
              })
              .eq('id', task.id);

          if (taskUpdateError) throw taskUpdateError;

          // 2. Ghi vào lịch sử thiết bị
          const { data: historyData, error: historyError } = await supabase
              .from('lich_su_thiet_bi')
              .insert({
                  thiet_bi_id: task.thiet_bi_id,
                  loai_su_kien: selectedPlan.loai_cong_viec,
                  mo_ta: `Hoàn thành ${selectedPlan.loai_cong_viec} tháng ${month}/${selectedPlan.nam} theo kế hoạch "${selectedPlan.ten_ke_hoach}"`,
                  chi_tiet: {
                      cong_viec_id: task.id,
                      thang: month,
                      ten_ke_hoach: selectedPlan.ten_ke_hoach,
                      khoa_phong: selectedPlan.khoa_phong,
                      nam: selectedPlan.nam,
                  },
                  ngay_thuc_hien: completionDate,
              })
              .select('id')
              .single();

          if (historyError) throw historyError;
          
          toast({
              title: "Ghi nhận thành công",
              description: `Đã ghi nhận hoàn thành ${selectedPlan.loai_cong_viec} cho thiết bị tháng ${month}.`,
          });

          setCompletionStatus(prev => ({
              ...prev,
              [completionKey]: { historyId: historyData.id },
          }));

          // Refresh tasks data to reflect the completion status
          if (selectedPlan) {
            await fetchPlanDetails(selectedPlan);
          }

      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Lỗi",
              description: "Không thể ghi nhận hoàn thành. " + error.message,
          });
      } finally {
          setIsCompletingTask(null);
      }
  }, [selectedPlan, user, canCompleteTask, completionStatus, isCompletingTask, toast, fetchPlanDetails]);


  const taskColumns: ColumnDef<MaintenanceTask>[] = React.useMemo(() => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                disabled={isPlanApproved || !!editingTaskId}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                disabled={isPlanApproved || !!editingTaskId}
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
    {
        id: 'stt',
        header: 'STT',
        cell: ({ row, table }) => {
            const { pageIndex, pageSize } = table.getState().pagination;
            return pageIndex * pageSize + row.index + 1;
        },
        size: 50,
    },
    {
        accessorKey: 'thiet_bi.ma_thiet_bi',
        header: 'Mã TB',
        cell: ({ row }) => row.original.thiet_bi?.ma_thiet_bi || '',
        size: 120,
    },
    {
        accessorKey: 'thiet_bi.ten_thiet_bi',
        header: 'Tên thiết bị',
        cell: ({ row }) => row.original.thiet_bi?.ten_thiet_bi || '',
        size: 250,
    },
    {
        accessorKey: 'loai_cong_viec',
        header: 'Loại CV',
        cell: ({ row }) => <Badge variant="outline">{row.getValue("loai_cong_viec")}</Badge>,
        size: 140,
    },
    ...Array.from({ length: 12 }, (_, i) => i + 1).map((month) => ({
        id: `thang_${month}`,
        header: () => <div className="text-center">{month}</div>,
        cell: ({ row, table }: { row: Row<MaintenanceTask>, table: any }) => {
            const meta = table.options.meta as any;
            const { 
              editingTaskId, editingTaskData, handleTaskDataChange, 
              isPlanApproved, completionStatus, isLoadingCompletion,
              handleMarkAsCompleted, isCompletingTask, canCompleteTask,
            } = meta;
            const fieldName = `thang_${month}` as keyof MaintenanceTask;
            
            if (isPlanApproved) {
              const isScheduled = !!row.original[fieldName];
              if (!isScheduled) return null;

              if (isLoadingCompletion) return <Skeleton className="h-4 w-4 mx-auto" />;

              // Check completion status from actual database field
              const completionFieldName = `thang_${month}_hoan_thanh` as keyof MaintenanceTask;
              const isCompletedFromDB = !!row.original[completionFieldName];
              
              // Debug logging
              if (month === 5 || month === 12) { // Only log for specific months to avoid spam
                console.log(`Row ${row.index + 1}, Month ${month}:`, {
                  taskId: row.original.id,
                  isScheduled,
                  completionFieldName,
                  isCompletedFromDB,
                  rawValue: row.original[completionFieldName],
                  canCompleteTask,
                  rowData: row.original
                });
              }
              
              const completionKey = `${row.original.id}-${month}`;
              const isUpdating = isCompletingTask === completionKey;

              if (isUpdating) {
                  return (
                      <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                  );
              }

              if (isCompletedFromDB) {
                  const completionDateField = `ngay_hoan_thanh_${month}` as keyof MaintenanceTask;
                  const completionDate = row.original[completionDateField] as string;
                  const formattedDate = completionDate ? new Date(completionDate).toLocaleDateString('vi-VN') : '';
                  
                  return (
                      <div className="flex justify-center items-center h-full">
                                                <div title={`Đã hoàn thành${formattedDate ? ` ngày ${formattedDate}` : ''}`}>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      </div>
                  );
              }
              
              // Interactive checkbox for scheduled but not completed tasks
              return (
                  <div className="flex justify-center items-center h-full">
                      <Checkbox
                          onCheckedChange={(checked) => {
                              if (checked) {
                                  handleMarkAsCompleted(row.original, month);
                              }
                          }}
                          disabled={!canCompleteTask}
                          title={canCompleteTask ? "Nhấp để ghi nhận hoàn thành" : "Bạn không có quyền thực hiện"}
                      />
                  </div>
              );
            }
            
            // Draft mode logic
            const isEditing = editingTaskId === row.original.id;
            const isChecked = isEditing ? editingTaskData?.[fieldName] : row.original[fieldName];
            return (
                <div className="flex justify-center items-center h-full">
                  <Checkbox 
                      key={`checkbox-${row.original.id}-${fieldName}`}
                      checked={!!isChecked}
                      onCheckedChange={(value) => isEditing && handleTaskDataChange(fieldName, !!value)}
                      disabled={!isEditing}
                  />
                </div>
            );
        },
        size: 40,
    })),
    {
        accessorKey: 'don_vi_thuc_hien',
        header: 'Đơn vị TH',
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const { editingTaskId, editingTaskData, handleTaskDataChange } = meta;
            const isEditing = editingTaskId === row.original.id;
            return isEditing ? (
                <Select
                    key={`select-don-vi-${row.original.id}`}
                    value={editingTaskData?.don_vi_thuc_hien || ""}
                    onValueChange={(value) => handleTaskDataChange('don_vi_thuc_hien', value === 'none' ? null : value)}
                >
                    <SelectTrigger className="h-8">
                        <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Nội bộ">Nội bộ</SelectItem>
                        <SelectItem value="Thuê ngoài">Thuê ngoài</SelectItem>
                        <SelectItem value="none">Xóa</SelectItem>
                    </SelectContent>
                </Select>
            ) : (
                row.original.don_vi_thuc_hien
            )
        },
        size: 150,
    },
    {
        accessorKey: 'ghi_chu',
        header: 'Ghi chú',
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const { editingTaskId, editingTaskData, handleTaskDataChange } = meta;
            const isEditing = editingTaskId === row.original.id;
            return isEditing ? (
                 <Input
                    key={`input-ghi-chu-${row.original.id}`}
                    value={editingTaskData?.ghi_chu || ""}
                    onChange={(e) => handleTaskDataChange('ghi_chu', e.target.value)}
                    className="h-8"
                />
            ) : (
                row.original.ghi_chu
            )
        },
        size: 200,
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const { editingTaskId, handleSaveTask, handleCancelEdit, handleStartEdit, isPlanApproved, setTaskToDelete } = meta;
            const task = row.original;
            const isEditing = editingTaskId === task.id;

            if (isPlanApproved) return null;

            if (isEditing) {
                return (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={handleSaveTask}>
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )
            }

            return (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(task)} disabled={!!editingTaskId}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setTaskToDelete(task)} disabled={!!editingTaskId}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
        size: 100,
    }
  ], [isPlanApproved, canCompleteTask, editingTaskId, editingTaskData, handleCancelEdit, handleSaveTask, handleStartEdit, handleMarkAsCompleted, completionStatus, isLoadingCompletion, isCompletingTask]);

  const handleSaveAllChanges = React.useCallback(async () => {
    if (!supabase || !selectedPlan || !hasChanges) return;
    setIsSavingAll(true);

    // 1. Find tasks to insert (new tasks with negative IDs)
    const tasksToInsert = draftTasks
      .filter(t => t.id < 0)
      .map(task => {
        const { id, thiet_bi, ...dbData } = task; // remove temp id and nested thiet_bi
        return dbData;
      });

    // 2. Find tasks to update (existing tasks that might have changed)
    const tasksToUpdate = draftTasks
      .filter(t => t.id > 0 && tasks.find(original => original.id === t.id && JSON.stringify(original) !== JSON.stringify(t)))
      .map(task => {
        const { thiet_bi, ...dbData } = task;
        return dbData;
      });

    // 3. Find tasks to delete (tasks in original list but not in draft)
    const draftTaskIds = new Set(draftTasks.map(t => t.id));
    const idsToDelete = tasks
      .map(t => t.id)
      .filter(id => !draftTaskIds.has(id));

    let hasError = false;

    // Perform operations
    if (tasksToInsert.length > 0) {
      const { error: insertError } = await supabase.from('cong_viec_bao_tri').insert(tasksToInsert);
      if (insertError) {
        toast({ variant: "destructive", title: "Lỗi thêm công việc mới", description: insertError.message, duration: 10000 });
        hasError = true;
      }
    }
    
    if (tasksToUpdate.length > 0 && !hasError) {
      for (const taskToUpdate of tasksToUpdate) {
        const { error: updateError } = await supabase.from('cong_viec_bao_tri').update(taskToUpdate).eq('id', taskToUpdate.id);
      if (updateError) {
            toast({ variant: "destructive", title: `Lỗi cập nhật công việc ID ${taskToUpdate.id}`, description: updateError.message, duration: 10000 });
        hasError = true;
            break;
        }
      }
    }

    if (idsToDelete.length > 0 && !hasError) {
       const { error: deleteError } = await supabase.from('cong_viec_bao_tri').delete().in('id', idsToDelete);
       if (deleteError) {
          toast({ variant: "destructive", title: "Lỗi xóa công việc cũ", description: deleteError.message, duration: 10000 });
          hasError = true;
       }
    }

    if (!hasError) {
        toast({ title: "Thành công", description: "Đã lưu tất cả thay đổi vào cơ sở dữ liệu." });
        localStorage.removeItem(getDraftCacheKey(selectedPlan.id));
        await fetchPlanDetails(selectedPlan);
    }
    
    setIsSavingAll(false);
  }, [supabase, selectedPlan, hasChanges, draftTasks, tasks, toast, getDraftCacheKey, fetchPlanDetails]);

  const handleGeneratePlanForm = React.useCallback(() => {
    if (!selectedPlan || tasks.length === 0) {
      toast({
        variant: "destructive",
        title: "Không có dữ liệu",
        description: "Vui lòng đảm bảo kế hoạch đã có thiết bị và đã được lưu vào database."
      });
      return;
    }

    const formatValue = (value: any) => value ?? "";
    
    // Generate table rows from saved tasks
    const generateTableRows = () => {
      return tasks.map((task, index) => {
        const checkboxes = Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
          const fieldName = `thang_${month}` as keyof MaintenanceTask;
          const isChecked = task[fieldName] ? 'checked' : '';
          return `<td><input type="checkbox" ${isChecked}></td>`;
        }).join('');
        
        const noiBoChecked = task.don_vi_thuc_hien === 'Nội bộ' ? 'checked' : '';
        const thueNgoaiChecked = task.don_vi_thuc_hien === 'Thuê ngoài' ? 'checked' : '';
        
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${formatValue(task.thiet_bi?.ma_thiet_bi)}</td>
            <td>${formatValue(task.thiet_bi?.ten_thiet_bi)}</td>
            <td>${formatValue(task.thiet_bi?.khoa_phong_quan_ly)}</td>
            <td><input type="checkbox" ${noiBoChecked}></td>
            <td><input type="checkbox" ${thueNgoaiChecked}></td>
            ${checkboxes}
            <td><input type="text" value="${formatValue(task.diem_hieu_chuan)}"></td>
          </tr>
        `;
      }).join('');
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kế Hoạch ${selectedPlan.loai_cong_viec} Thiết Bị - ${selectedPlan.ten_ke_hoach}</title>
    <!-- Import Tailwind CSS for styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            color: #000;
            background-color: #e5e7eb;
            line-height: 1.4;
        }
        .a4-landscape-page {
            width: 29.7cm;
            min-height: 21cm;
            padding: 1cm; /* Lề 1cm cho tất cả các cạnh */
            margin: 1cm auto;
            background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .content-body {
            flex-grow: 1; /* Cho phép khối nội dung chính giãn ra */
        }
        .form-input-line {
            font-family: inherit;
            font-size: inherit;
            border: none;
            border-bottom: 1px dotted #000;
            background-color: transparent;
            padding: 1px;
            outline: none;
            text-align: center;
        }
        h1, h2, .font-bold {
            font-weight: 700;
        }
        .title-main { font-size: 18px; }
        .title-sub { font-size: 16px; }

        /* Table styles */
        .data-table, .data-table th, .data-table td {
            border: 1px solid #000;
            border-collapse: collapse;
        }
        .data-table th, .data-table td {
            padding: 4px;
            text-align: center;
            vertical-align: middle;
        }
        .data-table tbody tr {
             height: 35px; /* Chiều cao cho các dòng dữ liệu */
        }
        .data-table input[type="text"] {
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            background-color: transparent;
            text-align: center;
        }

        /* Signature styles */
        .signature-area {
            text-align: center;
        }
        .signature-space {
            height: 60px; /* Không gian để ký tay */
        }

        /* CSS for printing */
        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background-color: #fff !important;
            }
            .a4-landscape-page {
                width: 100%;
                height: 100%;
                margin: 0 !important;
                padding: 1cm !important;
                box-shadow: none !important;
                border: none !important;
            }
             body > *:not(.a4-landscape-page) {
                display: none;
            }
            /* Lặp lại tiêu đề bảng trên mỗi trang */
            .data-table thead {
                display: table-header-group;
            }
            /* Ngăn các mục bị vỡ qua trang */
            .data-table tr, .signature-area {
                page-break-inside: avoid;
            }
            /* Cố định footer ở cuối mỗi trang in */
            .print-footer {
                position: fixed;
                bottom: 1cm;
                left: 1cm;
                right: 1cm;
                width: calc(100% - 2cm);
            }
             .content-body {
                padding-bottom: 30px; /* Khoảng đệm cho footer */
            }
        }
    </style>
</head>
<body>

    <div class="a4-landscape-page">
        <div class="content-body">
            <!-- Header -->
            <header>
                 <div class="flex justify-between items-start">
                    <div class="text-center w-1/4">
                        <img src="https://i.postimg.cc/W1ym4T74/cdc-logo-150.png" alt="Logo CDC" class="w-16" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e2e8f0/e2e8f0?text=Logo';">
                    </div>
                    <div class="text-center w-1/2">
                         <h2 class="title-sub uppercase font-bold">TRUNG TÂM KIỂM SOÁT BỆNH TẬT THÀNH PHỐ CẦN THƠ</h2>
                         <div class="flex items-baseline justify-center font-bold">
                            <label for="department-name">KHOA/PHÒNG:</label>
                            <input type="text" id="department-name" class="form-input-line flex-grow ml-2" value="${formatValue(selectedPlan.khoa_phong)}">
                         </div>
                    </div>
                    <div class="w-1/4"></div> <!-- Spacer -->
                </div>
                 <div class="text-center mt-4">
                     <h1 class="title-main uppercase font-bold flex justify-center items-baseline">
                        KẾ HOẠCH ${selectedPlan.loai_cong_viec.toUpperCase()} THIẾT BỊ NĂM
                        <input type="text" class="form-input-line w-24 ml-2" value="${selectedPlan.nam}">
                    </h1>
                </div>
            </header>

            <!-- Main Table -->
            <section class="mt-4">
                <table class="w-full data-table">
                    <thead class="font-bold">
                        <tr>
                            <th rowspan="2" class="w-[3%]">TT</th>
                            <th rowspan="2" class="w-[8%]">Mã TB</th>
                            <th rowspan="2" class="w-[15%]">Tên TB</th>
                            <th rowspan="2" class="w-[12%]">Khoa/Phòng sử dụng</th>
                            <th colspan="2">Đơn vị thực hiện</th>
                            <th colspan="12">Thời gian dự kiến ${selectedPlan.loai_cong_viec.toLowerCase()} (tháng)</th>
                            <th rowspan="2" class="w-[8%]">Điểm ${selectedPlan.loai_cong_viec.toLowerCase()}</th>
                        </tr>
                        <tr>
                            <th class="w-[5%]">Nội bộ</th>
                            <th class="w-[5%]">Thuê ngoài</th>
                            <th class="w-[2.5%]">1</th>
                            <th class="w-[2.5%]">2</th>
                            <th class="w-[2.5%]">3</th>
                            <th class="w-[2.5%]">4</th>
                            <th class="w-[2.5%]">5</th>
                            <th class="w-[2.5%]">6</th>
                            <th class="w-[2.5%]">7</th>
                            <th class="w-[2.5%]">8</th>
                            <th class="w-[2.5%]">9</th>
                            <th class="w-[2.5%]">10</th>
                            <th class="w-[2.5%]">11</th>
                            <th class="w-[2.5%]">12</th>
                        </tr>
                    </thead>
                    <tbody id="plan-table-body">
                        ${generateTableRows()}
                    </tbody>
                </table>
            </section>

             <!-- Signature section -->
            <section class="mt-4">
                 <div class="flex justify-between">
                    <div class="signature-area w-1/3">
                        <p class="font-bold">Lãnh đạo Khoa/Phòng</p>
                        <div class="signature-space"></div>
                    </div>
                     <div class="w-1/3"></div> <!-- Spacer -->
                    <div class="signature-area w-1/3">
                         <p class="italic mb-2">
                            Cần Thơ, ngày <input type="text" class="form-input-line w-12" value="${new Date().getDate()}">
                            tháng <input type="text" class="form-input-line w-12" value="${new Date().getMonth() + 1}">
                            năm <input type="text" class="form-input-line w-20" value="${new Date().getFullYear()}">
                        </p>
                         <p class="font-bold">Người lập</p>
                         <div class="signature-space"></div>
                         <input type="text" class="form-input-line" value="${formatValue(user?.full_name)}" style="border-bottom: none; text-align: center; font-weight: bold;">
                     </div>
                </div>
            </section>
        </div>

        <!-- Footer -->
        <footer class="print-footer flex justify-between items-center text-xs">
            <span>QLTB-BM.09</span>
            <span>BH.01 (05/2024)</span>
            <span>Trang: 1/1</span>
        </footer>

    </div>

</body>
</html>
    `;
    
    const newWindow = window.open("", "_blank");
    if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    }
  }, [selectedPlan, tasks, toast, user]);

  const taskTable = useReactTable({
    data: draftTasks,
    columns: taskColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setTaskPagination,
    onRowSelectionChange: setTaskRowSelection,
    state: {
      pagination: taskPagination,
      rowSelection: taskRowSelection,
    },
    meta: {
        editingTaskId,
        editingTaskData,
        isPlanApproved,
        setTaskToDelete,
        handleTaskDataChange,
        handleSaveTask,
        handleCancelEdit,
        handleStartEdit,
        completionStatus,
        isLoadingCompletion,
        handleMarkAsCompleted,
        isCompletingTask,
        canCompleteTask,
    }
  });

  const handleBulkScheduleApply = React.useCallback((months: Record<string, boolean>) => {
    const selectedIds = new Set(taskTable.getFilteredSelectedRowModel().rows.map(row => row.original.id));
    setDraftTasks(currentDrafts =>
        currentDrafts.map(task =>
            selectedIds.has(task.id) ? { ...task, ...months } : task
        )
    );
    setIsBulkScheduleOpen(false);
    toast({ title: "Đã áp dụng lịch", description: "Lịch trình đã được cập nhật vào bản nháp." });
  }, [taskTable, toast]);

  const handleBulkAssignUnit = React.useCallback((unit: string | null) => {
    const selectedIds = new Set(taskTable.getFilteredSelectedRowModel().rows.map(row => row.original.id));
    setDraftTasks(currentDrafts =>
        currentDrafts.map(task =>
            selectedIds.has(task.id) ? { ...task, don_vi_thuc_hien: unit } : task
        )
    );
    toast({ title: "Đã gán đơn vị", description: `Đã cập nhật đơn vị thực hiện vào bản nháp.` });
  }, [taskTable, toast]);

  const confirmDeleteSelectedTasks = React.useCallback(() => {
    if (Object.keys(taskRowSelection).length === 0) return;
    setIsDeletingTasks(true);
    const tableModel = taskTable.getRowModel();
    const idsToDelete = Object.keys(taskRowSelection).map(idx => tableModel.rows[parseInt(idx, 10)].original.id);
    setDraftTasks(currentDrafts => currentDrafts.filter(task => !idsToDelete.includes(task.id)));
    setTaskRowSelection({});
    setIsConfirmingBulkDelete(false);
    setIsDeletingTasks(false);
    toast({ title: "Đã xóa khỏi bản nháp", description: `Đã xóa ${idsToDelete.length} công việc.` });
  }, [taskTable, taskRowSelection, toast]);

  const selectedTaskRowsCount = Object.keys(taskRowSelection).length;

  return (
    <>
      <AddMaintenancePlanDialog
        open={isAddPlanDialogOpen}
        onOpenChange={setIsAddPlanDialogOpen}
        onSuccess={refetchPlans} // ✅ Use cached hook refetch
      />
      <EditMaintenancePlanDialog
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        onSuccess={refetchPlans} // ✅ Use cached hook refetch
        plan={editingPlan}
      />
      {planToApprove && (
        <AlertDialog open={!!planToApprove} onOpenChange={(open) => !open && setPlanToApprove(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn duyệt kế hoạch này?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Sau khi duyệt, kế hoạch <strong>{planToApprove.ten_ke_hoach}</strong> sẽ bị khóa. Bạn sẽ không thể thêm, sửa, hoặc xóa công việc khỏi kế hoạch này nữa. Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isApprovingPlan}>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleApprovePlan(planToApprove)} disabled={isApprovingPlan}>
                        {isApprovingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận duyệt
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
      <BulkScheduleDialog
        open={isBulkScheduleOpen}
        onOpenChange={setIsBulkScheduleOpen}
        onApply={handleBulkScheduleApply}
      />
       {planToDelete && (
         <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Kế hoạch 
                    <strong> {planToDelete.ten_ke_hoach} </strong> 
                    sẽ bị xóa vĩnh viễn, bao gồm tất cả công việc liên quan. Mọi bản nháp chưa lưu cũng sẽ bị xóa.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingPlan}>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePlan} disabled={isDeletingPlan} className="bg-destructive hover:bg-destructive/90">
                    {isDeletingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Xóa
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
      {(taskToDelete || isConfirmingBulkDelete) && (
         <AlertDialog open={!!taskToDelete || isConfirmingBulkDelete} onOpenChange={(open) => {
             if (!open) {
                 setTaskToDelete(null);
                 setIsConfirmingBulkDelete(false);
             }
         }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                <AlertDialogDescription>
                    {taskToDelete ? `Hành động này sẽ xóa công việc của thiết bị "${taskToDelete.thiet_bi?.ten_thiet_bi}" khỏi bản nháp.` : `Hành động này sẽ xóa ${Object.keys(taskRowSelection).length} công việc đã chọn khỏi bản nháp.`}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingTasks}>Hủy</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={taskToDelete ? confirmDeleteSingleTask : confirmDeleteSelectedTasks} 
                        disabled={isDeletingTasks} 
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeletingTasks && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xóa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
      {isConfirmingCancel && (
        <AlertDialog open={isConfirmingCancel} onOpenChange={setIsConfirmingCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hủy bỏ mọi thay đổi?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này sẽ loại bỏ tất cả các thay đổi bạn đã thực hiện trong bản nháp này và khôi phục lại dữ liệu gốc.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Ở lại</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelAllChanges}>Xác nhận hủy</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
      <AddTasksDialog
        open={isAddTasksDialogOpen}
        onOpenChange={setIsAddTasksDialogOpen}
        plan={selectedPlan}
        existingEquipmentIds={existingEquipmentIdsInDraft}
        onSuccess={handleAddTasksFromDialog}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="plans">Lập Kế hoạch</TabsTrigger>
            <TabsTrigger value="tasks" disabled={!selectedPlan}>Danh sách TB trong Kế hoạch</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="plans" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Danh sách Kế hoạch</CardTitle>
                <CardDescription>
                  Quản lý các kế hoạch bảo trì, hiệu chuẩn, kiểm định. Nhấp vào một hàng để xem chi tiết.
                </CardDescription>
              </div>
              <Button size="sm" className="h-8 gap-1 ml-auto" onClick={() => setIsAddPlanDialogOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Tạo kế hoạch mới
                </span>
              </Button>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                renderMobileCards()
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {planTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {isLoadingPlans ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={planColumns.length}>
                              <Skeleton className="h-8 w-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : planTable.getRowModel().rows?.length ? (
                        planTable.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => handleSelectPlan(row.original)}
                            className="cursor-pointer"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={planColumns.length} className="h-24 text-center">
                            Chưa có kế hoạch nào.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
               <div className="flex items-center justify-between w-full">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {planTable.getFilteredRowModel().rows.length} trên {plans.length} kế hoạch.
                  </div>
                  <div className="flex items-center gap-x-6 lg:gap-x-8">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Số dòng</p>
                      <Select
                        value={`${planTable.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                          planTable.setPageSize(Number(value))
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={planTable.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[10, 20, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Trang {planTable.getState().pagination.pageIndex + 1} /{" "}
                      {planTable.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => planTable.setPageIndex(0)}
                        disabled={!planTable.getCanPreviousPage()}
                      >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => planTable.previousPage()}
                        disabled={!planTable.getCanPreviousPage()}
                      >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => planTable.nextPage()}
                        disabled={!planTable.getCanNextPage()}
                      >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => planTable.setPageIndex(planTable.getPageCount() - 1)}
                        disabled={!planTable.getCanNextPage()}
                      >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle>Danh sách Thiết bị trong Kế hoạch: {selectedPlan?.ten_ke_hoach || '...'}</CardTitle>
                        <CardDescription className="mt-1">
                            {isPlanApproved 
                                ? 'Kế hoạch đã được duyệt. Nhấp vào các ô checkbox để ghi nhận hoàn thành công việc theo thực tế.'
                                : 'Chế độ nháp: Mọi thay đổi được lưu tạm thời. Nhấn "Lưu thay đổi" để cập nhật vào cơ sở dữ liệu hoặc "Hủy bỏ" để loại bỏ các thay đổi chưa lưu.'
                            }
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        {hasChanges && !isPlanApproved && (
                          <>
                            <Button variant="outline" onClick={() => setIsConfirmingCancel(true)} disabled={isSavingAll}>
                                <Undo2 className="mr-2 h-4 w-4" />
                                Hủy bỏ
                            </Button>
                            <Button onClick={handleSaveAllChanges} disabled={isSavingAll}>
                                {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Lưu thay đổi
                            </Button>
                          </>
                        )}
                        {tasks.length > 0 && (
                            <Button 
                                variant="secondary"
                                onClick={handleGeneratePlanForm}
                                disabled={!!editingTaskId || isSavingAll}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Xuất phiếu KH
                            </Button>
                        )}
                        {!isPlanApproved && (
                           <Button 
                                onClick={() => setIsAddTasksDialogOpen(true)}
                                disabled={!!editingTaskId || isSavingAll}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Thêm thiết bị
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingTasks ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {selectedTaskRowsCount > 0 && !isPlanApproved && (
                            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-md border">
                                <span className="text-sm font-medium">
                                    Đã chọn {selectedTaskRowsCount} mục:
                                </span>
                                <Button size="sm" variant="outline" onClick={() => setIsBulkScheduleOpen(true)}>
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Lên lịch hàng loạt
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Users className="mr-2 h-4 w-4" />
                                            Gán ĐVTH
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleBulkAssignUnit('Nội bộ')}>Nội bộ</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleBulkAssignUnit('Thuê ngoài')}>Thuê ngoài</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => handleBulkAssignUnit(null)}>Xóa đơn vị</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button size="sm" variant="destructive" className="ml-auto" onClick={() => setIsConfirmingBulkDelete(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa ({selectedTaskRowsCount})
                                </Button>
                            </div>
                        )}
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    {taskTable.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} style={{ minWidth: `${header.getSize()}px`, width: `${header.getSize()}px`}}>
                                            {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                                )}
                                        </TableHead>
                                        ))}
                                    </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {taskTable.getRowModel().rows?.length ? (
                                    taskTable.getRowModel().rows.map((row) => (
                                        <TableRow
                                        key={row.original.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className={editingTaskId === row.original.id ? "bg-muted/50" : ""}
                                        >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                        </TableRow>
                                    ))
                                    ) : (
                                    <TableRow>
                                        <TableCell colSpan={taskColumns.length} className="h-24 text-center">
                                        Chưa có công việc nào trong kế hoạch này.
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter>
                 <div className="flex items-center justify-between w-full">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Đã chọn {taskTable.getFilteredSelectedRowModel().rows.length} trên {draftTasks.length} công việc.
                    </div>
                     <div className="flex items-center gap-x-6 lg:gap-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Số dòng</p>
                            <Select
                                value={`${taskTable.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                taskTable.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={taskTable.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                {[10, 20, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Trang {taskTable.getState().pagination.pageIndex + 1} /{" "}
                            {taskTable.getPageCount()}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => taskTable.setPageIndex(0)}
                                disabled={!taskTable.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => taskTable.previousPage()}
                                disabled={!taskTable.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => taskTable.nextPage()}
                                disabled={!taskTable.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => taskTable.setPageIndex(taskTable.getPageCount() - 1)}
                                disabled={!taskTable.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
