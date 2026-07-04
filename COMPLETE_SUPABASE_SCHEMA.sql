-- =========================================================================
--               ENOVIQ AI SOMMELIER & CUPIDO: COMPLETE SUPABASE BACKEND CODE
-- =========================================================================
-- Description: Complete, production-ready PostgreSQL schema, indexes, RLS
--              (Row-Level Security) policies, dynamic compatibility 
--              algorithms, triggers, and real-time replication optimized for Supabase.
-- Compatibility: Postgres 15+ / Supabase Auth
-- Usage: Copy and paste this entire script into your Supabase SQL Editor and run it.
-- =========================================================================

-- =========================================================================
-- 1. EXTENSIONS & ENUMS SETUP
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Schema Enums for Cupido AI Dating
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wine_personality') THEN
    CREATE TYPE wine_personality AS ENUM (
      'The Collector', 
      'The Connoisseur', 
      'The Avant-Garde Sommelier', 
      'The Naturalist Rebel'
    );
  END IF;
END
$$;

-- =========================================================================
-- 2. CORE DATABASE TABLES
-- =========================================================================

-- 2.1 Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
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
  role TEXT DEFAULT 'explorer', -- 'explorer' or 'super_admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Wines Table
CREATE TABLE IF NOT EXISTS public.wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE,
  region TEXT,
  grape TEXT,
  vintage TEXT,
  price TEXT,
  image TEXT,
  notes TEXT,
  rating NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Cellar Table (Personal Cellar Inventory)
CREATE TABLE IF NOT EXISTS public.cellar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES public.wines(id) ON DELETE SET NULL,
  wine_name TEXT NOT NULL,
  vintage TEXT,
  region TEXT,
  grape TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  image_url TEXT,
  scanned_barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES public.wines(id) ON DELETE CASCADE,
  wine_name TEXT NOT NULL,
  vintage TEXT,
  region TEXT,
  grape TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, wine_id)
);

-- 2.5 Consumption Logs Table (Glasses Drank Tracking)
CREATE TABLE IF NOT EXISTS public.consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_name TEXT NOT NULL,
  vintage TEXT,
  region TEXT,
  grape TEXT,
  glasses INTEGER DEFAULT 1,
  calories INTEGER DEFAULT 120,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Events Table (VIP Wine Tastings & Masterclasses)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  wine_pairings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Reviews Table (Community Tasting Notes & Star Ratings)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES public.wines(id) ON DELETE CASCADE,
  rating NUMERIC CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 News Table (Wine Intelligence & Trending Headlines)
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT UNIQUE,
  category TEXT,
  image TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 AI Sommelier Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp BIGINT,
  mode TEXT NOT NULL CHECK (mode IN ('label', 'menu', 'winelist')),
  preview_url TEXT,
  result JSONB NOT NULL,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 2.10 CUPIDO (AI DATING) TABLES
-- =========================================================================

-- Cupido Profiles
CREATE TABLE IF NOT EXISTS public.cupido_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  wine_type TEXT DEFAULT 'Wine Enthusiast',
  personality wine_personality DEFAULT 'The Collector',
  
  -- Wine DNA components (Stored as integer percentages 0-100)
  old_world_affinity INTEGER DEFAULT 50 CHECK (old_world_affinity >= 0 AND old_world_affinity <= 100),
  bold_reds_affinity INTEGER DEFAULT 50 CHECK (bold_reds_affinity >= 0 AND bold_reds_affinity <= 100),
  luxury_dining_affinity INTEGER DEFAULT 50 CHECK (luxury_dining_affinity >= 0 AND luxury_dining_affinity <= 100),
  adventure_affinity INTEGER DEFAULT 50 CHECK (adventure_affinity >= 0 AND adventure_affinity <= 100),
  
  -- Metadata arrays
  favorite_wines TEXT[] DEFAULT '{}'::TEXT[],
  favorite_experiences TEXT[] DEFAULT '{}'::TEXT[],
  location_name TEXT DEFAULT 'Cape Town, South Africa',
  is_premium BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT name_length CHECK (char_length(full_name) >= 2)
);

