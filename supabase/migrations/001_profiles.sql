-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  user_type TEXT NOT NULL DEFAULT 'BUYER' CHECK (user_type IN ('BUYER', 'SELLER')),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seller profiles
CREATE TABLE seller_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  introduction TEXT,
  specialties TEXT[] DEFAULT '{}',
  grade TEXT NOT NULL DEFAULT 'NEW' CHECK (grade IN ('NEW', 'GENERAL', 'PRO', 'MASTER')),
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  response_time INTEGER, -- in minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_grade ON seller_profiles(grade);
