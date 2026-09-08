
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ===============================
// REGISTER USER
// ===============================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// ===============================
// LOGIN USER
// ===============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

// ===============================
// GET LOGGED-IN USER PROFILE
// ===============================
const getUserProfile = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching profile",
    });
  }
};

// ===============================
// UPDATE USER PROFILE
// ===============================
const updateUserProfile = async (req, res) => {
  try {
    const { name, businessName, phone, address } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (businessName !== undefined) user.businessName = businessName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    const updatedUser = await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        businessName: updatedUser.businessName,
        phone: updatedUser.phone,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);

    return res.status(500).json({
      message: "Server error while updating profile",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};