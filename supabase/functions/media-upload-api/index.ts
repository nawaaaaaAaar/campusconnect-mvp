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
        const { mediaData, fileName, mediaType } = await req.json();

        if (!mediaData || !fileName || !mediaType) {
            throw new Error('Media data, filename, and media type are required');
        }

        // Validate media type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
        if (!allowedTypes.includes(mediaType)) {
            throw new Error('Unsupported media type. Allowed: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM)');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Extract base64 data from data URL
        const base64Data = mediaData.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Validate file size (max 50MB for videos, 10MB for images)
        const maxSize = mediaType.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (binaryData.length > maxSize) {
            throw new Error(`File too large. Max size: ${mediaType.startsWith('video/') ? '50MB' : '10MB'}`);
        }

        // Generate unique filename with user ID prefix
        const timestamp = Date.now();
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${userId}/${timestamp}_${safeFileName}`;
        const bucketName = mediaType.startsWith('video/') ? 'post-videos' : 'post-images';

        // Upload to Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${uniqueFileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mediaType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload error:', errorText);
            throw new Error(`Upload failed: ${errorText}`);
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${uniqueFileName}`;

        // Save media metadata to database
        const mediaRecord = {
            user_id: userId,
            file_name: safeFileName,
            file_path: uniqueFileName,
            media_type: mediaType,
            file_size: binaryData.length,
            public_url: publicUrl,
            bucket_name: bucketName,
            created_at: new Date().toISOString()
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/media_uploads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(mediaRecord)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('Database insert error:', errorText);
            // Continue even if database insert fails - we have the uploaded file
        }

        const result = {
            data: {
                publicUrl,
                fileName: safeFileName,
                mediaType,
                fileSize: binaryData.length,
                uploadedAt: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Media upload error:', error);

        const errorResponse = {
            error: {
                code: 'MEDIA_UPLOAD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});