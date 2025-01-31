const Product=require('../../models/productModel')
const User=require('../../models/userModel')

const  addReview = async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.session.user;

    try {

if(!userId){
    return res.status(401).json({ message: 'Please login to post a review.' });
}

        const product = await Product.findById(productId);
        const existingReview = product.reviews.find(review => review.userId.toString() === userId.toString());
         if (existingReview) {
          return   res.status(400).json({ message: 'You can only post one review per product.' });
         }
 
        product.reviews.push({
            userId: userId,
            rating,
            comment
        });
        await product.save();
        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding review', error });
    }

};

const removeReview = async (req, res) => {
    const reviewId = req.params.id;
    console.log('Removing review with ID:', reviewId);
    try {
        // Assuming you have a Product model and reviews are embedded
        const product = await Product.findOneAndUpdate(
            { 'reviews._id': reviewId },
            { $pull: { reviews: { _id: reviewId } } },
            { new: true }
        );

        if (product) {
            res.status(200).json({ message: 'Review removed successfully' });
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error removing review', error });
    }
};



module.exports={
    addReview,
    removeReview
}