const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require('../schema.js');
const User = require("../models/user");
const { isLoggedIn, isOwner } = require('../authMiddleware');
const listingController = require('../controllers/listings');

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
router.get("/", wrapAsync(listingController.index));

// My Listings Route - Must be before /:id route
router.get("/my-listings", isLoggedIn, wrapAsync(listingController.myListings));

// New Route - Requires login
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Show Route - Public access
router.get("/:id", wrapAsync(listingController.show));

// Create Route - Requires login
router.post("/", isLoggedIn, validateListing, wrapAsync(listingController.create));

// Edit Route - Requires login and ownership
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// Update Route - Requires login and ownership
router.put("/:id", isLoggedIn, isOwner, validateListing, wrapAsync(listingController.update));

// Delete Route - Requires login and ownership
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.delete));

module.exports = router;