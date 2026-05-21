# Campus Lost & Found Portal

A modern, responsive full-stack application built with React, Vite, and Supabase.

## Features

- **Authentication**: Student signup/login via Supabase Auth.
- **Lost & Found Modules**: Report items with images, descriptions, and locations.
- **Advanced Search**: Filter by category, status, and keywords.
- **Admin Dashboard**: Analytics, record management, and resolution tracking.
- **Responsive Design**: Mobile-first UI with glassmorphism and smooth animations.
- **Theme Support**: Dark and Light mode.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Motion
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React
- **Charts**: Recharts

## Setup Instructions

### 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and paste the contents of `supabase/schema.sql`. Run it to create tables and RLS policies.
3. Go to **Storage Settings** and create a new public bucket named `item-images`.
4. Go to **Project Settings -> API** and copy your `URL` and `anon/public` key.

### 2. Environment Variables
Add the following to your AI Studio Secrets or `.env` file:
```env
SUPABASE_URL="your-project-url"
SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Authentication
- New users will default to the `student` role.
- To make yourself an admin, go to the Supabase **Table Editor -> profiles** and change the `role` of your user to `admin`.

## Project Structure

- `/src/components`: Reusable UI and Layout components.
- `/src/pages`: Main application screens.
- `/src/lib`: Supabase client and utility functions.
- `/supabase`: Database schema and reference files.

## Admin Features
Visit `/admin` to view the dashboard. Note: You must have the `admin` role in your profile record.
