import pg from 'pg'

// Try multiple connection methods to reach the Supabase database
const PROJECT_REF = 'myphwleouugkvlgvvrlh'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Supabase connection pooler regions to try
const REGIONS = [
  'ap-northeast-2',  // Seoul
  'ap-northeast-1',  // Tokyo
  'ap-southeast-1',  // Singapore
  'us-east-1',       // Virginia
  'us-west-1',       // Oregon
  'eu-west-1',       // Ireland
  'eu-central-1',    // Frankfurt
]

async function tryConnect(connectionString, label) {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 })
  try {
    await client.connect()
    console.log(`✅ 연결 성공: ${label}`)
    return client
  } catch (e) {
    console.log(`  ❌ ${label}: ${e.message.substring(0, 80)}`)
    return null
  }
}

async function main() {
  console.log('🔗 Supabase 데이터베이스 연결 시도 중...\n')

  let client = null

  // Method 1: Direct connection via Supavisor pooler with JWT auth
  for (const region of REGIONS) {
    const poolerHost = `aws-0-${region}.pooler.supabase.com`
    const connStr = `postgresql://postgres.${PROJECT_REF}:${SERVICE_ROLE_KEY}@${poolerHost}:6543/postgres`
    client = await tryConnect(connStr, `pooler (${region})`)
    if (client) break
  }

  // Method 2: Direct connection
  if (!client) {
    const directStr = `postgresql://postgres.${PROJECT_REF}:${SERVICE_ROLE_KEY}@db.${PROJECT_REF}.supabase.co:5432/postgres`
    client = await tryConnect(directStr, 'direct')
  }

  if (!client) {
    console.log('\n❌ 데이터베이스에 직접 연결할 수 없습니다.')
    console.log('Supabase SQL Editor에서 아래 SQL을 실행해주세요:\n')
    console.log('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;')
    process.exit(1)
  }

  try {
    // Drop the problematic trigger
    console.log('\n⚙️  트리거 삭제 중...')
    await client.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;')
    console.log('✅ on_auth_user_created 트리거 삭제 완료!')

    // Verify
    const res = await client.query(`
      SELECT tgname FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
    `)
    console.log(`검증: 트리거 ${res.rows.length === 0 ? '삭제 확인' : '아직 존재!'}`)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
