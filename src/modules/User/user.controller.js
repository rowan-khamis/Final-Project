import User from '../../../DB/Models/user.model.js'
import cloudinaryConnection from "../../utils/cloudinary.js"
import generateUniqueString from "../../utils/generate-Unique-String.js"
import bcrypt from 'bcrypt'
import sendEmailService from "../../services/send-email.service.js"
// ======================= update profile user =======================//
/**
 * destructuring data from req.body
 * destructuring data from req.authUser ( loggedInUser)
 * if user want to update his email so we need to if the email is already exists
 * if exists return error
 * update user data
 * return success response
*/
export const updateAccount = async (req, res, next) => {
    const { username, email, age,phoneNumbers, addresses} = req.body
    const { _id } = req.authUser

    if (email) {
        // email check
        const isEmailExists = await User.findOne({ email })
        if (isEmailExists) return next(new Error('Email is already exists', { cause: 409 }))
    }
    const updatedUser = await User.findByIdAndUpdate(_id, {
        username, email, age,phoneNumbers, addresses
    }, {
        new: true
    })
    if (!updatedUser) return next(new Error('update fail'))
    res.status(200).json({ message: 'done', updatedUser })
}

// ======================= delete profile user =======================//
// * destructuring data from req.authUser ( loggedInUser)
// * delete user data
// * return success response
// */
export const deleteAccount = async (req, res, next) => {
   const { _id } = req.authUser
   const deletedUser = await User.findByIdAndDelete(_id)
   if (!deletedUser) return next(new Error('delete fail'))
   res.status(200).json({ message: 'done' })
}
// ======================= get user profile data =======================//
/**
 * destructuring data from req.authUser ( loggedInUser)
 * return success response
*/
export const getUserProfile = async (req, res, next) => {
    res.status(200).json({ message: "User data:", data: req.authUser })
}


// ======================= forgot password =======================//

// Generate a reset token and send a reset password email to the user
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = generateUniqueString(); // You'll need to implement this function

        // Save the reset token to the user's document in the database
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();

        // Send the reset password email
        const resetPasswordLink = `https:test.com/reset-password?token=${resetToken}`;
        await sendEmailService.sendResetPasswordEmail(user.email, resetPasswordLink);

        res.status(200).json({ message: "Reset password email sent successfully" });
    } catch (error) {
        next(error);
    }
};

// Reset password endpoint
export const resetPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Reset password and clear reset token fields
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        next(error);
    }
};

// Controller function to update password
export const updatePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const { _id } = req.authUser;

    try {
        // Find the user by ID
        const user = await User.findById(_id);

        // Check if the current password matches the password in the database
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        next(error);
    }
};