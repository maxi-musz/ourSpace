import asyncHandler from "../../middleware/asyncHandler.js"
import Listing from "../../models/listingModel.js"

const getAllListings = asyncHandler(async(req, res) => {
    console.log("Getting all listings...".yellow)
    try{
        const listings = await Listing.find()
        console.log("All listings successfully retrieved".america)
        res.status(200).json({
            success : true,
            message : "All listings successfully retrieved",
            total: listings.length,
            data : listings
        })

    }catch(err){
        console.log(`Error retrieving users: ${err.message}`)
        res.status(400).json({
            message : `Error getting users: ${err.message || err}`,
        })
    }
})

export {
    getAllListings,
}