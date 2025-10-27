-- Migration: Seed IIT institutes data
-- Version: 1.0.0
-- Purpose: Replace sample institutes with all IITs (Indian Institutes of Technology)

-- Clear existing sample data (keeping the table structure)
DELETE FROM institutes WHERE verified = true;

-- Insert all 23 IITs in India
INSERT INTO institutes (name, short_name, location, verified) VALUES
  ('Indian Institute of Technology Kharagpur', 'IIT Kharagpur', 'Kharagpur, West Bengal', true),
  ('Indian Institute of Technology Bombay', 'IIT Bombay', 'Mumbai, Maharashtra', true),
  ('Indian Institute of Technology Madras', 'IIT Madras', 'Chennai, Tamil Nadu', true),
  ('Indian Institute of Technology Kanpur', 'IIT Kanpur', 'Kanpur, Uttar Pradesh', true),
  ('Indian Institute of Technology Delhi', 'IIT Delhi', 'New Delhi, Delhi', true),
  ('Indian Institute of Technology Guwahati', 'IIT Guwahati', 'Guwahati, Assam', true),
  ('Indian Institute of Technology Roorkee', 'IIT Roorkee', 'Roorkee, Uttarakhand', true),
  ('Indian Institute of Technology Ropar', 'IIT Ropar', 'Rupnagar, Punjab', true),
  ('Indian Institute of Technology Bhubaneswar', 'IIT Bhubaneswar', 'Bhubaneswar, Odisha', true),
  ('Indian Institute of Technology Gandhinagar', 'IIT Gandhinagar', 'Gandhinagar, Gujarat', true),
  ('Indian Institute of Technology Hyderabad', 'IIT Hyderabad', 'Hyderabad, Telangana', true),
  ('Indian Institute of Technology Jodhpur', 'IIT Jodhpur', 'Jodhpur, Rajasthan', true),
  ('Indian Institute of Technology Patna', 'IIT Patna', 'Patna, Bihar', true),
  ('Indian Institute of Technology Indore', 'IIT Indore', 'Indore, Madhya Pradesh', true),
  ('Indian Institute of Technology Mandi', 'IIT Mandi', 'Mandi, Himachal Pradesh', true),
  ('Indian Institute of Technology (BHU) Varanasi', 'IIT BHU', 'Varanasi, Uttar Pradesh', true),
  ('Indian Institute of Technology Palakkad', 'IIT Palakkad', 'Palakkad, Kerala', true),
  ('Indian Institute of Technology Tirupati', 'IIT Tirupati', 'Tirupati, Andhra Pradesh', true),
  ('Indian Institute of Technology (ISM) Dhanbad', 'IIT ISM', 'Dhanbad, Jharkhand', true),
  ('Indian Institute of Technology Bhilai', 'IIT Bhilai', 'Bhilai, Chhattisgarh', true),
  ('Indian Institute of Technology Goa', 'IIT Goa', 'Goa', true),
  ('Indian Institute of Technology Jammu', 'IIT Jammu', 'Jammu, Jammu & Kashmir', true),
  ('Indian Institute of Technology Dharwad', 'IIT Dharwad', 'Dharwad, Karnataka', true)
ON CONFLICT (name) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  location = EXCLUDED.location,
  verified = EXCLUDED.verified;

-- Comment on the update
COMMENT ON TABLE institutes IS 'All IITs (Indian Institutes of Technology) for user selection during signup';


