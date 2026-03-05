-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'DELETED')),
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service packages (3 tiers)
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('STANDARD', 'DELUXE', 'PREMIUM')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  work_days INTEGER NOT NULL CHECK (work_days > 0),
  revision_count INTEGER NOT NULL DEFAULT 0 CHECK (revision_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, tier)
);

-- Service images
CREATE TABLE service_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Service tags
CREATE TABLE service_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_services_seller ON services(seller_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_rating ON services(avg_rating DESC);
CREATE INDEX idx_services_created ON services(created_at DESC);
CREATE INDEX idx_service_packages_service ON service_packages(service_id);
CREATE INDEX idx_service_images_service ON service_images(service_id);
CREATE INDEX idx_service_tags_service ON service_tags(service_id);
