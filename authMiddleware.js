const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { verifyToken } = require('./utils/jwtUtils.js');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        
        try {
            const user = verifyToken(token);
            req.user = user;
            next();
        } catch (error) {
            res.status(403).json({ message: 'Invalid token' });
        }
    } else {
        res.status(401).json({ message: 'No token provided' });
    }
};

module.exports = { authenticateJWT };

module.exports.isLoggedIn = (req, res, next) => {
    if (!res.locals.currUser) {
        res.cookie('error', 'You must be logged in to create listing!', { maxAge: 5000, httpOnly: false });
        return res.redirect("/user/login");
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser.id)) {
        res.cookie('error', 'You are not the owner of this listing', { maxAge: 5000, httpOnly: false });
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.currUser.id)) {
        res.cookie('error', 'You are not the author of this review', { maxAge: 5000, httpOnly: false });
        return res.redirect(`/listings/${id}`);
    }
    next();
};