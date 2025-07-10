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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase, supabaseError } from "@/lib/supabase"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowUpDown, Calendar as CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, Edit, FilterX, History, Loader2, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useSearchDebounce } from "@/hooks/use-debounce"
import { Separator } from "@/components/ui/separator"
import type { Column } from "@tanstack/react-table"
import { RepairRequestAlert } from "@/components/repair-request-alert"
import { useRepairRealtimeSync } from "@/hooks/use-realtime-sync"
import { MobileFiltersDropdown } from "@/components/mobile-filters-dropdown"


type EquipmentSelectItem = {
    id: number;
    ma_thiet_bi: string;
    ten_thiet_bi: string;
}

// Export type để RepairRequestAlert có thể sử dụng nếu cần
export type RepairRequestWithEquipment = {
    id: number;
    thiet_bi_id: number;
    ngay_yeu_cau: string;
    trang_thai: string;
    mo_ta_su_co: string;
    hang_muc_sua_chua: string | null;
    ngay_mong_muon_hoan_thanh: string | null;
    nguoi_yeu_cau: string | null;
    ngay_duyet: string | null;
    ngay_hoan_thanh: string | null;
    don_vi_thuc_hien: 'noi_bo' | 'thue_ngoai' | null;
    ten_don_vi_thue: string | null;
    thiet_bi: {
        ten_thiet_bi: string;
        ma_thiet_bi: string;
        model: string | null;
        serial: string | null;
        khoa_phong_quan_ly: string | null;
    } | null;
};

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
  }[]
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed touch-target-sm md:h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} đã chọn
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        <span className="truncate max-w-[100px]">{option.label}</span>
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const isSelected = selectedValues.has(option.value)
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectedValues.add(option.value)
                } else {
                  selectedValues.delete(option.value)
                }
                const filterValues = Array.from(selectedValues)
                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined
                )
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="truncate">{option.label}</span>
            </DropdownMenuCheckboxItem>
          )
        })}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => column?.setFilterValue(undefined)}
              className="justify-center text-center"
            >
              Xóa bộ lọc
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const requestStatuses = ['Chờ xử lý', 'Đã duyệt', 'Hoàn thành', 'Không HT'];
const repairUnits = [
  { label: 'Nội bộ', value: 'noi_bo' },
  { label: 'Thuê ngoài', value: 'thue_ngoai' }
];

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

  // Edit form state
  const [editIssueDescription, setEditIssueDescription] = React.useState("");
  const [editRepairItems, setEditRepairItems] = React.useState("");
  const [editDesiredDate, setEditDesiredDate] = React.useState<Date | undefined>();
  const [editRepairUnit, setEditRepairUnit] = React.useState<'noi_bo' | 'thue_ngoai'>('noi_bo');
  const [editExternalCompanyName, setEditExternalCompanyName] = React.useState("");

  // UI state
  const [showRequestsList, setShowRequestsList] = React.useState(false);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "ngay_yeu_cau", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useSearchDebounce(searchTerm);
  
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

    try {
      const cachedItemJSON = localStorage.getItem(CACHE_KEY);
      if (cachedItemJSON) {
        const cachedItem = JSON.parse(cachedItemJSON);
        setRequests(cachedItem.data as RepairRequestWithEquipment[]);
        setIsLoading(false);
        // No return here, will still fetch in background to update
      }
    } catch (e) {
      console.error("Error reading cache for repair requests, fetching from network.", e);
      localStorage.removeItem(CACHE_KEY);
    }
    
    const { data, error } = await supabase
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
            don_vi_thuc_hien,
            ten_don_vi_thue,
            thiet_bi (
                ten_thiet_bi,
                ma_thiet_bi,
                model,
                serial,
                khoa_phong_quan_ly
            )
        `)
        .order('ngay_yeu_cau', { ascending: false });

    if (error) {
        toast({
            variant: "destructive",
            title: "Lỗi tải danh sách yêu cầu",
            description: error.message,
        });
        if (!localStorage.getItem(CACHE_KEY)) {
            setRequests([]);
        }
    } else {
        setRequests(data as RepairRequestWithEquipment[]);
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data }));
        } catch (e) {
            console.error("Error writing repair requests to localStorage", e);
        }
    }
    setIsLoading(false);
  }, [toast]);
  
  const invalidateCacheAndRefetch = React.useCallback(() => {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (error) {
        console.error("Failed to invalidate repair requests cache", error);
      }
      fetchRequests();
  }, [fetchRequests]);

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
      if (!supabase) {
          setIsLoading(false)
          return;
      }

      // Fetch equipment for the search dropdown
      const { data: equipmentData, error: equipmentError } = await supabase.from('thiet_bi').select('id, ma_thiet_bi, ten_thiet_bi');
      if (equipmentError) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách thiết bị. " + equipmentError.message,
        })
      } else {
        setAllEquipment(equipmentData || [])
      }

      // Fetch repair requests (will use cache if available)
      fetchRequests();
    }
    fetchInitialData();
  }, [toast, fetchRequests])

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      if (selectedEquipment) {
        setSelectedEquipment(null);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

    const { error } = await supabase
      .from('yeu_cau_sua_chua')
      .insert({
        thiet_bi_id: selectedEquipment.id,
        mo_ta_su_co: issueDescription,
        hang_muc_sua_chua: repairItems,
        ngay_mong_muon_hoan_thanh: desiredDate ? format(desiredDate, "yyyy-MM-dd") : null,
        nguoi_yeu_cau: user.full_name || user.username,
        trang_thai: 'Chờ xử lý',
        don_vi_thuc_hien: repairUnit,
        ten_don_vi_thue: repairUnit === 'thue_ngoai' ? externalCompanyName.trim() : null,
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
    }
    setIsSubmitting(false)
  }
  
  const handleApproveRequest = async (request: RepairRequestWithEquipment) => {
    if (!supabase) return;

    const { error: requestError } = await supabase
      .from('yeu_cau_sua_chua')
      .update({ trang_thai: 'Đã duyệt', ngay_duyet: new Date().toISOString() })
      .eq('id', request.id);

    if (requestError) {
      toast({
        variant: "destructive",
        title: "Lỗi duyệt yêu cầu",
        description: "Không thể duyệt yêu cầu. " + requestError.message,
      });
      return; 
    }

    const { error: equipmentError } = await supabase
      .from('thiet_bi')
      .update({ tinh_trang_hien_tai: 'Chờ sửa chữa' })
      .eq('id', request.thiet_bi_id);
    
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
    
    invalidateCacheAndRefetch();
  }
  
  const handleCompletion = async (request: RepairRequestWithEquipment, newStatus: 'Hoàn thành' | 'Không HT') => {
    if (!supabase) return;

    const newEquipmentStatus = newStatus === 'Hoàn thành' ? 'Hoạt động' : 'Chờ sửa chữa';

    const { error: requestError } = await supabase
      .from('yeu_cau_sua_chua')
      .update({
        trang_thai: newStatus,
        ngay_hoan_thanh: new Date().toISOString(),
      })
      .eq('id', request.id);
    
    if (requestError) {
      toast({ variant: "destructive", title: "Lỗi cập nhật yêu cầu", description: requestError.message });
      return;
    }
    
    const { error: equipmentError } = await supabase
      .from('thiet_bi')
      .update({ tinh_trang_hien_tai: newEquipmentStatus })
      .eq('id', request.thiet_bi_id);
    
    if (equipmentError) {
      toast({ variant: "destructive", title: "Lỗi cập nhật thiết bị", description: `Đã cập nhật yêu cầu, nhưng lỗi khi cập nhật trạng thái thiết bị. ${equipmentError.message}` });
    } else {
      toast({ title: "Thành công", description: `Đã cập nhật trạng thái yêu cầu thành "${newStatus}".` });
    }
    
    const { error: historyError } = await supabase
      .from('lich_su_thiet_bi')
      .insert({
        thiet_bi_id: request.thiet_bi_id,
        loai_su_kien: 'Sửa chữa',
        mo_ta: `Yêu cầu sửa chữa được cập nhật thành "${newStatus}"`,
        chi_tiet: {
          mo_ta_su_co: request.mo_ta_su_co,
          hang_muc_sua_chua: request.hang_muc_sua_chua,
          nguoi_yeu_cau: request.nguoi_yeu_cau
        },
        yeu_cau_id: request.id,
      });

    if (historyError) {
      toast({ variant: "destructive", title: "Lỗi ghi nhận lịch sử", description: `Đã cập nhật yêu cầu nhưng không thể ghi lại lịch sử. ${historyError.message}` });
    }

    invalidateCacheAndRefetch();
  }
  
  const handleUpdateRequest = async () => {
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
        don_vi_thuc_hien: editRepairUnit,
        ten_don_vi_thue: editRepairUnit === 'thue_ngoai' ? editExternalCompanyName.trim() : null,
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

  const getStatusVariant = (status: string | null) => {
    switch(status) {
        case 'Chờ xử lý': return 'destructive';
        case 'Đã duyệt': return 'secondary';
        case 'Hoàn thành': return 'default';
        case 'Không HT': return 'outline';
        default: return 'outline';
    }
  }

  const handleGenerateRequestSheet = (request: RepairRequestWithEquipment) => {
    if (!request || !request.thiet_bi) {
        toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không đủ thông tin để tạo phiếu yêu cầu.",
        });
        return;
    }

    const formatValue = (value: any) => value ?? "";

    const requestDate = request.ngay_yeu_cau ? parseISO(request.ngay_yeu_cau) : new Date();
    const day = format(requestDate, 'dd');
    const month = format(requestDate, 'MM');
    const year = format(requestDate, 'yyyy');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đề Nghị Sửa Chữa - ${formatValue(request.thiet_bi.ma_thiet_bi)}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              body { font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; line-height: 1.2; background-color: #e5e7eb; }
              .a4-page { width: 21cm; min-height: 29.7cm; padding: 1.5cm 2cm; margin: 1cm auto; background: white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); position: relative; }
              .form-input-line { font-family: inherit; font-size: inherit; border: none; border-bottom: 1px dotted #000; background-color: transparent; padding: 2px 1px; outline: none; text-align: center; }
              .form-textarea { font-family: inherit; font-size: inherit; border: 1px dotted #000; background-color: transparent; padding: 8px; outline: none; width: 100%; resize: none; }
              .form-input-line:focus, .form-textarea:focus { border-style: solid; }
              h1, h2, h3, .font-bold { font-weight: 700; }
              .title-main { font-size: 20px; }
              .title-sub { font-size: 16px; }
              .signature-area { display: flex; flex-direction: column; align-items: center; }
              .signature-space { height: 50px; }
              .signature-name-input { border: none; background-color: transparent; text-align: center; font-weight: 700; width: 200px; }
              .signature-name-input:focus { outline: none; }
              .page-break { page-break-before: always; }
              .print-footer { position: absolute; bottom: 0; left: 0; right: 0; }
              @media print {
                  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: #e5e7eb !important; }
                  .a4-page { width: 21cm !important; height: 29.7cm !important; margin: 0 !important; padding: 1.5cm 2cm !important; box-shadow: none !important; border: none !important; position: relative !important; }
                  .page-break { page-break-before: always !important; }
                  .print-footer { position: absolute !important; bottom: 1.5cm !important; left: 2cm !important; right: 2cm !important; width: calc(100% - 4cm) !important; }
                  body > *:not(.a4-page) { display: none; }
                  .form-input-line, .form-textarea, input[type="date"] { border-bottom: 1px dotted #000 !important; }
                  .signature-name-input { border: none !important; }
                  .form-textarea { border: 1px dotted #000 !important; }
              }
          </style>
      </head>
      <body>
          <div class="a4-page">
              <header class="text-center mb-8">
                  <div class="flex justify-between items-start">
                      <div class="text-center">
                          <img src="https://i.postimg.cc/W1ym4T74/cdc-logo-150.png" alt="Logo CDC" class="w-[70px] mx-auto mb-1" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e2e8f0/e2e8f0?text=Logo';">
                      </div>
                      <div class="flex-grow">
                          <h2 class="title-sub uppercase font-bold">TRUNG TÂM KIỂM SOÁT BỆNH TẬT THÀNH PHỐ CẦN THƠ</h2>
                          <h1 class="title-main uppercase mt-4 font-bold">ĐỀ NGHỊ SỬA CHỮA THIẾT BỊ</h1>
                      </div>
                      <div class="w-16"></div> <!-- Spacer -->
                  </div>
                  <div class="flex items-baseline mt-6">
                      <label for="department-request" class="font-bold whitespace-nowrap">Khoa/Phòng đề nghị:</label>
                      <input type="text" id="department-request" class="form-input-line ml-2" value="${formatValue(request.thiet_bi.khoa_phong_quan_ly)}">
                  </div>
              </header>
              <section>
                  <h3 class="font-bold">I. THÔNG TIN THIẾT BỊ</h3>
                  <div class="space-y-4 mt-3">
                      <div>
                          <label for="device-name" class="whitespace-nowrap">Tên thiết bị:</label>
                          <input type="text" id="device-name" class="form-input-line ml-2 w-full" value="${formatValue(request.thiet_bi.ten_thiet_bi)}">
                      </div>
                      <div class="grid grid-cols-3 gap-x-8">
                          <div class="flex items-baseline">
                              <label for="device-id" class="whitespace-nowrap">Mã TB:</label>
                              <input type="text" id="device-id" class="form-input-line ml-2" value="${formatValue(request.thiet_bi.ma_thiet_bi)}">
                          </div>
                          <div class="flex items-baseline">
                              <label for="model" class="whitespace-nowrap">Model:</label>
                              <input type="text" id="model" class="form-input-line ml-2" value="${formatValue(request.thiet_bi.model)}">
                          </div>
                          <div class="flex items-baseline">
                              <label for="serial-no" class="whitespace-nowrap">Serial N⁰:</label>
                              <input type="text" id="serial-no" class="form-input-line ml-2" value="${formatValue(request.thiet_bi.serial)}">
                          </div>
                      </div>
                      <div>
                          <label for="damage-description" class="block">Mô tả sự cố của thiết bị:</label>
                          <textarea id="damage-description" rows="1" class="form-textarea mt-1">${formatValue(request.mo_ta_su_co)}</textarea>
                      </div>
                      <div>
                          <label for="repair-request" class="block">Các hạng mục yêu cầu sửa chữa:</label>
                          <textarea id="repair-request" rows="1" class="form-textarea mt-1">${formatValue(request.hang_muc_sua_chua)}</textarea>
                      </div>
                      <div class="flex items-baseline">
                          <label for="completion-date" class="whitespace-nowrap">Ngày mong muốn hoàn thành (nếu có):</label>
                          <input type="date" id="completion-date" class="form-input-line ml-2" value="${formatValue(request.ngay_mong_muon_hoan_thanh)}">
                      </div>
                      <div class="flex items-baseline">
                          <label for="repair-unit" class="whitespace-nowrap">Đơn vị thực hiện:</label>
                          <input type="text" id="repair-unit" class="form-input-line ml-2" value="${request.don_vi_thuc_hien === 'noi_bo' ? 'Nội bộ' : 'Thuê ngoài'}" readonly>
                      </div>
                      ${request.don_vi_thuc_hien === 'thue_ngoai' && request.ten_don_vi_thue ? `
                      <div class="flex items-baseline">
                          <label for="external-company" class="whitespace-nowrap">Tên đơn vị được thuê:</label>
                          <input type="text" id="external-company" class="form-input-line ml-2" value="${formatValue(request.ten_don_vi_thue)}" readonly>
                      </div>
                      ` : ''}
                  </div>
              </section>
              <div class="mt-8">
                  <div class="flex justify-end mb-4">
                      <p class="italic">Cần Thơ, ngày <input type="text" class="w-8 form-input-line inline-block text-center" value="${day}"> tháng <input type="text" class="w-8 form-input-line inline-block text-center" value="${month}"> năm <input type="text" class="w-12 form-input-line inline-block text-center" value="${year}"></p>
                  </div>
                  <div class="flex justify-around">
                      <div class="signature-area">
                          <p class="font-bold">Lãnh đạo Khoa/phòng</p>
                          <div class="signature-space"></div>
                          <input type="text" id="leader-name" class="signature-name-input">
                      </div>
                      <div class="signature-area">
                          <p class="font-bold">Người đề nghị</p>
                          <div class="signature-space"></div>
                          <input type="text" id="requester-name" class="signature-name-input" value="${formatValue(request.nguoi_yeu_cau)}">
                      </div>
                  </div>
              </div>
              <section class="mt-6 border-t-2 border-dashed border-gray-400 pt-6">
                  <h3 class="font-bold">II. BỘ PHẬN SỬA CHỮA</h3>
                  <div class="mt-4 flex items-center space-x-10">
                      <label class="flex items-center">
                          <input type="checkbox" class="h-4 w-4">
                          <span class="ml-2">Tự sửa chữa được</span>
                      </label>
                      <label class="flex items-center">
                          <input type="checkbox" class="h-4 w-4">
                          <span class="ml-2">Không tự sửa chữa được</span>
                      </label>
                  </div>
                  <div class="mt-4">
                      <label for="tbyt-opinion" class="block">Ý kiến của Tổ Quản lý TBYT:</label>
                      <input type='text' id="tbyt-opinion" class="form-input-line ml-2">
                  </div>
              </section>
              <div class="mt-8 flex justify-around">
                  <div class="signature-area">
                      <p class="font-bold">Tổ Quản lý TBYT</p>
                      <div class="signature-space"></div>
                      <input type="text" id="tbyt-name" class="signature-name-input">
                  </div>
                  <div class="signature-area">
                      <p class="font-bold">Người sửa chữa</p>
                      <div class="signature-space"></div>
                      <input type="text" id="repairer-name" class="signature-name-input">
                  </div>
              </div>
              <footer class="mt-12 flex justify-between items-center text-xs text-gray-500">
                  <span>QLTB-BM.07</span>
                  <span>BH.01 (05/2024)</span>
                  <span>Trang: 1/2</span>
              </footer>
          </div>

          <!-- Page 2: Repair Result Form -->
          <div class="a4-page page-break">
              <div class="content-body">
                  <!-- Header -->
                  <header class="text-center mb-8">
                      <div class="flex items-center">
                          <div class="text-center">
                              <img src="https://i.postimg.cc/W1ym4T74/cdc-logo-150.png" alt="Logo CDC" class="w-[70px] mx-auto mb-1" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e2e8f0/e2e8f0?text=Logo';">
                          </div>
                          <div class="flex-grow">
                              <h2 class="title-sub uppercase font-bold">TRUNG TÂM KIỂM SOÁT BỆNH TẬT THÀNH PHỐ CẦN THƠ</h2>
                              <h1 class="title-main uppercase mt-4 font-bold">KẾT QUẢ SỬA CHỮA THIẾT BỊ</h1>
                          </div>
                          <div class="w-16"></div> <!-- Spacer -->
                      </div>
                  </header>

                  <!-- Main Content -->
                  <main class="mt-8">
                      <h3 class="title-main font-bold">III. KẾT QUẢ, TÌNH TRẠNG THIẾT BỊ SAU KHI XỬ LÝ</h3>
                      <div class="mt-4">
                          <textarea class="form-textarea" rows="5" placeholder="Nhập kết quả và tình trạng thiết bị..."></textarea>
                      </div>
                  </main>

                  <!-- Signature section -->
                  <section class="mt-8">
                       <div class="flex justify-end mb-4">
                           <p class="italic">
                              Cần Thơ, ngày <input type="text" class="form-input-line w-12" value="${day}">
                              tháng <input type="text" class="form-input-line w-12" value="${month}">
                              năm <input type="text" class="form-input-line w-20" value="${year}">
                          </p>
                      </div>
                       <div class="flex justify-around">
                          <div class="signature-area w-1/2">
                              <p class="font-bold">Tổ TTBYT</p>
                              <p class="italic">(Ký, ghi rõ họ, tên)</p>
                              <div class="signature-space"></div>
                              <input type="text" class="signature-name-input" placeholder="(Họ và tên)">
                          </div>
                          <div class="signature-area w-1/2">
                               <p class="font-bold">Người đề nghị</p>
                               <p class="italic">(Ký, ghi rõ họ, tên)</p>
                               <div class="signature-space"></div>
                               <input type="text" class="signature-name-input" placeholder="(Họ và tên)" value="${formatValue(request.nguoi_yeu_cau)}">
                          </div>
                      </div>
                  </section>
              </div>

              <!-- Footer -->
              <footer class="print-footer flex justify-between items-center text-xs">
                  <span>QLTB-BM.07</span>
                  <span>BH.01 (05/2024)</span>
                  <span>Trang: 2/2</span>
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
  }
  
  const renderActions = (request: RepairRequestWithEquipment) => {
    if (!user) return null;
    const canManage = user.role === 'admin' || user.role === 'to_qltb';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 touch-target-sm md:h-8 md:w-8">
                    <span className="sr-only">Mở menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleGenerateRequestSheet(request)}>
                    Xem phiếu yêu cầu
                </DropdownMenuItem>

                {request.trang_thai === 'Chờ xử lý' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setEditingRequest(request)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setRequestToDelete(request)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xoá
                    </DropdownMenuItem>
                  </>
                )}

                {canManage && (
                    <>
                        <DropdownMenuSeparator />
                        {request.trang_thai === 'Chờ xử lý' && (
                            <DropdownMenuItem onClick={() => handleApproveRequest(request)}>
                                Duyệt
                            </DropdownMenuItem>
                        )}
                        {request.trang_thai === 'Đã duyệt' && (
                            <>
                                <DropdownMenuItem onClick={() => handleCompletion(request, 'Hoàn thành')}>
                                    Hoàn thành
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCompletion(request, 'Không HT')}>
                                    Không hoàn thành
                                </DropdownMenuItem>
                            </>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
  };
  
  const columns: ColumnDef<RepairRequestWithEquipment>[] = [
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
            <Badge variant={getStatusVariant(request.trang_thai)} className="self-start">{request.trang_thai}</Badge>
            {request.trang_thai === 'Đã duyệt' && request.ngay_duyet && (
              <div className="text-xs text-muted-foreground">
                {format(parseISO(request.ngay_duyet), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </div>
            )}
            {(request.trang_thai === 'Hoàn thành' || request.trang_thai === 'Không HT') && request.ngay_hoan_thanh && (
              <div className="text-xs text-muted-foreground">
                {format(parseISO(request.ngay_hoan_thanh), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </div>
            )}
          </div>
        )
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "don_vi_thuc_hien",
      header: "Đơn vị thực hiện",
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={request.don_vi_thuc_hien === 'noi_bo' ? 'default' : 'secondary'} className="self-start">
              {request.don_vi_thuc_hien === 'noi_bo' ? 'Nội bộ' : 'Thuê ngoài'}
            </Badge>
            {request.don_vi_thuc_hien === 'thue_ngoai' && request.ten_don_vi_thue && (
              <div className="text-xs text-muted-foreground max-w-xs truncate">
                {request.ten_don_vi_thue}
              </div>
            )}
          </div>
        )
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "ngay_yeu_cau",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Ngày yêu cầu
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{format(parseISO(row.getValue("ngay_yeu_cau")), 'dd/MM/yyyy HH:mm', { locale: vi })}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => renderActions(row.original),
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
      {editingRequest && (
        <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sửa yêu cầu sửa chữa</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin cho yêu cầu của thiết bị: {editingRequest.thiet_bi?.ten_thiet_bi}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 mobile-card-spacing">
              <div className="space-y-2">
                <Label htmlFor="edit-issue">Mô tả sự cố</Label>
                <Textarea
                  id="edit-issue"
                  placeholder="Mô tả chi tiết vấn đề gặp phải..."
                  rows={4}
                  value={editIssueDescription}
                  onChange={(e) => setEditIssueDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-repair-items">Các hạng mục yêu cầu sửa chữa</Label>
                <Textarea
                  id="edit-repair-items"
                  placeholder="VD: Thay màn hình, sửa nguồn..."
                  rows={3}
                  value={editRepairItems}
                  onChange={(e) => setEditRepairItems(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày mong muốn hoàn thành (nếu có)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal touch-target",
                        !editDesiredDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDesiredDate ? format(editDesiredDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editDesiredDate}
                      onSelect={setEditDesiredDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-repair-unit">Đơn vị thực hiện</Label>
                <Select value={editRepairUnit} onValueChange={(value: 'noi_bo' | 'thue_ngoai') => setEditRepairUnit(value)}>
                  <SelectTrigger className="touch-target">
                    <SelectValue placeholder="Chọn đơn vị thực hiện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noi_bo">Nội bộ</SelectItem>
                    <SelectItem value="thue_ngoai">Thuê ngoài</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editRepairUnit === 'thue_ngoai' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-external-company">Tên đơn vị được thuê</Label>
                  <Input
                    id="edit-external-company"
                    placeholder="Nhập tên đơn vị được thuê sửa chữa..."
                    value={editExternalCompanyName}
                    onChange={(e) => setEditExternalCompanyName(e.target.value)}
                    required
                    className="touch-target"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRequest(null)} disabled={isEditSubmitting} className="touch-target">Hủy</Button>
              <Button onClick={handleUpdateRequest} disabled={isEditSubmitting} className="touch-target">
                {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {requestToDelete && (
         <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Yêu cầu sửa chữa cho thiết bị 
                    <strong> {requestToDelete.thiet_bi?.ten_thiet_bi} </strong> 
                    sẽ bị xóa vĩnh viễn.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRequest} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Xóa
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Repair Request Alert */}
      <RepairRequestAlert requests={requests} />

      <div className="space-y-6">
        {/* Primary Action: Create Repair Request Form */}
        <div className="w-full max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PlusCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="heading-responsive-h2">Tạo yêu cầu sửa chữa</CardTitle>
                  <CardDescription className="body-responsive-sm">
                    Điền thông tin bên dưới để gửi yêu cầu mới.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mobile-card-spacing">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search-equipment">Thiết bị</Label>
                  <div className="relative">
                      <Input
                          id="search-equipment"
                          placeholder="Nhập tên hoặc mã để tìm kiếm..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          autoComplete="off"
                          required
                      />
                      {filteredEquipment.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-1">
                                  {filteredEquipment.map((equipment) => (
                                      <div
                                          key={equipment.id}
                                          className="text-sm mobile-interactive hover:bg-accent rounded-sm cursor-pointer touch-target-sm"
                                          onClick={() => handleSelectEquipment(equipment)}
                                      >
                                          {equipment.ten_thiet_bi} ({equipment.ma_thiet_bi})
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
                  {selectedEquipment && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                          <Check className="h-3.5 w-3.5 text-green-600"/>
                          <span>Đã chọn: {selectedEquipment.ten_thiet_bi} ({selectedEquipment.ma_thiet_bi})</span>
                      </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue">Mô tả sự cố</Label>
                  <Textarea
                    id="issue"
                    placeholder="Mô tả chi tiết vấn đề gặp phải..."
                    rows={4}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repair-items">Các hạng mục yêu cầu sửa chữa</Label>
                  <Textarea
                    id="repair-items"
                    placeholder="VD: Thay màn hình, sửa nguồn..."
                    rows={3}
                    value={repairItems}
                    onChange={(e) => setRepairItems(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                    <Label>Ngày mong muốn hoàn thành (nếu có)</Label>
                    <Popover>
                          <PopoverTrigger asChild>
                              <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full justify-start text-left font-normal touch-target",
                                  !desiredDate && "text-muted-foreground"
                              )}
                              >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {desiredDate ? format(desiredDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                              <Calendar
                                  mode="single"
                                  selected={desiredDate}
                                  onSelect={setDesiredDate}
                                  initialFocus
                              />
                          </PopoverContent>
                      </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repair-unit">Đơn vị thực hiện</Label>
                  <Select value={repairUnit} onValueChange={(value: 'noi_bo' | 'thue_ngoai') => setRepairUnit(value)}>
                    <SelectTrigger className="touch-target">
                      <SelectValue placeholder="Chọn đơn vị thực hiện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noi_bo">Nội bộ</SelectItem>
                      <SelectItem value="thue_ngoai">Thuê ngoài</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {repairUnit === 'thue_ngoai' && (
                  <div className="space-y-2">
                    <Label htmlFor="external-company">Tên đơn vị được thuê</Label>
                    <Input
                      id="external-company"
                      placeholder="Nhập tên đơn vị được thuê sửa chữa..."
                      value={externalCompanyName}
                      onChange={(e) => setExternalCompanyName(e.target.value)}
                      required
                      className="touch-target"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full touch-target" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Toggle Button for Requests List */}
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRequestsList(!showRequestsList)}
              className="touch-target gap-2 toggle-button w-full max-w-sm md:w-auto"
            >
              {showRequestsList ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="button-text-responsive">Ẩn danh sách yêu cầu</span>
                </>
              ) : (
                <>
                  <History className="h-4 w-4" />
                  <span className="button-text-responsive">
                    <span className="hidden sm:inline">Xem danh sách yêu cầu</span>
                    <span className="sm:hidden">Xem yêu cầu</span>
                    {requests.length > 0 && ` (${requests.length})`}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Visual indicator when requests list is hidden */}
          {!showRequestsList && requests.length > 0 && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="caption-responsive">
                  {requests.length} yêu cầu sửa chữa đã ghi nhận
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Action: View Existing Requests */}
        {showRequestsList && (
          <div className="w-full collapsible-enter">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="heading-responsive-h2">Danh sách yêu cầu</CardTitle>
              <CardDescription className="body-responsive-sm">
                Tất cả các yêu cầu sửa chữa đã được ghi nhận.
              </CardDescription>
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
                              options={requestStatuses.map(s => ({label: s, value: s}))}
                          />
                          <DataTableFacetedFilter
                              column={table.getColumn("don_vi_thuc_hien")}
                              title="Đơn vị thực hiện"
                              options={repairUnits}
                          />
                        </>
                      )}

                      {/* Mobile: Show filters in dropdown */}
                      {isMobile && (
                        <MobileFiltersDropdown
                          activeFiltersCount={
                            ((table.getColumn("trang_thai")?.getFilterValue() as string[])?.length || 0) +
                            ((table.getColumn("don_vi_thuc_hien")?.getFilterValue() as string[])?.length || 0)
                          }
                          onClearFilters={() => {
                            table.getColumn("trang_thai")?.setFilterValue([])
                            table.getColumn("don_vi_thuc_hien")?.setFilterValue([])
                          }}
                        >
                          <DataTableFacetedFilter
                              column={table.getColumn("trang_thai")}
                              title="Trạng thái"
                              options={requestStatuses.map(s => ({label: s, value: s}))}
                          />
                          <DataTableFacetedFilter
                              column={table.getColumn("don_vi_thuc_hien")}
                              title="Đơn vị thực hiện"
                              options={repairUnits}
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
                        <Card key={request.id} className="mobile-repair-card">
                          <CardHeader className="mobile-repair-card-header flex flex-row items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <CardTitle className="mobile-repair-card-title truncate line-clamp-1">
                                {request.thiet_bi?.ten_thiet_bi || 'N/A'}
                              </CardTitle>
                              <CardDescription className="mobile-repair-card-description truncate">
                                {request.thiet_bi?.ma_thiet_bi || 'N/A'}
                              </CardDescription>
                            </div>
                            <div className="flex-shrink-0">
                              {renderActions(request)}
                            </div>
                          </CardHeader>
                          <CardContent className="mobile-repair-card-content">
                            <div className="mobile-repair-card-field">
                              <span className="mobile-repair-card-label">Trạng thái</span>
                              <Badge variant={getStatusVariant(request.trang_thai)} className="text-xs">
                                {request.trang_thai}
                              </Badge>
                            </div>
                            <div className="mobile-repair-card-field">
                              <span className="mobile-repair-card-label">Ngày yêu cầu</span>
                              <span className="mobile-repair-card-value">
                                {format(parseISO(request.ngay_yeu_cau), 'dd/MM/yyyy', { locale: vi })}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="mobile-repair-card-label">Mô tả sự cố:</span>
                              <p className="mobile-repair-card-value text-left text-xs leading-relaxed line-clamp-2">{request.mo_ta_su_co}</p>
                            </div>
                            {request.hang_muc_sua_chua && (
                              <div className="space-y-1">
                                <span className="mobile-repair-card-label">Hạng mục sửa chữa:</span>
                                <p className="mobile-repair-card-value text-left text-xs leading-relaxed line-clamp-2">{request.hang_muc_sua_chua}</p>
                              </div>
                            )}
                            {request.nguoi_yeu_cau && (
                              <div className="mobile-repair-card-field">
                                <span className="mobile-repair-card-label">Người yêu cầu</span>
                                <span className="mobile-repair-card-value">{request.nguoi_yeu_cau}</span>
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
                 <div className="flex items-center justify-between w-full">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredRowModel().rows.length} trên {requests.length} yêu cầu.
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Số dòng</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                            table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px] touch-target-sm md:h-8">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
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
                        Trang {table.getState().pagination.pageIndex + 1} /{" "}
                        {table.getPageCount()}
                        </div>
                        <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex touch-target-sm md:h-8 md:w-8"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 touch-target-sm md:h-8 md:w-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 touch-target-sm md:h-8 md:w-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex touch-target-sm md:h-8 md:w-8"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                </div>
            </CardFooter>
          </Card>
          </div>
        )}
      </div>
    </>
  )
}
