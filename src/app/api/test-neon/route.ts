import { NextRequest, NextResponse } from 'next/server'
import { testNeonConnection, neonQuery } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const connectionTest = await testNeonConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: connectionTest.error,
        message: connectionTest.message
      }, { status: 500 })
    }

    // Test database queries
    const queries = []
    
    // Test 1: Basic query
    try {
      const basicTest = await neonQuery('SELECT version() as postgres_version')
      queries.push({
        name: 'PostgreSQL Version',
        success: true,
        result: basicTest.rows[0]?.postgres_version
      })
    } catch (error: any) {
      queries.push({
        name: 'PostgreSQL Version',
        success: false,
        error: error.message
      })
    }

    // Test 2: Check if tables exist (from current Supabase schema)
    try {
      const tablesTest = await neonQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('thiet_bi', 'nhan_vien', 'yeu_cau_sua_chua')
        ORDER BY table_name
      `)
      queries.push({
        name: 'Tables Check',
        success: true,
        result: tablesTest.rows.map(row => row.table_name)
      })
    } catch (error: any) {
      queries.push({
        name: 'Tables Check',
        success: false,
        error: error.message
      })
    }

    // Test 3: Performance test
    const startTime = Date.now()
    try {
      await neonQuery('SELECT COUNT(*) as connection_test FROM generate_series(1, 1000)')
      const endTime = Date.now()
      queries.push({
        name: 'Performance Test',
        success: true,
        result: `${endTime - startTime}ms`
      })
    } catch (error: any) {
      queries.push({
        name: 'Performance Test',
        success: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Neon connection test completed',
      connection: connectionTest.data,
      queries: queries,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Neon test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Lỗi test kết nối Neon'
    }, { status: 500 })
  }
}

// POST method for testing specific queries
export async function POST(request: NextRequest) {
  try {
    const { query, params } = await request.json()
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 })
    }

    const startTime = Date.now()
    const result = await neonQuery(query, params)
    const endTime = Date.now()

    return NextResponse.json({
      success: true,
      result: result.rows,
      rowCount: result.rowCount,
      executionTime: `${endTime - startTime}ms`,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Neon query test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
