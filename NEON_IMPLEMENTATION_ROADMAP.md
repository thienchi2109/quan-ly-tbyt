# 🗺️ **ROADMAP TRIỂN KHAI: SUPABASE → NEON MIGRATION**

## 📅 **Timeline Overview**

```
Week 1    Week 2    Week 3    Week 4    Week 5    Week 6
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Setup   │ Dev     │ Dev     │ Test    │ Deploy  │ Monitor │
│ Research│ Phase 1 │ Phase 2 │ Stage   │ Prod    │ Optimize│
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

**Total Duration**: 6 weeks  
**Team Size**: 2-3 developers  
**Budget**: $5,000 - $8,000 (including tools và staging costs)

---

## 🎯 **WEEK 1: FOUNDATION & RESEARCH**

### **Day 1-2: Environment Setup**
```bash
# 1. Create Neon project
neon projects create --name "medical-equipment-prod"
neon databases create --project-id xxx --name "medical_equipment"

# 2. Setup development environment
git checkout feat/neon-migration
npm install pg @types/pg
npm install --save-dev @neon-tech/serverless

# 3. Environment configuration
cp .env.local .env.neon
# Update with Neon credentials
```

**Deliverables**:
- [ ] Neon project created và configured
- [ ] Development environment setup
- [ ] Initial connection testing
- [ ] Team access provisioned

### **Day 3-4: Realtime Solution Research**

#### **Option Evaluation Matrix**
| Solution | Complexity | Cost | Reliability | Performance |
|----------|------------|------|-------------|-------------|
| Server-Sent Events | Medium | Low | High | Good |
| WebSocket (Socket.io) | High | Medium | High | Excellent |
| Pusher/Ably | Low | High | Excellent | Excellent |
| Polling | Low | Low | Medium | Fair |

**Recommended**: Start với SSE, fallback to polling

#### **Prototype Implementation**
```typescript
// src/lib/realtime-neon.ts
export class NeonRealtime {
  private eventSources: Map<string, EventSource> = new Map()
  
  async subscribe(table: string, callback: (data: any) => void) {
    const eventSource = new EventSource(`/api/realtime/${table}`)
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      callback(data)
    }
    
    eventSource.onerror = (error) => {
      console.error(`Realtime error for ${table}:`, error)
      // Implement reconnection logic
    }
    
    this.eventSources.set(table, eventSource)
  }
}
```

**Deliverables**:
- [ ] Realtime solution prototype
- [ ] Performance benchmarks
- [ ] Fallback strategy implemented
- [ ] Documentation created

### **Day 5: Schema Analysis & Migration Planning**

```sql
-- Analyze current schema
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check constraints và indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public';
```

**Deliverables**:
- [ ] Complete schema documentation
- [ ] Migration scripts prepared
- [ ] Data mapping strategy
- [ ] Constraint analysis completed

---

## 🛠️ **WEEK 2: DEVELOPMENT PHASE 1**

### **Day 1-2: Database Client Replacement**

#### **Current Implementation**
```typescript
// src/lib/supabase.ts (OLD)
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(url, key)
```

#### **New Implementation**
```typescript
// src/lib/neon.ts (NEW)
import { Pool } from 'pg'

class NeonClient {
  private pool: Pool
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  
  async query(text: string, params?: any[]) {
    const client = await this.pool.connect()
    try {
      const result = await client.query(text, params)
      return result
    } finally {
      client.release()
    }
  }
}

export const neonClient = new NeonClient()
```

**Migration Tasks**:
- [ ] Replace Supabase client imports
- [ ] Update database query methods
- [ ] Add connection pooling
- [ ] Error handling implementation

### **Day 3-4: Core Functionality Migration**

#### **Equipment Management**
```typescript
// src/hooks/use-equipment-neon.ts
export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const result = await neonClient.query(`
        SELECT * FROM thiet_bi 
        ORDER BY created_at DESC
      `)
      return result.rows
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

#### **Realtime Integration**
```typescript
// Update components to use new realtime
export function EquipmentList() {
  const [equipment, setEquipment] = useState([])
  const realtime = new NeonRealtime()
  
  useEffect(() => {
    realtime.subscribe('thiet_bi', (data) => {
      setEquipment(prev => updateEquipmentList(prev, data))
    })
  }, [])
  
  return (
    // Component JSX
  )
}
```

