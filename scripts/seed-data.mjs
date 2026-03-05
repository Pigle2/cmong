import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')
  process.exit(1)
}

// service_role key bypasses RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Helper: run SQL via PostgREST pg_net or a workaround
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  return res
}

// ======== Test Users ========
const TEST_USERS = [
  {
    email: 'seller1@test.com',
    password: 'Test1234!',
    nickname: '디자인마스터',
    user_type: 'SELLER',
    seller: {
      display_name: '디자인마스터',
      introduction: '10년 경력의 전문 디자이너입니다. 로고, 브랜딩, 웹디자인을 전문으로 합니다.',
      specialties: ['로고디자인', '브랜딩', '웹디자인', 'UI/UX'],
      grade: 'PRO',
    },
  },
  {
    email: 'seller2@test.com',
    password: 'Test1234!',
    nickname: '코딩장인',
    user_type: 'SELLER',
    seller: {
      display_name: '코딩장인',
      introduction: '풀스택 개발자입니다. React, Next.js, Node.js 전문. 빠르고 정확한 개발을 약속드립니다.',
      specialties: ['웹개발', 'React', 'Next.js', 'Node.js'],
      grade: 'GENERAL',
    },
  },
  {
    email: 'buyer1@test.com',
    password: 'Test1234!',
    nickname: '구매자김철수',
    user_type: 'BUYER',
  },
]

