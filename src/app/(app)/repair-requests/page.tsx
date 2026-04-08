"use client"

import * as React from "react"
import type { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { supabase, supabaseError } from "@/lib/supabase"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { ArrowUpDown, Check, ChevronUp, FilterX, History, Loader2, PlusCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from 'date-fns/locale'
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useSearchDebounce } from "@/hooks/use-debounce"
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"
import { DataTablePagination } from "@/components/data-table-pagination"
import { RepairRequestAlert } from "@/components/repair-request-alert"
import { useRepairRealtimeSync } from "@/hooks/use-realtime-sync"
import { MobileFiltersDropdown } from "@/components/mobile-filters-dropdown"
import { RepairRequestFilterStatus } from "@/components/department-filter-status"
import { RepairRequestActionsMenu } from "./_components/repair-request-actions-menu"
import { RepairRequestCreateSheet } from "./_components/repair-request-create-sheet"
import { RepairDeadlineProgress } from "./_components/repair-deadline-progress"
import { RepairDesiredDateField } from "./_components/repair-desired-date-field"
import { RepairRequestDialogs } from "./_components/repair-request-dialogs"
import { RepairExecutionUnitFields } from "./_components/repair-execution-unit-fields"
import { openRepairRequestSheet } from "./_lib/repair-request-print"
import { getRepairRequestStatusVariant, requestStatuses } from "./constants"
import type {
  EquipmentSelectItem,
  RepairRequestWithEquipment,
} from "./types"

export default function RepairRequestsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  // Temporarily disable useRealtimeSync to avoid conflict with RealtimeProvider
  // useRepairRealtimeSync()
  const searchParams = useSearchParams()
  const [requests, setRequests] = React.useState<RepairRequestWithEquipment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [allEquipment, setAllEquipment] = React.useState<EquipmentSelectItem[]>([])

  // Form state
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedEquipment, setSelectedEquipment] = React.useState<EquipmentSelectItem | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [issueDescription, setIssueDescription] = React.useState("")
  const [repairItems, setRepairItems] = React.useState("")
  const [desiredDate, setDesiredDate] = React.useState<Date>()
  const [repairUnit, setRepairUnit] = React.useState<'noi_bo' | 'thue_ngoai'>('noi_bo')
  const [externalCompanyName, setExternalCompanyName] = React.useState("")

  // Edit/Delete state
  const [editingRequest, setEditingRequest] = React.useState<RepairRequestWithEquipment | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false);
  const [requestToDelete, setRequestToDelete] = React.useState<RepairRequestWithEquipment | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Detail dialog state
  const [requestToView, setRequestToView] = React.useState<RepairRequestWithEquipment | null>(null);

  // Edit form state
  const [editIssueDescription, setEditIssueDescription] = React.useState("");
  const [editRepairItems, setEditRepairItems] = React.useState("");
  const [editDesiredDate, setEditDesiredDate] = React.useState<Date | undefined>();
  const [editRepairUnit, setEditRepairUnit] = React.useState<'noi_bo' | 'thue_ngoai'>('noi_bo');
  const [editExternalCompanyName, setEditExternalCompanyName] = React.useState("");

  // Approval dialog state
  const [requestToApprove, setRequestToApprove] = React.useState<RepairRequestWithEquipment | null>(null);
  const [isApproving, setIsApproving] = React.useState(false);
  const [approvalRepairUnit, setApprovalRepairUnit] = React.useState<'noi_bo' | 'thue_ngoai'>('noi_bo');
  const [approvalExternalCompanyName, setApprovalExternalCompanyName] = React.useState("");

  // Completion dialog state
  const [requestToComplete, setRequestToComplete] = React.useState<RepairRequestWithEquipment | null>(null);
  const [completionType, setCompletionType] = React.useState<'Hoàn thành' | 'Không HT' | null>(null);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [completionResult, setCompletionResult] = React.useState("");
  const [nonCompletionReason, setNonCompletionReason] = React.useState("");

  // UI state
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "ngay_yeu_cau", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useSearchDebounce(searchTerm);

  const canSetRepairUnit = !!user && ['admin', 'to_qltb'].includes(user.role);

  React.useEffect(() => {
    if (editingRequest) {
      setEditIssueDescription(editingRequest.mo_ta_su_co);
      setEditRepairItems(editingRequest.hang_muc_sua_chua || "");
      setEditDesiredDate(
        editingRequest.ngay_mong_muon_hoan_thanh
          ? parseISO(editingRequest.ngay_mong_muon_hoan_thanh)
          : undefined
      );
      setEditRepairUnit(editingRequest.don_vi_thuc_hien || 'noi_bo');
      setEditExternalCompanyName(editingRequest.ten_don_vi_thue || "");
    }
  }, [editingRequest]);

  const CACHE_KEY = 'repair_requests_data';

  const fetchRequests = React.useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);

    // Phase 2: Department-based filtering for repair requests
    const shouldFilterByDepartment = user &&
      !['admin', 'to_qltb'].includes(user.role) &&
      user.khoa_phong;

    const cacheKey = shouldFilterByDepartment
      ? `${CACHE_KEY}_${user.khoa_phong}`
      : CACHE_KEY;

    try {
      const cachedItemJSON = localStorage.getItem(cacheKey);
      if (cachedItemJSON) {
        const cachedItem = JSON.parse(cachedItemJSON);
        setRequests(cachedItem.data as RepairRequestWithEquipment[]);
        setIsLoading(false);
        // No return here, will still fetch in background to update
      }
    } catch (e) {
      console.error("Error reading cache for repair requests, fetching from network.", e);
      localStorage.removeItem(cacheKey);
    }

    let query = supabase
      .from('yeu_cau_sua_chua')
      .select(`
            id,
            thiet_bi_id,
            ngay_yeu_cau,
            trang_thai,
            mo_ta_su_co,
            hang_muc_sua_chua,
            ngay_mong_muon_hoan_thanh,
            nguoi_yeu_cau,
            ngay_duyet,
            ngay_hoan_thanh,
            nguoi_duyet,
            nguoi_xac_nhan,
            don_vi_thuc_hien,
            ten_don_vi_thue,
            ket_qua_sua_chua,
            ly_do_khong_hoan_thanh,
            thiet_bi (
                ten_thiet_bi,
                ma_thiet_bi,
                model,
                serial,
                khoa_phong_quan_ly
            )
        `);

    // Phase 2: Apply department filter for repair requests
    if (shouldFilterByDepartment) {
      console.log(`[RepairRequests] Applying department filter: ${user.khoa_phong}`);
      query = query.eq('thiet_bi.khoa_phong_quan_ly', user.khoa_phong);
    }

    const { data, error } = await query.order('ngay_yeu_cau', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi tải danh sách yêu cầu",
        description: error.message,
      });
      if (!localStorage.getItem(cacheKey)) {
        setRequests([]);
      }
    } else {
      setRequests(data as unknown as RepairRequestWithEquipment[]);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data }));
      } catch (e) {
        console.error("Error writing repair requests to localStorage", e);
      }
    }
    setIsLoading(false);
  }, [toast, user]);

  const invalidateCacheAndRefetch = React.useCallback(() => {
    try {
      // Clear both general and department-specific cache
      localStorage.removeItem(CACHE_KEY);
      if (user?.khoa_phong) {
        localStorage.removeItem(`${CACHE_KEY}_${user.khoa_phong}`);
      }
    } catch (error) {
      console.error("Failed to invalidate repair requests cache", error);
    }
    fetchRequests();
  }, [fetchRequests, user?.khoa_phong]);

  const handleSelectEquipment = React.useCallback((equipment: EquipmentSelectItem) => {
    setSelectedEquipment(equipment);
    setSearchQuery(`${equipment.ten_thiet_bi} (${equipment.ma_thiet_bi})`);
  }, []);

  React.useEffect(() => {
    const fetchInitialData = async () => {
      if (supabaseError) {
        toast({
          variant: "destructive",
          title: "Lỗi cấu hình Supabase",
          description: supabaseError,
          duration: 10000,
        })
        setIsLoading(false)
        return;
      }
      if (!supabase || !user) {
        setIsLoading(false)
        return;
      }

      // Fetch equipment with department-based filtering
      try {
        let query = supabase.from('thiet_bi').select('id, ma_thiet_bi, ten_thiet_bi, khoa_phong_quan_ly');

        // Apply department filter for non-admin users
        const shouldFilterByDepartment = user &&
          !['admin', 'to_qltb'].includes(user.role) &&
          user.khoa_phong;

        if (shouldFilterByDepartment) {
          query = query.eq('khoa_phong_quan_ly', user.khoa_phong);
        }

        const { data: equipmentData, error: equipmentError } = await query;

        if (equipmentError) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể tải danh sách thiết bị. " + equipmentError.message,
          })
        } else {
          setAllEquipment(equipmentData || [])
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách thiết bị. Vui lòng thử lại.",
        })
      }

      // Fetch repair requests (will use cache if available)
      fetchRequests();
    }
    fetchInitialData();
  }, [toast, fetchRequests, user])

  React.useEffect(() => {
    const equipmentId = searchParams.get('equipmentId');
    if (equipmentId && allEquipment.length > 0) {
      if (selectedEquipment && selectedEquipment.id === Number(equipmentId)) {
        return;
      }
      const equipmentToSelect = allEquipment.find(eq => eq.id === Number(equipmentId));
      if (equipmentToSelect) {
        handleSelectEquipment(equipmentToSelect);
      }
    }
  }, [searchParams, allEquipment, handleSelectEquipment, selectedEquipment]);


  const filteredEquipment = React.useMemo(() => {
    if (!searchQuery) return [];

    if (selectedEquipment && searchQuery === `${selectedEquipment.ten_thiet_bi} (${selectedEquipment.ma_thiet_bi})`) {
      return [];
    }

    return allEquipment.filter(
      (eq) =>
        eq.ten_thiet_bi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.ma_thiet_bi.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allEquipment, selectedEquipment]);

  const shouldShowNoResults = React.useMemo(() => {
    if (!searchQuery) return false;
    if (selectedEquipment && searchQuery === `${selectedEquipment.ten_thiet_bi} (${selectedEquipment.ma_thiet_bi})`) {
      return false;
    }
    return filteredEquipment.length === 0;
  }, [searchQuery, selectedEquipment, filteredEquipment]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (selectedEquipment) {
      setSelectedEquipment(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (!selectedEquipment || !issueDescription || !repairItems) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc.",
      })
      return
    }

    // Validate external company name when repair unit is external
    if (repairUnit === 'thue_ngoai' && !externalCompanyName.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên đơn vị được thuê sửa chữa.",
      })
      return
    }

    if (!user) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại." });
      return;
    }

    setIsSubmitting(true)

    try {
      // Check department authorization for non-admin users
      if (!['admin', 'to_qltb'].includes(user.role)) {
        if (!user.khoa_phong) {
          toast({
            variant: "destructive",
            title: "Không có quyền",
            description: "Tài khoản chưa được phân công khoa/phòng.",
          });
          setIsSubmitting(false);
          return;
        }

        const { data: equipmentData, error: equipmentError } = await supabase
          .from('thiet_bi')
          .select('khoa_phong_quan_ly')
          .eq('id', selectedEquipment.id)
          .single();

        if (equipmentError || !equipmentData) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể xác thực thiết bị.",
          });
          setIsSubmitting(false);
          return;
        }

        if (equipmentData.khoa_phong_quan_ly !== user.khoa_phong) {
          toast({
            variant: "destructive",
            title: "Không có quyền",
            description: "Bạn chỉ có thể tạo yêu cầu sửa chữa cho thiết bị thuộc khoa/phòng của mình.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create repair request
      const { error } = await supabase
        .from('yeu_cau_sua_chua')
        .insert({
          thiet_bi_id: selectedEquipment.id,
          mo_ta_su_co: issueDescription,
          hang_muc_sua_chua: repairItems,
          ngay_mong_muon_hoan_thanh: desiredDate ? format(desiredDate, "yyyy-MM-dd") : null,
          nguoi_yeu_cau: user.full_name || user.username,
          trang_thai: 'Chờ xử lý',
          don_vi_thuc_hien: canSetRepairUnit ? repairUnit : null,
          ten_don_vi_thue: canSetRepairUnit && repairUnit === 'thue_ngoai' ? externalCompanyName.trim() : null,
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Gửi yêu cầu thất bại",
          description: error.message,
        });
      } else {
        toast({
          title: "Thành công",
          description: "Yêu cầu sửa chữa của bạn đã được gửi đi.",
        })
        // Reset form
        setSelectedEquipment(null)
        setSearchQuery("")
        setIssueDescription("")
        setRepairItems("")
        setDesiredDate(undefined)
        setRepairUnit('noi_bo')
        setExternalCompanyName("")
        // Invalidate cache and refetch requests
        invalidateCacheAndRefetch()
        setIsCreateSheetOpen(false)
      }
    } catch (error) {
      console.error("Repair request creation failed:", error);
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Không thể tạo yêu cầu sửa chữa. Vui lòng thử lại.",
      });
    }

    setIsSubmitting(false)
  }

  const handleApproveRequest = (request: RepairRequestWithEquipment) => {
    setRequestToApprove(request);
    setApprovalRepairUnit('noi_bo');
    setApprovalExternalCompanyName('');
  }

  const handleConfirmApproval = async () => {
    if (!supabase || !requestToApprove) return;

    // Validate external company name when repair unit is external
    if (approvalRepairUnit === 'thue_ngoai' && !approvalExternalCompanyName.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên đơn vị được thuê sửa chữa.",
      });
      return;
    }

    setIsApproving(true);

    const { error: requestError } = await supabase
      .from('yeu_cau_sua_chua')
      .update({
        trang_thai: 'Đã duyệt',
        ngay_duyet: new Date().toISOString(),
        nguoi_duyet: user?.full_name || user?.username || '',
        don_vi_thuc_hien: approvalRepairUnit,
        ten_don_vi_thue: approvalRepairUnit === 'thue_ngoai' ? approvalExternalCompanyName.trim() : null
      })
      .eq('id', requestToApprove.id);

    if (requestError) {
      toast({
        variant: "destructive",
        title: "Lỗi duyệt yêu cầu",
        description: "Không thể duyệt yêu cầu. " + requestError.message,
      });
      setIsApproving(false);
      return;
    }

    const { error: equipmentError } = await supabase
      .from('thiet_bi')
      .update({ tinh_trang_hien_tai: 'Chờ sửa chữa' })
      .eq('id', requestToApprove.thiet_bi_id);

    if (equipmentError) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật thiết bị",
        description: `Đã duyệt yêu cầu, nhưng không thể cập nhật trạng thái thiết bị. ${equipmentError.message}`,
      });
    } else {
      toast({
        title: "Thành công",
        description: "Đã duyệt yêu cầu và cập nhật trạng thái thiết bị.",
      });
    }

    setRequestToApprove(null);
    setApprovalRepairUnit('noi_bo');
    setApprovalExternalCompanyName('');
    setIsApproving(false);
    invalidateCacheAndRefetch();
  }

  const handleCompletion = (request: RepairRequestWithEquipment, newStatus: 'Hoàn thành' | 'Không HT') => {
    setRequestToComplete(request);
    setCompletionType(newStatus);
    setCompletionResult('');
    setNonCompletionReason('');
  }

  const handleConfirmCompletion = async () => {
    if (!supabase || !requestToComplete || !completionType) return;

    // Validate input based on completion type
    if (completionType === 'Hoàn thành' && !completionResult.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập kết quả sửa chữa.",
      });
      return;
    }

    if (completionType === 'Không HT' && !nonCompletionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập lý do không hoàn thành.",
      });
      return;
    }

    setIsCompleting(true);

    const newEquipmentStatus = completionType === 'Hoàn thành' ? 'Hoạt động' : 'Chờ sửa chữa';

    const { error: requestError } = await supabase
      .from('yeu_cau_sua_chua')
      .update({
        trang_thai: completionType,
        ngay_hoan_thanh: new Date().toISOString(),
        nguoi_xac_nhan: user?.full_name || user?.username || '',
        ket_qua_sua_chua: completionType === 'Hoàn thành' ? completionResult.trim() : null,
        ly_do_khong_hoan_thanh: completionType === 'Không HT' ? nonCompletionReason.trim() : null,
      })
      .eq('id', requestToComplete.id);

    if (requestError) {
      toast({ variant: "destructive", title: "Lỗi cập nhật yêu cầu", description: requestError.message });
      setIsCompleting(false);
      return;
    }

    const { error: equipmentError } = await supabase
      .from('thiet_bi')
      .update({ tinh_trang_hien_tai: newEquipmentStatus })
      .eq('id', requestToComplete.thiet_bi_id);

    if (equipmentError) {
      toast({ variant: "destructive", title: "Lỗi cập nhật thiết bị", description: `Đã cập nhật yêu cầu, nhưng lỗi khi cập nhật trạng thái thiết bị. ${equipmentError.message}` });
    } else {
      toast({ title: "Thành công", description: `Đã cập nhật trạng thái yêu cầu thành "${completionType}".` });
    }

    const { error: historyError } = await supabase
      .from('lich_su_thiet_bi')
      .insert({
        thiet_bi_id: requestToComplete.thiet_bi_id,
        loai_su_kien: 'Sửa chữa',
        mo_ta: `Yêu cầu sửa chữa được cập nhật thành "${completionType}"`,
        chi_tiet: {
          mo_ta_su_co: requestToComplete.mo_ta_su_co,
          hang_muc_sua_chua: requestToComplete.hang_muc_sua_chua,
          nguoi_yeu_cau: requestToComplete.nguoi_yeu_cau,
          ket_qua: completionType === 'Hoàn thành' ? completionResult.trim() : nonCompletionReason.trim()
        },
        yeu_cau_id: requestToComplete.id,
      });

    if (historyError) {
      toast({ variant: "destructive", title: "Lỗi ghi nhận lịch sử", description: `Đã cập nhật yêu cầu nhưng không thể ghi lại lịch sử. ${historyError.message}` });
    }

    setRequestToComplete(null);
    setCompletionType(null);
    setCompletionResult('');
    setNonCompletionReason('');
    setIsCompleting(false);
    invalidateCacheAndRefetch();
  }

  const handleUpdateRequest = async () => {
    if (!supabase) return;
    if (!editingRequest || !editIssueDescription || !editRepairItems) {
      toast({ variant: "destructive", title: "Thiếu thông tin", description: "Mô tả sự cố và hạng mục không được để trống." });
      return;
    }

    // Validate external company name when repair unit is external
    if (editRepairUnit === 'thue_ngoai' && !editExternalCompanyName.trim()) {
      toast({ variant: "destructive", title: "Thiếu thông tin", description: "Vui lòng nhập tên đơn vị được thuê sửa chữa." });
      return;
    }

    setIsEditSubmitting(true);
    const { error } = await supabase
      .from('yeu_cau_sua_chua')
      .update({
        mo_ta_su_co: editIssueDescription,
        hang_muc_sua_chua: editRepairItems,
        ngay_mong_muon_hoan_thanh: editDesiredDate ? format(editDesiredDate, "yyyy-MM-dd") : null,
        don_vi_thuc_hien: canSetRepairUnit ? editRepairUnit : editingRequest.don_vi_thuc_hien,
        ten_don_vi_thue: canSetRepairUnit && editRepairUnit === 'thue_ngoai' ? editExternalCompanyName.trim() : (canSetRepairUnit ? null : editingRequest.ten_don_vi_thue),
      })
      .eq('id', editingRequest.id);

    if (error) {
      toast({ variant: "destructive", title: "Lỗi cập nhật", description: error.message });
    } else {
      toast({ title: "Thành công", description: "Đã cập nhật yêu cầu." });
      setEditingRequest(null);
      invalidateCacheAndRefetch();
    }
    setIsEditSubmitting(false);
  }

  const handleDeleteRequest = async () => {
    if (!requestToDelete || !supabase) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('yeu_cau_sua_chua')
      .delete()
      .eq('id', requestToDelete.id);

    if (error) {
      toast({ variant: "destructive", title: "Lỗi xóa yêu cầu", description: error.message });
    } else {
      toast({ title: "Đã xóa", description: "Yêu cầu đã được xóa thành công." });
      invalidateCacheAndRefetch();
    }

    setIsDeleting(false);
    setRequestToDelete(null);
  }

  const handleGenerateRequestSheet = (request: RepairRequestWithEquipment) => {
    if (!openRepairRequestSheet(request)) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không đủ thông tin để tạo phiếu yêu cầu.",
      })
    }
  }

  const columns: ColumnDef<RepairRequestWithEquipment>[] = [
    // 1. Thiết bị (với mô tả sự cố)
    {
      accessorFn: row => `${row.thiet_bi?.ten_thiet_bi} ${row.mo_ta_su_co}`,
      id: 'thiet_bi_va_mo_ta',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Thiết bị
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const request = row.original
        return (
          <div>
            <div className="font-medium">{request.thiet_bi?.ten_thiet_bi || 'N/A'}</div>
            <div className="text-sm text-muted-foreground truncate max-w-xs">{request.mo_ta_su_co}</div>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const nameA = rowA.original.thiet_bi?.ten_thiet_bi || '';
        const nameB = rowB.original.thiet_bi?.ten_thiet_bi || '';
        return nameA.localeCompare(nameB);
      }
    },
    // 2. Người yêu cầu
    {
      accessorKey: "nguoi_yeu_cau",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Người yêu cầu
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const nguoiYeuCau = row.getValue("nguoi_yeu_cau") as string | null;
        return (
          <div className="text-sm">
            {nguoiYeuCau || <span className="text-muted-foreground italic">N/A</span>}
          </div>
        );
      },
    },
    // 3. Ngày yêu cầu
    {
      accessorKey: "ngay_yeu_cau",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Ngày yêu cầu
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-sm">{format(parseISO(row.getValue("ngay_yeu_cau")), 'dd/MM/yyyy HH:mm', { locale: vi })}</div>,
    },
    // 4. Ngày mong muốn hoàn thành
    {
      accessorKey: "ngay_mong_muon_hoan_thanh",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Ngày mong muốn HT
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const ngayMongMuon = row.getValue("ngay_mong_muon_hoan_thanh") as string | null;
        const request = row.original;

        if (!ngayMongMuon) {
          return (
            <div className="text-sm">
              <span className="text-muted-foreground italic">Không có</span>
            </div>
          );
        }

        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {format(parseISO(ngayMongMuon), 'dd/MM/yyyy', { locale: vi })}
            </div>
            <RepairDeadlineProgress
              desiredDate={ngayMongMuon}
              requestStatus={request.trang_thai}
            />
          </div>
        );
      },
    },
    // 5. Trạng thái
    {
      accessorKey: "trang_thai",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Trạng thái
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={getRepairRequestStatusVariant(request.trang_thai)} className="self-start">{request.trang_thai}</Badge>
            {request.trang_thai === 'Đã duyệt' && request.ngay_duyet && (
              <div className="text-xs text-muted-foreground">
                {format(parseISO(request.ngay_duyet), 'dd/MM/yyyy HH:mm', { locale: vi })}
                {request.nguoi_duyet && (
                  <div className="text-blue-600 font-medium">Duyệt bởi: {request.nguoi_duyet}</div>
                )}
              </div>
            )}
            {(request.trang_thai === 'Hoàn thành' || request.trang_thai === 'Không HT') && request.ngay_hoan_thanh && (
              <div className="text-xs text-muted-foreground">
                {format(parseISO(request.ngay_hoan_thanh), 'dd/MM/yyyy HH:mm', { locale: vi })}
                {request.nguoi_xac_nhan && (
                  <div className="text-green-600 font-medium">Xác nhận bởi: {request.nguoi_xac_nhan}</div>
                )}
              </div>
            )}
          </div>
        )
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <RepairRequestActionsMenu
            request={row.original}
            visible={!!user}
            canManage={!!user && (user.role === 'admin' || user.role === 'to_qltb')}
            onGenerateRequestSheet={handleGenerateRequestSheet}
            onEdit={setEditingRequest}
            onDelete={setRequestToDelete}
            onApprove={handleApproveRequest}
            onCompletion={handleCompletion}
          />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: requests,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedSearch,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (value: string) => setSearchTerm(value),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const isFiltered = table.getState().columnFilters.length > 0 || debouncedSearch.length > 0;

  return (
    <>
      <RepairRequestDialogs
        editingRequest={editingRequest}
        onEditingRequestChange={setEditingRequest}
        editIssueDescription={editIssueDescription}
        onEditIssueDescriptionChange={setEditIssueDescription}
        editRepairItems={editRepairItems}
        onEditRepairItemsChange={setEditRepairItems}
        editDesiredDate={editDesiredDate}
        onEditDesiredDateChange={setEditDesiredDate}
        canSetRepairUnit={canSetRepairUnit}
        editRepairUnit={editRepairUnit}
        onEditRepairUnitChange={setEditRepairUnit}
        editExternalCompanyName={editExternalCompanyName}
        onEditExternalCompanyNameChange={setEditExternalCompanyName}
        isEditSubmitting={isEditSubmitting}
        onUpdateRequest={handleUpdateRequest}
        requestToDelete={requestToDelete}
        onRequestToDeleteChange={setRequestToDelete}
        isDeleting={isDeleting}
        onDeleteRequest={handleDeleteRequest}
        requestToApprove={requestToApprove}
        onRequestToApproveChange={setRequestToApprove}
        isApproving={isApproving}
        approvalRepairUnit={approvalRepairUnit}
        onApprovalRepairUnitChange={setApprovalRepairUnit}
        approvalExternalCompanyName={approvalExternalCompanyName}
        onApprovalExternalCompanyNameChange={setApprovalExternalCompanyName}
        onConfirmApproval={handleConfirmApproval}
        requestToComplete={requestToComplete}
        onRequestToCompleteChange={setRequestToComplete}
        completionType={completionType}
        isCompleting={isCompleting}
        completionResult={completionResult}
        onCompletionResultChange={setCompletionResult}
        nonCompletionReason={nonCompletionReason}
        onNonCompletionReasonChange={setNonCompletionReason}
        onConfirmCompletion={handleConfirmCompletion}
        requestToView={requestToView}
        onRequestToViewChange={setRequestToView}
      />

      {/* Repair Request Alert */}
      <RepairRequestAlert requests={requests} />

      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-10">
        {/* Header Section with Page Title and Action Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Yêu cầu sửa chữa
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Quản lý danh sách và tiến độ các yêu cầu sửa chữa thiết bị.
            </p>
          </div>
          
          <RepairRequestCreateSheet
            open={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
            onSubmit={handleSubmit}
            user={user}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filteredEquipment={filteredEquipment}
            shouldShowNoResults={shouldShowNoResults}
            selectedEquipment={selectedEquipment}
            onSelectEquipment={handleSelectEquipment}
            issueDescription={issueDescription}
            onIssueDescriptionChange={setIssueDescription}
            repairItems={repairItems}
            onRepairItemsChange={setRepairItems}
            desiredDate={desiredDate}
            onDesiredDateChange={setDesiredDate}
            canSetRepairUnit={canSetRepairUnit}
            repairUnit={repairUnit}
            onRepairUnitChange={setRepairUnit}
            externalCompanyName={externalCompanyName}
            onExternalCompanyNameChange={setExternalCompanyName}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Main List view */}
        <div className="w-full">
          <Card className="overflow-hidden border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-b from-muted/50 to-transparent border-b pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-primary/70" />
                Danh sách trạng thái 
                <Badge variant="secondary" className="ml-2 py-0.5">{requests.length}</Badge>
              </CardTitle>
              <CardDescription>
                Bạn có thể lọc, tìm kiếm và phân loại các yêu cầu tại đây.
              </CardDescription>

              <RepairRequestFilterStatus
                itemCount={requests.length}
                className="mt-3"
              />
            </CardHeader>
              <CardContent className="p-3 md:p-6 gap-3 md:gap-4">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3 md:mb-4">
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      placeholder="Tìm thiết bị, mô tả..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="h-8 w-[120px] md:w-[200px] lg:w-[250px] touch-target-sm md:h-8"
                    />

                    {/* Desktop: Show filters inline */}
                    {!isMobile && (
                      <>
                        <DataTableFacetedFilter
                          column={table.getColumn("trang_thai")}
                          title="Trạng thái"
                          options={requestStatuses.map(s => ({ label: s, value: s }))}
                          triggerClassName="touch-target-sm md:h-8"
                        />
                      </>
                    )}

                    {/* Mobile: Show filters in dropdown */}
                    {isMobile && (
                      <MobileFiltersDropdown
                        activeFiltersCount={
                          ((table.getColumn("trang_thai")?.getFilterValue() as string[])?.length || 0)
                        }
                        onClearFilters={() => {
                          table.getColumn("trang_thai")?.setFilterValue([])
                        }}
                      >
                        <DataTableFacetedFilter
                          column={table.getColumn("trang_thai")}
                          title="Trạng thái"
                          options={requestStatuses.map(s => ({ label: s, value: s }))}
                          triggerClassName="touch-target-sm md:h-8"
                        />
                      </MobileFiltersDropdown>
                    )}

                    {/* Clear all filters button */}
                    {isFiltered && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          table.resetColumnFilters();
                          setSearchTerm("");
                        }}
                        className="h-8 px-2 lg:px-3 touch-target-sm md:h-8"
                      >
                        <span className="hidden sm:inline">Xóa</span>
                        <FilterX className="h-4 w-4 sm:ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Mobile Card View */}
                {isMobile ? (
                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="flex justify-center items-center gap-2 py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Đang tải...</span>
                      </div>
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => {
                        const request = row.original;
                        return (
                          <Card
                            key={request.id}
                            className="mobile-repair-card cursor-pointer hover:bg-muted/50"
                            onClick={() => setRequestToView(request)}
                          >
                            <CardHeader className="mobile-repair-card-header flex flex-row items-start justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <CardTitle className="mobile-repair-card-title truncate line-clamp-1">
                                  {request.thiet_bi?.ten_thiet_bi || 'N/A'}
                                </CardTitle>
                                <CardDescription className="mobile-repair-card-description truncate">
                                  {request.thiet_bi?.ma_thiet_bi || 'N/A'}
                                </CardDescription>
                              </div>
                              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <RepairRequestActionsMenu
                                  request={request}
                                  visible={!!user}
                                  canManage={!!user && (user.role === 'admin' || user.role === 'to_qltb')}
                                  onGenerateRequestSheet={handleGenerateRequestSheet}
                                  onEdit={setEditingRequest}
                                  onDelete={setRequestToDelete}
                                  onApprove={handleApproveRequest}
                                  onCompletion={handleCompletion}
                                />
                              </div>
                            </CardHeader>
                            <CardContent className="mobile-repair-card-content">
                              {/* Người yêu cầu */}
                              {request.nguoi_yeu_cau && (
                                <div className="mobile-repair-card-field">
                                  <span className="mobile-repair-card-label">Người yêu cầu</span>
                                  <span className="mobile-repair-card-value">{request.nguoi_yeu_cau}</span>
                                </div>
                              )}

                              {/* Ngày yêu cầu */}
                              <div className="mobile-repair-card-field">
                                <span className="mobile-repair-card-label">Ngày yêu cầu</span>
                                <span className="mobile-repair-card-value">
                                  {format(parseISO(request.ngay_yeu_cau), 'dd/MM/yyyy', { locale: vi })}
                                </span>
                              </div>

                              {/* Ngày mong muốn hoàn thành */}
                              {request.ngay_mong_muon_hoan_thanh && (
                                <div className="space-y-2">
                                  <div className="mobile-repair-card-field">
                                    <span className="mobile-repair-card-label">Ngày mong muốn HT</span>
                                    <span className="mobile-repair-card-value">
                                      {format(parseISO(request.ngay_mong_muon_hoan_thanh), 'dd/MM/yyyy', { locale: vi })}
                                    </span>
                                  </div>
                                  <RepairDeadlineProgress
                                    desiredDate={request.ngay_mong_muon_hoan_thanh}
                                    requestStatus={request.trang_thai}
                                  />
                                </div>
                              )}

                              {/* Trạng thái */}
                              <div className="mobile-repair-card-field">
                                <span className="mobile-repair-card-label">Trạng thái</span>
                                <Badge variant={getRepairRequestStatusVariant(request.trang_thai)} className="text-xs">
                                  {request.trang_thai}
                                </Badge>
                              </div>

                              {/* Mô tả sự cố */}
                              <div className="space-y-1">
                                <span className="mobile-repair-card-label">Mô tả sự cố:</span>
                                <p className="mobile-repair-card-value text-left text-xs leading-relaxed line-clamp-2">{request.mo_ta_su_co}</p>
                              </div>

                              {/* Hạng mục sửa chữa (optional) */}
                              {request.hang_muc_sua_chua && (
                                <div className="space-y-1">
                                  <span className="mobile-repair-card-label">Hạng mục sửa chữa:</span>
                                  <p className="mobile-repair-card-value text-left text-xs leading-relaxed line-clamp-2">{request.hang_muc_sua_chua}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Không có kết quả.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
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
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                              <div className="flex justify-center items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Đang tải...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setRequestToView(row.original)}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                              Không có kết quả.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <DataTablePagination
                  table={table}
                  summary={
                    <>
                      {table.getFilteredRowModel().rows.length} trên {requests.length} yêu cầu.
                    </>
                  }
                  selectTriggerClassName="touch-target-sm md:h-8"
                  buttonClassName="touch-target-sm md:h-8 md:w-8"
                  firstLastButtonClassName="touch-target-sm md:h-8 md:w-8"
                  labels={{
                    first: "Go to first page",
                    previous: "Go to previous page",
                    next: "Go to next page",
                    last: "Go to last page",
                  }}
                />
              </CardFooter>
            </Card>
          </div>
      </div>
    </>
  )
}
