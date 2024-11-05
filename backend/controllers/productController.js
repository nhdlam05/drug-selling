const Product = require('../../backend/model/product');
const Category = require('../../backend/model/category');
const Discount = require('../../backend/model/discount');
const Manufacturer = require('../../backend/model/manufacturer');
const mongoose = require('mongoose');

// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({})
            .populate('category', 'name')  // Liên kết với Category và chỉ lấy name
            .populate('discount', 'name discountPercent')  // Liên kết với Discount
            .populate('manufacturer', 'name');  // Liên kết với Manufacturer
        res.status(200).json(products);
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
    try {
        const categoryId = req.params.categoryId;


        // Kiểm tra tính hợp lệ của categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        // Tìm sản phẩm với categoryId
        const products = await Product.find({ category: categoryId }) // Không cần dùng new ObjectId ở đây nếu đã kiểm tra isValid
            .select('description images price name') // Thêm name để hiển thị tên sản phẩm
            .populate('category', 'name');

        // Trả về danh sách sản phẩm
        res.status(200).json({ success: true, data: products });
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
    if (!name || !category || !price || !manufacturer) {
        return res.status(400).json({ message: 'Name, category, price, and manufacturer are required' });
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

        // Tạo sản phẩm mới và lưu đường dẫn ảnh (nếu có)
        const product = new Product({
            name,
            category,
            description,
            price,
            discount: discount || null,
            stock: stock || 0,
            ingredients,
            usage,
            stock,
            manufacturer,
            images: req.file ? `/uploads/${req.file.filename}` : '', // Lưu đường dẫn ảnh vào MongoDB
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
            product.images = `/uploads/${req.file.filename}`;
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


module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategoryId
};