// ======== Sample Services ========
function buildServices(sellerIds, categories) {
  const cat = (slug) => categories.find((c) => c.slug === slug)?.id

  return [
    {
      seller_id: sellerIds[0],
      category_id: cat('design-logo-logo'),
      title: '감각적인 로고 디자인, 브랜드의 첫인상을 만들어드립니다',
      description: '안녕하세요, 10년 경력 디자이너입니다.\n\n브랜드 아이덴티티를 담은 로고를 제작해드립니다.\n- 다양한 시안 제공\n- 원본 AI 파일 제공\n- 명함, 간판 등 활용 가이드 포함\n\n카페, 레스토랑, 스타트업, 쇼핑몰 등 다양한 업종 경험이 있습니다.',
      status: 'ACTIVE',
      avg_rating: 4.8, review_count: 23, order_count: 45, view_count: 1200,
      packages: [
        { tier: 'STANDARD', name: '베이직 로고', description: '로고 시안 2개 + 1회 수정 + PNG 파일', price: 50000, work_days: 3, revision_count: 1 },
        { tier: 'DELUXE', name: '프로 로고', description: '로고 시안 4개 + 3회 수정 + AI/PNG/PDF 파일', price: 150000, work_days: 5, revision_count: 3 },
        { tier: 'PREMIUM', name: '프리미엄 로고', description: '로고 시안 6개 + 무제한 수정 + 모든 파일 + 브랜드 가이드', price: 300000, work_days: 7, revision_count: 99 },
      ],
      tags: ['로고', '브랜딩', 'CI', '로고디자인', '심볼'],
    },
    {
      seller_id: sellerIds[0],
      category_id: cat('design-web-website'),
      title: '반응형 웹사이트 디자인, 모바일까지 완벽하게',
      description: '모바일 퍼스트 반응형 웹디자인을 제공합니다.\n- Figma 작업\n- 프로토타입 포함\n- 개발 가이드 제공',
      status: 'ACTIVE',
      avg_rating: 4.9, review_count: 15, order_count: 28, view_count: 890,
      packages: [
        { tier: 'STANDARD', name: '단일 페이지', description: '랜딩페이지 1장 디자인 + 반응형', price: 100000, work_days: 3, revision_count: 2 },
        { tier: 'DELUXE', name: '5페이지', description: '메인+서브4 페이지 디자인 + 반응형 + 프로토타입', price: 300000, work_days: 7, revision_count: 3 },
        { tier: 'PREMIUM', name: '10페이지+', description: '풀사이트 디자인 + 반응형 + 프로토타입 + 개발가이드', price: 600000, work_days: 14, revision_count: 5 },
      ],
      tags: ['웹디자인', 'UI', 'UX', '반응형', '피그마'],
    },
    {
      seller_id: sellerIds[0],
      category_id: cat('design-logo-card'),
      title: '프리미엄 명함 디자인, 비즈니스의 격을 높여드립니다',
      description: '고급스러운 명함 디자인을 제작해드립니다.\n- 양면 디자인\n- 인쇄용 파일 제공 (AI, PDF)\n- 다양한 재질 추천',
      status: 'ACTIVE',
      avg_rating: 4.7, review_count: 31, order_count: 67, view_count: 2100,
      packages: [
        { tier: 'STANDARD', name: '기본 명함', description: '단면 명함 시안 2개 + PDF', price: 30000, work_days: 2, revision_count: 1 },
        { tier: 'DELUXE', name: '양면 명함', description: '양면 명함 시안 3개 + AI/PDF + 1회 수정', price: 60000, work_days: 3, revision_count: 2 },
        { tier: 'PREMIUM', name: '프리미엄 명함', description: '양면 명함 + 봉투 + 레터헤드 세트', price: 120000, work_days: 5, revision_count: 3 },
      ],
      tags: ['명함', '명함디자인', '비즈니스', '인쇄'],
    },
    {
      seller_id: sellerIds[0],
      category_id: cat('design-illust-character'),
      title: '귀엽고 개성있는 캐릭터 디자인 제작',
      description: '브랜드 마스코트, SNS 프로필, 이모티콘용 캐릭터를 만들어드립니다.\n- 컨셉 회의 포함\n- 다양한 포즈/표정 제작 가능\n- 상업적 사용 가능',
      status: 'ACTIVE',
      avg_rating: 4.6, review_count: 12, order_count: 19, view_count: 650,
      packages: [
        { tier: 'STANDARD', name: '기본 캐릭터', description: '캐릭터 1포즈 + PNG 파일', price: 80000, work_days: 5, revision_count: 2 },
        { tier: 'DELUXE', name: '캐릭터 세트', description: '캐릭터 3포즈 + 표정 3종 + AI/PNG', price: 200000, work_days: 7, revision_count: 3 },
        { tier: 'PREMIUM', name: '풀패키지', description: '캐릭터 5포즈 + 표정 5종 + 가이드라인', price: 400000, work_days: 14, revision_count: 5 },
      ],
      tags: ['캐릭터', '일러스트', '마스코트', '이모티콘'],
    },
    {
      seller_id: sellerIds[1],
      category_id: cat('it-web-homepage'),
      title: '워드프레스/Next.js 홈페이지 제작, 관리자 페이지 포함',
      description: '기업 홈페이지, 포트폴리오, 쇼핑몰을 제작합니다.\n- 반응형 웹\n- SEO 최적화\n- 관리자 페이지 포함\n- 6개월 무상 유지보수',
      status: 'ACTIVE',
      avg_rating: 4.5, review_count: 8, order_count: 15, view_count: 540,
      packages: [
        { tier: 'STANDARD', name: '원페이지', description: '원페이지 홈페이지 + 반응형 + 도메인 연결', price: 200000, work_days: 7, revision_count: 2 },
        { tier: 'DELUXE', name: '기업 홈페이지', description: '5페이지 + 관리자 + 게시판 + SEO', price: 500000, work_days: 14, revision_count: 3 },
        { tier: 'PREMIUM', name: '풀커스텀', description: '10페이지+ + 관리자 + DB + API + 유지보수 3개월', price: 1500000, work_days: 30, revision_count: 5 },
      ],
      tags: ['홈페이지', '웹개발', 'Next.js', 'WordPress', '반응형'],
    },
    {
      seller_id: sellerIds[1],
      category_id: cat('it-web-shop'),
      title: '쇼핑몰 제작, 결제 시스템까지 올인원',
      description: '카페24, 쇼피파이, 자체 개발 쇼핑몰을 만들어드립니다.\n- 상품 관리 시스템\n- PG 결제 연동\n- 주문/배송 관리\n- 모바일 최적화',
      status: 'ACTIVE',
      avg_rating: 4.3, review_count: 5, order_count: 9, view_count: 420,
      packages: [
        { tier: 'STANDARD', name: '기본 쇼핑몰', description: '카페24 기본 쇼핑몰 세팅 + 디자인 커스텀', price: 300000, work_days: 7, revision_count: 2 },
        { tier: 'DELUXE', name: '프로 쇼핑몰', description: '자체 쇼핑몰 + 결제연동 + 관리자', price: 1000000, work_days: 21, revision_count: 3 },
        { tier: 'PREMIUM', name: '엔터프라이즈', description: '풀커스텀 쇼핑몰 + ERP 연동 + 앱', price: 3000000, work_days: 45, revision_count: 5 },
      ],
      tags: ['쇼핑몰', '이커머스', '결제', '카페24'],
    },
    {
      seller_id: sellerIds[1],
      category_id: cat('it-app-cross'),
      title: 'React Native 크로스플랫폼 앱 개발',
      description: 'iOS/Android 동시 개발! React Native로 빠르고 효율적인 앱을 만들어드립니다.\n- 하나의 코드로 iOS + Android\n- 네이티브 수준의 성능',
      status: 'ACTIVE',
      avg_rating: 4.4, review_count: 3, order_count: 6, view_count: 310,
      packages: [
        { tier: 'STANDARD', name: 'MVP 앱', description: '핵심 기능 3개 + 로그인 + 기본 UI', price: 500000, work_days: 14, revision_count: 2 },
        { tier: 'DELUXE', name: '프로 앱', description: '기능 7개 + 푸시알림 + 관리자웹', price: 1500000, work_days: 30, revision_count: 3 },
        { tier: 'PREMIUM', name: '풀패키지', description: '전체 기능 + 서버 + 관리자 + 스토어등록', price: 3000000, work_days: 60, revision_count: 5 },
      ],
      tags: ['앱개발', 'React Native', 'iOS', 'Android'],
    },
    {
      seller_id: sellerIds[1],
      category_id: cat('it-data-chatbot'),
      title: 'ChatGPT API 연동 AI 챗봇 개발',
      description: '비즈니스에 맞는 AI 챗봇을 개발해드립니다.\n- OpenAI API 연동\n- 커스텀 학습 데이터 적용\n- 웹/카카오톡/슬랙 연동',
      status: 'ACTIVE',
      avg_rating: 4.9, review_count: 7, order_count: 12, view_count: 780,
      packages: [
        { tier: 'STANDARD', name: '기본 챗봇', description: 'FAQ 기반 챗봇 + 웹 위젯', price: 300000, work_days: 7, revision_count: 2 },
        { tier: 'DELUXE', name: 'AI 챗봇', description: 'GPT 연동 + 커스텀 데이터 + 카카오톡', price: 800000, work_days: 14, revision_count: 3 },
        { tier: 'PREMIUM', name: '엔터프라이즈', description: '멀티채널 + RAG + 관리자 대시보드', price: 2000000, work_days: 30, revision_count: 5 },
      ],
      tags: ['챗봇', 'AI', 'ChatGPT', 'OpenAI'],
    },
    {
      seller_id: sellerIds[0],
      category_id: cat('design-print-flyer'),
      title: '눈에 띄는 전단지·포스터 디자인',
      description: '행사, 이벤트, 매장 홍보용 전단지와 포스터를 제작합니다.\n- 인쇄용 고해상도 파일\n- 다양한 사이즈 대응',
      status: 'ACTIVE',
      avg_rating: 4.5, review_count: 18, order_count: 35, view_count: 950,
      packages: [
        { tier: 'STANDARD', name: '전단지 1종', description: 'A4 전단지 단면 + PDF', price: 40000, work_days: 2, revision_count: 1 },
        { tier: 'DELUXE', name: '전단지 양면', description: 'A4 양면 + 2회 수정 + AI/PDF', price: 80000, work_days: 3, revision_count: 2 },
        { tier: 'PREMIUM', name: '포스터 세트', description: 'A1 포스터 + A4 전단지 + SNS 배너', price: 150000, work_days: 5, revision_count: 3 },
      ],
      tags: ['전단지', '포스터', '인쇄물', '홍보물'],
    },
    {
      seller_id: sellerIds[1],
      category_id: cat('it-server-aws'),
      title: 'AWS 서버 구축 및 배포 자동화',
      description: 'AWS 인프라 설계부터 배포 자동화까지 원스톱으로 해결해드립니다.\n- EC2, RDS, S3, CloudFront 구축\n- Docker + CI/CD 파이프라인',
      status: 'ACTIVE',
      avg_rating: 4.7, review_count: 4, order_count: 8, view_count: 290,
      packages: [
        { tier: 'STANDARD', name: '기본 구축', description: 'EC2 + RDS + 도메인 연결', price: 200000, work_days: 3, revision_count: 1 },
        { tier: 'DELUXE', name: '프로 구축', description: '전체 AWS 구축 + Docker + CI/CD', price: 500000, work_days: 7, revision_count: 2 },
        { tier: 'PREMIUM', name: '풀 인프라', description: '마이크로서비스 + 오토스케일링 + 모니터링', price: 1500000, work_days: 14, revision_count: 3 },
      ],
      tags: ['AWS', '서버', 'DevOps', 'Docker'],
    },
  ]
}

