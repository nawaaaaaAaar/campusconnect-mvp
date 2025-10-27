-- Analytics events table for tracking user actions and system events
-- Created for CampusConnect MVP telemetry system

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  society_id UUID REFERENCES societies(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  device TEXT NOT NULL,
  app_version TEXT NOT NULL,
  latency_ms INTEGER,
  post_count INTEGER,
  feed_type TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for efficient querying
  INDEX idx_analytics_events_user_id (user_id),
  INDEX idx_analytics_events_event (event),
  INDEX idx_analytics_events_created_at (created_at),
  INDEX idx_analytics_events_user_event (user_id, event),
  INDEX idx_analytics_events_user_date (user_id, created_at)
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
-- Only admins can view all analytics
CREATE POLICY "Admins can view all analytics events" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- Users can insert their own events
CREATE POLICY "Users can insert their own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Service role has full access (for background operations)
CREATE POLICY "Service role has full access" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');

-- Create a function to automatically include user_id if not provided
CREATE OR REPLACE FUNCTION insert_analytics_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate user_id if not provided and user is authenticated
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Auto-populate device info
  IF NEW.device IS NULL THEN
    NEW.device := 'unknown';
  END IF;
  
  -- Auto-populate app version
  IF NEW.app_version IS NULL THEN
    NEW.app_version := '1.0.0';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic field population
DROP TRIGGER IF EXISTS populate_analytics_event ON analytics_events;
CREATE TRIGGER populate_analytics_event
  BEFORE INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION insert_analytics_event();
