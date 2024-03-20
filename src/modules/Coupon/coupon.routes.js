
import { Router } from "express";
import * as  couponController from "./coupon.controller.js";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { endpointsRoles } from "./coupon.endpoints.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js"
import * as validators from  './coupon.validationSchemas.js';
const router = Router();


router.post('/', 
auth(endpointsRoles.ADD_COUPOUN), 
validationMiddleware(validators.addCouponSchema),
 expressAsyncHandler(couponController.addCoupon));

router.get('/', 
auth(endpointsRoles.ADD_COUPOUN), 
// validationMiddleware(validators.addCouponSchema),
 expressAsyncHandler(couponController.applyCoupon));

 router.put('/coupons/:id/toggle',expressAsyncHandler(couponController.enableDisable));
 router.get('/coupons/disabled',expressAsyncHandler(couponController.getAllDisableCoupons));
 router.get('/coupons/enabled',expressAsyncHandler(couponController.getAllEnableCoupons));
 router.get('/coupons/:id',expressAsyncHandler(couponController.getCouponById));

 router.put('/coupons/:id',);
export default router;