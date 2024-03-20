import slugify from 'slugify'

import Brand from '../../../DB/Models/brand.model.js'
import subCategory from '../../../DB/Models/sub-category.model.js'
import cloudinaryConnection from '../../utils/cloudinary.js'
import generateUniqueString from '../../utils/generate-Unique-String.js'


//======================= add brand =======================//
export const addBrand = async (req, res, next) => {
    // 1- desturcture the required data from teh request object
    const { name } = req.body
    const { categoryId, subCategoryId } = req.query
    const { _id } = req.authUser
    // category check , subcategory check
    // 2- subcategory check
    const subCategoryCheck = await subCategory.findById(subCategoryId).populate('categoryId', 'folderId')
    if (!subCategoryCheck) return next({ message: 'SubCategory not found', cause: 404 })

    // 3- duplicate  brand document check 
    const isBrandExists = await Brand.findOne({ name, subCategoryId })
    if (isBrandExists) return next({ message: 'Brand already exists for this subCategory', cause: 400 })

    // 4- categogry check
    if (categoryId != subCategoryCheck.categoryId._id) return next({ message: 'Category not found', cause: 404 })

    // 5 - generate the slug
    const slug = slugify(name, '-')

    // 6- upload brand logo
    if (!req.file) return next({ message: 'Please upload the brand logo', cause: 400 })

    const folderId = generateUniqueString(4)
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${subCategoryCheck.categoryId.folderId}/SubCategories/${subCategoryCheck.folderId}/Brands/${folderId}`,
    })

    const brandObject = {
        name, slug,
        Image: { secure_url, public_id },
        folderId,
        addedBy: _id,
        subCategoryId,
        categoryId
    }

    const newBrand = await Brand.create(brandObject)

    res.status(201).json({
        status: 'success',
        message: 'Brand added successfully',
        data: newBrand
    })

}

//============================== delete brand ==============================//
export const deleteBrand = async (req, res, next) => {
    const { _id } = req.authUser
    const { brandId } = req.params

    // check product
    const brand = await Brand.findOneAndDelete({ addedBy: _id, _id: brandId })
    if (!brand) return next(new Error('brand not found', { cause: 404 }))

    let publicIdsArr = []
    // delete images from cloudinary
    for (const image of Brand.Image) {
        publicIdsArr.push(image.public_id)
    }
    //  delete images from cloudinary
    await cloudinaryConnection().api.delete_resources(publicIdsArr)
    //  delete folder from cloudinary

    await cloudinaryConnection().api.delete_folder(Brand.folderId);

    res.status(200).json({ message: 'Deleted Done' })
}
//============================== update brand (by brand owner only)==============================//
export const updateBrand = async (req, res, next) => {
    const { name, oldPublicId} = req.body
    const { _id } = req.authUser
    const { brandId } = req.params

    // check brand
    const brand = await Brand.findOne({ addedBy: _id, _id: brandId })
    if (!brand) return next(new Error('brand not found', { cause: 404 }))

    // update brand
    if (name) {brand.name = name; brand.slug = slugify(name, '-')}

    if (oldPublicId) {
        if (!req.file) return next(new Error('please upload the new image', { cause: 400 }))

        // delete old image from cloudinary
        await cloudinaryConnection().uploader.destroy(oldPublicId)
        // upload the new image to cloudinary
        const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${subCategoryCheck.categoryId.folderId}/SubCategories/${subCategoryCheck.folderId}/Brands/${folderId}`,
        })

        brand.Image.map(image => {
            if (image.public_id === oldPublicId) {
                image.public_id = public_id
                image.secure_url = secure_url
            }
        })
    }
    brand.updatedBy = _id
    await brand.save()
    res.status(200).json({ message: 'Updated Done', brand })
}
//============================== get all brands ==============================//
export const getAllBrands = async (req, res, next) => {
    const brands = await Brand.find().cursor()
    let finalResult = []
    for (let doc = await brands.next(); doc != null; doc = await brands.next()) {
        const docObject = doc.toObject()
        finalResult.push(docObject)
    }
    res.status(200).json({ message: 'done', brands: finalResult })
}

//============================== get all brands by Category ==============================//
export const getAllBrandsForCategory= async (req, res, next) => {
    const { categoryId } = req.params
   const brands = await Brand.findOne({ categoryId: categoryId}).cursor()
    let finalResult = []
    for (let doc = await brands.next(); doc != null; doc = await brands.next()) {
        const docObject = doc.toObject()
        finalResult.push(docObject)
    }
    res.status(200).json({ message: 'done', brands: finalResult })
}
//============================== get all brands by subCategory ==============================//
export const getAllBrandsForSubCategory= async (req, res, next) => {
    const { SubCategoryId } = req.params
   const brands = await Brand.findOne({ subCategoryId: SubCategoryId}).cursor()
    let finalResult = []
    for (let doc = await brands.next(); doc != null; doc = await brands.next()) {
        const docObject = doc.toObject()
        finalResult.push(docObject)
    }
    res.status(200).json({ message: 'done', brands: finalResult })
}