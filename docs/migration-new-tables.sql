-- Migration to add new tables: tours, tour_dates, careers, newsletter_subscribers, seo_settings, 
-- award_categories, award_periods, award_entries, award_votes, static_pages, testimonials

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  artist_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  currency TEXT DEFAULT 'USD',
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tours_published ON tours(published);
CREATE INDEX IF NOT EXISTS idx_tours_slug ON tours(slug);

-- Tour dates table
CREATE TABLE IF NOT EXISTS tour_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  ticket_url TEXT,
  ticket_price TEXT,
  sold_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_dates_tour_id ON tour_dates(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_dates_date ON tour_dates(date);

-- Careers table
CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT DEFAULT 'full-time',
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  benefits TEXT,
  salary TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_careers_published ON careers(published);
CREATE INDEX IF NOT EXISTS idx_careers_slug ON careers(slug);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(active);

-- SEO settings table
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_title TEXT NOT NULL,
  default_description TEXT NOT NULL,
  default_keywords TEXT[],
  og_image TEXT,
  twitter_image TEXT,
  twitter_handle TEXT,
  organization_schema JSONB,
  website_schema JSONB,
  music_group_schema JSONB,
  head_scripts TEXT,
  body_scripts TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Award categories table
CREATE TABLE IF NOT EXISTS award_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('artist', 'track')),
  period TEXT NOT NULL CHECK (period IN ('week', 'month')),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_categories_slug ON award_categories(slug);
CREATE INDEX IF NOT EXISTS idx_award_categories_active ON award_categories(is_active);

-- Award periods table
CREATE TABLE IF NOT EXISTS award_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES award_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  voting_open BOOLEAN DEFAULT FALSE,
  winner_id UUID,
  announced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_periods_category_id ON award_periods(category_id);
CREATE INDEX IF NOT EXISTS idx_award_periods_voting_open ON award_periods(voting_open);

-- Award entries table
CREATE TABLE IF NOT EXISTS award_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES award_periods(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name TEXT,
  artist_image_url TEXT,
  artist_bio TEXT,
  track_title TEXT,
  track_artist TEXT,
  track_cover_url TEXT,
  track_audio_url TEXT,
  track_duration INTEGER,
  spotify_url TEXT,
  apple_music_url TEXT,
  soundcloud_url TEXT,
  vote_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_entries_period_id ON award_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_award_entries_vote_count ON award_entries(vote_count);

-- Award votes table
CREATE TABLE IF NOT EXISTS award_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES award_entries(id) ON DELETE CASCADE,
  period_id UUID REFERENCES award_periods(id) ON DELETE CASCADE,
  user_id UUID,
  voter_ip TEXT,
  voter_email TEXT,
  fingerprint TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_award_votes_entry_id ON award_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_award_votes_period_id ON award_votes(period_id);
CREATE INDEX IF NOT EXISTS idx_award_votes_fingerprint ON award_votes(fingerprint);

-- Static pages table
CREATE TABLE IF NOT EXISTS static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);
CREATE INDEX IF NOT EXISTS idx_static_pages_published ON static_pages(published);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured);

-- Enable Row Level Security (RLS) for all new tables
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access where appropriate
CREATE POLICY "Public can read published tours" ON tours FOR SELECT USING (published = true);
CREATE POLICY "Public can read tour dates" ON tour_dates FOR SELECT USING (true);
CREATE POLICY "Public can read published careers" ON careers FOR SELECT USING (published = true);
CREATE POLICY "Public can read active award categories" ON award_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read award periods" ON award_periods FOR SELECT USING (true);
CREATE POLICY "Public can read award entries" ON award_entries FOR SELECT USING (true);
CREATE POLICY "Public can submit votes" ON award_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read published static pages" ON static_pages FOR SELECT USING (published = true);
CREATE POLICY "Public can read published testimonials" ON testimonials FOR SELECT USING (published = true);

-- Create policies for admin full access (assuming you have an admin role or auth system)
-- Adjust these based on your authentication setup
CREATE POLICY "Admin full access to tours" ON tours FOR ALL USING (true);
CREATE POLICY "Admin full access to tour_dates" ON tour_dates FOR ALL USING (true);
CREATE POLICY "Admin full access to careers" ON careers FOR ALL USING (true);
CREATE POLICY "Admin full access to newsletter_subscribers" ON newsletter_subscribers FOR ALL USING (true);
CREATE POLICY "Admin full access to seo_settings" ON seo_settings FOR ALL USING (true);
CREATE POLICY "Admin full access to award_categories" ON award_categories FOR ALL USING (true);
CREATE POLICY "Admin full access to award_periods" ON award_periods FOR ALL USING (true);
CREATE POLICY "Admin full access to award_entries" ON award_entries FOR ALL USING (true);
CREATE POLICY "Admin full access to award_votes" ON award_votes FOR SELECT USING (true);
CREATE POLICY "Admin full access to static_pages" ON static_pages FOR ALL USING (true);
CREATE POLICY "Admin full access to testimonials" ON testimonials FOR ALL USING (true);
