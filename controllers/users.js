const User = require("../models/user.js");
const { generateToken } = require("../utils/jwtUtils.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            req.flash("error", "Username or email already exists");
            return res.redirect("/user/signup");
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();
        
        // Generate token
        const token = generateToken(user);
        
        // Store user in session
        req.session.user = {
            id: user._id,
            username: user.username,
            token: token,
            isAdmin: user.isAdmin
        };

        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                req.flash("error", "Error during signup");
                return res.redirect("/user/signup");
            }
            req.flash("success", `Welcome to WanderLust, ${user.username}!`);
            res.redirect("/listings");
        });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/user/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            req.flash("error", "Invalid username or password");
            return res.redirect("/user/login");
        }

        const isValid = await user.authenticate(password);
        if (!isValid) {
            req.flash("error", "Invalid username or password");
            return res.redirect("/user/login");
        }

        const token = generateToken(user);
        
        // Store user in session
        req.session.user = {
            id: user._id,
            username: user.username,
            token: token,
            isAdmin: user.isAdmin
        };

        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                req.flash("error", "Error during login");
                return res.redirect("/user/login");
            }
            req.flash("success", `Welcome back, ${user.username}!`);
            res.redirect("/listings");
        });
    } catch (error) {
        req.flash("error", "Login failed. Please try again.");
        res.redirect("/user/login");
    }
};

module.exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            req.flash("error", "Error logging out");
            return res.redirect("/listings");
        }
        req.flash("success", "Successfully logged out!");
        res.redirect("/listings");
    });
};

module.exports.renderProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select("-password");
        res.render("users/profile.ejs", { user });
    } catch (error) {
        req.flash("error", "Error loading profile");
        res.redirect("/listings");
    }
}; 