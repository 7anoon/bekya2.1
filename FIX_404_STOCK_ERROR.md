# Fixing 404 Error in Stock Tracking

## The Problem
You're seeing a "Failed to load resource: the server responded with a status of 404" error when trying to access the stock tracking page.

## Root Cause
This happens because the required database tables or columns are missing in your Supabase database.

## Quick Solution

### Step 1: Run the Database Migration
1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of `final-migration.sql`
5. Paste it into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify the Fix
1. The migration script will:
   - ✅ Create missing tables (sales, offers, notifications)
   - ✅ Add missing columns (weight, phone, location)
   - ✅ Set up proper Row Level Security policies
   - ✅ Create helpful database views
   - ✅ Add performance indexes

2. After running, you should see a success message:
   ```
   ✅ Migration completed successfully! All tables and policies are ready.
   ```

### Step 3: Test the Application
1. Refresh your application
2. Navigate to the Stock Tracking page (`/admin/stock`)
3. The 404 error should be resolved

## Alternative Testing Method
You can also test your database connection by opening `db-test.html` in your browser to see detailed connection diagnostics.

## What the Migration Does

### Tables Created:
- `sales` - Track product sales
- `offers` - Manage promotional offers  
- `notifications` - User notification system

### Columns Added:
- `products.weight` - Product weight tracking
- `profiles.phone` - User phone numbers
- `profiles.location` - User locations

### Security:
- Enables Row Level Security (RLS) on all tables
- Creates appropriate access policies
- Ensures data privacy and security

### Performance:
- Adds database indexes for faster queries
- Creates views for common data aggregations

## If You Still Get Errors

1. **Check Supabase Connection**: Verify your `.env` file has correct credentials
2. **Verify Table Existence**: Run this query in Supabase SQL Editor:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```
3. **Check RLS Status**: 
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

## Need Help?
If the migration doesn't work:
1. Check the browser console for specific error messages
2. Verify your Supabase project URL and API key are correct
3. Make sure you're running the migration on the correct Supabase project

The error should be completely resolved after running the migration!