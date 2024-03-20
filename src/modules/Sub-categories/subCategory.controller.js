
import SubCategory from "../../../DB/Models/sub-category.model.js"
import Category from '../../../DB/Models/category.model.js'
import generateUniqueString from "../../utils/generate-Unique-String.js"
import cloudinaryConnection from "../../utils/cloudinary.js"
import slugify from "slugify"

//============================== add SubCategory ==============================//
export const addSubCategory = async (req, res, next) => {
    // 1- destructuring the request body
    const { name } = req.body
    const { categoryId } = req.params
    const { _id } = req.authUser

    // 2- check if the subcategory name is already exist
    const isNameDuplicated = await SubCategory.findOne({ name })
    if (isNameDuplicated) {
        return next({ cause: 409, message: 'SubCategory name is already exist' })
        // return next( new Error('Category name is already exist' , {cause:409}) )
    }

    // 3- check if the category is exist by using categoryId
    const category = await Category.findById(categoryId)
    if (!category) return next({ cause: 404, message: 'Category not found' })

    // 4- generate the slug
    const slug = slugify(name, '-')

    // 5- upload image to cloudinary
    if (!req.file) return next({ cause: 400, message: 'Image is required' })

    const folderId = generateUniqueString(4)
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}`
    })


    // 6- generate the subCategory object
    const subCategory = {
        name,
        slug,
        Image: { secure_url, public_id },
        folderId,
        addedBy: _id,
        categoryId
    }
    // 7- create the subCategory
    const subCategoryCreated = await SubCategory.create(subCategory)
    res.status(201).json({ success: true, message: 'subCategory created successfully', data: subCategoryCreated })
}

//============================== update SubCategory ==============================//
export const updateSubCategory = async (req, res, next) => {
    const { name, oldPublicId} = req.body
    const { _id } = req.authUser
    const { subCategoryId } = req.params

    // check brand
    const subCategory = await SubCategory.findOne({ addedBy: _id, _id: subCategoryId })
    if (!subCategory) return next(new Error('subCategory not found', { cause: 404 }))

    // update brand
    if (name) {subCategory.name = name; subCategory.slug = slugify(name, '-')}
    
    if (oldPublicId) {
        if (!req.file) return next(new Error('please upload the new image', { cause: 400 }))

        // delete old image from cloudinary
        await cloudinaryConnection().uploader.destroy(oldPublicId)
        // upload the new image to cloudinary
        const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}`,
        })

        subCategory.Image.map(image => {
            if (image.public_id === oldPublicId) {
                image.public_id = public_id
                image.secure_url = secure_url
            }
        })
    }
    subCategory.updatedBy = _id
    await subCategory.save()
    res.status(200).json({ message: 'Updated Done', subCategory })
}
//============================== delete SubCategory ==============================//
export const deleteSubCategory = async (req, res, next) => {
    const { _id } = req.authUser
    const { SubCategoryId } = req.params

    // check product
    const subCategory = await SubCategory.findOneAndDelete({ addedBy: _id, _id: SubCategoryId })
    if (!subCategory) return next(new Error('subCategory not found', { cause: 404 }))

    let publicIdsArr = []
    // delete images from cloudinary
    for (const image of SubCategory.Image) {
        publicIdsArr.push(image.public_id)
    }
    //  delete images from cloudinary
    await cloudinaryConnection().api.delete_resources(publicIdsArr)
    //  delete folder from cloudinary

    await cloudinaryConnection().api.delete_folder(SubCategory.folderId);

    res.status(200).json({ message: 'Deleted Done' })
}
//============================== get all SubCategory with brands ==============================//
export const getAllSubCategorys = async (req, res, next) => {

    const subCategory = await SubCategory.find().cursor()
    let finalResult = []
    for (let doc = await subCategory.next(); doc != null; doc = await subCategory.next()) {
        const brands = await Brand.find({ subCategorytId: doc._id })
        const docObject = doc.toObject()
        docObject.brands = brands
        finalResult.push(docObject)
    }
    res.status(200).json({ message: 'done', subCategory: finalResult })
}
//============================== get Subcategory by id ==============================//
export const getSubCategoryById = async (req, res, next) => {
    const { SubCategoryId } = req.params
    const subCategory = await Category.findById(SubCategoryId)
    // console.log(subCategory);
    res.status(200).json({ success: true, message: 'subCategory fetched successfully', data: subCategory })
}