**Deliverables**:
- [ ] Core database operations migrated
- [ ] Equipment management functionality
- [ ] User authentication working
- [ ] Basic realtime implementation

### **Day 5: API Routes Update**

```typescript
// pages/api/equipment/index.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const result = await neonClient.query('SELECT * FROM thiet_bi')
      res.status(200).json(result.rows)
    } else if (req.method === 'POST') {
      const { ma_thiet_bi, ten_thiet_bi } = req.body
      const result = await neonClient.query(
        'INSERT INTO thiet_bi (ma_thiet_bi, ten_thiet_bi) VALUES ($1, $2) RETURNING *',
        [ma_thiet_bi, ten_thiet_bi]
      )
      res.status(201).json(result.rows[0])
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

**Deliverables**:
- [ ] All API routes updated
- [ ] Error handling improved
- [ ] Request validation added
- [ ] Response formatting standardized

---

## 🔧 **WEEK 3: DEVELOPMENT PHASE 2**

### **Day 1-2: Advanced Features Migration**

#### **Repair Requests System**
```typescript
// src/hooks/use-repair-requests-neon.ts
export function useRepairRequests() {
  return useQuery({
    queryKey: ['repair-requests'],
    queryFn: async () => {
      const result = await neonClient.query(`
        SELECT 
          ycsc.*,
          tb.ten_thiet_bi,
          nv.full_name as nguoi_yeu_cau_name
        FROM yeu_cau_sua_chua ycsc
        LEFT JOIN thiet_bi tb ON ycsc.thiet_bi_id = tb.id
        LEFT JOIN nhan_vien nv ON ycsc.nguoi_yeu_cau_id = nv.id
        ORDER BY ycsc.ngay_yeu_cau DESC
      `)
      return result.rows
    }
  })
}
```

#### **Transfer Management**
```typescript
// src/hooks/use-transfers-neon.ts
export function useTransfers() {
  const realtime = new NeonRealtime()
  
  const query = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const result = await neonClient.query(`
        SELECT * FROM yeu_cau_luan_chuyen 
        ORDER BY created_at DESC
      `)
      return result.rows
    }
  })
  
  useEffect(() => {
    realtime.subscribe('yeu_cau_luan_chuyen', (data) => {
      queryClient.invalidateQueries(['transfers'])
    })
  }, [])
  
  return query
}
```

**Deliverables**:
- [ ] Repair requests system migrated
- [ ] Transfer management working
- [ ] Maintenance scheduling updated
- [ ] Reports functionality migrated

### **Day 3-4: Realtime System Completion**

#### **SSE API Implementation**
```typescript
// pages/api/realtime/[table].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { table } = req.query
  
  // Verify user permissions
  const user = await verifySession(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })
  
  // Poll for changes
  const interval = setInterval(async () => {
    try {
      const changes = await checkTableChanges(table as string, user)
      if (changes.length > 0) {
        res.write(`data: ${JSON.stringify(changes)}\n\n`)
      }
    } catch (error) {
      console.error('SSE error:', error)
    }
  }, 5000)
  
  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(interval)
  })
}
```

#### **Change Detection System**
```typescript
// src/lib/change-detection.ts
export async function checkTableChanges(table: string, user: User) {
  const lastCheck = await getLastCheckTime(table, user.id)
  
  const result = await neonClient.query(`
    SELECT * FROM ${table} 
    WHERE updated_at > $1 
    AND (
      CASE 
        WHEN $2 = 'admin' THEN true
        WHEN $2 = 'to_qltb' THEN true
        ELSE khoa_phong_quan_ly = $3
      END
    )
    ORDER BY updated_at DESC
  `, [lastCheck, user.role, user.khoa_phong])
  
  await updateLastCheckTime(table, user.id)
  return result.rows
}
```

**Deliverables**:
- [ ] SSE implementation completed
- [ ] Change detection system working
- [ ] User permission filtering
- [ ] Connection management optimized

### **Day 5: Testing Framework Setup**

```typescript
// tests/neon-integration.test.ts
describe('Neon Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase()
  })
  
  test('should connect to Neon database', async () => {
    const result = await neonClient.query('SELECT 1 as test')
    expect(result.rows[0].test).toBe(1)
  })
  
  test('should fetch equipment list', async () => {
    const equipment = await getEquipmentList()
    expect(Array.isArray(equipment)).toBe(true)
  })
  
  test('should receive realtime updates', (done) => {
    const realtime = new NeonRealtime()
    realtime.subscribe('thiet_bi', (data) => {
      expect(data).toBeDefined()
      done()
    })
    
    // Trigger update
    setTimeout(() => {
      updateEquipment(1, { ten_thiet_bi: 'Test Update' })
    }, 1000)
  })
})
```

**Deliverables**:
- [ ] Test framework configured
- [ ] Integration tests written
- [ ] Performance tests created
- [ ] CI/CD pipeline updated

---

## 🧪 **WEEK 4: TESTING & STAGING**

### **Day 1-2: Comprehensive Testing**

#### **Test Categories**
1. **Unit Tests**: Individual functions và components
2. **Integration Tests**: Database operations và API endpoints
3. **End-to-End Tests**: Complete user workflows
4. **Performance Tests**: Load testing và benchmarks
5. **Security Tests**: Authentication và authorization

#### **Performance Benchmarking**
```bash
# Load testing script
artillery run load-test-config.yml

