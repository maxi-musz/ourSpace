import multer from "multer";

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define the destination folder for uploaded files
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Define the filename for uploaded files
    cb(null, file.fieldname + '-' + Date.now());
  }
});

// Create a Multer instance
const upload = multer({ storage: storage });

export default upload;