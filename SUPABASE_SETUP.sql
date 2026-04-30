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
  name TEXT,
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
  title TEXT,
  category TEXT,
  image TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some dummy data for the search
INSERT INTO wines (name, region, grape, vintage, price, image, notes, rating)
VALUES 
('Meerlust Rubicon', 'Stellenbosch', 'Cabernet Sauvignon', '2018', 'R 500', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop', 'A classic Stellenbosch Bordeaux blend with notes of cassis and cedar.', 4.5),
('Vilafonté Series C', 'Paarl', 'Cabernet Sauvignon', '2019', 'R 1200', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop', 'Elegant and structured, bursting with dark fruit.', 4.8),
('Ataraxia Chardonnay', 'Hemel-en-Aarde', 'Chardonnay', '2021', 'R 350', 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop', 'Crisp, mineral-driven Chardonnay from the cool Hemel-en-Aarde valley.', 4.6),
('Kanonkop Pinotage', 'Stellenbosch', 'Pinotage', '2019', 'R 450', 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=400&auto=format&fit=crop', 'The benchmark for Pinotage. Rich red fruit and subtle oak.', 4.7),
('Sadie Family Columella', 'Swartland', 'Shiraz', '2020', 'R 1200', 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=400&auto=format&fit=crop', 'Spectacular Mediterranean-style red blend from Swartland.', 4.9)
ON CONFLICT DO NOTHING;

-- Insert some dummy data for news
INSERT INTO news (title, category, image, description)
VALUES 
('Global Supply Shift Shapes Upcoming Vintages', 'Global News', 'https://images.unsplash.com/photo-1596758410228-568ea46a9b51?q=80&w=600&auto=format&fit=crop', 'Experts predict a rise in alternative varietals as traditional regions adapt to climate shifts this year.'),
('South Africa''s Cap Classique Renaissance', 'Local Spotlight', 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=600&auto=format&fit=crop', 'Stellenbosch producers are gaining international acclaim for traditional method sparkling wines.'),
('The Rise of Low-Intervention Wonders', 'Trend', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=600&auto=format&fit=crop', 'Natural and biodynamic wines continue to see explosive growth among modern connoisseurs.')
ON CONFLICT DO NOTHING;

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
  CREATE PUBLICATION supabase_realtime FOR TABLE profiles, cellar, wishlist, consumption, events, reviews, news;
COMMIT;

