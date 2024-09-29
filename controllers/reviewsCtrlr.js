import asyncHandler from "../middleware/asyncHandler.js";
import Listing from "../models/listingModel.js";
import Review from "../models/reviewsModel.js";
import ReviewStats from "../models/reviewTotalModel.js";
import cloudinaryConfig from "../uploadUtils/cloudinaryConfig.js";

const uploadReviewImagesToCloudinary = async (files) => {
    const uploadPromises = files.map(file => {
        return cloudinaryConfig.uploader.upload(file.path, {
            folder: 'ourSpace/review-images'
        });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Extract only the URLs (or secure URLs) from the response
    return uploadedImages.map(image => image.secure_url);
};


const addNewReview = asyncHandler(async (req, res) => {
    console.log("Adding a new review".yellow);

    const { listingId, userId } = req.query;

    const {
        starValue,
        title,
        experience,
        stayPeriod,
        cleanliness,
        accuracy,
        value,
        service,
        facilities,
        location,
        reviewCertification
    } = req.body;

    try {
        console.log("Creating a new review".blue);

        let reviewImages = [];

        // Check if files are uploaded
        if (req.files && req.files.length > 0) {
            console.log("Uploading review images".grey)
            reviewImages = await uploadReviewImagesToCloudinary(req.files);  // Pass the entire array
        }

        const review = await Review.create({
            listing: listingId,
            user: userId,
            starValue: parseFloat(starValue.trim()),
            title: title.trim(),
            experience: experience.trim(),
            stayPeriod: stayPeriod.trim(),
            cleanliness: parseFloat(cleanliness.trim()),
            accuracy: parseFloat(accuracy.trim()),
            value: parseFloat(value.trim()),
            service: parseFloat(service.trim()),
            facilities: parseFloat(facilities.trim()),
            location: parseFloat(location.trim()),
            reviewImages,
            reviewCertification: reviewCertification.trim()
        });

        let reviewStats = await ReviewStats.findOne({ listing: listingId });

        if (!reviewStats) {
            reviewStats = new ReviewStats({
                listing: listingId,
                totalReviews: 0,
                totalStarRating: 0,
                totalCleanliness: 0,
                totalAccuracy: 0,
                totalValue: 0,
                totalService: 0,
                totalFacilities: 0,
                totalLocation: 0
            });
        }

        console.log("Review successfully created, updating review statistics".green);
        reviewStats.totalReviews += 1;
        reviewStats.totalStarRating = ((reviewStats.totalStarRating * (reviewStats.totalReviews - 1)) + parseFloat(starValue.trim())) / reviewStats.totalReviews;
        reviewStats.totalCleanliness = ((reviewStats.totalCleanliness * (reviewStats.totalReviews - 1)) + parseFloat(cleanliness.trim())) / reviewStats.totalReviews;
        reviewStats.totalAccuracy = ((reviewStats.totalAccuracy * (reviewStats.totalReviews - 1)) + parseFloat(accuracy.trim())) / reviewStats.totalReviews;
        reviewStats.totalValue = ((reviewStats.totalValue * (reviewStats.totalReviews - 1)) + parseFloat(value.trim())) / reviewStats.totalReviews;
        reviewStats.totalService = ((reviewStats.totalService * (reviewStats.totalReviews - 1)) + parseFloat(service.trim())) / reviewStats.totalReviews;
        reviewStats.totalFacilities = ((reviewStats.totalFacilities * (reviewStats.totalReviews - 1)) + parseFloat(facilities.trim())) / reviewStats.totalReviews;
        reviewStats.totalLocation = ((reviewStats.totalLocation * (reviewStats.totalReviews - 1)) + parseFloat(location.trim())) / reviewStats.totalReviews;

        await reviewStats.save();

        console.log("Review and review statistics updated successfully".magenta);
        res.status(201).json({
            success: true,
            message: "Your review has successfully been submitted",
            data: review
        });
    } catch (error) {
        console.log("Error", error.message);
        res.status(400).json({
            success: false,
            message: "Error encountered while submitting review",
            error
        });
    }
});



export { 
    addNewReview
 };