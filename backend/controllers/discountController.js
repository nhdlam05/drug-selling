const Discount = require('../../backend/model/discount');

// Lấy tất cả giảm giá
const getAllDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find({});
        res.status(200).json({ data: discounts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết giảm giá theo ID
const getDiscountById = async (req, res) => {
    try {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }
        res.status(200).json(discount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm giảm giá mới
const addDiscount = async (req, res) => {
    const { code, discountPercent, startDate, endDate } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!code || !discountPercent || !startDate || !endDate) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const discount = new Discount({
            code,
            discountPercent,
            startDate,
            endDate
        });

        const createdDiscount = await discount.save();
        res.status(201).json(createdDiscount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật giảm giá theo ID
const updateDiscount = async (req, res) => {
    const { code, discountPercent, startDate, endDate } = req.body;

    try {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        // Cập nhật các trường có sẵn
        discount.code = code || discount.code;
        discount.discountPercent = discountPercent || discount.discountPercent;
        discount.startDate = startDate || discount.startDate;
        discount.endDate = endDate || discount.endDate;

        const updatedDiscount = await discount.save();
        res.status(200).json(updatedDiscount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa giảm giá theo ID
const deleteDiscount = async (req, res) => {
    try {
        const discount = await Discount.findByIdAndDelete(req.params.id); // Sử dụng findByIdAndDelete

        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        res.status(200).json({ message: 'Discount deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getAllDiscounts,
    getDiscountById,
    addDiscount,
    updateDiscount,
    deleteDiscount,
};
