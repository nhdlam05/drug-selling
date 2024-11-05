const express = require('express');
const {
    createPayment,
    getPaymentByOrderId,
    updatePaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Tạo bản ghi thanh toán mới
router.post('/add', protect, createPayment);

// Lấy chi tiết thanh toán theo ID đơn hàng
router.get('/:orderId', protect, getPaymentByOrderId);

// Cập nhật trạng thái thanh toán
router.put('/:id', protect, updatePaymentStatus);

module.exports = router;
