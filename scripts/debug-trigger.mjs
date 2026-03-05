import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 유저 생성
const { data } = await supabase.auth.admin.createUser({
  email: 'debug-test@test.com',
  password: 'Test1234!',
  email_confirm: true,
  user_metadata: { nickname: '디버그', user_type: 'BUYER' },
})

const userId = data.user.id
console.log('유저 ID:', userId)
console.log('user_metadata:', JSON.stringify(data.user.user_metadata))
console.log('app_metadata:', JSON.stringify(data.user.app_metadata))

// 수동으로 프로필 INSERT 시도해서 어떤 에러인지 확인
const { error: insertErr } = await supabase.from('profiles').insert({
  id: userId,
  email: 'debug-test@test.com',
  nickname: '디버그',
  user_type: 'BUYER',
})

if (insertErr) {
  console.log('\n프로필 수동 INSERT 에러:', insertErr.message)
} else {
  console.log('\n✅ 프로필 수동 INSERT 성공 - 트리거 함수 내부 문제')
  // 삭제
  await supabase.from('profiles').delete().eq('id', userId)
}

// 삭제
await supabase.auth.admin.deleteUser(userId)
console.log('테스트 유저 삭제 완료')
