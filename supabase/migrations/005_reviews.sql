-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  service_id UUID NOT NULL REFERENCES services(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  rating NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  quality_rating NUMERIC(2,1) NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating NUMERIC(2,1) NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
  delivery_rating NUMERIC(2,1) NOT NULL CHECK (delivery_rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  seller_reply TEXT,
  seller_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_service ON reviews(service_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
