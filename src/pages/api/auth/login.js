import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Call your backend API endpoint for authentication
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
      username,
      password
    });

    // Set cookies if needed for session management
    if (response.data && response.data.token) {
      // You could set a cookie here if needed
      // res.setHeader('Set-Cookie', `auth_token=${response.data.token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`);
    }

    // Return the response from the backend
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Login error:', error);
    
    // Forward error from the backend if available
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Authentication failed',
      });
    }

    // Generic error
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}