
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// =====================================
// UPLOAD BUSINESS LOGO
// =====================================

const uploadBusinessLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================
    // DELETE OLD CLOUDINARY LOGO
    // =====================================

    if (user.logoPublicId) {
      try {
        await cloudinary.uploader.destroy(
          user.logoPublicId,
          {
            resource_type: "image",
          }
        );
      } catch (deleteError) {
        console.error(
          "Old Logo Delete Error:",
          deleteError
        );
      }
    }

    // =====================================
    // UPLOAD NEW LOGO
    // =====================================

    const uploadResult = await new Promise(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: "invoiceai/business-logos",
              public_id: `user-${user._id}`,
              overwrite: true,
              resource_type: "image",
              transformation: [
                {
                  width: 800,
                  height: 800,
                  crop: "limit",
                  quality: "auto",
                  fetch_format: "auto",
                },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

        uploadStream.end(req.file.buffer);
      }
    );

    // =====================================
    // SAVE LOGO DETAILS
    // =====================================

    user.logoUrl = uploadResult.secure_url;
    user.logoPublicId = uploadResult.public_id;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Business logo uploaded successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        businessName:
          updatedUser.businessName || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        website: updatedUser.website || "",
        gstNumber:
          updatedUser.gstNumber || "",
        panNumber:
          updatedUser.panNumber || "",
        currency:
          updatedUser.currency || "INR",
        logoUrl:
          updatedUser.logoUrl || "",
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Business Logo Upload Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to upload business logo",
    });
  }
};

// =====================================
// REMOVE BUSINESS LOGO
// =====================================

const removeBusinessLogo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================
    // DELETE FROM CLOUDINARY
    // =====================================

    if (user.logoPublicId) {
      try {
        await cloudinary.uploader.destroy(
          user.logoPublicId,
          {
            resource_type: "image",
          }
        );
      } catch (cloudinaryError) {
        console.error(
          "Cloudinary Logo Delete Error:",
          cloudinaryError
        );
      }
    }

    // =====================================
    // CLEAR DATABASE VALUES
    // =====================================

    user.logoUrl = "";
    user.logoPublicId = "";

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Business logo removed successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        businessName:
          updatedUser.businessName || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        website: updatedUser.website || "",
        gstNumber:
          updatedUser.gstNumber || "",
        panNumber:
          updatedUser.panNumber || "",
        currency:
          updatedUser.currency || "INR",
        logoUrl: "",
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Business Logo Remove Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove business logo",
    });
  }
};

module.exports = {
  uploadBusinessLogo,
  removeBusinessLogo,
};