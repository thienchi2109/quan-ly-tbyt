# Hướng dẫn sử dụng Supabase Realtime Integration

## Tổng quan

Hệ thống QLTBYT đã được tích hợp Supabase Realtime để cập nhật dữ liệu thời gian thực, giảm thiểu việc polling và cải thiện hiệu suất.

## Kiến trúc Realtime

### 1. Components chính

- **`useRealtimeSubscription`**: Hook chính để subscribe database changes
- **`RealtimeProvider`**: Context provider quản lý connection status  
- **Cached Hooks**: Tất cả hooks đã được tích hợp Realtime

### 2. Tables được theo dõi

Realtime đã được enable cho 9 tables chính:

```typescript
- thiet_bi              // Equipment
- nhan_vien             // Users  
- nhat_ky_su_dung       // Usage Logs
- lich_su_thiet_bi      // Equipment History
- yeu_cau_luan_chuyen   // Transfer Requests
- lich_su_luan_chuyen   // Transfer History
- ke_hoach_bao_tri      // Maintenance Plans
- cong_viec_bao_tri     // Maintenance Tasks
- yeu_cau_sua_chua      // Repair Requests
```

## Deployment

### 1. Enable Realtime Publications

Chạy migration để enable realtime:

```bash
# Option 1: Automated script (khuyên dùng)
./scripts/quick_enable_realtime.ps1

# Option 2: Manual theo hướng dẫn
# Xem: scripts/enable_realtime_manual.md
```

### 2. Rollback (nếu cần)

```bash
# Emergency rollback
./scripts/emergency_rollback.ps1
```

## Cách sử dụng

### 1. Sử dụng cached hooks (Đã tích hợp sẵn)

Tất cả cached hooks đã được tích hợp Realtime:

```typescript
// Equipment
import { useEquipment } from '@/hooks/use-cached-equipment'

// Transfers  
import { useTransferRequests } from '@/hooks/use-cached-transfers'

// Repair
import { useRepairRequests } from '@/hooks/use-cached-repair'

// Maintenance
import { useMaintenancePlans } from '@/hooks/use-cached-maintenance'

// Usage Logs
import { useEquipmentUsageLogs } from '@/hooks/use-usage-logs'
```

### 2. Sử dụng RealtimeProvider (Optional)

Wrap app với RealtimeProvider để theo dõi connection status:

```tsx
import { RealtimeProvider } from '@/providers/realtime-provider'

function App() {
  return (
    <RealtimeProvider enableToasts={true}>
      {/* Your app components */}
    </RealtimeProvider>
  )
}
```

### 3. Kiểm tra connection status

```tsx
import { useRealtime } from '@/providers/realtime-provider'

function MyComponent() {
  const { isConnected, isEnabled, setIsEnabled } = useRealtime()
  
  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={() => setIsEnabled(!isEnabled)}>
        {isEnabled ? 'Disable' : 'Enable'} Realtime
      </button>
    </div>
  )
}
```

### 4. Custom realtime subscription

```typescript
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'

function MyComponent() {
  useRealtimeSubscription({
    table: 'thiet_bi',
    queryKeys: [['equipment']],
    showNotifications: true,
    onInsert: (payload) => {
      console.log('New equipment:', payload.new)
    },
    onUpdate: (payload) => {
      console.log('Equipment updated:', payload.new)
    },
    onDelete: (payload) => {
      console.log('Equipment deleted:', payload.old)
    }
  })
  
  return <div>My Component</div>
}
```

## Logging & Debugging

### 1. Console logs

Realtime events được log với prefix:

```
🆕 [Equipment] New equipment: {...}
📝 [Transfers] Transfer updated: {...}  
🗑️ [Repair] Repair deleted: {...}
✅ [Realtime] Connected successfully
❌ [Realtime] Disconnected
```

### 2. Development indicator

Trong development mode, có status indicator ở góc phải dưới:

- 🟢 Realtime ON: Kết nối thành công
- 🔄 Connecting...: Đang kết nối
- 🔴 Disconnected: Mất kết nối  
- 🚫 Realtime OFF: Đã tắt realtime

### 3. Browser DevTools

```javascript
// Check Supabase realtime connection
console.log(supabase.realtime.channels)

// Check TanStack Query cache
console.log(queryClient.getQueryCache().getAll())
```

## Performance Improvements

### 1. Tăng stale times

Cache được giữ lâu hơn vì có realtime updates:

```typescript
// Trước: 30 seconds - 2 minutes
// Sau: 5 - 20 minutes (tùy loại data)
staleTime: 15 * 60 * 1000 // 15 phút
```

### 2. Giảm manual invalidation

Mutations không cần invalidate cache manually:

```typescript
// Trước
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['equipment'] })
}

// Sau  
onSuccess: () => {
  // Realtime sẽ tự động invalidate
}
```

### 3. Optimistic updates

Một số mutations vẫn dùng optimistic updates:

```typescript
onSuccess: (data) => {
  // Update cache ngay lập tức
  queryClient.setQueryData(['equipment', data.id], data)
}
```

## Troubleshooting

### 1. Realtime không hoạt động

```sql
-- Kiểm tra publications
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Kiểm tra RLS đã tắt
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

### 2. Connection issues

- Kiểm tra network connectivity
- Verify API keys và permissions
- Check browser console cho errors

### 3. Performance issues

- Monitor số lượng subscriptions
- Kiểm tra query invalidation frequency
- Review console logs cho excessive updates

## Migration Status

✅ **Completed**:
- Supabase client configuration 
- useRealtimeSubscription hook
- Equipment hooks integration
- Transfers hooks integration  
- Repair hooks integration
- Usage logs hooks integration
- Maintenance hooks integration
- RealtimeProvider component
- Safety scripts và rollback procedures

🔄 **Next Steps**:
- Deploy realtime migration to production
- Monitor performance impacts
- User acceptance testing
- Documentation updates

## Support

Nếu gặp vấn đề:

1. Kiểm tra console logs
2. Verify database migration status  
3. Test với scripts/enable_realtime_manual.md
4. Use emergency rollback nếu cần thiết

---

**Lưu ý**: Realtime chỉ hoạt động sau khi chạy migration để enable publications. Đảm bảo backup database trước khi deploy. 