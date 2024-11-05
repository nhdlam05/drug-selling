const express = require('express');
const {
    createOrderFromCart,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    createOrderWithoutCart,
    getTopSellingProducts
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Tạo đơn hàng không cần giỏ hàng
router.post('/add-direct', protect, createOrderWithoutCart);

// Tạo đơn hàng mới
router.post('/add', protect, createOrderFromCart);

// Lấy tất cả đơn hàng của người dùng
router.get('/my-orders', protect, getUserOrders);
//lây san phẩm bán chạy
router.get('/top-selling', protect, getTopSellingProducts)

// Lấy chi tiết đơn hàng theo ID
router.get('/:id', protect, getOrderById);

// Cập nhật trạng thái đơn hàng
router.put('/:id', protect, updateOrderStatus);

// Xóa đơn hàng theo ID
router.delete('/:id', protect, deleteOrder);



module.exports = router;
