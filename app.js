const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const cookieParser = require("cookie-parser");
const { verifyToken } = require('./utils/jwtUtils');

require("dotenv").config();

const MONGO_URL = process.env.MONGODB_URI;

const listingRoutes = require("./routes/listing");
const reviewRoutes = require("./routes/review");
const userRoutes = require("./routes/user");

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Middleware to set currUser from JWT cookie
app.use((req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const user = verifyToken(token);
            res.locals.currUser = user;
        } catch (err) {
            res.locals.currUser = null;
        }
    } else {
        res.locals.currUser = null;
    }
    next();
});

// Middleware to set flash messages from cookies
app.use((req, res, next) => {
    res.locals.success = req.cookies.success || null;
    res.locals.error = req.cookies.error || null;
    if (req.cookies.success) res.clearCookie('success');
    if (req.cookies.error) res.clearCookie('error');
    next();
});

// Logging middleware
app.use((req, res, next) => {
    if (req.path.includes('.well-known/appspecific')) {
        return res.status(204).end();
    }
    console.log(`Incoming request: ${req.method} ${req.url}`);
    console.log("Current User:", res.locals.currUser);
    next();
});

app.get("/favicon.ico", (req, res) => res.sendStatus(204));

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
}
main();

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use("/listings", listingRoutes);
app.use("/listings/:id", reviewRoutes);
app.use("/user", userRoutes);

app.all("*", (req, res, next) => {
    if (req.path.includes('.well-known/appspecific')) {
        return res.status(204).end();
    }
    next(new (require("./utils/ExpressError"))(404, "Page Not Found!!"));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    const message = err.message || "Something went wrong!";
    if (!(statusCode === 404 && req.path.includes('.well-known/appspecific'))) {
        console.error(`[${new Date().toISOString()}] Error: ${message}`, err);
    }
    res.status(statusCode).render("error.ejs", { message, err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
