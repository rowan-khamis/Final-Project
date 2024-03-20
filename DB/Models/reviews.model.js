import mongoose, { Schema, model } from "mongoose"


//============================== Create the brand schema ==============================//

const  reviewsSchema = new Schema({
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    comment:{
        type: String,
        required: true
    }
},
    {
        timestamps: true
    })


export default mongoose.models.Reviews || model('Reviews', reviewsSchema)
