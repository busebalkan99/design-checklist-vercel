export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header',
        message: 'Please provide a valid Bearer token'
      });
    }

    const accessToken = authHeader.substring(7);
    const userInfo = await verifyGoogleToken(accessToken);
    if (!userInfo) {
      return res.status(401).json({ 
        error: 'Invalid Google token',
        message: 'The provided access token is invalid or expired'
      });
    }

    const { userId, userEmail, data, timestamp } = req.body;
    
    if (userId !== userInfo.id) {
      return res.status(403).json({ 
        error: 'User ID mismatch',
        message: 'The user ID does not match the authenticated user'
      });
    }

    console.log('=== SAVE REQUEST ===');
    console.log(`User: ${userEmail} (${userId})`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Data size: ${JSON.stringify(data).length} characters`);
    console.log('==================');
    
    res.status(200).json({ 
      success: true, 
      message: 'Data saved successfully',
      timestamp: new Date().toISOString(),
      userId: userId
    });
    
  } catch (error) {
    console.error('Save endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while saving data'
    });
  }
}

async function verifyGoogleToken(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Google API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const userInfo = await response.json();
    
    if (!userInfo.id || !userInfo.email) {
      console.error('Invalid user info from Google:', userInfo);
      return null;
    }
    
    return userInfo;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
