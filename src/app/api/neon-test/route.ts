import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Simple Neon connection test
export async function GET(request: NextRequest) {
  let client: Pool | null = null
  
  try {
    // Create connection to Neon
    client = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // Test basic connection
    const connectionTest = await client.query('SELECT NOW() as current_time, version() as postgres_version')
    
    // Test equipment data
    const equipmentTest = await client.query('SELECT ma_thiet_bi, ten_thiet_bi, khoa_phong_quan_ly FROM thiet_bi ORDER BY created_at DESC')
    
    // Test user data  
    const userTest = await client.query('SELECT username, full_name, role, khoa_phong FROM nhan_vien ORDER BY created_at DESC')

    return NextResponse.json({
      success: true,
      message: 'Neon connection successful! 🎉',
      database: 'Neon PostgreSQL',
      connection: connectionTest.rows[0],
      data: {
        equipment: equipmentTest.rows,
        users: userTest.rows,
        equipment_count: equipmentTest.rowCount,
        user_count: userTest.rowCount
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Neon connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to connect to Neon database',
      database: 'Neon PostgreSQL'
    }, { status: 500 })
  } finally {
    if (client) {
      await client.end()
    }
  }
}
