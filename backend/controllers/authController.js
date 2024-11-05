const User = require('../../backend/model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Hàm tạo JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Đăng ký người dùng mới
const registerUser = async (req, res) => {
    const { username, email, password, phoneNumber, address } = req.body;

    if (!username || !email || !password || !phoneNumber || !address) {
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Tạo người dùng mới
        const user = await User.create({
            username,
            email,
            password,
            phoneNumber,
            address
        });

        // Tạo token
        const token = generateToken(user._id);

        // Lưu token vào cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            success: true,
            _id: user._id,
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            address: user.address,
            isAdmin: user.isAdmin,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Đăng nhập người dùng
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password' });
    }

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = generateToken(user._id);

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            res.status(200).json({
                success: true,
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Đăng xuất người dùng
const logoutUser = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({
        message: 'Logged out successfully', success: true
    });
};

// Quên mật khẩu
// const forgotPassword = async (req, res) => {
//     const { email } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'Email not found' });
//         }

//         // Tạo token đặt lại mật khẩu
//         const resetToken = crypto.randomBytes(20).toString('hex');
//         const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//         const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút

//         user.resetPasswordToken = resetPasswordToken;
//         user.resetPasswordExpire = resetPasswordExpire;
//         await user.save();

//         // Gửi email chứa liên kết đặt lại mật khẩu
//         const resetUrl = `http://${req.headers.host}/api/auth/reset-password/${resetToken}`;
//         const message = `Bạn nhận được email này vì có yêu cầu đặt lại mật khẩu.\n\nVui lòng nhấn vào liên kết sau để đặt lại mật khẩu:\n\n${resetUrl}`;

//         try {
//             await sendEmail({
//                 email: user.email,
//                 subject: 'Password reset token',
//                 message,
//             });

//             res.status(200).json({ message: 'Reset password link sent to your email' });
//         } catch (error) {
//             user.resetPasswordToken = undefined;
//             user.resetPasswordExpire = undefined;
//             await user.save();

//             res.status(500).json({ message: 'Email could not be sent' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// Đặt lại mật khẩu
// const resetPassword = async (req, res) => {
//     const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

//     try {
//         const user = await User.findOne({
//             resetPasswordToken,
//             resetPasswordExpire: { $gt: Date.now() },
//         });

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid token' });
//         }

//         user.password = req.body.newPassword;
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpire = undefined;

//         await user.save();

//         res.status(200).json({ message: 'Password has been reset successfully' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    // forgotPassword,
    // resetPassword,
};
