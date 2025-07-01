const express = require("express");
const mongoose = require('mongoose');
const Review = require('../models/review');
const Listing = require('../models/listing');
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");

const route = express.Router({ mergeParams: true });
const { reviewSchema } = require('../schema.js');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!res.locals.currUser) {
        res.cookie('error', 'You must be logged in to leave a review', { maxAge: 5000, httpOnly: false });
        return res.redirect("/user/login");
    }
    next();
};

// Middleware to check if user is the review author
const isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.currUser.id)) {
        res.cookie('error', "You don't have permission to delete this review", { maxAge: 5000, httpOnly: false });
        return res.redirect(`/listings/${id}`);
    }
    next();
};

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Create Review Route
route.post("/reviews", isLoggedIn, validateReview, wrapAsync(async(req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    const newReview = new Review(req.body.review);
    
    // Set the author to the current user's ID
    newReview.author = res.locals.currUser.id;
    
    console.log("Debug - Creating Review:", {
        listingId: listing._id,
        review: {
            comment: newReview.comment,
            rating: newReview.rating,
            author: newReview.author
        },
        currentUser: res.locals.currUser
    });
    
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();
    
    res.cookie('success', 'Review added successfully!', { maxAge: 5000, httpOnly: false });
    res.redirect(`/listings/${listing.id}`);
}));

// Delete Review Route
route.delete("/reviews/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.cookie('success', 'Review deleted successfully!', { maxAge: 5000, httpOnly: false });
    res.redirect(`/listings/${id}`);
}));

module.exports = route;
