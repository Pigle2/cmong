-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Seller profiles: public read, own write
CREATE POLICY "seller_profiles_select" ON seller_profiles FOR SELECT USING (true);
CREATE POLICY "seller_profiles_insert" ON seller_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "seller_profiles_update" ON seller_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Categories: public read
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);

-- Services: public read active, seller CRUD own
CREATE POLICY "services_select" ON services FOR SELECT USING (
  status = 'ACTIVE' OR seller_id = auth.uid()
);
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "services_update" ON services FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "services_delete" ON services FOR DELETE USING (auth.uid() = seller_id);

-- Service packages: public read, seller write
CREATE POLICY "service_packages_select" ON service_packages FOR SELECT USING (true);
CREATE POLICY "service_packages_insert" ON service_packages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));
CREATE POLICY "service_packages_update" ON service_packages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));
CREATE POLICY "service_packages_delete" ON service_packages FOR DELETE
  USING (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));

-- Service images: public read, seller write
CREATE POLICY "service_images_select" ON service_images FOR SELECT USING (true);
CREATE POLICY "service_images_insert" ON service_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));
CREATE POLICY "service_images_update" ON service_images FOR UPDATE
  USING (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));
CREATE POLICY "service_images_delete" ON service_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));

-- Service tags: public read, seller write
CREATE POLICY "service_tags_select" ON service_tags FOR SELECT USING (true);
CREATE POLICY "service_tags_insert" ON service_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));
CREATE POLICY "service_tags_delete" ON service_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM services WHERE id = service_id AND seller_id = auth.uid()));

-- Orders: buyer/seller can see own orders
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Order status history: visible to order participants
CREATE POLICY "order_history_select" ON order_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE id = order_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ));
CREATE POLICY "order_history_insert" ON order_status_history FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE id = order_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ));

-- Reviews: public read, reviewer write
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "reviews_update" ON reviews FOR UPDATE
  USING (reviewer_id = auth.uid() OR seller_id = auth.uid());

-- Chat rooms: participants only
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants WHERE room_id = id AND user_id = auth.uid()
  ));
CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_rooms_update" ON chat_rooms FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM chat_participants WHERE room_id = id AND user_id = auth.uid()
  ));

-- Chat participants: visible to room members
CREATE POLICY "chat_participants_select" ON chat_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants cp WHERE cp.room_id = room_id AND cp.user_id = auth.uid()
  ));
CREATE POLICY "chat_participants_insert" ON chat_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_participants_update" ON chat_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Chat messages: room participants only
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  ));
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Notifications: own only
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

-- Favorites: own only
CREATE POLICY "favorites_select" ON favorites FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "favorites_insert" ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "favorites_delete" ON favorites FOR DELETE
  USING (user_id = auth.uid());
