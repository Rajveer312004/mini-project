const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key-change-in-production", {
    expiresIn: "7d",
  });
};

// Sign up new user
exports.signup = async (req, res) => {
  try {
    const { email, password, fullName, organization, designation, phone, address, role } = req.body;

    // Validation - organization is required for agency role, optional for public
    const isPublicUser = role === "public";
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        message: "Missing required fields: email, password, and fullName are required" 
      });
    }

    if (!isPublicUser && !organization) {
      return res.status(400).json({ 
        message: "Organization is required for agency users" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      fullName,
      organization: organization || (isPublicUser ? "Public User" : ""),
      designation: designation || "",
      phone: phone || "",
      address: address || "",
      role: role || "agency",
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    console.log(`✅ New user registered: ${user.email}`);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        organization: user.organization,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ 
      error: "Failed to register user", 
      details: error.message 
    });
  }
};

// Sign in existing user
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Account is deactivated. Please contact administrator." 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    console.log(`✅ User signed in: ${user.email}`);

    res.json({
      message: "Sign in successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        organization: user.organization,
        designation: user.designation,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in signin:", error);
    res.status(500).json({ 
      error: "Failed to sign in", 
      details: error.message 
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, organization, designation, phone, address } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (organization) user.organization = organization;
    if (designation !== undefined) user.designation = designation;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        organization: user.organization,
        designation: user.designation,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

