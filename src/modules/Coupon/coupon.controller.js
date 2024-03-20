

import  Coupon  from '../../../DB/Models/coupon.model.js';
import CouponUsers  from '../../../DB/Models/coupon-users.model.js';

import User from '../../../DB/Models/user.model.js';
import { couponValidation } from '../../utils/coupon-validation.js';
//=============================== add coupon API ===============================//
export const addCoupon = async (req, res ,next) => {
    // destructuring the request body
    const { couponCode  , couponAmount , fromDate, toDate , isFixed, isPercentage , Users } = req.body;
    // destructuring the request authUser
    const { _id:addedBy} = req.authUser;  // const addedBy = req.authUser._id;

    // couponCode check
    const coupon = await Coupon.findOne({couponCode});
    if(coupon) return next({message: 'Coupon already exists', cause: 409});

    if(isFixed == isPercentage) return next({message: 'Coupon can be either fixed or percentage', cause: 400});

    if(isPercentage && couponAmount > 100) return next({message: 'Percentage should be less than 100', cause: 400});

    const couponObject = {
        couponCode,
        couponAmount,
        fromDate,
        toDate,
        isFixed,
        isPercentage,
        addedBy
    }

    const newCoupon = await Coupon.create(couponObject);

    // Users check
    let userIdsArr = []
    for (const user of Users) {
        userIdsArr.push(user.userId);
    }
    // [1,2,3,4 , 10]  => 1,2,3,4,5,6 => 1234
    const isUsersExist = await User.find({
        _id:{
            $in:userIdsArr
        }
    });

    if(isUsersExist.length !== Users.length) return next({message: `User not found`, cause: 404});

    // users => [{userId,maxUsage}].map(ele => {couponId,userId,maxUsage})
    const couponUsers = await CouponUsers.create(
        Users.map(ele => ({couponId:newCoupon._id, userId:ele.userId, maxUsage:ele.maxUsage}))
    )
    res.status(201).json({messag:'Coupon added successfully', newCoupon , couponUsers});
    
}


export const applyCoupon = async (req, res, next) => {
    const { couponCode } = req.body;
    const { _id:userId } = req.authUser;

    const couponCheck  = await couponValidation(couponCode, userId);
    console.log({couponCheck});

    if(couponCheck.status) return next({message: couponCheck.message, cause: couponCheck.status});
    res.status(200).json({message: 'Coupon applied successfully'});
    
}

/**
 * couponCode
 * valid(fromDate) or expired(toDate)
 * user assgined to coupon or not
 * user isn't exceeding the maxUsage
 */


//=============================== enable/disable cupon ===============================//
export const enableDisable = async (req, res) => {
const { id } = req.params;
const { _id} = req.authUser;

  try {
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    if (coupon.enabled) {
        // Disable the coupon
        coupon.enabled = false;
        coupon.disabledAt = new Date();
        coupon.disabledBy = _id;
        coupon.couponStatus='expired';
      } else {
        // Enable the coupon
        coupon.enabled = true;
        coupon.disabledAt = new Date();
        coupon.disabledBy = _id;
        coupon.couponStatus='valid';
      }
  
      await coupon.save();

    return res.json({ message: 'Coupon status toggled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
//=============================== get all disabled coupons API ===============================//
export const getAllDisableCoupons = async (req, res) => {
    try {
      const disabledCoupons = await Coupon.find({ enabled: false });
  
      return res.json(disabledCoupons);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
//=============================== get all enabled coupons API ===============================//
export const getAllEnableCoupons = async (req, res) => {
    try {
      const enabledCoupons = await Coupon.find({ enabled: true });
  
      return res.json(enabledCoupons);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
//=============================== get coupon by id API ===============================//
export const getCouponById = async (req, res) => {
    const { id } = req.params;
    try {
      const Coupons = await Coupon.findById(id);
  
      return res.json(Coupons);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }



//=============================== update coupon API ===============================//

  async (req, res) => {
    const { id } = req.params;
    const { _id} = req.authUser;
    const { couponCode, couponAmount, couponStatus,isFixed,isPercentage,fromDate,toDate,updatedBy } = req.body;
  
    try {
      const coupon = await Coupon.findById(id);
  
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
      if(isFixed == isPercentage) return next({message: 'Coupon can be either fixed or percentage', cause: 400});

      if(isPercentage && couponAmount > 100) return next({message: 'Percentage should be less than 100', cause: 400});
      coupon.couponCode = couponCode;
      coupon.couponAmount = couponAmount;
      coupon.couponStatus = couponStatus;
      coupon.isFixed = isFixed;
      coupon.isPercentage = isPercentage;
      coupon.fromDate = fromDate;
      coupon.toDate = toDate;
      coupon.updatedBy = _id;
      await coupon.save();
  
      return res.json({ message: 'Coupon updated successfully', coupon });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }