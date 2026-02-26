const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// --- Base upload folder ---
const baseDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

// --- Folder-specific dimensions ---
const folderSizes = {
  brand: { width: 181, height: 65, tolerance: 20 },//	181 × 65 px
  contact: { width: 217, height: 41, tolerance: 10 },//217 × 41 px
   favicon: { width: 35, height: 35, tolerance: 10 } ,
  review: { width: 56, height: 56, tolerance: 1 },
  blogs: { width: 861, height: 465, tolerance: 10 },//	389 × 210 px 861 x 465
  profileimage: { width: 300, height: 300, tolerance: 50 },
  loginsection: { width: 800, height: 700, tolerance: 200 },
  tickets: null,
  herosection: {
    backgroundImg: { width: 1440, height: 1384, tolerance: 0 },
    mainImg: { width: 843, height: 843, tolerance: 0 }
  },
};

// --- Helper to get folder from route ---
const getFolderFromRoute = (req) => {
  const route = req.originalUrl.toLowerCase();
  //  ADMIN PROFILE IMAGE
  if (route.includes("adminimage") || route.includes("adminprofile"))
    return "adminprofile";
  if (route.includes("brand")) return "brand";
  if (route.includes("savecontact")) return "contact";
  if (route.includes("review")) return "review";
  if (route.includes("blogs")) return "blogs";
  if (route.includes("profile")) return "profileimage";
  if (route.includes("ticket") || route.includes("support")) return "tickets";
  if (route.includes("leadsuploadexcel")) return "leads";
  if (route.includes("herosection")) return "herosection"; // Add this line
  if (route.includes("growtoolsave")) return "growtool"
  if (route.includes("loginsectionsave")) return "loginsection"
  
  return "others";
};

// --- Multer Storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = getFolderFromRoute(req);
    let folderPath = path.join(baseDir, folderName);
    // *** Special structure for blogs ***
    if (folderName === "blogs") {
      folderPath = path.join(baseDir, "blogs/main");
    }
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// --- File Filter (extension only) ---
const fileFilter = (req, file, cb) => {
  const folderName = getFolderFromRoute(req);

  //  EXCEL UPLOAD (LEADS)
  if (folderName === "leads") {
    const allowedExcel =
      /xlsx|xls/.test(path.extname(file.originalname).toLowerCase()) &&
      (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "application/vnd.ms-excel"
      );

    if (allowedExcel) return cb(null, true);
    return cb(new Error("Only Excel files allowed (.xlsx, .xls)"));
  }

  let allowed = /jpeg|jpg|png|webp/;
  if (folderName === "tickets") allowed = /jpeg|jpg|png|webp|pdf/;

  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);

  if (extValid && mimeValid) return cb(null, true);
  return cb(new Error(`Invalid file type. Allowed: ${allowed}`));
};

// --- Multer Instance ---
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// --- Sharp Dimension Validator ---
const validateDimensions = async (req, res, next) => {
  const folderName = getFolderFromRoute(req);
  if (folderName === "leads") return next();

  // Collect all files uploaded
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) Object.values(req.files).flat().forEach(f => files.push(f));

  if (!files.length) return next();

  try {
    for (let f of files) {
      if (!f.mimetype.startsWith("image/")) continue;

      const metadata = await sharp(f.path).metadata();
      const { width, height } = metadata;

      // Use custom dimension for favicon
      let dim = folderSizes[folderName];
        if (folderName === "herosection") {
        dim = folderSizes.herosection[f.fieldname];
      }
      if (f.fieldname === "favicon") dim = folderSizes.favicon;

      if (!dim) continue;

      const validWidth = width >= dim.width - dim.tolerance && width <= dim.width + dim.tolerance;
      const validHeight = height >= dim.height - dim.tolerance && height <= dim.height + dim.tolerance;

      if (!validWidth || !validHeight) {
        fs.unlinkSync(f.path);
        return res.status(200).json({
          success: false,
          message: `Invalid size for ${f.fieldname}. Required: ${dim.width}x${dim.height}`,
        });
      }
    }

    next();
  } catch (err) {
    files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    return res.status(500).json({ success: false, message: "Error processing image" });
  }
};



// ==========================
//  THUMBNAIL GENERATOR
// ==========================
const generateThumbnail = async (req, res, next) => {
  if (!req.file) return next();

  const folderName = getFolderFromRoute(req);
  if (folderName !== "blogs") return next();

  const thumbDir = path.join(baseDir, "blogs/thumb");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const thumbFilename = "thumb_" + req.file.filename;
  const thumbPath = path.join(thumbDir, thumbFilename);

  try {
    await sharp(req.file.path)
      .resize(389, 210)
      .toFile(thumbPath);

    // Pass thumbnail to controller
    req.thumbnailPath = "/uploads/blogs/thumb/" + thumbFilename;

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Thumbnail creation failed" });
  }
};

upload.fieldsWithSizeError = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, function (err) {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(200).json({
            success: false,
            message: "File must be under 5 MB"
          });
        }
        return res.status(200).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};


// ==========================
//  UPLOAD WITH SIZE ERROR HANDLING
// ==========================
upload.singleWithSizeError = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, function (err) {
      if (err) {
        // FILE SIZE ERROR
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(200).json({
            success: false,
            message: "File must be under 5 MB"
          });
        }

        // OTHER MULTER ERRORS
        return res.status(200).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// --- Export ---
upload.validateDimensions = validateDimensions;
upload.generateThumbnail = generateThumbnail;
module.exports = upload;