# Database performance
pgbench -h neon-host -U user -d database -c 10 -j 2 -T 60
```

**Success Criteria**:
- All tests pass với >95% coverage
- Performance within 10% of current system
- Zero security vulnerabilities
- Realtime latency <5 seconds

### **Day 3-4: Staging Deployment**

#### **Staging Environment Setup**
```bash
# Deploy to staging
vercel --env staging
wrangler pages deploy --env staging

# Database migration
psql $NEON_STAGING_URL < migration-scripts/full-migration.sql
```

#### **User Acceptance Testing**
- Medical staff testing critical workflows
- Performance validation under load
- Realtime functionality verification
- Mobile responsiveness testing

**Deliverables**:
- [ ] Staging environment deployed
- [ ] UAT completed successfully
- [ ] Performance benchmarks met
- [ ] Bug fixes implemented

### **Day 5: Production Preparation**

#### **Final Checklist**
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security audit completed
- [ ] Backup procedures tested
- [ ] Rollback plan verified
- [ ] Monitoring configured
- [ ] Team trained

---

## 🚀 **WEEK 5-6: PRODUCTION DEPLOYMENT**

### **Week 5: Migration Execution**

#### **Blue-Green Deployment Process**
```bash
# Day 1-2: Final preparation
- Complete data backup
- Verify staging environment
- Prepare production database

# Day 3: Migration day
- Maintenance window announcement
- Data migration execution
- Application deployment
- DNS switch

# Day 4-5: Monitoring và stabilization
- Performance monitoring
- Error tracking
- User support
- Bug fixes if needed
```

### **Week 6: Optimization & Documentation**

#### **Performance Optimization**
- Query optimization based on production data
- Connection pooling tuning
- Realtime performance improvements
- Caching strategy refinement

#### **Documentation Updates**
- [ ] Technical documentation
- [ ] User guides updated
- [ ] API documentation
- [ ] Deployment procedures
- [ ] Troubleshooting guides

---

## 📊 **Success Metrics & KPIs**

### **Technical KPIs**
- **Uptime**: >99.9%
- **Response Time**: <2 seconds average
- **Realtime Latency**: <5 seconds
- **Error Rate**: <0.1%

### **Business KPIs**
- **User Satisfaction**: >90%
- **Cost Reduction**: 20-30%
- **Performance Improvement**: 15-25%
- **Incident Count**: <2 critical issues

---

## 💰 **Budget Breakdown**

| Category | Cost | Description |
|----------|------|-------------|
| Neon Database | $200/month | Production database |
| Development Tools | $500 | Testing tools, monitoring |
| Staging Environment | $300 | 6 weeks staging costs |
| Third-party Services | $200 | Realtime service (if needed) |
| Team Time | $6,000 | 2 developers × 6 weeks |
| **Total** | **$7,200** | **Complete migration cost** |

---

**🎯 Final Note**: Roadmap này provides detailed step-by-step approach cho successful migration. Each phase builds upon previous work và includes comprehensive testing to ensure system reliability.**
