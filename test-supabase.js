// test-supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set (length: ' + supabaseKey.length + ')' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not properly configured!');
  console.error('Please check your .env file and ensure variables start with REACT_APP_');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔍 Testing connection...');

    // Test 1: Get current user (should be null for unauthenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Auth test failed:', userError.message);
    } else {
      console.log('✅ Auth test passed - Current user:', user ? user.email : 'null (unauthenticated)');
    }

    // Test 2: Try to sign up with a test user (this will fail if email already exists, but tests the API)
    console.log('\n🔍 Testing signup API...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome_completo: 'Test User',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (signupError) {
      console.log('⚠️  Signup test result:', signupError.message);
      if (signupError.message.includes('Invalid API key')) {
        console.error('❌ INVALID API KEY - Please check your Supabase configuration');
      } else if (signupError.message.includes('Email not confirmed')) {
        console.log('✅ API key is valid - Email confirmation required');
      } else {
        console.log('✅ API connection working - Other error:', signupError.message);
      }
    } else {
      console.log('✅ Signup test successful!');
      console.log('User created:', signupData.user?.email);
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testConnection();
