-- chat_participants 테이블에 나가기/재입장 관련 컬럼 추가
ALTER TABLE chat_participants ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE chat_participants ADD COLUMN left_at TIMESTAMPTZ;
ALTER TABLE chat_participants ADD COLUMN rejoined_at TIMESTAMPTZ;

-- 인덱스: 활성 참여자 조회 최적화
CREATE INDEX idx_participants_user_active ON chat_participants(user_id, is_active);

-- chat_messages의 sender_id를 NULL 허용으로 변경 (시스템 메시지용)
ALTER TABLE chat_messages ALTER COLUMN sender_id DROP NOT NULL;
