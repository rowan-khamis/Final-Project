import { couponValidation } from "../../utils/coupon-validation.js";
import { checkProductAvailability } from "../Cart/utils/check-product-in-db.js";


import Order from "../../../DB/Models/order.model.js";
import Cart from "../../../DB/Models/cart.model.js";
import CouponUsers from "../../../DB/Models/coupon-users.model.js";
import Product from "../../../DB/Models/product.model.js";
import { DateTime } from "luxon";
import { qrCodeGenetation } from "../../utils/qr-code.js";
import {} from "../../utils/generate-invoice.js";
import { confirmPaymentIntent, createCheckOutSession, createPaymentIntent, createStripeCoupon, refundPayment } from "../../payment-handler/stripe.js";

//===================== create order =====================//
export const createOrder = async (req, res,next) => {
    // destructuring the request body
    const {
        product,
        quantity,
        couponCode,
        paymentMethod,
        address,
        city,
        postalCode,
        country,
        phoneNumbers
    } = req.body;
    // destcructuring the user from request authUser
    const {_id:user} =req.authUser;

    // coupon code check
    let coupon = null;
    if(couponCode){
        const isCouponValid = await couponValidation(couponCode,user);
        if(isCouponValid.status) return next({message:isCouponValid.message , status:isCouponValid.status});

        coupon = isCouponValid;
    }


    // product check
    const isProductAvailable = await checkProductAvailability(product, quantity);
    if(!isProductAvailable) return next({message:'Product is not available', status:400});
    const orderItems = [{
        title: isProductAvailable.title,
        quantity,
        price: isProductAvailable.appliedPrice,
        product: isProductAvailable._id
    }]


    // shipping price calculation
    // orderItems[0].price * quantity
    const shippingPrice =  isProductAvailable.appliedPrice * quantity;
    let totalPrice = shippingPrice;

    if(coupon?.isFixed && coupon?.couponAmount > shippingPrice){
        return next({message:'cannot  apply this coupon for this order' , cause:400})
    }
    if(coupon?.isFixed && coupon?.couponAmount  <= shippingPrice){
        totalPrice = shippingPrice - coupon.couponAmount;
    }else if(coupon?.isPercentage){
        totalPrice = shippingPrice - (shippingPrice * (coupon.couponAmount / 100));
    }

    // payment method  + orderStatus
    let orderStatus ;
    if(paymentMethod == 'Cash' ) orderStatus = 'Placed';


    const orderObject =  {
        user,
        orderItems,
        shippingAddress: {address, city, postalCode, country},
        phoneNumbers,
        shippingPrice,
        coupon: coupon?._id,
        totalPrice,
        paymentMethod,
        orderStatus
    }

    // create order
    const order = await Order.create(orderObject);
    if(!order) return next({message:'Order creation failed', status:500});

    // qrcode
    const qrcode = await qrCodeGenetation({
        orderId:order._id,
        orderStatus:order.orderStatus,
        totalPrice:order.totalPrice,
        paymentMethod:order.paymentMethod
    })

    // decrease the stock of the product
    isProductAvailable.stock -= quantity;
    await isProductAvailable.save();

    // increase the usage count of the coupon if there is a coupon used
    if(coupon){
        const userCoupon = await CouponUsers.findOne({couponId:coupon._id, userId:user});
        userCoupon.usageCount += 1;
        await userCoupon.save();
    }

    res.status(201).json({ order});
} 

