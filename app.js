const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const User = require("./models/user.js");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");

// Set up environment variables
require("dotenv").config();

// Database connection
const MONGO_URL = process.env.MONGODB_URI;

// Routes
const listingRoutes = require("./routes/listing");
const reviewRoutes = require("./routes/review");
const userRoutes = require("./routes/user");

// Models
const Listing = require("./models/listing");
const Review = require("./models/review");

const app = express();

// Set up EJS and middlewares
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "images.unsplash.com", "plus.unsplash.com"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
        },
    },
}));

// Session Configuration
const sessionOptions = {
    secret: process.env.SESSION_SECRET || "devsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax'
    },
    store: new MongoStore({
        mongoUrl: MONGO_URL,
        touchAfter: 24 * 3600 // time period in seconds
    })
};

app.use(session(sessionOptions));
app.use(flash());

// Flash and User Middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.session.user || null;
    next();
});

// Logging middleware
app.use((req, res, next) => {
    // Ignore Chrome DevTools requests
    if (req.path.includes('.well-known/appspecific')) {
        return res.status(204).end();
    }
    console.log(`Incoming request: ${req.method} ${req.url}`);
    console.log("Current User Session:", req.session.user);
    next();
});

// Handle favicon requests
app.get("/favicon.ico", (req, res) => res.sendStatus(204));

// Database connection
async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
}
main();

// Routes
app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use("/listings", listingRoutes);
app.use("/listings/:id", reviewRoutes);
app.use("/user", userRoutes);

// Catch-all route
app.all("*", (req, res, next) => {
    // Ignore Chrome DevTools requests
    if (req.path.includes('.well-known/appspecific')) {
        return res.status(204).end();
    }
    next(new ExpressError(404, "Page Not Found!!"));
});

// Error-handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    const message = err.message || "Something went wrong!";
    
    // Only log errors that aren't 404s for DevTools
    if (!(statusCode === 404 && req.path.includes('.well-known/appspecific'))) {
        console.error(`[${new Date().toISOString()}] Error: ${message}`, err);
    }
    
    res.status(statusCode).render("error.ejs", { message, err });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
