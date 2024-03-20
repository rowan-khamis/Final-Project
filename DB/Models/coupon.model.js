import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    couponCode:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    couponAmount:{
        type: Number,
        required: true,
        min:1
    },
    couponStatus:{
        type: String,
        default: 'valid',
        enum:[ 'valid', 'expired']
    },
    isFixed:{
        type: Boolean,
    },
    isPercentage:{
        type: Boolean,
    },
    fromDate:{
        type: String,
        required: true,
    },
    toDate:{
        type: String,
        required: true,
    },
    addedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true,
    },
    updatedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    disabledAt:{
        type: String,
    },
    disabledBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',

    },
    enableAt:{
        type: String,
    },
    enableBy:{
        type: mongoose.Schema.Types,
        ref:'User',
    },
    enabled: {
        type: Boolean,
        default: true,
    },
},{timestamps: true});


export default  mongoose.models.Coupon ||  mongoose.model('Coupon', couponSchema);