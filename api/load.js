export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests'
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
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
        message: 'The userId query parameter is required'
      });
    }
    
    const userInfo = await verifyGoogleToken(accessToken);
    if (!userInfo || userInfo.id !== userId) {
      return res.status(401).json({ 
        error: 'Invalid token or user mismatch',
        message: 'The provided token does not match the requested user'
      });
    }

    console.log('=== LOAD REQUEST ===');
    console.log(`User: ${userInfo.email} (${userId})`);
    console.log(`Loading data for user...`);
    console.log('==================');
    
    res.status(200).json({ 
      success: true, 
      data: null,
      timestamp: null,
      message: 'No saved data found (this is normal for new users)',
      userId: userId
    });
    
  } catch (error) {
    console.error('Load endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while loading data'
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
