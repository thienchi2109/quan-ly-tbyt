import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: SupabaseClient | null = null;
let supabaseError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseError = "Vui lòng cấu hình biến môi trường Supabase trong file .env.local (xem hướng dẫn ở các bước trước).";
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
          // Tối ưu hóa cho realtime subscriptions
          global: {
            headers: {
              'x-my-custom-header': 'QLTBYT-CDC-CANTHO',
            },
          },
          // Cấu hình database schema cho realtime
          db: {
            schema: 'public',
          },
        })
    } catch (e: any) {
        supabaseError = "Lỗi khởi tạo Supabase client: " + e.message;
    }
}

export { supabase, supabaseError };
