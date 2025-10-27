-- Member-Society Communication Migration
-- Adds support for members to communicate with their respective societies

-- Create member_society_messages table
CREATE TABLE IF NOT EXISTS member_society_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type VARCHAR(20) DEFAULT 'message', -- 'message', 'announcement', 'feedback'
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES member_society_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_messages_society_id ON member_society_messages(society_id);
CREATE INDEX IF NOT EXISTS idx_member_messages_sender_id ON member_society_messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_member_messages_created_at ON member_society_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_messages_is_read ON member_society_messages(is_read);

-- Create RLS policies for member_society_messages
ALTER TABLE member_society_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Society members can view messages for their society
CREATE POLICY "Society members can view society messages" ON member_society_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM society_members 
      WHERE society_members.society_id = member_society_messages.society_id 
      AND society_members.user_id = auth.uid()
    )
  );

-- Policy: Society members can create messages for their society
CREATE POLICY "Society members can send messages to society" ON member_society_messages
  FOR INSERT WITH CHECK (
    sender_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM society_members 
      WHERE society_members.society_id = member_society_messages.society_id 
      AND society_members.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own messages
CREATE POLICY "Users can update their own messages" ON member_society_messages
  FOR UPDATE USING (sender_user_id = auth.uid());

-- Policy: Society leaders can mark messages as read
CREATE POLICY "Society leaders can manage messages" ON member_society_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM society_members 
      WHERE society_members.society_id = member_society_messages.society_id 
      AND society_members.user_id = auth.uid()
      AND society_members.role IN ('admin', 'leader')
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_member_messages_updated_at BEFORE UPDATE
    ON member_society_messages FOR EACH ROW EXECUTE PROCEDURE
    update_updated_at_column();
