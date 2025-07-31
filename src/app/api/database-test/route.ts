import { NextRequest, NextResponse } from 'next/server'
import { getEquipment, getUsers, getDatabaseInfo } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const dbInfo = getDatabaseInfo()
    
    // Test equipment query
    const equipmentResult = await getEquipment()
    
    // Test users query
    const usersResult = await getUsers()

    return NextResponse.json({
      success: true,
      message: `Database connection successful! Using ${dbInfo.mode.toUpperCase()}`,
      database: {
        mode: dbInfo.mode,
        isNeon: dbInfo.isNeon,
        isSupabase: dbInfo.isSupabase
      },
      data: {
        equipment: equipmentResult.data,
        users: usersResult.data,
        equipment_count: equipmentResult.count,
        user_count: usersResult.count
      },
      errors: {
        equipment_error: equipmentResult.error,
        users_error: usersResult.error
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Database test failed'
    }, { status: 500 })
  }
}