export const convertFromCartToOrder = async (req, res, next) => {
        // destructuring the request body
        const {
            couponCode,
            paymentMethod,
            address,
            city,
            postalCode,
            country,
            phoneNumbers
        } = req.body;
        // destcructuring the user from request authUser
        const {_id:user} =req.authUser;
    
        const userCart = await Cart.findOne({userId:user})
        if(!userCart) return next({message:'Cart not found', status:404});

        // coupon code check
        let coupon = null;
        if(couponCode){
            const isCouponValid = await couponValidation(couponCode,user);
            if(isCouponValid.status) return next({message:isCouponValid.message , status:isCouponValid.status});
    
            coupon = isCouponValid;
        }
    
    
        // product check
        const orderItems = userCart.products.map(product => {
            return {
                title: product.title,
                quantity: product.quantity,
                price: product.basePrice,
                product: product.productId
            }
        })
    
        // shipping price calculation
        // orderItems[0].price * quantity
        const shippingPrice =  userCart.subTotal;
        let totalPrice = shippingPrice;
    
        if(coupon?.isFixed && coupon?.couponAmount > shippingPrice){
            return next({message:'cannot  apply this coupon for this order' , cause:400})
        }
        if(coupon?.isFixed && coupon?.couponAmount  <= shippingPrice){
            totalPrice = shippingPrice - coupon.couponAmount;
        }else if(coupon?.isPercentage){
            totalPrice = shippingPrice - (shippingPrice * (coupon.couponAmount / 100));
        }
    
        // payment method  + orderStatus
        let orderStatus ;
        if(paymentMethod == 'Cash' ) orderStatus = 'Placed';
    
    
        const orderObject =  {
            user,
            orderItems,
            shippingAddress: {address, city, postalCode, country},
            phoneNumbers,
            shippingPrice,
            coupon: coupon?._id,
            totalPrice,
            paymentMethod,
            orderStatus
        }
    
        // create order
        const order = await Order.create(orderObject);
        if(!order) return next({message:'Order creation failed', status:500});
    
      // decrease the stock of the product
        order.orderItems.forEach(async item => {
            const product = await Product.findById(item.product);
            product.stock -= item.quantity;
            await product.save();
        });
        // increase the usage count of the coupon if there is a coupon used
        if(coupon){
            const userCoupon = await CouponUsers.findOne({couponId:coupon._id, userId:user});
            userCoupon.usageCount += 1;
            await userCoupon.save();
        }
        // delete the user cart
        await Cart.findByIdAndDelete(userCart._id);
        res.status(201).json({order});
}


export const deliverOrder = async (req, res, next) => {
    const {orderId} = req.params;
    const {_id:deliveredBy} = req.authUser;

    const order = await Order.findOneAndUpdate({
        _id:orderId,
        orderStatus:'Placed'
    },{
        orderStatus:'Delivered',
        isDelivered:true,
        deliveredAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        deliveredBy
    },{new:true});


    if(!order) return next({message:'Fail to deliever please check the order status', status:404});

    res.status(200).json({order});

}


export const payOrderWithStripe = async (req, res, next) => {

    const {orderId} = req.params;

    const order = await Order.findOne({_id:orderId , user: req.authUser._id , orderStatus:'Pending'});
    if(!order) return next({message:'Order not found', status:404});

    const checkoutObject = {
        customer_email:req.authUser.email,
        discounts:[],
        line_items:order.orderItems.map(item => {
            return {
                price_data: {
                    currency: 'EGP',
                    product_data: {
                        name: item.title,
                    },
                    unit_amount: item.price * 100, // convert to cents
                },
                quantity: item.quantity,
            }
        }),
        orderId:order._id.toString()
    }
     // coupon
     if(order.coupon){
        const coupon = await createStripeCoupon(order.coupon);
        checkoutObject.discounts.push({coupon:coupon.id});
     }
    const checkoutSession = await createCheckOutSession(checkoutObject);

    const paymentIntent = await createPaymentIntent(order.totalPrice);

    order.payment_intent = paymentIntent.id;
    await order.save();
    res.status(200).json({checkoutSession , paymentIntent});

}


export const stripeWebHookLocal = async (req, res, next) => {

    const orderId  = req.body.data.object.metadata.orderId;
    const order = await Order.findById(orderId);

    await confirmPaymentIntent(order.payment_intent);

    order.orderStatus = 'Paid';
    order.isPaid = true;
    order.paidAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    await order.save();

    res.status(200).json({message:'ok'});
}

export const refundOrder = async (req, res, next) => {
    const {orderId} = req.params;

    const order = await Order.findOne({_id:orderId  , orderStatus:'Paid'});
    if(!order) return next({message:'Order not found', status:404});

    const refundPaymenttes = await refundPayment(order.payment_intent);
    
    order.orderStatus = 'Refunded';
    await order.save();

    res.status(200).json({refundPaymenttes});
 
}



// ===============================add invoice api ========================//
export const generateAndSendInvoice = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        // Find the order by its ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Generate invoice PDF
        const invoiceData = generateInvoicePDF(order); // Assuming generateInvoicePDF function accepts order data and returns PDF buffer

        // Send email with invoice as attachment
        const emailOptions = {
            to: order.customerEmail,
            subject: 'Invoice for Order #' + order.orderNumber,
            text: 'Please find the attached invoice for your recent order.',
            attachments: [{
                filename: 'invoice.pdf',
                content: invoiceData,
                contentType: 'application/pdf'
            }]
        };

        await sendEmailService(emailOptions);

        res.status(200).json({ success: true, message: 'Invoice sent successfully' });
    } catch (error) {
        next(error);
    }
};