-- Cupido Swipes (Matchmaker State Machine)
CREATE TABLE IF NOT EXISTS public.cupido_swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  sender_id UUID REFERENCES public.cupido_profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.cupido_profiles(id) ON DELETE CASCADE NOT NULL,
  swipe_type TEXT NOT NULL CHECK (swipe_type IN ('like', 'pass')),
  
  UNIQUE (sender_id, receiver_id)
);

-- Cupido Matches
CREATE TABLE IF NOT EXISTS public.cupido_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_one_id UUID REFERENCES public.cupido_profiles(id) ON DELETE CASCADE NOT NULL,
  user_two_id UUID REFERENCES public.cupido_profiles(id) ON DELETE CASCADE NOT NULL,
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  
  UNIQUE (user_one_id, user_two_id)
);

-- Cupido Conversations
CREATE TABLE IF NOT EXISTS public.cupido_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  match_id UUID REFERENCES public.cupido_matches(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Cupido Messages
CREATE TABLE IF NOT EXISTS public.cupido_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.cupido_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.cupido_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

-- Virtual Wine Dates (Synchronous guided tastings)
CREATE TABLE IF NOT EXISTS public.cupido_virtual_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  match_id UUID REFERENCES public.cupido_matches(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  selected_wine TEXT DEFAULT 'Kanonkop Pinotage',
  current_round INTEGER DEFAULT 1 CHECK (current_round >= 1 AND current_round <= 4), -- 4 is completed!
  shared_tasting_notes TEXT[] DEFAULT '{}'::TEXT[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'canceled'))
);

-- Cupido Event Registrations (Regional VIP ticket reservations)
CREATE TABLE IF NOT EXISTS public.cupido_event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.cupido_profiles(id) ON DELETE CASCADE NOT NULL,
  event_id TEXT NOT NULL, -- 'bordeaux' or 'cabernet' code
  registration_code TEXT NOT NULL UNIQUE, -- EQ-###### format security ticket code
  checked_in BOOLEAN DEFAULT FALSE,
  
  UNIQUE (user_id, event_id)
);