const SAMPLE_REVIEWS = [
  { rating: 5, quality: 5, communication: 5, delivery: 5, content: '정말 만족스러운 결과물이었습니다! 소통도 빠르고 수정도 꼼꼼하게 해주셨어요. 강력 추천합니다.' },
  { rating: 5, quality: 5, communication: 5, delivery: 4, content: '퀄리티가 기대 이상이에요. 다음에도 꼭 의뢰하겠습니다.' },
  { rating: 4, quality: 4, communication: 5, delivery: 4, content: '전체적으로 만족합니다. 소통이 원활해서 좋았어요.' },
  { rating: 5, quality: 5, communication: 4, delivery: 5, content: '납기도 빠르고 결과물도 훌륭합니다. 감사합니다!' },
  { rating: 4, quality: 4, communication: 4, delivery: 5, content: '가격 대비 퀄리티가 좋습니다. 재구매 의사 있어요.' },
  { rating: 5, quality: 5, communication: 5, delivery: 5, content: '정성스러운 작업에 감동했습니다. 주변에 추천하고 있어요.' },
  { rating: 4, quality: 5, communication: 4, delivery: 3, content: '디자인은 정말 좋았는데 일정이 좀 밀렸어요. 그래도 결과물은 만족!' },
  { rating: 5, quality: 5, communication: 5, delivery: 5, content: '세 번째 의뢰인데 매번 만족합니다. 최고의 전문가예요.' },
]

