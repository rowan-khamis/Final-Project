import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import reviewController from './review.controller.js'
const router = Router();

router.post('/', expressAsyncHandler(reviewController.addReview));
router.delete('/', expressAsyncHandler(reviewController.deleteReview));
router.get('/', expressAsyncHandler(reviewController.getAllReviews));
export default router;