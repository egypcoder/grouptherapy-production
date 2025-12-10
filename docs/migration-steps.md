# Migration Steps - GroupTherapy Database Setup

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Access to the Supabase SQL Editor
3. Your Supabase project URL and anon key

## Step-by-Step Migration

### Step 1: Set Up Environment Variables

Add these to your Replit Secrets or `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Run the Database Schema

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy the contents of `docs/db-schema-fixed.sql`
5. Click **Run**
6. Verify no errors appear

### Step 3: Run Seed Data (Optional)

For testing with sample data:

1. In SQL Editor, create a new query
2. Copy the contents of `docs/seed-data.sql`
3. Click **Run**

### Step 4: Configure Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. (Optional) Disable email confirmation for development
4. Configure password requirements

### Step 5: Create Storage Buckets (Optional)

If using Supabase Storage for file uploads:

1. Go to **Storage**
2. Create these buckets:
   - `images` (public)
   - `audio` (public)
   - `videos` (public)
   - `documents` (public)

### Step 6: Create Admin User

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter your admin email and password
4. User is automatically an admin (all authenticated users have admin privileges)

### Step 7: Verify Setup

Run these queries in SQL Editor to verify:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check default data
SELECT COUNT(*) FROM site_settings;
SELECT COUNT(*) FROM seo_settings;
SELECT COUNT(*) FROM static_pages;
SELECT COUNT(*) FROM award_categories;
```

## Rollback Instructions

If you need to reset the database:

```sql
-- WARNING: This will delete ALL data!
-- Only run this if you want to start fresh

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS award_votes CASCADE;
DROP TABLE IF EXISTS award_entries CASCADE;
DROP TABLE IF EXISTS award_periods CASCADE;
DROP TABLE IF EXISTS award_categories CASCADE;
DROP TABLE IF EXISTS radio_sessions CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS tour_dates CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS career_applications CASCADE;
DROP TABLE IF EXISTS careers CASCADE;
DROP TABLE IF EXISTS radio_tracks CASCADE;
DROP TABLE IF EXISTS radio_shows CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS releases CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS press_assets CASCADE;
DROP TABLE IF EXISTS static_pages CASCADE;
DROP TABLE IF EXISTS radio_settings CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS seo_settings CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_vote_count();
```

## Troubleshooting

### "Permission denied" errors
- Ensure RLS policies are correctly applied
- Check that the user is authenticated

### Tables not appearing
- Run the schema script again
- Check the SQL Editor output for errors

### Authentication issues
- Verify the Supabase URL and anon key are correct
- Check that email provider is enabled

### Data not saving
- Check browser console for errors
- Verify RLS policies allow the operation
- Ensure the user is logged in
