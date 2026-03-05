import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Check tables
const tables = ['profiles', 'seller_profiles', 'categories', 'services', 'service_packages', 'orders', 'reviews']

for (const table of tables) {
  const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    console.log(`❌ ${table}: ${error.message}`)
  } else {
    console.log(`✅ ${table}: ${count}행`)
  }
}

// Check if trigger exists
const { data, error } = await supabase.rpc('handle_new_user').catch(() => ({}))
console.log('\n트리거 함수 확인:', error?.message || '존재')
