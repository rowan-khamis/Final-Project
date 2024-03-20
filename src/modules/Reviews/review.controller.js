import Review from "../../../DB/Models/reviews.model.js"
// =================================== Add Review api ========================== //
export const addReview = async (req, res, next) => {

    const { _id:addedBy } = req.authUser;
    const { productId } = req.params;
    const { comment } = req.body;
    
    try{
        const review = await Review.create({
            comment,
            addedBy,
            productId
        })
        res.status(201).json({
            message: 'Review added successfully',
            review
        })
    }catch(error){
        console.log('Error in adding a new review : ', error);
        return next(error)
    }
} 

// =================================== Delete Review API ========================== //
export const deleteReview = async (req, res, next) => {
    const { _id: addedBy } = req.authUser;
    const { id } = req.params;
  
    try {
      const review = await Review.findById(id);
      if (!review) {
        return next(new Error('Review not found', { cause: 404 }));
      } else if (addedBy !== review.addedBy) {
        return next(new Error('You are not authorized to perform this action', { cause: 403 }));
      }
  
      const deletedReview = await Review.findByIdAndDelete(id);
      if (!deletedReview) {
        return next(new Error('Failed to delete the review', { cause: 500 }));
      }
  
      res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error(error);
      return next(new Error('Internal server error', { cause: 500 }));
    }
  };

  // =================================== Get all reviews for specific product api ========================== //
  export const getAllReviews = async (req, res, next) => {
    const { _id: addedBy } = req.authUser;
    const { productId } = req.params;
  
    const reviews = await Review.find({productId:productId}).cursor()
    let finalResult = []
    for (let doc = await reviews.next(); doc != null; doc = await reviews.next()) {
        const docObject = doc.toObject()
        finalResult.push(docObject)
    }
    res.status(200).json({ message: 'done', brands: finalResult })
  };