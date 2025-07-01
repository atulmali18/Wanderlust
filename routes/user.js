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
  res.render("users/signup.ejs", { currUser: res.locals.currUser });
});

// Show login form
router.get("/login", (req, res) => {
  res.render("users/login.ejs", { currUser: res.locals.currUser });
});

// Base user route
router.get("/", (req, res) => {
  res.redirect("/listings");
});

// Signup Route
router.post("/signup", wrapAsync(userController.signup));

// Login Route
router.post("/login", wrapAsync(userController.login));

// Logout Route - Changed to GET
router.get("/logout", userController.logout);

// Profile Route
router.get("/profile", wrapAsync(userController.renderProfile));

module.exports = router;
