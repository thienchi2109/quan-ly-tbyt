"use client"

import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import { equipmentKeys, repairKeys, transferKeys } from "@/lib/query-keys"

/**
 * A client component that sets up all the necessary real-time subscriptions
 * for the application based on the enabled replication tables.
 */
export function RealtimeManager() {
  // Subscription for Equipment
  useRealtimeSubscription(
    "realtime:thiet_bi",
    "thiet_bi",
    equipmentKeys.all
  )

  // Subscription for Repair Requests
  useRealtimeSubscription(
    "realtime:yeu_cau_sua_chua",
    "yeu_cau_sua_chua",
    repairKeys.all
  )

  // Subscription for Transfer Requests
  useRealtimeSubscription(
    "realtime:yeu_cau_luan_chuyen",
    "yeu_cau_luan_chuyen",
    transferKeys.all
  )

  /*
   * NOTE:
   * The following tables are NOT subscribed to because replication is not enabled for them:
   * - lich_bao_tri (Maintenance Schedules)
   * - profiles (Users)
   * - nhat_ky_su_dung (Usage Logs)
   * Their data will be updated via standard cache invalidation (e.g., on mutation or window focus).
  */

  return null
} 