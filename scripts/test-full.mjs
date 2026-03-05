import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, ANON_KEY)
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

let passed = 0
let failed = 0

function ok(label) { console.log(`  ✅ ${label}`); passed++ }
function fail(label, err) { console.log(`  ❌ ${label}: ${err}`); failed++ }

// ===== 1. 인증 테스트 =====
console.log('\n🔐 인증 테스트')

// 구매자 로그인
const { data: buyerAuth, error: buyerErr } = await supabase.auth.signInWithPassword({
  email: 'buyer1@test.com', password: 'Test1234!'
})
buyerErr ? fail('구매자 로그인', buyerErr.message) : ok('구매자 로그인')

// 판매자 로그인
const { data: sellerAuth, error: sellerErr } = await supabase.auth.signInWithPassword({
  email: 'seller1@test.com', password: 'Test1234!'
})
sellerErr ? fail('판매자 로그인', sellerErr.message) : ok('판매자 로그인')

// ===== 2. 프로필 테스트 =====
console.log('\n👤 프로필 테스트')

const { data: profiles } = await admin.from('profiles').select('*')
profiles?.length >= 3 ? ok(`프로필 ${profiles.length}개 존재`) : fail('프로필', `${profiles?.length}개`)

const { data: sellerProfiles } = await admin.from('seller_profiles').select('*')
sellerProfiles?.length >= 2 ? ok(`판매자 프로필 ${sellerProfiles.length}개`) : fail('판매자 프로필', `${sellerProfiles?.length}개`)

// ===== 3. 카테고리 테스트 =====
console.log('\n📂 카테고리 테스트')

const { data: categories } = await admin.from('categories').select('*')
categories?.length >= 100 ? ok(`카테고리 ${categories.length}개`) : fail('카테고리', `${categories?.length}개`)

// ===== 4. 서비스 테스트 =====
console.log('\n📦 서비스 테스트')

const { data: services } = await admin.from('services').select('*, packages:service_packages(*), tags:service_tags(*)')
services?.length >= 10 ? ok(`서비스 ${services.length}개`) : fail('서비스', `${services?.length}개`)

const allHavePackages = services?.every(s => s.packages?.length === 3)
allHavePackages ? ok('모든 서비스에 패키지 3개씩') : fail('패키지', '일부 서비스에 패키지 부족')

const { data: tags } = await admin.from('service_tags').select('*')
tags?.length > 0 ? ok(`태그 ${tags.length}개`) : fail('태그', '0개')

// ===== 5. 서비스 API 테스트 =====
console.log('\n🌐 API 테스트')

const apiRes = await fetch('https://cmong-chi.vercel.app/api/services')
const apiData = await apiRes.json()
apiData?.success && apiData?.data?.length > 0
  ? ok(`서비스 API (${apiData.data.length}개 반환)`)
  : fail('서비스 API', JSON.stringify(apiData).substring(0, 100))

const catRes = await fetch('https://cmong-chi.vercel.app/api/categories')
const catData = await catRes.json()
catData?.success ? ok('카테고리 API') : fail('카테고리 API', JSON.stringify(catData).substring(0, 100))

// ===== 6. 주문 테스트 =====
console.log('\n📋 주문 테스트')

const { data: orders } = await admin.from('orders').select('*')
orders?.length >= 8 ? ok(`주문 ${orders.length}개`) : fail('주문', `${orders?.length}개`)

const completedOrders = orders?.filter(o => o.status === 'COMPLETED')
completedOrders?.length >= 8 ? ok(`완료 주문 ${completedOrders.length}개`) : fail('완료 주문', `${completedOrders?.length}개`)

// ===== 7. 리뷰 테스트 =====
console.log('\n⭐ 리뷰 테스트')

const { data: reviews } = await admin.from('reviews').select('*')
reviews?.length >= 8 ? ok(`리뷰 ${reviews.length}개`) : fail('리뷰', `${reviews?.length}개`)

// ===== 8. 페이지 접근 테스트 =====
console.log('\n🖥️  페이지 접근 테스트')

const pages = [
  ['/', '홈페이지'],
  ['/login', '로그인'],
  ['/register', '회원가입'],
  ['/services', '서비스 검색'],
  ['/chat', '채팅'],
  ['/orders', '주문 목록'],
  ['/mypage', '마이페이지'],
  ['/seller/dashboard', '판매자 대시보드'],
]

for (const [path, label] of pages) {
  const res = await fetch(`https://cmong-chi.vercel.app${path}`, { redirect: 'manual' })
  // 200 or 307 (redirect to login) are both acceptable
  ;[200, 307].includes(res.status) ? ok(`${label} (${res.status})`) : fail(label, `HTTP ${res.status}`)
}

// ===== 9. 서비스 상세 페이지 =====
console.log('\n📄 서비스 상세 테스트')

if (services?.length > 0) {
  const svcId = services[0].id
  const detailRes = await fetch(`https://cmong-chi.vercel.app/services/${svcId}`)
  detailRes.status === 200 ? ok('서비스 상세 페이지') : fail('서비스 상세', `HTTP ${detailRes.status}`)

  const apiDetailRes = await fetch(`https://cmong-chi.vercel.app/api/services/${svcId}`)
  const apiDetail = await apiDetailRes.json()
  apiDetail?.success ? ok('서비스 상세 API') : fail('서비스 상세 API', apiDetail?.error)
}

// ===== 10. 신규 회원가입 플로우 테스트 =====
console.log('\n🆕 회원가입 플로우 테스트')

const { data: newUser, error: signUpErr } = await supabase.auth.signUp({
  email: 'flowtest@test.com',
  password: 'Test1234!',
  options: { data: { nickname: '플로우테스트', user_type: 'BUYER' } }
})
signUpErr ? fail('회원가입', signUpErr.message) : ok('회원가입')

if (newUser?.user) {
  // 잠시 대기 후 프로필 확인
  await new Promise(r => setTimeout(r, 1000))
  const { data: newProfile } = await admin.from('profiles').select('*').eq('id', newUser.user.id).single()
  newProfile ? ok(`프로필 자동 생성 (닉네임: ${newProfile.nickname})`) : fail('프로필 자동 생성', '프로필 없음')

  // 정리
  await admin.auth.admin.deleteUser(newUser.user.id)
  ok('테스트 유저 정리')
}

// ===== 결과 =====
console.log('\n' + '='.repeat(40))
console.log(`📊 테스트 결과: ${passed}개 통과 / ${failed}개 실패 (총 ${passed + failed}개)`)
console.log('='.repeat(40))

if (failed > 0) process.exit(1)
