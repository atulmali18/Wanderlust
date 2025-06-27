const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require('../schema.js');
const User = require("../models/user");

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        req.flash("error", "You must be logged in to access this page");
        return res.redirect("/user/login");
    }
    next();
};

// Middleware to check if user is the owner
const isOwner = async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing.owner.equals(req.session.user.id)) {
        req.flash("error", "You don't have permission to perform this action");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Validation middleware for Listing Schema
const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Index Route - Public access
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({}).populate("owner", "username");
    res.render("listings/index.ejs", { 
        allListings, 
        currUser: req.session.user 
    });
}));

// My Listings Route - Must be before /:id route
router.get("/my-listings", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        console.log("Fetching listings for user:", req.session.user);
        
        // First verify the user exists
        const user = await User.findById(req.session.user._id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/listings");
        }

        // Find all listings owned by this user
        const listings = await Listing.find({ owner: user._id })
            .populate("owner", "username")
            .sort({ createdAt: -1 });
        
        console.log("Found listings:", listings.length);
        console.log("First listing (if any):", listings[0]);
        
        res.render("listings/my-listings.ejs", { 
            listings,
            currUser: req.session.user,
            title: "My Listings"
        });
    } catch (error) {
        console.error("Error in my-listings route:", error);
        req.flash("error", "Error fetching your listings");
        res.redirect("/listings");
    }
}));

// New Route - Requires login
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs", { currUser: req.session.user });
});

// Show Route - Public access
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("owner", "username")
        .populate({
            path: "reviews",
            populate: {
                path: "author",
                select: "username"
            }
        });
    
    // Ensure currUser is properly set
    const currUser = req.session.user || null;
    
    res.render("listings/show.ejs", { 
        listing, 
        currUser
    });
}));

// Create Route - Requires login
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    try {
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.session.user._id;
        
        console.log("Creating new listing:", {
            title: newListing.title,
            owner: newListing.owner,
            user: req.session.user
        });
        
        await newListing.save();
        req.flash("success", "New listing created!");
        res.redirect("/listings");
    } catch (error) {
        console.error("Error creating listing:", error);
        req.flash("error", "Error creating listing");
        res.redirect("/listings/new");
    }
}));

// Edit Route - Requires login and ownership
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing, currUser: req.session.user });
}));

// Update Route - Requires login and ownership
router.put("/:id", isLoggedIn, isOwner, validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${updatedListing._id}`);
}));

// Delete Route - Requires login and ownership
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
}));

module.exports = router;