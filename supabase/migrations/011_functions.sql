-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nickname, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'BUYER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate order number: ORD-YYYYMMDDNN
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  seq_num INTEGER;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || today_str || '%';
  NEW.order_number := 'ORD-' || today_str || LPAD(seq_num::TEXT, 2, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_order_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- Update service rating stats when review is inserted
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE services SET
    avg_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM reviews WHERE service_id = NEW.service_id
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews WHERE service_id = NEW.service_id
    ),
    updated_at = NOW()
  WHERE id = NEW.service_id;

  -- Also update seller profile stats
  UPDATE seller_profiles SET
    avg_rating = (
      SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0)
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE s.seller_id = NEW.seller_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE s.seller_id = NEW.seller_id
    ),
    updated_at = NOW()
  WHERE user_id = NEW.seller_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_service_rating();

-- Update service order count
CREATE OR REPLACE FUNCTION update_service_order_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    UPDATE services SET
      order_count = order_count + 1,
      updated_at = NOW()
    WHERE id = NEW.service_id;

    UPDATE seller_profiles SET
      total_sales = total_sales + 1,
      updated_at = NOW()
    WHERE user_id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION update_service_order_count();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON seller_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update favorite count on services
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE services SET favorite_count = favorite_count + 1 WHERE id = NEW.service_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE services SET favorite_count = favorite_count - 1 WHERE id = OLD.service_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_favorite_change
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_favorite_count();
