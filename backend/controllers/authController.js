const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');

function generateFarmerId() {
  return `BVM-F-${Date.now().toString().slice(-6)}`;
}

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const {
      name,
      mobile,
      password,
      location,
      crops,
      preferredLanguage
    } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile number and password are required.'
      });
    }

    const existingFarmer = await Farmer.findOne({ mobile });

    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const farmer = new Farmer({
      farmerId: generateFarmerId(),
      name,
      mobile,
      password: hashedPassword,
      location: location || '',
      crops: crops || [],
      preferredLanguage: preferredLanguage || 'te'
    });

    await farmer.save();

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully.',
      farmerId: farmer.farmerId
    });

  } catch (error) {
    console.error('Signup Error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to register farmer.'
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required.'
      });
    }

    const farmer = await Farmer.findOne({ mobile });

    if (!farmer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password.'
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      farmer.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password.'
      });
    }

    const token = jwt.sign(
      {
        farmerId: farmer.farmerId,
        mobile: farmer.mobile
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,

      farmer: {
        farmerId: farmer.farmerId,
        name: farmer.name,
        mobile: farmer.mobile,
        location: farmer.location,
        crops: farmer.crops,
        preferredLanguage: farmer.preferredLanguage
      }
    });

  } catch (error) {
    console.error('Login Error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to login.'
    });
  }
};