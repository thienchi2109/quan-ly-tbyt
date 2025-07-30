# 🔧 **PHÂN TÍCH KỸ THUẬT: SUPABASE → NEON MIGRATION**

## 🏗️ **Kiến trúc hiện tại vs Kiến trúc mới**

### **CURRENT ARCHITECTURE (Supabase)**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │────│  Supabase Client │────│   PostgreSQL    │
│   (Frontend)   │    │   (@supabase/    │    │   + Extensions  │
│                │    │   supabase-js)   │    │   + Realtime    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌────────▼────────┐
         └──────────────│ Supabase        │
                        │ Realtime API    │
                        └─────────────────┘
```

### **NEW ARCHITECTURE (Neon)**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │────│   PostgreSQL     │────│   Neon Database │
│   (Frontend)   │    │   Client (pg)    │    │   (Serverless)  │
│                │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         │              ┌─────────────────┐
         └──────────────│ Realtime        │
                        │ Solution        │
                        │ (SSE/WebSocket) │
                        └─────────────────┘
```

---

## 📊 **Component Impact Analysis**

### **1. DATABASE LAYER**

#### **Current Implementation**
```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

#### **New Implementation**
```typescript
// src/lib/neon.ts
import { Pool } from 'pg'
// or
import { PrismaClient } from '@prisma/client'

const neonClient = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})
```

#### **Migration Impact**: MEDIUM
- Replace client initialization
- Update all database queries
- Handle connection pooling differently

### **2. REALTIME FUNCTIONALITY**

#### **Current Implementation**
```typescript
// 9 tables với Supabase Realtime
const subscription = supabase
  .channel('equipment-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'thiet_bi' },
    (payload) => {
      // Handle realtime updates
    }
  )
  .subscribe()
```

#### **Proposed Solutions**

##### **Option A: Server-Sent Events (RECOMMENDED)**
```typescript
// src/lib/realtime-sse.ts
export class RealtimeSSE {
  private eventSource: EventSource

  subscribe(table: string, callback: Function) {
    this.eventSource = new EventSource(`/api/realtime/${table}`)
    this.eventSource.onmessage = (event) => {
      callback(JSON.parse(event.data))
    }
  }
}

// API Route: /api/realtime/[table].ts
export default async function handler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  // Poll database for changes
  const interval = setInterval(async () => {
    const changes = await checkForChanges(req.query.table)
    if (changes.length > 0) {
      res.write(`data: ${JSON.stringify(changes)}\n\n`)
    }
  }, 5000) // Poll every 5 seconds

  req.on('close', () => clearInterval(interval))
}
```

##### **Option B: WebSocket với Socket.io**
```typescript
// Requires additional server setup
import io from 'socket.io-client'

