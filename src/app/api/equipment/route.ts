import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { supabase, DATABASE_MODE } from '@/lib/supabase'

// Create Neon connection (server-side only)
async function createNeonConnection() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
}

// Get equipment data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const khoa_phong = searchParams.get('khoa_phong')
    const search = searchParams.get('search')

    if (DATABASE_MODE === 'neon') {
      // Use Neon
      const pool = await createNeonConnection()
      const client = await pool.connect()
      
      try {
        let query = `
          SELECT 
            id, ma_thiet_bi, ten_thiet_bi, model, hang_san_xuat,
            khoa_phong_quan_ly, tinh_trang_hien_tai, tinh_trang,
            ngay_nhap, gia_tri, created_at
          FROM thiet_bi
        `
        const conditions: string[] = []
        const params: any[] = []
        let paramIndex = 1

        if (khoa_phong) {
          conditions.push(`khoa_phong_quan_ly = $${paramIndex}`)
          params.push(khoa_phong)
          paramIndex++
        }

        if (search) {
          conditions.push(`(ten_thiet_bi ILIKE $${paramIndex} OR ma_thiet_bi ILIKE $${paramIndex})`)
          params.push(`%${search}%`)
          paramIndex++
        }

        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`
        }

        query += ` ORDER BY created_at DESC`

        const result = await client.query(query, params)
        
        return NextResponse.json({
          success: true,
          data: result.rows,
          count: result.rowCount,
          database: 'Neon',
          mode: DATABASE_MODE
        })
      } finally {
        client.release()
        await pool.end()
      }
    } else {
      // Use Supabase
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      let query = supabase
        .from('thiet_bi')
        .select(`
          id, ma_thiet_bi, ten_thiet_bi, model, hang_san_xuat,
          khoa_phong_quan_ly, tinh_trang_hien_tai, tinh_trang,
          ngay_nhap, gia_tri, created_at
        `)

      if (khoa_phong) {
        query = query.eq('khoa_phong_quan_ly', khoa_phong)
      }

      if (search) {
        query = query.or(`ten_thiet_bi.ilike.%${search}%,ma_thiet_bi.ilike.%${search}%`)
      }

      const { data, error, count } = await query.order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: data,
        count: count,
        database: 'Supabase',
        mode: DATABASE_MODE
      })
    }

  } catch (error: any) {
    console.error('Equipment API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      database: DATABASE_MODE
    }, { status: 500 })
  }
}

// Create new equipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ma_thiet_bi, ten_thiet_bi, model, hang_san_xuat, khoa_phong_quan_ly, tinh_trang, ngay_nhap, gia_tri } = body

    if (DATABASE_MODE === 'neon') {
      // Use Neon
      const pool = await createNeonConnection()
      const client = await pool.connect()
      
      try {
        const query = `
          INSERT INTO thiet_bi (ma_thiet_bi, ten_thiet_bi, model, hang_san_xuat, khoa_phong_quan_ly, tinh_trang, ngay_nhap, gia_tri) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          RETURNING *
        `
        
        const result = await client.query(query, [ma_thiet_bi, ten_thiet_bi, model, hang_san_xuat, khoa_phong_quan_ly, tinh_trang, ngay_nhap, gia_tri])
        
        return NextResponse.json({
          success: true,
          data: result.rows[0],
          database: 'Neon',
          mode: DATABASE_MODE
        })
      } finally {
        client.release()
        await pool.end()
      }
    } else {
      // Use Supabase
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('thiet_bi')
        .insert([{ ma_thiet_bi, ten_thiet_bi, model, hang_san_xuat, khoa_phong_quan_ly, tinh_trang, ngay_nhap, gia_tri }])
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: data[0],
        database: 'Supabase',
        mode: DATABASE_MODE
      })
    }

  } catch (error: any) {
    console.error('Equipment create error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      database: DATABASE_MODE
    }, { status: 500 })
  }
}
