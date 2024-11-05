const Order = require('../../backend/model/order');
const Product = require('../../backend/model/product');
const Payment = require('../../backend/model/payment');
const Cart = require('../../backend/model/cart');
const Manufacturer = require('../../backend/model/manufacturer')

// Tạo đơn hàng không cần giỏ hàng
const createOrderWithoutCart = async (req, res) => {
    const { products, address, paymentMethod } = req.body;

    if (!products || products.length === 0) {
        return res.status(400).json({ message: 'No products in the order' });
    }

    if (!address) {
        return res.status(400).json({ message: 'Address is required' });
    }

    try {
        let totalAmount = 0;

        // Tính tổng giá trị đơn hàng dựa trên giá sản phẩm và số lượng
        const productDetails = await Promise.all(
            products.map(async item => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                totalAmount += product.price * item.quantity;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                };
            })
        );

        // Tạo đơn hàng mới
        const order = new Order({
            userId: req.user._id,
            products: productDetails,
            totalAmount,
            address,
            paymentMethod: paymentMethod || 'COD',  // Phương thức thanh toán mặc định là COD
            paymentStatus: paymentMethod === 'MoMo' ? 'Pending' : 'Completed', // Trạng thái thanh toán
        });

        const createdOrder = await order.save();

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo đơn hàng mới từ giỏ hàng
const createOrderFromCart = async (req, res) => {
    try {
        // Lấy giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId', 'price manufacturer');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        let totalAmount = 0;
        const productDetails = cart.products.map(item => {
            totalAmount += item.productId.price * item.quantity;
            return {
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price,
            };
        });

        // Tạo đơn hàng mới từ sản phẩm trong giỏ hàng
        const order = new Order({
            userId: req.user._id,
            products: productDetails,
            totalAmount,
            address: req.body.address,  // Địa chỉ lấy từ body
            paymentMethod: req.body.paymentMethod || 'COD',  // Phương thức thanh toán lấy từ body (mặc định COD)
            paymentStatus: req.body.paymentMethod === 'Online Payment' ? 'Pending' : 'Completed', // Trạng thái thanh toán
        });

        const createdOrder = await order.save();

        // Cập nhật salesCount cho các nhà sản xuất
        for (const item of cart.products) {
            const manufacturerId = item.productId.manufacturer;  // Lấy manufacturerId từ sản phẩm
            console.log(manufacturerId)
            if (manufacturerId) {
                await Manufacturer.findByIdAndUpdate(manufacturerId, {
                    $inc: { salesCount: item.quantity }
                });
            }
        }

        // Xóa giỏ hàng sau khi tạo đơn hàng
        cart.products = [];
        await cart.save();

        res.status(201).json({ data: createdOrder, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Lấy tất cả đơn hàng của người dùng
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('products.productId', 'name price');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết đơn hàng theo ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('products.productId', 'name price');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    try {
        const order = await Order.findById(req.params.id).populate('products.productId'); // Lấy thông tin sản phẩm qua populate
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Cập nhật trạng thái đơn hàng
        order.status = status;

        // Nếu trạng thái là Delivered, cập nhật trạng thái thanh toán và trừ stock
        if (status === 'Delivered') {
            if (order.paymentMethod === 'Online Payment') {
                order.paymentStatus = 'Completed';
                order.paymentDate = new Date();
            }

            // Trừ stock cho từng sản phẩm trong đơn hàng
            for (const item of order.products) {
                const product = item.productId;
                if (product && product.stock >= item.quantity) {  // Kiểm tra tồn kho trước khi trừ
                    product.stock -= item.quantity;
                    await product.save();
                } else {
                    return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
                }
            }
        }

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Xóa đơn hàng theo ID
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.remove();
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getTopSellingProducts = async (req, res) => {
    try {
        // Chỉ lấy các đơn hàng đã được giao (hoặc trạng thái hoàn tất tùy theo logic của bạn)
        const orders = await Order.find({ status: 'Delivered' }); // Hoặc 'Completed' hoặc 'Shipped' nếu có

        const productSales = {};

        // Tính tổng số lượng bán cho mỗi sản phẩm
        orders.forEach(order => {
            order.products.forEach(product => {
                if (productSales[product.productId]) {
                    productSales[product.productId] += product.quantity;
                } else {
                    productSales[product.productId] = product.quantity;
                }
            });
        });

        // Cập nhật số lượng bán cho sản phẩm
        for (const productId in productSales) {
            await Product.findByIdAndUpdate(productId, { totalSold: productSales[productId] });
        }

        // Lấy danh sách sản phẩm bán chạy (sắp xếp theo totalSold giảm dần)
        const topSellingProducts = await Product.find().sort({ totalSold: -1 }).limit(10);

        res.status(200).json(topSellingProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};





module.exports = {
    createOrderFromCart,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    createOrderWithoutCart,
    getTopSellingProducts
};
