// Try creating user via raw HTTP to get detailed error
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Method 1: Try via GoTrue admin API directly
console.log('=== GoTrue Admin API로 유저 생성 시도 ===\n')

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({
    email: 'test-debug@test.com',
    password: 'Test1234!',
    email_confirm: true,
  }),
})

const body = await res.text()
console.log(`Status: ${res.status}`)
console.log(`Response: ${body}\n`)

// If user was created, clean up
if (res.ok) {
  const user = JSON.parse(body)
  console.log(`유저 생성 성공! ID: ${user.id}`)

  // Check if profile was created
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
    {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  )
  const profiles = await profileRes.json()
  console.log(`프로필 자동 생성: ${profiles.length > 0 ? '✅ 예' : '❌ 아니오'}`)

  // Delete test user
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  console.log('테스트 유저 삭제 완료')
} else {
  console.log('유저 생성 실패')

  // Check if the trigger function exists by checking profiles table structure
  console.log('\n=== 프로필 테이블 구조 확인 ===')
  const schemaRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?limit=0`,
    {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact',
      },
    }
  )
  console.log(`프로필 테이블: ${schemaRes.status === 200 ? '존재' : '없음'}`)
}
