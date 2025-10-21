import fs from 'fs';

const envContent = `# CampusConnect Environment Variables
VITE_SUPABASE_URL=https://egdavxjkyxvawgguqmvx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGF2eGpreXh2YXdnZ3VxbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTMzNDQsImV4cCI6MjA3MTUyOTM0NH0.TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4
VITE_FIREBASE_PROJECT_ID=campusconnect-db9a2
VITE_FIREBASE_API_KEY=AIzaSyBvQKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjK
VITE_FIREBASE_AUTH_DOMAIN=campusconnect-db9a2.firebaseapp.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
VITE_FIREBASE_STORAGE_BUCKET=campusconnect-db9a2.appspot.com
VITE_SENTRY_DSN=https://your-sentry-dsn-here@sentry.io/project-id
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=CampusConnect`;

fs.writeFileSync('.env', envContent, 'utf8');
console.log('✅ Created .env file successfully');


