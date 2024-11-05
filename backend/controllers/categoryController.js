const Category = require('../../backend/model/category');

// Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).json({ data: categories, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy danh mục theo ID
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm danh mục mới
const addCategory = async (req, res) => {
    const { name, slug, description, isFeatured } = req.body;

    if (!name || !slug) {
        return res.status(400).json({ message: 'Name and slug are required' });
    }

    try {
        const category = new Category({
            name,
            slug,
            description,
            isFeatured
        });

        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật danh mục theo ID
const updateCategory = async (req, res) => {
    const { name, slug, description, isFeatured } = req.body;

    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.name = name || category.name;
        category.slug = slug || category.slug;
        category.description = description || category.description;
        category.isFeatured = isFeatured !== undefined ? isFeatured : category.isFeatured;

        const updatedCategory = await category.save();
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa danh mục theo ID
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.remove();
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory,
};
