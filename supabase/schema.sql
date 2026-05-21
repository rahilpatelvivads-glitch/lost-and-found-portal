-- Database Schema for Campus Lost & Found Portal

-- Enable Row Level Security
ALTER DATABASE postgres SET "search_path" TO public, extensions;

-- Create Users table (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  display_name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  preferred_language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Lost Items table
CREATE TABLE lost_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  lost_location TEXT NOT NULL,
  lost_date DATE NOT NULL,
  contact_info TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'lost' CHECK (status IN ('lost', 'returned', 'claimed')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Found Items table
CREATE TABLE found_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  found_location TEXT NOT NULL,
  found_date DATE NOT NULL,
  contact_info TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'found' CHECK (status IN ('found', 'returned', 'claimed')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Lost Items Policies
CREATE POLICY "Lost items are viewable by everyone" ON lost_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create lost items" ON lost_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own lost items" ON lost_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any lost item" ON lost_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Found Items Policies
CREATE POLICY "Found items are viewable by everyone" ON found_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create found items" ON found_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own found items" ON found_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any found item" ON found_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
