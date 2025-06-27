const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { generateToken, verifyToken } = require("../utils/jwtUtils.js");
const userController = require("../controllers/users.js");

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Show signup form
router.get("/signup", (req, res) => {
  res.render("users/signup.ejs", { currUser: req.session.user });
});

// Show login form
router.get("/login", (req, res) => {
  res.render("users/login.ejs", { currUser: req.session.user });
});

// Base user route
router.get("/", (req, res) => {
  res.redirect("/listings");
});

// Signup Route
router.post("/signup", wrapAsync(userController.signup));

// Login Route
router.post("/login", wrapAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/user/login");
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/user/login");
    }

    // Store complete user data in session
    req.session.user = {
        _id: user._id,
        username: user.username,
        email: user.email
    };
    
    console.log("User logged in:", req.session.user);
    req.flash("success", "Welcome back!");
    res.redirect("/listings");
}));

// Logout Route - Changed to GET
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/listings");
    }
    res.clearCookie("connect.sid");
    req.flash("success", "You have been logged out successfully!");
    res.redirect("/listings");
  });
});

// Profile Route
router.get("/profile", authenticateToken, wrapAsync(userController.renderProfile));

module.exports = router;
