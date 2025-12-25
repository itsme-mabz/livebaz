const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

// Configuration check
const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

/**
 * Uploads an image either to Cloudinary or returns the base64 string for DB storage
 */
const uploadToCloudinary = async (fileStr, folder) => {
    try {
        // If Cloudinary is configured, use it for professional hosting
        if (isCloudinaryConfigured) {
            console.log("Uploading to Cloudinary...");
            const uploadResponse = await cloudinary.uploader.upload(fileStr, {
                folder: folder || "blog_images",
            });
            return uploadResponse.secure_url;
        } else {
            // Fallback: Store directly in SQL Database as Base64 string
            console.log("Cloudinary NOT configured. Storing image data directly in SQL database...");

            // If it's already a Data URL (base64 from frontend), just return it
            if (fileStr.startsWith("data:image/")) {
                return fileStr;
            }

            return fileStr;
        }
    } catch (error) {
        console.error("Image processing error:", error);
        throw error;
    }
};

module.exports = { uploadToCloudinary };
