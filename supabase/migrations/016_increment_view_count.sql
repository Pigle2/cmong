-- Atomic view count increment to prevent race conditions
CREATE OR REPLACE FUNCTION increment_view_count(service_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE services
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
