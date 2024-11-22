const Cart = require('../../backend/model/cart');
const Product = require('../../backend/model/product');

// Lấy giỏ hàng của người dùng
const getUserCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate({
                path: 'products.productId', // Lấy thông tin từ `productId` trong `products`
                select: 'name price images discount', // Chỉ lấy các trường cần thiết từ `Product`
                populate: {
                    path: 'discount', // Populate tiếp `discount` từ `Product`
                    select: 'discountPercent' // Chỉ lấy `discountPercent` từ `Discount`
                }
            });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.status(200).json({ data: cart, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;

    // Kiểm tra đầu vào có đủ dữ liệu không
    if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    try {
        // Kiểm tra xem sản phẩm có tồn tại không
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Kiểm tra số lượng yêu cầu có vượt quá số lượng tồn kho hay không
        if (quantity > product.stock) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        // Tìm giỏ hàng của người dùng hoặc tạo mới nếu không tồn tại
        let cart = await Cart.findOne({ userId: req.user._id });

        if (cart) {
            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);

            if (productIndex > -1) {
                // Nếu sản phẩm đã tồn tại, kiểm tra tổng số lượng sau khi cộng có vượt quá tồn kho không
                const newQuantity = cart.products[productIndex].quantity + quantity;

                if (newQuantity > product.stock) {
                    return res.status(400).json({ message: 'Insufficient stock available for the requested quantity' });
                }

                // Nếu không vượt quá, cập nhật số lượng
                cart.products[productIndex].quantity = newQuantity;
            } else {
                // Nếu sản phẩm chưa có, kiểm tra trước khi thêm
                if (quantity > product.stock) {
                    return res.status(400).json({ message: 'Insufficient stock available for the requested quantity' });
                }

                // Thêm mới sản phẩm vào giỏ hàng
                cart.products.push({ productId, quantity });
            }
        } else {
            // Nếu giỏ hàng chưa tồn tại, tạo mới
            cart = new Cart({
                userId: req.user._id,
                products: [{ productId, quantity }]
            });
        }

        // Lưu giỏ hàng
        await cart.save();
        res.status(200).json({ data: cart, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateCart = async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    try {
        // Tìm sản phẩm trong cơ sở dữ liệu để kiểm tra tồn kho
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Kiểm tra số lượng yêu cầu có vượt quá số lượng tồn kho hay không
        if (quantity > product.stock) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
        }

        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Tìm sản phẩm trong giỏ hàng
        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);

        if (productIndex > -1) {
            // Nếu sản phẩm tồn tại, cập nhật số lượng
            cart.products[productIndex].quantity = quantity;
            await cart.save();
            res.status(200).json({ data: cart, success: true });
        } else {
            // Nếu sản phẩm không có trong giỏ hàng
            res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
    console.log('Received DELETE request for product:', req.params.productId);
    const { productId } = req.params;

    try {
        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Loại bỏ sản phẩm khỏi giỏ hàng
        cart.products = cart.products.filter(p => p.productId.toString() !== productId);

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa toàn bộ giỏ hàng của người dùng
const clearCart = async (req, res) => {
    try {
        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Xóa toàn bộ sản phẩm trong giỏ hàng
        cart.products = [];

        await cart.save();
        res.status(200).json({ message: 'Cart cleared successfully', success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const countAddToCartProduct = async (req, res) => {
    try {
        const userId = req.user._id;

        // Tìm giỏ hàng của user
        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.json({
                data: {
                    count: 0
                },
                message: "No products found in cart",
                error: false,
                success: true
            });
        }

        // Đếm số lượng sản phẩm khác nhau
        const uniqueProductCount = cart.products.length;

        res.json({
            data: {
                count: uniqueProductCount
            },
            message: "ok",
            error: false,
            success: true
        });
    } catch (error) {
        res.json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}
module.exports = {
    getUserCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    countAddToCartProduct
};
