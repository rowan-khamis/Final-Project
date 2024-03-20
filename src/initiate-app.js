import { gracefulShutdown } from "node-schedule"
import   db_connection     from "../DB/connection.js"
import { globalResponse } from "./middlewares/global-response.middleware.js"
import { rollbackSavedDocuments } from "./middlewares/rollback-saved-documnets.middleware.js"
import { rollbackUploadedFiles } from "./middlewares/rollback-uploaded-files.middleware.js"

import * as  routers from './modules/index.routes.js'
import {Server}  from 'socket.io'

import {
     scheduleCronsForCouponCheck, 
     scheduleCronsForOrder
} from "./utils/crons.js"
import productModel from "../DB/Models/product.model.js"


import cors from 'cors'
import { generateIo } from "./utils/io-generation.js"
export const initiateApp = (app, express) => {

    const port = process.env.PORT

 
    app.use(express.json())

    db_connection()
    app.use(cors())
    app.use('/auth', routers.authRouter)
    app.use('/user', routers.userRouter)
    app.use('/category', routers.categoryRouter)
    app.use('/subCategory', routers.subCategoryRouter)
    app.use('/brand', routers.brandRouter)
    app.use('/product', routers.productRouter)
    app.use('/cart', routers.cartRouter)
    app.use('/coupon', routers.couponRouter)
    app.use('/order', routers.orderRouter)

    app.get('/', (req, res) => res.send('Hello World!'))

    app.use('*', (req, res, next) => {
        res.status(404).json({ message: 'Not Found' })
    })

    app.use(globalResponse, rollbackUploadedFiles, rollbackSavedDocuments)

    scheduleCronsForCouponCheck()
    scheduleCronsForOrder()
    gracefulShutdown()
    
   
   const server =  app.listen(port, () => console.log(`Example app listening on port ${port}!`))
    
   const io = generateIo(server)


   io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    // socket.on('request-all-products',async()=>{
    //     const products = await productModel.find()

    //     socket.emit('all-products',products)
    // })
    
})
}