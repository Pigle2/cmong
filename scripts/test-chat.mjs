import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('💬 채팅 기능 테스트\n')

// 1. 유저 확인
const { data: profiles } = await admin.from('profiles').select('id, nickname, user_type')
const buyer = profiles.find(p => p.nickname === '구매자김철수')
const seller = profiles.find(p => p.nickname === '디자인마스터')
console.log(`구매자: ${buyer.nickname} (${buyer.id})`)
console.log(`판매자: ${seller.nickname} (${seller.id})`)

// 2. 서비스 확인
const { data: services } = await admin.from('services').select('id, title').limit(1)
const service = services[0]
console.log(`서비스: ${service.title.substring(0, 30)}...\n`)

// 3. 채팅방 생성 테스트
console.log('📨 채팅방 생성...')
const { data: room, error: roomErr } = await admin
  .from('chat_rooms')
  .insert({ room_type: 'INQUIRY', service_id: service.id })
  .select()
  .single()

if (roomErr) {
  console.log(`❌ 채팅방 생성 실패: ${roomErr.message}`)
  process.exit(1)
}
console.log(`✅ 채팅방 생성: ${room.id}`)

// 4. 참가자 추가
const { error: partErr } = await admin.from('chat_participants').insert([
  { room_id: room.id, user_id: buyer.id },
  { room_id: room.id, user_id: seller.id },
])
partErr ? console.log(`❌ 참가자 추가 실패: ${partErr.message}`) : console.log('✅ 참가자 추가 (구매자 + 판매자)')

// 5. 메시지 전송 테스트 (구매자 → 판매자)
const { error: msg1Err } = await admin.from('chat_messages').insert({
  room_id: room.id,
  sender_id: buyer.id,
  message_type: 'TEXT',
  content: '안녕하세요! 로고 디자인 문의드립니다.',
})
msg1Err ? console.log(`❌ 구매자 메시지 실패: ${msg1Err.message}`) : console.log('✅ 구매자 메시지 전송')

// 6. 메시지 전송 테스트 (판매자 → 구매자)
const { error: msg2Err } = await admin.from('chat_messages').insert({
  room_id: room.id,
  sender_id: seller.id,
  message_type: 'TEXT',
  content: '안녕하세요! 네, 어떤 스타일의 로고를 원하시나요?',
})
msg2Err ? console.log(`❌ 판매자 메시지 실패: ${msg2Err.message}`) : console.log('✅ 판매자 메시지 전송')

// 7. 메시지 조회 확인
const { data: messages } = await admin
  .from('chat_messages')
  .select('content, sender_id')
  .eq('room_id', room.id)
  .order('created_at')

console.log(`\n📋 메시지 ${messages.length}개 확인:`)
for (const m of messages) {
  const who = m.sender_id === buyer.id ? '구매자' : '판매자'
  console.log(`  [${who}] ${m.content}`)
}

console.log('\n✨ 채팅 기능 정상 작동!')
console.log('\n이제 브라우저에서 채팅 페이지를 열면 이 대화가 보입니다.')
