Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get service role key from environment
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing environment variables');
    }

    // Get project reference from URL
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    
    // Update auth settings using Management API
    const authSettings = {
      SITE_URL: 'https://campusconnect-mvp.vercel.app',
      URI_ALLOW_LIST: 'https://campusconnect-mvp.vercel.app,https://campusconnect-mvp.vercel.app/auth/callback',
      SECURITY_CAPTCHA_ENABLED: false,
      SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
      SMTP_ADMIN_EMAIL: 'admin@campusconnect.com',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 587,
      SMTP_USER: '',
      SMTP_PASS: '',
      SMTP_SENDER_NAME: 'CampusConnect',
      MAILER_SECURE_EMAIL_CHANGE_ENABLED: true,
      MAILER_AUTOCONFIRM: false,
      PASSWORD_MIN_LENGTH: 6,
      EXTERNAL_GOOGLE_ENABLED: true,
      EXTERNAL_GOOGLE_CLIENT_ID: Deno.env.get('GOOGLE_CLIENT_ID') || '',
      EXTERNAL_GOOGLE_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
      EXTERNAL_GOOGLE_REDIRECT_URI: 'https://campusconnect-mvp.vercel.app/auth/callback'
    };

    // The Management API endpoint for updating auth config
    const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
    
    const response = await fetch(managementUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify(authSettings)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Management API Error:', errorText);
      
      // Return manual configuration instructions
      const manualInstructions = {
        message: 'Could not update settings automatically. Please update manually in Supabase Dashboard.',
        instructions: {
          step1: 'Go to Supabase Dashboard > Authentication > Settings',
          step2: 'Set Site URL to: https://campusconnect-mvp.vercel.app',
          step3: 'Add to Redirect URLs: https://campusconnect-mvp.vercel.app/auth/callback',
          step4: 'Ensure Google OAuth redirect URI is set to: https://campusconnect-mvp.vercel.app/auth/callback'
        },
        current_settings: authSettings
      };
      
      return new Response(JSON.stringify({ 
        success: false, 
        instructions: manualInstructions 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Auth settings updated successfully',
      settings: authSettings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating auth settings:', error);
    
    // Provide manual configuration as fallback
    const manualConfig = {
      message: 'Please configure manually in Supabase Dashboard',
      steps: [
        'Go to Supabase Dashboard > Authentication > Settings',
        'Set Site URL: https://campusconnect-mvp.vercel.app',
        'Add Redirect URLs: https://campusconnect-mvp.vercel.app/auth/callback',
        'Update Google OAuth settings if using Google sign-in'
      ]
    };

    return new Response(JSON.stringify({ 
      error: error.message,
      manual_config: manualConfig 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});