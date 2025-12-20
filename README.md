# GroupTherapy Records - Production Website

A modern, full-featured website for GroupTherapy Records built with React, TypeScript, and Supabase.

## Features

### Public Features
- 🎵 **Releases Management** - Display latest music releases with Spotify integration
- 🎤 **Artist Profiles** - Showcase artists with bios, social links, and releases
- 📅 **Events** - Event listing with ticketing, countdowns, and featured events
- 📝 **Blog & News** - News articles and blog posts with SEO optimization
- 📻 **Radio Shows** - Live and recorded radio shows with schedule
- 🎬 **Videos** - Video gallery with YouTube integration
- 🎼 **Playlists** - Curated music playlists
- 🏆 **Awards** - Voting system for best artists and tracks
- 💼 **Careers** - Job listings and applications
- 🎫 **Tours** - Tour dates and ticket information
- ✉️ **Newsletter** - Email subscription system
- 📧 **Contact** - Contact form with spam protection

### Admin Features
- 🔐 **Secure Authentication** - Login system with rate limiting
- 📊 **Dashboard** - Analytics and overview of all content
- ✨ **AI Content Generation** - Generate blog posts and newsletters with Gemini AI
- 🖼️ **Media Management** - Image and audio upload via Cloudinary
- 📈 **Analytics** - Track page views and user engagement
- 🎯 **SEO Management** - Control meta tags and structured data
- 🎨 **Theme Customization** - Dark/light mode support

## Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **React Query** - Data fetching
- **Wouter** - Routing
- **Framer Motion** - Animations

### Backend
- **Supabase** - Database and authentication
- **Firebase** - Real-time features
- **Cloudinary** - Media storage
- **Gemini AI** - Content generation
- **Spotify API** - Music metadata

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudinary account
- Spotify Developer account
- Google Gemini API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_PROJECT_ID=your_gemini_project_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Firebase
DATABASE_URL=your_firebase_database_url
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_DATABASE_URL=your_firebase_database_url
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Admin Credentials
ADMIN_PASSWORD=your_secure_password
ADMIN_EMAIL=admin@yourdomain.com

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/egypcoder/grouptherapy-production.git
cd grouptherapy-production
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Database**

Run the SQL migration files in your Supabase SQL editor in this order:
```bash
# 1. Main schema
docs/db-schema-fixed.sql

# 2. New tables (tours, awards, etc.)
docs/migration-new-tables.sql

# 3. Seed data (optional)
docs/seed-data.sql
```

4. **Configure Cloudinary**
- Create an unsigned upload preset in your Cloudinary dashboard
- Set the preset name in `VITE_CLOUDINARY_UPLOAD_PRESET`

5. **Configure Spotify API**
- Create an app at https://developer.spotify.com/dashboard
- Add your Client ID and Secret to the environment variables

6. **Configure Gemini AI**
- Get an API key from https://ai.google.dev/
- Add the key to `VITE_GEMINI_API_KEY`

7. **Start development server**
```bash
npm run dev
```

The app will be available at http://localhost:5000

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Database Schema

The application uses the following main tables:
- `releases` - Music releases
- `artists` - Artist profiles
- `events` - Event listings
- `tours` - Tour dates
- `posts` - Blog posts and news
- `radio_shows` - Radio show schedules
- `radio_tracks` - Radio playlist
- `videos` - Video content
- `playlists` - Music playlists
- `careers` - Job listings
- `award_categories` - Award categories
- `award_periods` - Voting periods
- `award_entries` - Award nominees
- `award_votes` - User votes
- `newsletter_subscribers` - Email subscribers
- `contacts` - Contact form submissions
- `testimonials` - User testimonials
- `static_pages` - Custom pages
- `seo_settings` - SEO configuration

See `docs/migration-new-tables.sql` for detailed schema.

## Admin Access

Default admin credentials are set in the environment variables:
- Email: Set in `ADMIN_EMAIL`
- Password: Set in `ADMIN_PASSWORD`

Admin panel is accessible at `/admin`

## Features Guide

### Spotify Integration
- Paste a Spotify track URL in admin releases
- Metadata is automatically fetched and populated

### AI Content Generation
- Available in blog/news and newsletter sections
- Provide a prompt and AI generates the content
- Uses Google Gemini 1.5 Flash model

### Audio Upload
- Supports files up to 500MB
- Automatic chunked upload for files >100MB
- Progress tracking during upload

### Awards System
- Create categories (artist or track)
- Set voting periods
- Users can vote once per period
- Automatic vote counting
- Display winners

### Newsletter System
- Collect email subscribers
- Send newsletters to all active subscribers
- AI-powered content generation
- HTML email support
- Export subscribers to CSV

## Troubleshooting

### Audio Upload Fails
- Check Cloudinary upload preset is configured correctly
- Ensure file size is under 500MB
- Verify internet connection is stable

### Spotify Metadata Not Loading
- Verify Spotify API credentials are correct
- Check if the Spotify URL is valid
- Ensure CORS is properly configured

### AI Generation Errors
- Verify Gemini API key is valid
- Check API quota limits
- Ensure internet connectivity

## Contributing

This is a production project for GroupTherapy Records. For any issues or feature requests, please contact the development team.

## License

Proprietary - All rights reserved by GroupTherapy Records

## Support

For technical support, contact: osama@grouptherapyeg.com