const socket = io(process.env.REALTIME_ENDPOINT)
socket.on('table-update', (data) => {
  // Handle updates
})
```

#### **Migration Impact**: HIGH
- Complete rewrite of realtime logic
- Update all components using realtime (9 tables)
- Test synchronization across multiple users

### **3. AUTHENTICATION SYSTEM**

#### **Current Status**: ✅ NO IMPACT
- Dự án đã dùng custom authentication
- Không phụ thuộc Supabase Auth
- Bảng `nhan_vien` sẽ migrate nguyên vẹn

### **4. FILE OPERATIONS**

#### **Current Usage**: Excel import/export only
- Không dùng Supabase Storage
- File operations qua browser/server
- **Migration Impact**: NONE

---

## 🔄 **Database Schema Migration**

### **Tables to Migrate (9 Realtime Tables)**
1. `thiet_bi` - Equipment
2. `nhan_vien` - Staff/Users  
3. `yeu_cau_sua_chua` - Repair Requests
4. `yeu_cau_luan_chuyen` - Transfer Requests
5. `ke_hoach_bao_tri` - Maintenance Plans
6. `cong_viec_bao_tri` - Maintenance Tasks
7. `nhat_ky_su_dung` - Usage Logs
8. `lich_su_thiet_bi` - Equipment History
9. `lich_su_luan_chuyen` - Transfer History

### **Migration Script Structure**
```sql
-- 1. Create schema
CREATE TABLE IF NOT EXISTS thiet_bi (
  id SERIAL PRIMARY KEY,
  ma_thiet_bi VARCHAR(50) UNIQUE NOT NULL,
  ten_thiet_bi VARCHAR(200) NOT NULL,
  -- ... other fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes (from existing optimization)
CREATE INDEX IF NOT EXISTS idx_thiet_bi_khoa_phong_quan_ly 
ON thiet_bi (khoa_phong_quan_ly);

-- 3. Insert data
INSERT INTO thiet_bi SELECT * FROM supabase_backup.thiet_bi;
```

### **Data Migration Strategy**
```bash
# 1. Export from Supabase
pg_dump $SUPABASE_URL > supabase_backup.sql

# 2. Clean Supabase-specific extensions
sed -i 's/supabase_specific_function//g' supabase_backup.sql

# 3. Import to Neon
psql $NEON_DATABASE_URL < cleaned_backup.sql
```

---

## ⚡ **Performance Considerations**

### **Connection Pooling**
```typescript
// Current: Supabase handles automatically
// New: Manual configuration needed

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

### **Query Optimization**
- Existing indexes sẽ được migrate
- Neon's auto-scaling có thể improve performance
- Connection pooling tốt hơn cho concurrent users

### **Realtime Performance**
- SSE polling: 5-10 second latency
- WebSocket: Near real-time
- Trade-off giữa complexity và performance

---

## 🔒 **Security Considerations**

### **Database Security**
```typescript
// Environment variables
DATABASE_URL=postgresql://user:pass@neon.tech/db?sslmode=require
NEON_API_KEY=neon_api_key_here

// Connection security
const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon requires SSL
})
```

### **Realtime Security**
```typescript
// API route authentication
export default async function handler(req, res) {
  // Verify user session
  const user = await verifySession(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Department-based filtering
  const allowedTables = getUserAllowedTables(user.role, user.khoa_phong)
  if (!allowedTables.includes(req.query.table)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// Test database operations
describe('Neon Database Operations', () => {
  test('should connect to database', async () => {
    const result = await neonClient.query('SELECT 1')
    expect(result.rows[0]).toEqual({ '?column?': 1 })
  })

  test('should fetch equipment', async () => {
    const equipment = await getEquipment()
    expect(equipment).toBeDefined()
  })
})
```

### **Integration Tests**
```typescript
// Test realtime functionality
describe('Realtime Updates', () => {
  test('should receive equipment updates', (done) => {
    const realtime = new RealtimeSSE()
    realtime.subscribe('thiet_bi', (data) => {
      expect(data).toHaveProperty('id')
      done()
    })
    
    // Trigger update
    updateEquipment(1, { ten_thiet_bi: 'Updated Name' })
  })
})
```

### **Performance Tests**
```typescript
// Benchmark database queries
describe('Performance Tests', () => {
  test('should load equipment list under 2 seconds', async () => {
    const start = Date.now()
    await getEquipmentList()
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
  })
})
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Setup**
- [ ] Create Neon project
- [ ] Setup development environment
- [ ] Install PostgreSQL client libraries
- [ ] Configure environment variables

### **Phase 2: Database Migration**
- [ ] Export Supabase schema
- [ ] Clean Supabase-specific code
- [ ] Create Neon database
- [ ] Import schema và data
- [ ] Verify data integrity

### **Phase 3: Code Changes**
- [ ] Replace Supabase client
- [ ] Implement realtime solution
- [ ] Update all database queries
- [ ] Update TypeScript types
- [ ] Add error handling

### **Phase 4: Testing**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] User acceptance testing

### **Phase 5: Deployment**
- [ ] Staging deployment
- [ ] Production migration
- [ ] Monitoring setup
- [ ] Documentation update

---

## 🚀 **Deployment Strategy**

### **Blue-Green Deployment**
1. **Blue** (Current): Supabase-based system
2. **Green** (New): Neon-based system
3. **Switch**: DNS/routing change
4. **Rollback**: Quick switch back if issues

### **Environment Variables Update**
```bash
# Vercel
vercel env add DATABASE_URL
vercel env add NEON_API_KEY

# Cloudflare Workers
wrangler secret put DATABASE_URL
wrangler secret put NEON_API_KEY
```

---

**📝 Kết luận**: Migration từ Supabase sang Neon là feasible với careful planning. Realtime functionality là biggest challenge, nhưng có multiple solutions available. Expected benefits include better performance, cost savings, và modern serverless architecture.
