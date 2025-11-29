const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist (using absolute paths)
const baseUploadDir = path.join(__dirname, '..', 'uploads');
const uploadDirs = {
  supportingDocs: path.join(baseUploadDir, 'supporting-docs'),
  expenditureBills: path.join(baseUploadDir, 'expenditure-bills'),
  proofs: path.join(baseUploadDir, 'proofs'),
  certificates: path.join(baseUploadDir, 'certificates'),
  grievances: path.join(baseUploadDir, 'grievances')
};

// Create base upload directory if it doesn't exist
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Create subdirectories
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.supportingDocs; // Default
    const routePath = req.route?.path || req.url || '';
    
    // Determine upload directory based on route or field name
    if (routePath.includes('grievance')) {
      uploadPath = uploadDirs.grievances;
    } else if (routePath.includes('request') || file.fieldname === 'documents') {
      uploadPath = uploadDirs.supportingDocs;
    } else if (routePath.includes('expenditure') || file.fieldname === 'bill') {
      uploadPath = uploadDirs.expenditureBills;
    } else if (routePath.includes('proof') || file.fieldname === 'file') {
      uploadPath = uploadDirs.proofs;
    } else if (routePath.includes('certificate')) {
      uploadPath = uploadDirs.certificates;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and common document formats
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, PDF, and document files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

module.exports = { upload, uploadDirs };

