import {scheduleJob} from 'node-schedule'

import Coupon from '../../DB/Models/coupon.model.js';
import { DateTime } from 'luxon';

// generate a cron job to check the coupon status
export const scheduleCronsForCouponCheck = () => {
    scheduleJob('*/5 * * * * *', async () => {
        console.log('scheduleCronsForCouponCheck() is running  ............');
        const coupons  = await Coupon.find({couponStatus:'valid'});
        
        for (const coupon of coupons) {
            if(DateTime.fromISO(coupon.toDate) < DateTime.now()){
                coupon.couponStatus = 'expired';
                await coupon.save();
            }            
        }
    });
}


export const scheduleCronsForOrder = () => {
    scheduleJob('*/5 * * * * *', async () => {
      try {
        // Find orders that are within the cancellation period
        const orders = await Order.find({
          status: 'created',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
  
        // Cancel orders that are within the cancellation period
        for (const order of orders) {
          order.status = 'cancelled';
          await order.save();
        }
  
        console.log('Scheduled cron job executed successfully');
      } catch (error) {
        console.error('Error executing scheduled cron job:', error);
      }
    });
  };