async function main() {
  console.log('🚀 테스트 데이터 시딩 시작...\n')

  // Step 1: Drop the trigger temporarily so user creation doesn't fail
  console.log('⚙️  트리거 비활성화 중...')

  // We need to create a helper function to run arbitrary SQL
  // First, create a temporary RPC function
  const createHelperRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: 'SELECT 1' }),
  })

  // If exec_sql doesn't exist, we'll try a different approach
  // Create users directly, handling the trigger error
  console.log('\n👤 테스트 유저 생성 중...')
  const userIds = []

  for (const user of TEST_USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find((u) => u.email === user.email)

    if (existing) {
      console.log(`  ✅ ${user.email} (이미 존재)`)
      userIds.push(existing.id)

      // Ensure profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', existing.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: existing.id,
          email: user.email,
          nickname: user.nickname,
          user_type: user.user_type,
        })
        console.log(`    📝 프로필 수동 생성`)
      }
      continue
    }

    // Try creating user - if trigger fails, we handle it
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (error) {
      // If "Database error", the user might have been created but trigger failed
      // Let's check
      const { data: retryList } = await supabase.auth.admin.listUsers()
      const retryUser = retryList?.users?.find((u) => u.email === user.email)

      if (retryUser) {
        console.log(`  ⚠️  ${user.email} (유저 생성됨, 트리거 실패 - 프로필 수동 생성)`)
        userIds.push(retryUser.id)

        await supabase.from('profiles').upsert({
          id: retryUser.id,
          email: user.email,
          nickname: user.nickname,
          user_type: user.user_type,
        }, { onConflict: 'id' })
        continue
      }

      console.error(`  ❌ ${user.email}: ${error.message}`)
      console.log('  💡 Supabase SQL Editor에서 다음 SQL을 실행해주세요:')
      console.log('     DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;')
      console.log('  그 후 이 스크립트를 다시 실행해주세요.')
      process.exit(1)
    }

    console.log(`  ✅ ${user.email} (${user.nickname})`)
    userIds.push(data.user.id)

    // Ensure profile exists (in case trigger created it, upsert is safe)
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: user.email,
      nickname: user.nickname,
      user_type: user.user_type,
    }, { onConflict: 'id' })
  }

  // Step 2: Update profiles to SELLER and create seller profiles
  console.log('\n🏪 판매자 프로필 설정 중...')
  for (let i = 0; i < TEST_USERS.length; i++) {
    const user = TEST_USERS[i]
    if (user.user_type === 'SELLER' && user.seller) {
      await supabase
        .from('profiles')
        .update({ user_type: 'SELLER' })
        .eq('id', userIds[i])

      const { error } = await supabase.from('seller_profiles').upsert(
        {
          user_id: userIds[i],
          display_name: user.seller.display_name,
          introduction: user.seller.introduction,
          specialties: user.seller.specialties,
          grade: user.seller.grade,
        },
        { onConflict: 'user_id' }
      )

      if (error) {
        console.error(`  ❌ ${user.seller.display_name}: ${error.message}`)
      } else {
        console.log(`  ✅ ${user.seller.display_name}`)
      }
    }
  }

  // Step 3: Get categories
  const { data: categories } = await supabase.from('categories').select('id, slug')
  if (!categories || categories.length === 0) {
    console.error('❌ 카테고리가 없습니다. seed.sql을 먼저 실행해주세요.')
    process.exit(1)
  }
  console.log(`\n📂 카테고리 ${categories.length}개 확인`)

  // Step 4: Create services
  const sellerIds = [userIds[0], userIds[1]]
  const services = buildServices(sellerIds, categories)

  console.log('\n📦 서비스 생성 중...')
  const createdServiceIds = []

  for (const svc of services) {
    const { packages, tags, ...serviceData } = svc

    // Skip if category not found
    if (!serviceData.category_id) {
      console.error(`  ⚠️  카테고리 없음, 건너뜀: "${serviceData.title.substring(0, 30)}..."`)
      continue
    }

    // Check if service already exists
    const { data: existing } = await supabase
      .from('services')
      .select('id')
      .eq('title', serviceData.title)
      .single()

    if (existing) {
      console.log(`  ✅ "${serviceData.title.substring(0, 30)}..." (이미 존재)`)
      createdServiceIds.push(existing.id)
      continue
    }

    const { data: newService, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()

    if (error) {
      console.error(`  ❌ "${serviceData.title.substring(0, 30)}...": ${error.message}`)
      continue
    }

    // Insert packages
    const pkgData = packages.map((p) => ({ ...p, service_id: newService.id }))
    const { error: pkgErr } = await supabase.from('service_packages').insert(pkgData)
    if (pkgErr) console.error(`    패키지 에러: ${pkgErr.message}`)

    // Insert tags
    if (tags?.length) {
      const tagData = tags.map((t) => ({ service_id: newService.id, tag: t }))
      await supabase.from('service_tags').insert(tagData)
    }

    console.log(`  ✅ "${serviceData.title.substring(0, 30)}..." (패키지 ${packages.length}개)`)
    createdServiceIds.push(newService.id)
  }

  // Step 5: Create sample orders & reviews
  const buyerId = userIds[2]
  console.log('\n📝 주문 + 리뷰 생성 중...')

  for (let i = 0; i < Math.min(createdServiceIds.length, SAMPLE_REVIEWS.length); i++) {
    const serviceId = createdServiceIds[i]

    const { data: pkg } = await supabase
      .from('service_packages')
      .select('id, price, work_days')
      .eq('service_id', serviceId)
      .eq('tier', 'STANDARD')
      .single()

    if (!pkg) continue

    const { data: svc } = await supabase
      .from('services')
      .select('seller_id')
      .eq('id', serviceId)
      .single()

    if (!svc) continue

    // Check existing order
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('service_id', serviceId)
      .eq('status', 'COMPLETED')
      .single()

    if (existingOrder) {
      console.log(`  ✅ 주문+리뷰 ${i + 1} (이미 존재)`)
      continue
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + pkg.work_days)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        seller_id: svc.seller_id,
        service_id: serviceId,
        package_id: pkg.id,
        status: 'COMPLETED',
        requirements: '테스트 주문입니다.',
        total_amount: pkg.price,
        due_date: dueDate.toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderErr) {
      console.error(`  ❌ 주문 ${i + 1}: ${orderErr.message}`)
      continue
    }

    const r = SAMPLE_REVIEWS[i]
    const { error: reviewErr } = await supabase.from('reviews').insert({
      order_id: order.id,
      service_id: serviceId,
      reviewer_id: buyerId,
      seller_id: svc.seller_id,
      rating: r.rating,
      quality_rating: r.quality,
      communication_rating: r.communication,
      delivery_rating: r.delivery,
      content: r.content,
    })

    if (reviewErr) {
      console.error(`  ❌ 리뷰 ${i + 1}: ${reviewErr.message}`)
    } else {
      console.log(`  ✅ 주문+리뷰 ${i + 1} (⭐${r.rating})`)
    }
  }

  console.log('\n✨ 시딩 완료!\n')
  console.log('=== 테스트 계정 정보 ===')
  console.log('┌──────────────────────┬──────────────┬────────┐')
  console.log('│ 이메일               │ 비밀번호     │ 역할   │')
  console.log('├──────────────────────┼──────────────┼────────┤')
  console.log('│ seller1@test.com     │ Test1234!    │ 판매자 │')
  console.log('│ seller2@test.com     │ Test1234!    │ 판매자 │')
  console.log('│ buyer1@test.com      │ Test1234!    │ 구매자 │')
  console.log('└──────────────────────┴──────────────┴────────┘')
}

main().catch(console.error)
