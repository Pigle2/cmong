-- Favorites (wishlist)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

-- Indexes
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_service ON favorites(service_id);
