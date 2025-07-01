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
            res.cookie('error', 'Username or email already exists', { maxAge: 5000, httpOnly: false });
            return res.redirect("/user/signup");
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();
        
        // Generate token
        const token = generateToken(user);
        
        // Set JWT cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.cookie('success', `Welcome to WanderLust, ${user.username}!`, { maxAge: 5000, httpOnly: false });
        res.redirect("/listings");
    } catch (error) {
        res.cookie('error', error.message, { maxAge: 5000, httpOnly: false });
        res.redirect("/user/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.cookie('error', 'Invalid email or password', { maxAge: 5000, httpOnly: false });
            return res.redirect("/user/login");
        }

        const isValid = await user.authenticate(password);
        if (!isValid) {
            res.cookie('error', 'Invalid email or password', { maxAge: 5000, httpOnly: false });
            return res.redirect("/user/login");
        }

        const token = generateToken(user);
        
        // Set JWT cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.cookie('success', `Welcome back, ${user.username}!`, { maxAge: 5000, httpOnly: false });
        res.redirect("/listings");
    } catch (error) {
        res.cookie('error', 'Login failed. Please try again.', { maxAge: 5000, httpOnly: false });
        res.redirect("/user/login");
    }
};

module.exports.logout = (req, res) => {
    res.clearCookie('token');
    res.cookie('success', 'Successfully logged out!', { maxAge: 5000, httpOnly: false });
    res.redirect("/listings");
};

module.exports.renderProfile = async (req, res) => {
    try {
        const user = await User.findById(res.locals.currUser.id).select("-password");
        res.render("users/profile.ejs", { user });
    } catch (error) {
        res.cookie('error', 'Error loading profile', { maxAge: 5000, httpOnly: false });
        res.redirect("/listings");
    }
}; 