const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==================== LOGIN ====================
// Demo login — no database check
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Demo user — no DB lookup and no password comparison
    const user = {
      id: 'demo-user-001',
      name: 'Demo User',
      email: email.toLowerCase().trim(),
      role: 'admin',
    };

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET ||
        'smartcold_storage_demo_jwt_secret_key_2026',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


// ==================== GET ME ====================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
    });
  }
};


// ==================== UPDATE PROFILE ====================
const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email.toLowerCase().trim();
    }

    if (password) {
      const bcrypt = require('bcryptjs');

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==================== EXPORT ====================
module.exports = {
  login,
  getMe,
  updateProfile,
};
