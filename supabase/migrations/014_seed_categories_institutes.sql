-- Migration: Seed categories and institutes data
-- Version: 1.0.0
-- Purpose: Populate categories and institutes tables with initial data (PRD 3.3)

-- Create categories table if not exists
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert categories
INSERT INTO categories (name, icon, display_order, description) VALUES
  ('Technology', '💻', 1, 'Computer science, AI, robotics, and tech innovation'),
  ('Sports', '🏆', 2, 'Athletic clubs, fitness groups, and sports teams'),
  ('Arts', '🎨', 3, 'Visual arts, painting, sculpture, and creative expression'),
  ('Music', '🎵', 4, 'Music performance, bands, orchestras, and music appreciation'),
  ('Academic', '📚', 5, 'Subject-specific clubs and academic competition teams'),
  ('Social', '👥', 6, 'Social gatherings, networking, and community building'),
  ('Cultural', '🌍', 7, 'Cultural heritage, international student groups, and diversity'),
  ('Business', '💼', 8, 'Entrepreneurship, finance, consulting, and business development'),
  ('Health', '❤️', 9, 'Mental health, wellness, fitness, and healthy living'),
  ('Environment', '🌱', 10, 'Sustainability, conservation, and environmental activism'),
  ('Volunteer', '🤝', 11, 'Community service, volunteering, and social impact'),
  ('Gaming', '🎮', 12, 'Video games, esports, board games, and gaming culture'),
  ('Media', '📺', 13, 'Journalism, broadcasting, film, and content creation'),
  ('Politics', '🏛️', 14, 'Political discourse, debate, and civic engagement'),
  ('Religious', '🕊️', 15, 'Faith-based organizations and spiritual communities')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Seed institutes table (sample data - should be customized per deployment)
-- Note: In production, this would contain actual universities in the target region

INSERT INTO institutes (name, short_name, location, verified) VALUES
  ('Massachusetts Institute of Technology', 'MIT', 'Cambridge, MA, USA', true),
  ('Stanford University', 'Stanford', 'Stanford, CA, USA', true),
  ('Harvard University', 'Harvard', 'Cambridge, MA, USA', true),
  ('University of Cambridge', 'Cambridge', 'Cambridge, UK', true),
  ('University of Oxford', 'Oxford', 'Oxford, UK', true),
  ('California Institute of Technology', 'Caltech', 'Pasadena, CA, USA', true),
  ('University of California, Berkeley', 'UC Berkeley', 'Berkeley, CA, USA', true),
  ('Imperial College London', 'Imperial', 'London, UK', true),
  ('ETH Zurich', 'ETH', 'Zurich, Switzerland', true),
  ('University of Toronto', 'U of T', 'Toronto, ON, Canada', true),
  ('Princeton University', 'Princeton', 'Princeton, NJ, USA', true),
  ('Yale University', 'Yale', 'New Haven, CT, USA', true),
  ('Columbia University', 'Columbia', 'New York, NY, USA', true),
  ('University of Chicago', 'UChicago', 'Chicago, IL, USA', true),
  ('Carnegie Mellon University', 'CMU', 'Pittsburgh, PA, USA', true),
  ('University of Pennsylvania', 'Penn', 'Philadelphia, PA, USA', true),
  ('Cornell University', 'Cornell', 'Ithaca, NY, USA', true),
  ('University of Michigan', 'UMich', 'Ann Arbor, MI, USA', true),
  ('Georgia Institute of Technology', 'Georgia Tech', 'Atlanta, GA, USA', true),
  ('University of Washington', 'UW', 'Seattle, WA, USA', true)
ON CONFLICT (name) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  location = EXCLUDED.location,
  verified = EXCLUDED.verified;

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

-- Comment on tables
COMMENT ON TABLE categories IS 'PRD 3.3: Society categories for classification and discovery';
COMMENT ON COLUMN categories.display_order IS 'Order in which categories are displayed in UI (lower = higher priority)';
COMMENT ON COLUMN categories.icon IS 'Emoji or icon identifier for visual display';



