import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a single image to Cloudinary
const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(file.path, { folder: 'property_images' }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
};

// Function to upload multiple images
export const uploadImagesToCloudinary = async (files) => {
  const urls = [];
  for (const file of files) {
    const url = await uploadImage(file);
    urls.push(url);
  }
  return urls;
};
