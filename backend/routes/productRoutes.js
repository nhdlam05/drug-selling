const express = require('express');
const {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategoryId
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Cấu hình multer để lưu ảnh vào thư mục `uploads/`
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Lưu ảnh vào thư mục `uploads/`
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file là thời gian hiện tại + phần mở rộng của file
    }
});

const upload = multer({ storage: storage });

// Lấy tất cả sản phẩm
router.get('/', getAllProducts);

// Lấy chi tiết sản phẩm theo ID
router.get('/:id', getProductById);

// Lấy sản phẩm theo ID Category
router.get('/category/:categoryId', getProductsByCategoryId);

// Thêm sản phẩm (chỉ admin) và hỗ trợ upload ảnh
router.post('/add', protect, admin, upload.single('image'), addProduct);

// Cập nhật sản phẩm (chỉ admin)
router.put('/:id', protect, admin, upload.single('image'), updateProduct);

// Xóa sản phẩm (chỉ admin)
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
