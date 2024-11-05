
const express = require('express');
const {
    getAllManufacturers,
    getManufacturerById,
    addManufacturer,
    updateManufacturer,
    deleteManufacturer,
    getFavoriteManufacturersBySales
} = require('../controllers/manufacturerController');
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


// Lấy tất cả nhà sản xuất
router.get('/', getAllManufacturers);

//lây brand yêu thích
router.get('/favourite-brand', getFavoriteManufacturersBySales)


// Lấy chi tiết nhà sản xuất theo ID
router.get('/:id', getManufacturerById);

// Thêm nhà sản xuất mới (chỉ admin)
router.post('/add', protect, admin, upload.single('image'), addManufacturer);

// Cập nhật nhà sản xuất (chỉ admin)
router.put('/:id', protect, admin, upload.single('image'), updateManufacturer);

// Xóa nhà sản xuất (chỉ admin)
router.delete('/:id', protect, admin, deleteManufacturer);
//

module.exports = router;
