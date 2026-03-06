-- RLS 정책 수정: INSERT 정책에 인증 요구 추가
-- 기존 WITH CHECK (true) 정책을 auth.uid() IS NOT NULL 로 강화

-- 1. chat_rooms INSERT 정책 강화
-- 문제: 인증되지 않은 사용자도 채팅방 생성 가능
DROP POLICY IF EXISTS "chat_rooms_insert" ON chat_rooms;
CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. chat_participants INSERT 정책 강화
-- 문제: 누구나 다른 사용자를 채팅방에 추가 가능
DROP POLICY IF EXISTS "chat_participants_insert" ON chat_participants;
CREATE POLICY "chat_participants_insert" ON chat_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. notifications INSERT 정책 강화
-- 문제: 인증 없이 알림 전송 가능
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
