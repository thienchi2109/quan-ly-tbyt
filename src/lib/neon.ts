import { Pool } from 'pg'
import { neon } from '@neondatabase/serverless'

// Neon client configuration
let neonClient: Pool | null = null
let neonError: string | null = null

// Environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
const neonApiKey = process.env.NEON_API_KEY

if (!databaseUrl) {
  neonError = "Vui lòng cấu hình DATABASE_URL trong file .env.local"
} else {
  try {
    // Create connection pool for better performance
    neonClient = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }, // Neon requires SSL
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Connection timeout
    })

    // Test connection on initialization
    neonClient.on('connect', () => {
      console.log('✅ Connected to Neon database')
    })

    neonClient.on('error', (err) => {
      console.error('❌ Neon database error:', err)
    })

  } catch (e: any) {
    neonError = "Lỗi khởi tạo Neon client: " + e.message
  }
}

// Serverless function for edge environments (Cloudflare Workers)
const neonServerless = databaseUrl ? neon(databaseUrl) : null

// Query wrapper with error handling
export async function neonQuery(text: string, params?: any[]) {
  if (!neonClient) {
    throw new Error(neonError || 'Neon client not initialized')
  }

  const client = await neonClient.connect()
  try {
    const result = await client.query(text, params)
    return result
  } catch (error) {
    console.error('Neon query error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Serverless query for edge environments
export async function neonServerlessQuery(text: string, params?: any[]) {
  if (!neonServerless) {
    throw new Error('Neon serverless client not initialized')
  }

  try {
    const result = await neonServerless(text, params)
    return { rows: result }
  } catch (error) {
    console.error('Neon serverless query error:', error)
    throw error
  }
}

// Connection test function
export async function testNeonConnection() {
  try {
    const result = await neonQuery('SELECT 1 as test, NOW() as timestamp')
    return {
      success: true,
      data: result.rows[0],
      message: 'Kết nối Neon thành công'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Lỗi kết nối Neon'
    }
  }
}

// Close connection pool (for cleanup)
export async function closeNeonConnection() {
  if (neonClient) {
    await neonClient.end()
    console.log('🔌 Neon connection pool closed')
  }
}

export { neonClient, neonError, neonServerless }