-- =========================================================================
-- 3. INDEX OPTIMIZATIONS (FOR SPEED & PERFORMANCE)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_cellar_user ON public.cellar(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_user ON public.consumption(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_wine ON public.reviews(wine_id);
CREATE INDEX IF NOT EXISTS idx_scans_user ON public.scans(user_id);

CREATE INDEX IF NOT EXISTS idx_cupido_swipes_sender ON public.cupido_swipes(sender_id);
CREATE INDEX IF NOT EXISTS idx_cupido_swipes_receiver ON public.cupido_swipes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_cupido_matches_users ON public.cupido_matches(user_one_id, user_two_id);
CREATE INDEX IF NOT EXISTS idx_cupido_messages_conversation ON public.cupido_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cupido_messages_created_at ON public.cupido_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cupido_events_user ON public.cupido_event_registrations(user_id, event_id);

-- =========================================================================
-- 4. BUSINESS LOGIC & COMPATIBILITY CALCULATION ALGORITHMS
-- =========================================================================

-- 4.1 Taste Compatibility Match Score Calculator
-- Runs a multi-signal comparison on sensory dimensions
CREATE OR REPLACE FUNCTION public.calculate_compatibility(
  user_a UUID,
  user_b UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prof_a public.cupido_profiles;
  prof_b public.cupido_profiles;
  diff_old_world INTEGER;
  diff_reds INTEGER;
  diff_dining INTEGER;
  diff_adventure INTEGER;
  raw_score NUMERIC;
BEGIN
  -- Fetch profiles
  SELECT * INTO prof_a FROM public.cupido_profiles WHERE id = user_a;
  SELECT * INTO prof_b FROM public.cupido_profiles WHERE id = user_b;
  
  IF NOT FOUND OR prof_b IS NULL THEN
    RETURN 75; -- Fallback baseline compatibility score
  END IF;

  -- Absolute differences between taste parameters
  diff_old_world := ABS(prof_a.old_world_affinity - prof_b.old_world_affinity);
  diff_reds      := ABS(prof_a.bold_reds_affinity - prof_b.bold_reds_affinity);
  diff_dining    := ABS(prof_a.luxury_dining_affinity - prof_b.luxury_dining_affinity);
  diff_adventure := ABS(prof_a.adventure_affinity - prof_b.adventure_affinity);

  -- Weighted average variance offset
  raw_score := 100 - ((diff_old_world + diff_reds + diff_dining + diff_adventure) / 4.0);
  
  -- Clamp range securely between 50% and 100%
  RETURN GREATEST(50, LEAST(100, ROUND(raw_score)));
END;
$$;

-- 4.2 Auto Match & Conversation Creator Trigger Hook
-- Triggers whenever a swipe record is written, checking if a mutual LIKE is completed
CREATE OR REPLACE FUNCTION public.process_swipe_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mutual_exists BOOLEAN;
  score INTEGER;
  new_match_id UUID;
BEGIN
  -- Only evaluate if swipe was positive ('like')
  IF new.swipe_type = 'like' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.cupido_swipes
      WHERE sender_id = new.receiver_id 
        AND receiver_id = new.sender_id 
        AND swipe_type = 'like'
    ) INTO mutual_exists;

    -- If mutual love is verified, instantiate the Match and configure Conversation threads!
    IF mutual_exists THEN
      -- Calculate algorithmic taste match accuracy score
      score := public.calculate_compatibility(new.sender_id, new.receiver_id);

      -- Maintain unique, ordered composite pairs
      INSERT INTO public.cupido_matches (user_one_id, user_two_id, compatibility_score)
      VALUES (
        LEAST(new.sender_id, new.receiver_id),
        GREATEST(new.sender_id, new.receiver_id),
        score
      )
      ON CONFLICT (user_one_id, user_two_id) DO UPDATE
        SET compatibility_score = EXCLUDED.compatibility_score
      RETURNING id INTO new_match_id;

      -- Instantiate default interactive real-time Chat room conversation box
      INSERT INTO public.cupido_conversations (match_id)
      VALUES (new_match_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create Swipe Trigger
DROP TRIGGER IF EXISTS check_mutual_swipe_match ON public.cupido_swipes;
CREATE TRIGGER check_mutual_swipe_match
  AFTER INSERT ON public.cupido_swipes
  FOR EACH ROW EXECUTE FUNCTION public.process_swipe_match();

-- 4.3 Trigger to Auto-Create User Profiles on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into core profiles table
  INSERT INTO public.profiles (id, email, first_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;

  -- Insert into cupido profiles table
  INSERT INTO public.cupido_profiles (id, full_name, wine_type)
  VALUES (new.id, split_part(new.email, '@', 1), 'Wine Explorer')
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook Trigger up to Supabase Auth tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- 5. ENABLE ROW-LEVEL SECURITY (RLS) FOR ALL TABLES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cellar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cupido_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupido_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupido_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupido_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupido_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupido_virtual_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupido_event_registrations ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 6. CREATE ROW-LEVEL SECURITY ACCESS POLICIES
-- =========================================================================

-- Profiles Policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Cellar Policies
DROP POLICY IF EXISTS "Users can manage their own cellar" ON public.cellar;
CREATE POLICY "Users can manage their own cellar" ON public.cellar
  FOR ALL USING (auth.uid() = user_id);

-- Wishlist Policies
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Consumption Policies
DROP POLICY IF EXISTS "Users can manage their own consumption logs" ON public.consumption;
CREATE POLICY "Users can manage their own consumption logs" ON public.consumption
  FOR ALL USING (auth.uid() = user_id);

-- Events Policies
DROP POLICY IF EXISTS "Users can manage their own events" ON public.events;
CREATE POLICY "Users can manage their own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- Reviews Policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add reviews" ON public.reviews;
CREATE POLICY "Users can add reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
CREATE POLICY "Users can manage their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Wines Policies (Publicly readable)
DROP POLICY IF EXISTS "Anyone can read wines" ON public.wines;
CREATE POLICY "Anyone can read wines" ON public.wines
  FOR SELECT USING (true);

-- News Policies (Publicly readable)
DROP POLICY IF EXISTS "Anyone can read news" ON public.news;
CREATE POLICY "Anyone can read news" ON public.news
  FOR SELECT USING (true);

-- Scans Policies
DROP POLICY IF EXISTS "Users can manage their own scans" ON public.scans;
CREATE POLICY "Users can manage their own scans" ON public.scans
  FOR ALL USING (auth.uid() = user_id);

-- Cupido Profiles Policies
DROP POLICY IF EXISTS "Read access for verified profiles" ON public.cupido_profiles;
CREATE POLICY "Read access for verified profiles" ON public.cupido_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Write access to your own profile" ON public.cupido_profiles;
CREATE POLICY "Write access to your own profile" ON public.cupido_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Cupido Swipes Policies
DROP POLICY IF EXISTS "Insert own swipes" ON public.cupido_swipes;
CREATE POLICY "Insert own swipes" ON public.cupido_swipes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Read own swipes" ON public.cupido_swipes;
CREATE POLICY "Read own swipes" ON public.cupido_swipes
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Cupido Matches Policies
DROP POLICY IF EXISTS "Select own matches" ON public.cupido_matches;
CREATE POLICY "Select own matches" ON public.cupido_matches
  FOR SELECT TO authenticated USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- Cupido Messages Policies
DROP POLICY IF EXISTS "Read conversation messages" ON public.cupido_messages;
CREATE POLICY "Read conversation messages" ON public.cupido_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.cupido_conversations c
      JOIN public.cupido_matches m ON c.match_id = m.id
      WHERE c.id = conversation_id 
        AND (m.user_one_id = auth.uid() OR m.user_two_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Send conversation messages" ON public.cupido_messages;
CREATE POLICY "Send conversation messages" ON public.cupido_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.cupido_conversations c
      JOIN public.cupido_matches m ON c.match_id = m.id
      WHERE c.id = conversation_id 
        AND (m.user_one_id = auth.uid() OR m.user_two_id = auth.uid())
    )
  );

-- Cupido Event Registrations Policies
DROP POLICY IF EXISTS "Select own registrations" ON public.cupido_event_registrations;
CREATE POLICY "Select own registrations" ON public.cupido_event_registrations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Create own registrations" ON public.cupido_event_registrations;
CREATE POLICY "Create own registrations" ON public.cupido_event_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 7. SEED DUMMY DATA (IF NOT EXISTS)
-- =========================================================================

-- Seed Wines
INSERT INTO public.wines (name, region, grape, vintage, price, image, notes, rating)
VALUES 
('Meerlust Rubicon', 'Stellenbosch', 'Cabernet Sauvignon', '2018', 'R 500', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop', 'A classic Stellenbosch Bordeaux blend with notes of cassis and cedar.', 4.5),
('Vilafonté Series C', 'Paarl', 'Cabernet Sauvignon', '2019', 'R 1200', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop', 'Elegant and structured, bursting with dark fruit.', 4.8),
('Ataraxia Chardonnay', 'Hemel-en-Aarde', 'Chardonnay', '2021', 'R 350', 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop', 'Crisp, mineral-driven Chardonnay from the cool Hemel-en-Aarde valley.', 4.6),
('Kanonkop Pinotage', 'Stellenbosch', 'Pinotage', '2019', 'R 450', 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=400&auto=format&fit=crop', 'The benchmark for Pinotage. Rich red fruit and subtle oak.', 4.7),
('Sadie Family Columella', 'Swartland', 'Shiraz', '2020', 'R 1200', 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=400&auto=format&fit=crop', 'Spectacular Mediterranean-style red blend from Swartland.', 4.9)
ON CONFLICT (name) DO NOTHING;

-- Seed News
INSERT INTO public.news (title, category, image, description)
VALUES 
('Global Supply Shift Shapes Upcoming Vintages', 'Global News', 'https://images.unsplash.com/photo-1596758410228-568ea46a9b51?q=80&w=600&auto=format&fit=crop', 'Experts predict a rise in alternative varietals as traditional regions adapt to climate shifts this year.'),
('South Africa''s Cap Classique Renaissance', 'Local Spotlight', 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=600&auto=format&fit=crop', 'Stellenbosch producers are gaining international acclaim for traditional method sparkling wines.'),
('The Rise of Low-Intervention Wonders', 'Trend', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=600&auto=format&fit=crop', 'Natural and biodynamic wines continue to see explosive growth among modern connoisseurs.')
ON CONFLICT (title) DO NOTHING;

-- Helper to seed Cupido Profiles
CREATE OR REPLACE FUNCTION public.seed_cupido_mock_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  emma_id UUID := 'e0a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c';
  alex_id UUID := 'a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
  sophia_id UUID := 's2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e';
  chloe_id UUID := 'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f';
BEGIN
  -- Emma
  INSERT INTO public.cupido_profiles (
    id, full_name, photo_url, wine_type, personality, 
    old_world_affinity, bold_reds_affinity, luxury_dining_affinity, adventure_affinity,
    favorite_wines, favorite_experiences, location_name, is_premium
  ) VALUES (
    emma_id,
    'Emma',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    'French Wine Enthusiast',
    'The Collector',
    95, 88, 92, 81,
    ARRAY['Pinot Noir', 'Champagne', 'Barolo'],
    ARRAY['Tuscany', 'Michelin Dining', 'Opera'],
    'Stellenbosch, South Africa',
    TRUE
  ) ON CONFLICT (id) DO NOTHING;

  -- Alex
  INSERT INTO public.cupido_profiles (
    id, full_name, photo_url, wine_type, personality, 
    old_world_affinity, bold_reds_affinity, luxury_dining_affinity, adventure_affinity,
    favorite_wines, favorite_experiences, location_name, is_premium
  ) VALUES (
    alex_id,
    'Alex',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    'Bold Red Collector',
    'The Connoisseur',
    80, 96, 85, 89,
    ARRAY['Syrah/Shiraz', 'Cabernet Sauvignon', 'Malbec'],
    ARRAY['Stellenbosch Braai', 'Helicopter Vineyard Tour', 'Napa Valley'],
    'Franschhoek, South Africa',
    FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Sophia
  INSERT INTO public.cupido_profiles (
    id, full_name, photo_url, wine_type, personality, 
    old_world_affinity, bold_reds_affinity, luxury_dining_affinity, adventure_affinity,
    favorite_wines, favorite_experiences, location_name, is_premium
  ) VALUES (
    sophia_id,
    'Sophia',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
    'Vintage Champagne Specialist',
    'The Avant-Garde Sommelier',
    90, 60, 98, 85,
    ARRAY['Blanc de Blancs', 'Pet-Nat', 'Chardonnay'],
    ARRAY['Franschhoek Tram', 'Oyster Shucking', 'Art Galleries'],
    'Constantia, South Africa',
    TRUE
  ) ON CONFLICT (id) DO NOTHING;

  -- Chloe
  INSERT INTO public.cupido_profiles (
    id, full_name, photo_url, wine_type, personality, 
    old_world_affinity, bold_reds_affinity, luxury_dining_affinity, adventure_affinity,
    favorite_wines, favorite_experiences, location_name, is_premium
  ) VALUES (
    chloe_id,
    'Chloe',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    'Eclectic Orange explorer',
    'The Naturalist Rebel',
    75, 70, 72, 95,
    ARRAY['Amphora Chenin Blanc', 'Barolo', 'Cinsault'],
    ARRAY['Swartland Organic Harvest', 'Record Bars', 'Glamping'],
    'Cape Town, South Africa',
    FALSE
  ) ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Seed Cupido Profiles
SELECT public.seed_cupido_mock_data();

-- =========================================================================
-- 8. ENABLE REALTIME REPLICATION (PUBLICATIONS) FOR LIVE UPDATES
-- =========================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.profiles, 
    public.cellar, 
    public.wishlist, 
    public.consumption, 
    public.events, 
    public.reviews, 
    public.news, 
    public.scans,
    public.cupido_profiles,
    public.cupido_swipes,
    public.cupido_matches,
    public.cupido_conversations,
    public.cupido_messages,
    public.cupido_virtual_dates,
    public.cupido_event_registrations;
COMMIT;

SELECT 'ENOVIQ AI: All database schemas, triggers, seed data, and live real-time structures completed successfully!' AS integration_status;
