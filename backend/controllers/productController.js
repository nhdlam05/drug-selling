const Product = require('../../backend/model/product');
const Category = require('../../backend/model/category');
const Discount = require('../../backend/model/discount');
const Manufacturer = require('../../backend/model/manufacturer');
const mongoose = require('mongoose');

// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const limit = parseInt(req.query.limit) || 1; // Số sản phẩm mỗi trang (mặc định là 6)
    try {
        const skip = (page - 1) * limit;
        const products = await Product.find({})
            .skip(skip)
            .limit(limit)
            .populate('category', 'name')  // Liên kết với Category và chỉ lấy name
            .populate('discount', 'name discountPercent')  // Liên kết với Discount
            .populate('manufacturer', 'name');  // Liên kết với Manufacturer
        const totalProducts = await Product.countDocuments()
        const totalPages = Math.ceil(totalProducts / limit)
        res.status(200).json({
            products: products,
            success: true,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết sản phẩm theo ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('discount', 'code ')
            .populate('manufacturer', 'name country');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ data: product, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getProductsByCategoryId = async (req, res) => {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const limit = parseInt(req.query.limit) || 1; // Số sản phẩm mỗi trang (mặc định là 6)

    try {
        const skip = (page - 1) * limit;

        // Truy vấn để lấy dữ liệu với phân trang
        const products = await Product.find({ category: categoryId })
            .skip(skip)
            .limit(limit)
            .select('description images price name category');

        const totalProducts = await Product.countDocuments({ category: categoryId });
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            success: true,
            data: products,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
const getProductsByBrandId = async (req, res) => {
    try {
        const brandId = req.params.brandId;
        const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
        const limit = parseInt(req.query.limit) || 6; // Số sản phẩm mỗi trang (mặc định là 6)
        const skip = (page - 1) * limit;

        // Lấy sản phẩm theo `brandId` với phân trang
        const products = await Product.find({ manufacturer: brandId })
            .skip(skip)
            .limit(limit)
            .select('description images price name category');

        // Tổng số sản phẩm để tính tổng số trang
        const totalProducts = await Product.countDocuments({ manufacturer: brandId });
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            success: true,
            data: products,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Thêm sản phẩm mới
const addProduct = async (req, res) => {
    const {
        name, category, description, price, discount,
        stock, ingredients, usage, origin, manufacturer, rating, isFeatured
    } = req.body;

    // Kiểm tra bắt buộc
    if (!name || !category || !price) {
        return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    try {
        // Kiểm tra xem category, discount, và manufacturer có tồn tại không
        const foundCategory = await Category.findById(category);
        const foundManufacturer = await Manufacturer.findById(manufacturer);
        if (!foundCategory || !foundManufacturer) {
            return res.status(400).json({ message: 'Invalid category or manufacturer' });
        }

        if (discount) {
            const foundDiscount = await Discount.findById(discount);
            if (!foundDiscount) {
                return res.status(400).json({ message: 'Invalid discount' });
            }
        }

        // Tạo sản phẩm mới và lưu đường dẫn ảnh từ Cloudinary (nếu có)
        const product = new Product({
            name,
            category,
            description,
            price,
            discount: discount || null,
            stock: stock || 0,
            ingredients,
            usage,
            origin,
            manufacturer,
            images: req.file ? req.file.path : '', // Sử dụng URL từ Cloudinary đã lưu trong `req.file.path`
            rating: rating || 0,
            isFeatured: isFeatured || false,
        });

        const createdProduct = await product.save();
        res.status(201).json({ data: createdProduct, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// Cập nhật sản phẩm theo ID
const updateProduct = async (req, res) => {
    const {
        name, category, description, price, discount,
        stock, ingredients, usage, origin, manufacturer, rating, isFeatured
    } = req.body;

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Cập nhật các trường có sẵn
        product.name = name || product.name;
        product.category = category || product.category;
        product.description = description || product.description;
        product.price = price || product.price;
        product.discount = discount || product.discount;
        product.stock = stock || product.stock;
        product.ingredients = ingredients || product.ingredients;
        product.usage = usage || product.usage;
        product.manufacturer = manufacturer || product.manufacturer;
        product.rating = rating || product.rating;
        product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

        // Cập nhật ảnh nếu có ảnh mới trong request
        if (req.file) {
            product.images = req.file.path; // Sử dụng URL đầy đủ từ Cloudinary
        }

        const updatedProduct = await product.save();
        res.status(200).json({ data: updatedProduct, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Tìm sản phẩm theo tên category
// Tìm sản phẩm theo tên category
const getProductsByCategoryName = async (req, res) => {
    try {
        const searchTerm = req.query.name;


        // Kiểm tra nếu từ khóa tìm kiếm không hợp lệ
        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search term is required' });
        }

        // Tìm category theo tên
        const category = await Category.findOne({ name: { $regex: searchTerm, $options: 'i' } });

        let products = [];
        if (category) {
            // Nếu tìm thấy category, tìm các sản phẩm trong category đó
            products = await Product.find({ category: category._id })
                .select('description images price name')
                .populate('category', 'name');
        }

        // Tìm thêm sản phẩm theo tên sản phẩm
        const productsByName = await Product.find({ name: { $regex: searchTerm, $options: 'i' } })
            .select('description images price name')
            .populate('category', 'name');

        // Kết hợp kết quả (loại bỏ trùng lặp nếu cần)
        products = [...products, ...productsByName];

        // Loại bỏ các sản phẩm trùng lặp (nếu cần)
        products = products.filter((product, index, self) =>
            index === self.findIndex((p) => p._id.toString() === product._id.toString())
        );

        if (products.length === 0) {
            return res.status(200).json({ success: true, message: 'No products found for this search term', data: [] });
        }

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching products by category or product name:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategoryId,
    getProductsByCategoryName,
    getProductsByBrandId
};
