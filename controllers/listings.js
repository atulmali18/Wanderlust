const Listing = require('../models/listing');
const User = require('../models/user');

exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate("owner", "username");
    res.render("listings/index.ejs", {
        allListings,
        currUser: res.locals.currUser
    });
};

exports.myListings = async (req, res) => {
    try {
        const user = await User.findById(res.locals.currUser.id);
        if (!user) {
            res.cookie('error', 'User not found', { maxAge: 5000, httpOnly: false });
            return res.redirect("/listings");
        }
        const listings = await Listing.find({ owner: user._id })
            .populate("owner", "username")
            .sort({ createdAt: -1 });
        res.render("listings/my-listings.ejs", {
            listings,
            currUser: res.locals.currUser,
            title: "My Listings"
        });
    } catch (error) {
        res.cookie('error', 'Error fetching your listings', { maxAge: 5000, httpOnly: false });
        res.redirect("/listings");
    }
};

exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { currUser: res.locals.currUser });
};

exports.show = async (req, res) => {
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
    res.render("listings/show.ejs", {
        listing,
        currUser: res.locals.currUser
    });
};

exports.create = async (req, res) => {
    try {
        const newListing = new Listing(req.body.listing);
        newListing.owner = res.locals.currUser.id;
        await newListing.save();
        res.cookie('success', 'New listing created!', { maxAge: 5000, httpOnly: false });
        res.redirect("/listings");
    } catch (error) {
        res.cookie('error', 'Error creating listing', { maxAge: 5000, httpOnly: false });
        res.redirect("/listings/new");
    }
};

exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing, currUser: res.locals.currUser });
};

exports.update = async (req, res) => {
    let { id } = req.params;
    const updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });
    res.cookie('success', 'Listing updated successfully!', { maxAge: 5000, httpOnly: false });
    res.redirect(`/listings/${updatedListing._id}`);
};

exports.delete = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.cookie('success', 'Listing deleted successfully!', { maxAge: 5000, httpOnly: false });
    res.redirect("/listings");
};

exports.search = async (req, res) => {
    const { q } = req.query;
    let results = [];
    if (q && q.trim() !== "") {
        // Search by title or location (case-insensitive)
        results = await Listing.find({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { location: { $regex: q, $options: "i" } }
            ]
        }).populate("owner", "username");
    }
    res.render("listings/index.ejs", {
        allListings: results,
        currUser: res.locals.currUser,
        searchQuery: q
    });
}; 