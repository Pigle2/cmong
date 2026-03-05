-- Chat rooms
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type TEXT NOT NULL DEFAULT 'INQUIRY' CHECK (room_type IN ('INQUIRY', 'ORDER')),
  service_id UUID REFERENCES services(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat participants
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')),
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_rooms_service ON chat_rooms(service_id);
CREATE INDEX idx_chat_rooms_order ON chat_rooms(order_id);
CREATE INDEX idx_chat_participants_room ON chat_participants(room_id);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
