-- Supabase Full Backend Setup Script for AfriSommelier

-- =========================================
-- 1. Create Tables
-- =========================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  identity TEXT,
  flavors JSONB,
  regions JSONB,
  interests JSONB,
  sweet_dry TEXT,
  light_full TEXT,
  fruity_earthy TEXT,
  location TEXT,
  avatar_url TEXT,
  taste_dna JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cellar Table
CREATE TABLE IF NOT EXISTS cellar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  vintage TEXT,
  region TEXT,
  grape TEXT,
  status TEXT,
  status_color TEXT,
  image TEXT,
  rating NUMERIC,
  awards TEXT,
  price TEXT,
  calories_per_glass NUMERIC,
  is_organic BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  vintage TEXT,
  region TEXT,
  image TEXT,
  price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consumption Table (Logged Glasses)
CREATE TABLE IF NOT EXISTS consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_name TEXT,
  region TEXT,
  grape TEXT,
  calories NUMERIC,
  date TEXT,
  rating NUMERIC,
  notes TEXT,
  occasion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  date TEXT,
  time TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_name TEXT,
  rating NUMERIC,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wines Table (Directory)
CREATE TABLE IF NOT EXISTS wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE,
  region TEXT,
  grape TEXT,
  vintage TEXT,
  price TEXT,
  image TEXT,
  notes TEXT,
  rating NUMERIC
);

-- News Table (Trending Now)
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT UNIQUE,
  category TEXT,
  image TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scans Table (AI Sommelier Scans)
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp BIGINT,
  mode TEXT NOT NULL CHECK (mode IN ('label', 'menu', 'winelist')),
  preview_url TEXT,
  result JSONB NOT NULL,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production schemas intentionally do not insert catalog or news records.
-- Manage wines and articles through the admin dashboard or controlled migrations.

-- =========================================
-- 2. Enable Row Level Security (RLS)
-- =========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cellar ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 3. Create RLS Policies
-- =========================================

-- Profiles Policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Cellar Policies
DROP POLICY IF EXISTS "Users can manage their own cellar" ON cellar;
CREATE POLICY "Users can manage their own cellar" ON cellar
  FOR ALL USING (auth.uid() = user_id);

-- Wishlist Policies
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlist;
CREATE POLICY "Users can manage their own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Consumption Policies
DROP POLICY IF EXISTS "Users can manage their own consumption logs" ON consumption;
CREATE POLICY "Users can manage their own consumption logs" ON consumption
  FOR ALL USING (auth.uid() = user_id);

-- Events Policies
DROP POLICY IF EXISTS "Users can manage their own events" ON events;
CREATE POLICY "Users can manage their own events" ON events
  FOR ALL USING (auth.uid() = user_id);

-- Reviews Policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can add reviews" ON reviews;
CREATE POLICY "Users can add reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own reviews" ON reviews;
CREATE POLICY "Users can manage their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Wines Policies
DROP POLICY IF EXISTS "Anyone can read wines" ON wines;
CREATE POLICY "Anyone can read wines" ON wines
  FOR SELECT USING (true);

-- News Policies
DROP POLICY IF EXISTS "Anyone can read news" ON news;
CREATE POLICY "Anyone can read news" ON news
  FOR SELECT USING (true);

-- Scans Policies
DROP POLICY IF EXISTS "Users can manage their own scans" ON scans;
CREATE POLICY "Users can manage their own scans" ON scans
  FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- 4. Auto-Create Profile on Signup Trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================
-- 5. Enable Realtime for Dashboard
-- =========================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE profiles, cellar, wishlist, consumption, events, reviews, news, scans;
COMMIT;


-- Production admin support inbox
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
  category TEXT NOT NULL CHECK (category IN ('Fraud Reporting', 'Sommelier Support', 'App Feedback', 'Wine Listing Error')),
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production promotion campaigns
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  wine_name TEXT NOT NULL,
  discount TEXT NOT NULL,
  target TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  image TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage support tickets" ON support_tickets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'lead_sommelier')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'lead_sommelier')));

CREATE POLICY "Admins manage promotions" ON promotions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'lead_sommelier')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'lead_sommelier')));

ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE promotions;
