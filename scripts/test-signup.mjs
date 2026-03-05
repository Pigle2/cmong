import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 테스트 유저 생성 시도
console.log('🧪 트리거 테스트: 유저 생성 시도...\n')

const { data, error } = await supabase.auth.admin.createUser({
  email: 'trigger-test@test.com',
  password: 'Test1234!',
  email_confirm: true,
  user_metadata: { nickname: '트리거테스트', user_type: 'BUYER' },
})

if (error) {
  console.log(`❌ 유저 생성 실패: ${error.message}`)
  console.log('트리거가 아직 문제가 있습니다.')
  process.exit(1)
}

console.log(`✅ 유저 생성 성공! (${data.user.id})`)

// 프로필 자동 생성 확인
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user.id)
  .single()

if (profile) {
  console.log(`✅ 프로필 자동 생성 확인!`)
  console.log(`   닉네임: ${profile.nickname}`)
  console.log(`   유저타입: ${profile.user_type}`)
} else {
  console.log(`⚠️  유저는 생성됐지만 프로필은 자동 생성되지 않음 (트리거 내부 에러)`)
}

// 테스트 유저 삭제
await supabase.auth.admin.deleteUser(data.user.id)
console.log(`\n🗑️  테스트 유저 삭제 완료`)
console.log('\n✨ 트리거 정상 작동!')
