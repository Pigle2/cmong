-- Full-text search index for services
CREATE INDEX idx_services_search ON services
  USING GIN (to_tsvector('simple', title || ' ' || description));

-- Composite indexes for common queries
CREATE INDEX idx_services_active_rating ON services(avg_rating DESC)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_services_active_created ON services(created_at DESC)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_services_active_orders ON services(order_count DESC)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX idx_orders_seller_status ON orders(seller_id, status);
