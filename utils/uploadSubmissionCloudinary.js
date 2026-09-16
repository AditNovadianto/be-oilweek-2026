import cloudinary from "../config/cloudinary.js";

export const uploadSubmissionToCloudinary = async (filePath, options = {}) => {
  if (!filePath) {
    throw new Error("Submission file path is missing");
  }

  const {
    folder = "oilweek2026/stage-submissions",
    resourceType = "raw",
    publicId,
  } = options;

  const uploadOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  };

  if (publicId) {
    uploadOptions.public_id = publicId;
    uploadOptions.use_filename = false;
    uploadOptions.unique_filename = false;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return result.secure_url;
  } catch (error) {
    console.error("Submission Cloudinary upload error:", error);
    throw error;
  }
};
