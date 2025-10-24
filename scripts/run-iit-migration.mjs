#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.egdavxjkyxvawgguqmvx:TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
});

const migrationSQL = `
-- Clear existing sample data
DELETE FROM institutes WHERE verified = true;

-- Insert all 23 IITs
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
`;

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('🚀 Running IIT migration...');
    const result = await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Rows affected: ${result.rowCount || 0}`);
    
    // Verify the data
    console.log('\n🔍 Verifying institutes...');
    const verifyResult = await client.query('SELECT COUNT(*) as count FROM institutes WHERE verified = true');
    const count = verifyResult.rows[0].count;
    console.log(`✅ Total verified institutes: ${count}`);
    
    if (count >= 23) {
      console.log('🎉 All 23 IITs successfully added!');
      
      // Show first 5 IITs
      const sampleResult = await client.query('SELECT short_name FROM institutes WHERE verified = true ORDER BY short_name LIMIT 5');
      console.log('\n📋 Sample IITs:');
      sampleResult.rows.forEach(row => {
        console.log(`   - ${row.short_name}`);
      });
      console.log('   ... and 18 more');
    } else {
      console.warn(`⚠️  Warning: Expected 23 IITs, but found ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed.');
  }
}

runMigration();

