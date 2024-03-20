
import { Router } from "express";
const router = Router();
import * as subCategoryController from './subCategory.controller.js'
import expressAsyncHandler from "express-async-handler";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { endPointsRoles } from "../Category/category.endpoints.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";


router.post('/:categoryId',
    auth(endPointsRoles.ADD_CATEGORY),
    multerMiddleHost({
        extensions: allowedExtensions.image
    }).single('image'),
    expressAsyncHandler(subCategoryController.addSubCategory))


    router.get('/',auth(),multerMiddleHost({
        extensions: allowedExtensions.image
    }).single('image'),
     expressAsyncHandler(subCategoryController.getAllSubCategorys))
    router.put('/', auth(), expressAsyncHandler(subCategoryController.updateSubCategory))
    router.delete('/', auth(), expressAsyncHandler(subCategoryController.deleteSubCategory))
router.get('/:id',auth(),expressAsyncHandler(subCategoryController.getSubCategoryById));
export default router;