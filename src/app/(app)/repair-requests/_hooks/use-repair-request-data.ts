"use client"

import * as React from "react"

import { useToast } from "@/hooks/use-toast"
import { supabase, supabaseError } from "@/lib/supabase"
import type { User } from "@/types/database"

import { getRepairRequestDepartment } from "../_lib/repair-request-permissions"
import type { EquipmentSelectItem, RepairRequestWithEquipment } from "../types"

type ToastFn = ReturnType<typeof useToast>["toast"]

const CACHE_KEY = "repair_requests_data"

interface UseRepairRequestDataParams {
  user: User | null | undefined
  toast: ToastFn
}

function filterVisibleRepairRequests(
  requests: RepairRequestWithEquipment[],
  department: string | null,
) {
  if (!department) {
    return requests
  }

  return requests.filter((request) => {
    return request.thiet_bi?.khoa_phong_quan_ly === department
  })
}

export function useRepairRequestData({
  user,
  toast,
}: UseRepairRequestDataParams) {
  const [requests, setRequests] = React.useState<RepairRequestWithEquipment[]>(
    [],
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [allEquipment, setAllEquipment] = React.useState<EquipmentSelectItem[]>(
    [],
  )

  const fetchRequests = React.useCallback(async () => {
    if (!supabase) {
      return
    }

    setIsLoading(true)
    const department = getRepairRequestDepartment(user)
    const cacheKey = department ? `${CACHE_KEY}_${department}` : CACHE_KEY

    try {
      const cachedItemJSON = localStorage.getItem(cacheKey)
      if (cachedItemJSON) {
        const cachedItem = JSON.parse(cachedItemJSON)
        const cachedRequests = filterVisibleRepairRequests(
          (cachedItem.data ?? []) as RepairRequestWithEquipment[],
          department,
        )
        setRequests(cachedRequests)
        setIsLoading(false)
      }
    } catch (error) {
      console.error(
        "Error reading cache for repair requests, fetching from network.",
        error,
      )
      localStorage.removeItem(cacheKey)
    }

    let query = supabase.from("yeu_cau_sua_chua").select(`
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
      `)

    if (department) {
      query = query.eq("thiet_bi.khoa_phong_quan_ly", department)
    }

    const { data, error } = await query.order("ngay_yeu_cau", {
      ascending: false,
    })

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi tải danh sách yêu cầu",
        description: error.message,
      })

      if (!localStorage.getItem(cacheKey)) {
        setRequests([])
      }
    } else {
      const visibleRequests = filterVisibleRepairRequests(
        (data ?? []) as unknown as RepairRequestWithEquipment[],
        department,
      )
      setRequests(visibleRequests)

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: visibleRequests }))
      } catch (cacheError) {
        console.error("Error writing repair requests to localStorage", cacheError)
      }
    }

    setIsLoading(false)
  }, [toast, user])

  const invalidateCacheAndRefetch = React.useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY)
      const department = getRepairRequestDepartment(user)

      if (department) {
        localStorage.removeItem(`${CACHE_KEY}_${department}`)
      }
    } catch (error) {
      console.error("Failed to invalidate repair requests cache", error)
    }

    void fetchRequests()
  }, [fetchRequests, user])

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
        return
      }

      if (!supabase || !user) {
        setIsLoading(false)
        return
      }

      try {
        let equipmentQuery = supabase
          .from("thiet_bi")
          .select("id, ma_thiet_bi, ten_thiet_bi, khoa_phong_quan_ly")

        const department = getRepairRequestDepartment(user)
        if (department) {
          equipmentQuery = equipmentQuery.eq("khoa_phong_quan_ly", department)
        }

        const { data, error } = await equipmentQuery
        if (error) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description:
              "Không thể tải danh sách thiết bị. " + error.message,
          })
        } else {
          setAllEquipment(data || [])
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách thiết bị. Vui lòng thử lại.",
        })
      }

      void fetchRequests()
    }

    void fetchInitialData()
  }, [fetchRequests, toast, user])

  return {
    requests,
    isLoading,
    allEquipment,
    invalidateCacheAndRefetch,
  }
}
