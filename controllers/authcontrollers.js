const Blog = require('../models/Blog');
const Brand = require('../models/Brand');
const Faq = require('../models/Faq');
const Review = require('../models/Review');
const Contact = require('../models/Contact');
const PricingPlan = require('../models/PricingPlan');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const UserResetPasswordToken = require('../models/UserResetPasswordToken');
const UserContact = require('../models/Usercontact')
const DataRequest = require('../models/DataRequest')
const Category = require('../models/Category');
const Country = require('../models/Countrie');
const State = require('../models/States');
const SupportTicket = require('../models/Ticket');
const Admin = require('../models/AdminTable');
const Payment = require('../models/Payment');
const Newsletter = require('../models/NewsLetter');
const LeadDetail = require('../models/LeadDetail');
const UserSubscription = require('../models/UserSubscription');
const Notification = require('../models/Notification')
const Herosection = require('../models/Herosection'); // Add this import 
const Logonsection = require('../models/Loginsection'); // Add this import
const PageSection = require('../models/PageSection'); // Add this import
const PaymentGateway = require('../models/PaymentGateway');
const LeadSetting = require('../models/LeadSetting')
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const transporter = require('../helpers/emailHelper');
const sendResetLink = require('../helpers/sendresetlink');
const Seo = require('../models/Seo');
const geoip = require("geoip-lite");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
const moment = require("moment");
const generatePDF = require('../helpers/GeneratePDF');
const generateCSV = require('../helpers/GenerateCSV');
const generateExcel = require('../helpers/GenerateExcel');
const sendTemplateEmail = require('../helpers/sendresetlink');
const generateUsername = require('../helpers/CreateUsername')
// ==========================================
// Sign Up 
// ==========================================
module.exports.signup = async (req, res) => {
  try {
    const {
      profileImage,
      firstName,
      lastName,
      email,
      password,
      mobile,
      address,
      city,
      state,
      zip,
      country,
      ip
    } = req.body;

    // Required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(200).json({
        success: false,
        message: "First name, last name, email & password are required"
      });
    }

    // OTP Generate
    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    let otpExpiry = Date.now() + 10 * 60 * 1000;


    let user = await User.findOne({ email });
    const contact = await Contact.findOne({}, { logo: 1, favicon: 1 }).lean();
    const emailVars = {
      firstName,
      site_name: "GrowLead",
      site_logo: `${process.env.BASE_URL}${contact.logo}`,
      otp
    };

    if (user?.status === false) {
      return res.status(200).json({
        success: false,
        message: "Your account has been banned. Please contact support."
      });
    }

    if (user) {
      if (!user.emailVerified) {

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendTemplateEmail("resend_otp", email, emailVars);

        return res.json({
          success: true,
          message: "OTP resend to your email.",
          status: "1",
          userId: user._id,
        })

      }
      else {
        return res.status(200).json({
          success: false,
          message: "Email already registered plese login",
        });
      }

    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    const username = await generateUsername(firstName, lastName);

    await Notification.create({
      name: `${firstName} ${lastName}`,
      subject: "New User Registered",
      message: `${firstName} ${lastName} has registered.`,
    });
    // user create (optional fields included)
    let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    ipAddress = ipAddress.split(',')[0].trim(); 
    ipAddress = ipAddress.startsWith('::ffff:') ? ipAddress.replace('::ffff:', '') : ipAddress;

    user = new User({
      profileImage,
      firstName,
      lastName,
      email,
      password: hashedPassword,

      mobile: mobile || "",
      address: address || "",
      city: city || "",
      state: state || "",
      zip: zip || "",
      country: country || "",
      ip: ipAddress,
      username,
      otp,
      otpExpiry,
      emailVerified: false
    });

    await user.save();

    // Send OTP Email
    await sendTemplateEmail("signup_otp", email, emailVars);



    res.json({
      success: true,
      message: "Signup successful. OTP sent to your email.",
      userId: user._id,
      status: "1",
      email: user.email
    });

  } catch (err) {
    console.log("Signup Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ==========================================
// Verify Otp  
// ==========================================
module.exports.verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found"
      });
    }

    // OTP compare 
    if (user.otp !== String(otp).trim()) {
      return res.status(200).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(200).json({
        success: false,
        message: "OTP expired"
      });
    }

    // UPDATE VERIFY
    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (err) {
    console.log("OTP Verify Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ==========================================
// Login  
// ==========================================

module.exports.login = async (req, res) => {
  try {
    const { email, password, browser, os} = req.body;

    if (!email || !password) {
      return res.status(200).json({
        success: false,
        message: "Email & password are required"
      });
    }

    // -----------------------------
    // Find User
    // -----------------------------
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user?.status === false) {
      return res.status(200).json({
        success: false,
        message: "Your account has been banned. Please contact support."
      });
    }
    // -----------------------------
    // Compare Password
    // -----------------------------
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(200).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // -----------------------------
    // Get IP & Location
    // -----------------------------
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    ip = ip.split(',')[0].trim();
    const cleanIP = ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;

    const geo = geoip.lookup(cleanIP) || {};
    const location = geo.city && geo.country ? `${geo.city}, ${geo.country}` : "Unknown";



    // -----------------------------
    // Save Login History
    // -----------------------------
    await LoginHistory.create({
      userId: user._id,
      loginAt: new Date(),
      ip: cleanIP,
      location,
      browser,
      os
    });

    user.lastLogin = new Date();
    user.ip = cleanIP;
    await user.save();

    // -----------------------------
    // JWT Token
    // -----------------------------
    const token = jwt.sign(
      {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // -----------------------------
    // FULL RESPONSE (As requested)
    // -----------------------------
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        city: user.city,
        state: user.state,
        zip: user.zip,
        country: user.country,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        registeredAt: user.createdAt,
        profileImage: user.profileImage,
        // Login meta
        ip: cleanIP,
        location,
        browser,
        os
      }
    });

  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ==========================================
// Update Profile
// ==========================================
module.exports.updateProfile = async (req, res) => {
  try {

    const userId = req.user._id;


    const { firstName, lastName, email, mobile, address, city, state, zip, country } = req.body;

    let updateData = { firstName, lastName, email, mobile, address, city, state, zip, country };


    //  Fetch user ONLY if new image is uploaded
    if (req.file && req.file.filename) {
      const user = await User.findById(userId);

      //  Delete old image ONLY when new image is uploaded
      if (user && user.profileImage) {
        const oldImagePath = path.join(__dirname, "..", user.profileImage);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Set new image path
      updateData.profileImage = `/uploads/profileimage/${req.file.filename}`;
    }


    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });

  }


}


// ==========================================
// Get Profile
// ==========================================
module.exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password -otp -otpExpiry -status -ip ");
    if (!user) {
      return res.status(200).json({ success: false, message: "User not found" });
    }

    // -------------------------
    //  Get active subscription
    // -------------------------
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active",
      endDate: { $gte: new Date() } // NOT expired
    }).populate("planId");

    let subscriptionInfo = null;
    if (subscription) {
      subscriptionInfo = {
        planId: subscription.planId?._id,
        planName: subscription.planId?.name,
        billingType: subscription.billingType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        isActive: true
      };
    } else {
      subscriptionInfo = {
        isActive: false
      };
    }


    res.json({
      success: true,
      data: {
        user,
        subscription: subscriptionInfo
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ==========================================
// Get Blogs  
// ==========================================
module.exports.getBlogs = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "blogs" }, {
      _id: 0,
      label: 1,
      title: 1,
      shortDescription: 1,
    });

    const blogs = await Blog.find({}, {
      title: 1,
      shortDescription: 1,
      description: 1,
      image: 1,
      createdAt: 1,
      thumbnail: 1,
      _id: 1
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      pageSection,
      blogs
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// Get Blog Details 
// ==========================================
module.exports.getBlogDetails = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "blogs" }, {
      _id: 0,
      label: 1,
      title: 1,
      shortDescription: 1,
    });
    const { id } = req.params;

    // -----------------------------
    // Get ALL recent blogs (array)
    // -----------------------------
    const recentBlogs = await Blog.find(
      { isRecent: true },
      { title: 1, shortDescription: 1, description: 1, image: 1, _id: 1, createdAt: 1, thumbnail: 1 }
    ).sort({ createdAt: -1 });

    // -----------------------------
    // Get Blog Details (if id given)
    // -----------------------------
    let blogDetails = [];

    if (id) {
      const blog = await Blog.findById(id, {
        title: 1,
        shortDescription: 1,
        description: 1,
        content: 1,
        image: 1,
        isRecent: 1,
        createdAt: 1,
        thumbnail: 1,
      });

      if (blog) {
        blogDetails.push({
          id: blog._id,
          title: blog.title,
          shortDescription: blog.shortDescription,
          description: blog.description,
          content: blog.content,
          image: blog.image,
          isRecent: blog.isRecent,
          createdAt: blog.createdAt
        });
      }
    }

    // -----------------------------
    // Final Response
    // -----------------------------
    res.json({
      success: true,
      pageSection,
      blogDetails,   // array of 1 or empty array
      recentBlogs    // array of all recent blogs
    });

  } catch (err) {
    console.error("Blog Combined Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}
// ==========================================
// Get Brands
// ==========================================
module.exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}, { image: 1, _id: 0 });

    const formatted = brands.map((b, index) => ({
      alt: "Brand " + (index + 1),
      image: b.image
    }));

    res.json({
      success: true,
      Data: formatted
    });

  } catch (err) {
    console.error("Brand API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
// ==========================================
// Get Faq
// ==========================================
module.exports.getFaq = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "faq" }, {
      _id: 0,
      label: 1,
      title: 1,
      shortDescription: 1,
    });
    const faq = await Faq.find({}, {
      question: 1,
      answer: 1,
      _id: 0
    });


    res.json({
      success: true,
      pageSection,
      data: faq
    });

  } catch (err) {
    console.error("Faq API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
// ==========================================
// Get Review
// ==========================================
module.exports.getReview = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "testimonials" }, {
      _id: 0,
      label: 1,
      title: 1,
      shortDescription: 1,
    });
    const reviews = await Review.find({}, {
      name: 1,
      username: 1,
      image: 1,
      review: 1,
      rating: 1,
      _id: 0
    });

    const formatted = reviews.map(r => ({
      avatar: r.image || null,
      name: r.name || "",
      handle: r.username ? `${r.username}` : "",
      rating: r.rating || 0,
      text: r.review || "",
    }));

    const joinWithUsCount = await Review.countDocuments();
    const joinWithUs = `${joinWithUsCount}+`;

    res.json({
      success: true,
      joinWithUs,
      pageSection,
      data: formatted
    });

  } catch (err) {
    console.error("Review API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ==========================================
// Get Contact Details  
// ==========================================
module.exports.getContactDetails = async (req, res) => {
  try {
    const contact = await Contact.findOne({});


    res.json({
      success: true,
      data: contact
    });

  } catch (err) {
    console.error("Review API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
// ==========================================
// Get Pricing Plans
// ==========================================
exports.getPricingPlans = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "subscriptions" }, {
      _id: 0,
      label: 1,
      title: 1,
      shortDescription: 1,
    });
    let plans = await PricingPlan.find({ status: true });

    const planOrder = {
      basic: 1,
      standard: 2,
      Premium: 3,
    };

    plans.sort((a, b) => {
      return (planOrder[a.planType]) - (planOrder[b.planType]);
    });


    // MONTHLY ARRAY
    const monthlyPlans = plans.map(plan => ({
      id: plan._id,
      title: plan.name,
      description: plan.shortDescription,
      billingType: "monthly",

      price: {
        monthly: plan.monthlyPrice
      },

      features: [
        `${plan.monthlyLeadLimit} ${plan.monthlyCredit}`,
        plan.expiredDaysMonthly,
        plan.monthlyFeatures,
        plan.monthlyDescription


      ],

      isPremium: plan.isPremium || false,
      planType: plan.planType
    }));

    // ANNUAL ARRAY
    const annualPlans = plans.map(plan => ({
      id: plan._id,
      title: plan.name,
      description: plan.shortDescription,
      billingType: "yearly",

      price: {
        annual: plan.yearlyPrice
      },

      features: [
        `${plan.yearlyLeadLimit} ${plan.yearlyCredit}`,
        plan.expiredDaysYearly,
        plan.yearlyFeatures,
        plan.yearlyDescription
      ],

      isPremium: plan.isPremium || false,
      planType: plan.planType
    }));

    // FINAL RESPONSE
    res.json({
      success: true,
      pageSection,
      data: {
        monthly: monthlyPlans,
        annual: annualPlans
      }
    });

  } catch (err) {
    console.error("Pricing API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ==========================================
// Send Reset Link
// ==========================================
module.exports.sendresetlink = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(200).json({ success: false, message: "Email not found" });

    // Delete old tokens
    await UserResetPasswordToken.deleteMany({ userId: user._id });

    // Create new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await new UserResetPasswordToken({
      userId: user._id,
      token,
      expiresAt,
    }).save();

    // Link that your UI (frontend) will open
    const frontendURL = process.env.FRONTEND_BASE_URL;
    const resetLink = `${frontendURL}/Resetpassword?token=${token}`;
    const contact = await Contact.findOne({}, { logo: 1, favicon: 1 }).lean();

    const emailVars = {
      firstName: user.firstName,
      site_name: "GrowLead",
      site_logo: `${process.env.BASE_URL}${contact.logo}`,
      reset_link: resetLink,
      time: new Date().toLocaleString()
    };
    await sendTemplateEmail("reset_password", email, emailVars);

    res.json({ success: true, message: "Password reset link sent to your email!" });
  } catch (err) {
    console.error("Error sending reset link:", err);
    res.status(500).json({ success: false, message: "Failed to send reset link" });
  }
};


// ==========================================
// Reset Password
// ==========================================
module.exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword)
      return res.status(200).json({ success: false, message: "Passwords do not match" });

    const tokenDoc = await UserResetPasswordToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc)
      return res.status(200).json({ success: false, message: "Invalid or expired token" });

    const user = await User.findById(tokenDoc.userId);
    if (!user)
      return res.status(200).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await UserResetPasswordToken.findByIdAndDelete(tokenDoc._id);

    res.json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// User Contact
// ==========================================

module.exports.createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(200).json({
        success: false,
        message: "All fields are required!"
      });
    }

    const newMessage = await UserContact.create({
      name,
      email,
      subject,
      message,
    });

    res.json({
      success: true,
      message: "Message submitted successfully!",
      data: newMessage
    });

  } catch (err) {
    console.error("Error submitting message:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};


// ==========================================
// Create Data Request
// ==========================================
const { getgeminidata, getopenaidata, getgoogleMapdata, getgeographydata } = require('../helpers/LeadgenerateApi')
const { cleanLeadForExport } = require('../helpers/leadExport')

module.exports.createDataRequest = async (req, res) => {
  try {

    const userId = req.user._id;

    let {
      categoryId,
      countryId,
      stateId,
      NumberOfData,
      downloadType,

    } = req.body;

    const category = await Category.findById(categoryId).lean();
    const country = await Country.findById(countryId).lean();
    const state = await State.findById(stateId).lean();


    // Single document fetch
    const contactSettings = await LeadSetting.findOne({}).lean(); // plain object
    // let useApiData = false;
    let activeApi = { type: null, apiKey: null };

    if (contactSettings) {
      for (const [key, value] of Object.entries(contactSettings)) {
        if (value && typeof value === "object" && value.enabled === true) {
          activeApi = {
            type: key,
            apiKey: value.apiKey ?? null
          };
          // useApiData = true;
          break;
        }
      }
    }

    // Validation
    if (!categoryId || !countryId || !stateId) {
      return res.status(200).json({
        success: false,
        message: "Category, country & state are required"
      });
    }

    NumberOfData = Number(NumberOfData);

    if (isNaN(NumberOfData) || NumberOfData <= 0) {
      return res.status(200).json({
        success: false,
        message: "Plese minimum generate 1 data"
      });
    }

    if (downloadType) {
      downloadType = downloadType.toLowerCase().trim();
    }

    // Get Active Subscription
    const subscription = await UserSubscription.findOne({
      userId,
      status: "active"
    });

    if (!subscription) {
      return res.status(200).json({
        success: false,
        message: "No active subscription. Please upgrade your plan."
      });
    }

    // Expiry check
    if (subscription.endDate < new Date()) {
      subscription.status = "expired";
      await subscription.save();

      return res.status(200).json({
        success: false,
        message: "Your subscription has expired. Please renew."
      });
    }

    if (subscription.remainingLeads <= 0) {
      return res.status(200).json({
        success: false,
        message: "You have exhausted your lead limit. Upgrade your plan."
      });
    }

    if (NumberOfData > subscription.remainingLeads) {
      return res.json({
        success: false,
        message: `You can generate only ${subscription.remainingLeads} more leads`
      });
    }

    const newRequest = await DataRequest.create({
      userId,
      categoryId,
      countryId,
      stateId,
      NumberOfData,
      downloadType
    });

    // --------------------------------------------------
    // ADMIN NOTIFICATION (IMPORTANT)
    // --------------------------------------------------

    await Notification.create({
      userId: userId,
      subject: "New Data Request Created",
      message: `generate ${NumberOfData} leads`
    });

    console.log(activeApi.apiKey, activeApi.type);

    const apiPayload = {
      apiKey: activeApi.apiKey,
      category: category.title,
      country: country.name,
      state: state.name,
      limit: NumberOfData
    };


    console.log(apiPayload);


    let apiData = [];
    let resposdata = null;

    if (activeApi.type && activeApi.type !== "manualData") {

      switch (activeApi.type) {
        case "geminiApi":
          resposdata = await getgeminidata(apiPayload);
          break;

        case "openAi":
          resposdata = await getopenaidata(apiPayload);
          break;

        case "googleMap":
          resposdata = await getgoogleMapdata(apiPayload);
          break;

        case "geographyApi":
          resposdata = await getgeographydata(apiPayload);
          break;

        default:
          console.log(`Unknown API type: ${activeApi.type}`);
          break;
      }

      // Use API data if available
      if (resposdata && Array.isArray(resposdata)) {
        apiData = resposdata;
      }
    } else if (activeApi.type === "manualData") {

      const manualLeads = await LeadDetail.find({
        CategoryId: categoryId, type: 'manual',
        state: {
          $regex: new RegExp(`^${state.name}$`, "i")
        },
        country: {
          $regex: new RegExp(`^${country.name}$`, "i")
        },

      }).lean();


      // Ensure each lead has type "manual"
      apiData = manualLeads
    }

    // --------------------
    //  CLEAN API DATA (EMAIL DUPLICATE CHECK)
    // --------------------
    let finalLeads = [];
    const emailSet = new Set();
    let apiLeads = [];

    for (let item of apiData) {
      let email = item.email || item.email;
      if (Array.isArray(email)) email = email[0];
      if (!email || typeof email !== "string") continue;

      let exists = await LeadDetail.findOne({
        email: email.toLowerCase()
      });

      if (!exists && !emailSet.has(email)) {
        emailSet.add(email);

        apiLeads.push({
          Name: item.name || item.name || null,
          Email: [email.toLowerCase()],
          Type: item.type || "api",
          Phone: item?.phone
            ? [item.phone]
            : [],
          Website: item.website || null,
          City: item.city || null,
          State: item.state || null,
          Country: item.country || null,
          Postcode: item.postcode || null,
          Street: item.street || null,
          OpeningHours: item.openinghours || null,
        });
      }
    }

    // --------------------
    //  IF API DATA LESS → FETCH FROM DB
    // --------------------
    finalLeads = [...apiLeads];


    if (finalLeads.length < NumberOfData) {
      const needed = NumberOfData - finalLeads.length;

      const dbLeads = await LeadDetail.find({
        CategoryId: categoryId,
        state: { $regex: new RegExp(`^${state.name}$`, "i") },
        country: { $regex: new RegExp(`^${country.name}$`, "i") }
      })
        .limit(needed)
        .lean();

      finalLeads.push(...dbLeads);
    }

    // --------------------
    //  FINAL LIMIT SAFETY
    // --------------------
    finalLeads = finalLeads.slice(0, NumberOfData);

    if (finalLeads.length === 0) {
      return res.json({
        success: false,
        message: "No leads available"
      });
    }

    const skipDbInsert = ["geminiApi", "openAi"].includes(activeApi.type);

    // --------------------
    // INSERT ONLY NEW LEADS
    // --------------------
    if (!skipDbInsert) {
      const newLeads = finalLeads
        .filter(l => !l._id)
        .map(l => ({
          CategoryId: categoryId,
          ...l
        }));

      if (newLeads.length > 0) {
        await LeadDetail.insertMany(newLeads);
      }
    }
    // Generate file based on downloadType
    let filePath = null;
    const exportLeads = finalLeads.map(cleanLeadForExport);
    const finalFileData = { leadData: exportLeads };
    if (downloadType) {
      switch (downloadType.toLowerCase()) {
        case 'pdf':
          filePath = await generatePDF(finalFileData);
          break;
        case 'csv':
          filePath = await generateCSV(finalFileData);
          break;
        case 'excel':
        case 'xlsx':
          filePath = await generateExcel(finalFileData);
          break;
      }

      if (filePath) {
        newRequest.generatedFilePath = filePath;
        await newRequest.save();
      }
    }

    // -------------------------
    // SAVE TO LEADDETAIL
    // -------------------------
    const deliveredCount = finalLeads.length;


    await DataRequest.findByIdAndUpdate(
      newRequest._id,
      {
        $set: {
          NumberOfData: deliveredCount,
        }
      }
    );
    const updatedSubscription = await UserSubscription.findOneAndUpdate(
      { userId, status: "active" },
      { $inc: { remainingLeads: -deliveredCount } },
      { new: true }
    );

    const user = await User.findById(userId).lean();
    const contact = await Contact.findOne({}, { logo: 1, favicon: 1 }).lean();

    // ---------------- SEND EMAIL TO USER ----------------
    await sendTemplateEmail("lead_generated", user.email, {
      firstName: user.firstName || "User",
      site_name: "GrowLead",
      site_logo: `${process.env.BASE_URL}${contact.logo}`,
      generated: deliveredCount,
      remaining: updatedSubscription.remainingLeads
    });

    // --------------------
    // RESPONSE
    // --------------------
    res.json({
      success: true,
      message: `${deliveredCount} leads generated successfully`,
      requested: NumberOfData,
      delivered: deliveredCount,
      remainingLeads: updatedSubscription.remainingLeads
    });
  } catch (err) {
    console.error("Data Request Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// =====================
// GET ALL CATEGORIES
// =====================
module.exports.getCategories = async (req, res) => {
  try {
    const categoriesData = await Category.find(
      { status: true },
      { _id: 1, title: 1 }
    ).sort({ title: 1 });

    const categories = categoriesData.map(cat => ({
      _id: cat._id,
      name: cat.title
    }));

    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    console.error("Get Categories Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// =====================
// GET ALL COUNTRIES
// =====================
module.exports.getCountries = async (req, res) => {
  try {
    const countries = await Country.find({ status: true }, { _id: 1, name: 1 }
    ).sort({ name: 1 });

    res.json({
      success: true,
      data: countries
    });
  } catch (err) {
    console.error("Get Countries Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================
// GET STATES BY COUNTRY
// =====================
module.exports.getStatesByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    const states = await State.find({
      country: countryId,
      status: true
    },
      { _id: 1, name: 1 }
    ).sort({ name: 1 });

    res.json({
      success: true,
      data: states
    });
  } catch (err) {
    console.error("Get States Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// =====================
// Create Ticket
// =====================
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(200).json({
        success: false,
        message: "Subject and message are required"
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Fetch actual user details
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(200).json({ success: false, message: "User not found" });
    }

    // Handle attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(f => ({
        file: f.filename,
        url: "/uploads/tickets/" + f.filename
      }));
    }



    // Sender object
    const senderData = {
      _id: user._id,
      name: user.firstName + " " + user.lastName,
      username: user.username,
      email: user.email
    };

    // Convert priority to lowercase (only new change)
    const fixedPriority = priority ? priority.toLowerCase() : null;

    const ticket = new SupportTicket({
      subject,
      priority: fixedPriority,
      submittedBy: user._id,
      status: "open",
      messages: [
        {
          sender: senderData,
          senderModel: "User",
          message,
          attachments
        }
      ]
    });

    await ticket.save();

    res.json({
      success: true,
      message: "Ticket submitted",
      ticket
    });

  } catch (err) {
    console.log("Create Ticket Error:", err);
    res.status(500).json({ success: false });
  }
};
// =====================
// REPLY TO TICKET
// =====================
exports.replyToTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;

    if (!message)
      return res.status(200).json({ success: false, message: "Message required" });

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket)
      return res.status(200).json({ success: false, message: "Ticket not found" });

    // Handle attachments
    const attachments = (req.files || []).map(f => ({
      file: f.filename,
      url: "/uploads/tickets/" + f.filename
    }));

    // Check sender type
    const isAdmin = !!req.session?.adminId;
    const senderId = isAdmin ? req.session.adminId : req.user._id;

    let senderData;

    if (isAdmin) {
      const admin = await Admin.findById(senderId).lean();
      if (!admin) {
        return res.status(200).json({ success: false, message: "Admin not found" });
      }
      senderData = {
        _id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email
      };
    } else {
      const user = await User.findById(senderId).lean();
      if (!user) {
        return res.status(200).json({ success: false, message: "User not found" });
      }
      senderData = {
        _id: user._id,
        name: user.firstName + " " + user.lastName,
        username: user.username,
        email: user.email
      };
    }

    // Create message
    const newMessage = {
      sender: senderData,
      senderModel: isAdmin ? "Admin" : "User",
      message,
      attachments,
      createdAt: new Date()
    };

    ticket.messages.push(newMessage);

    // Update status
    ticket.status = ticket.submittedBy.toString() === senderId.toString() ? "open" : "answered";
    ticket.lastReply = new Date();

    await ticket.save();

    const savedMessage = ticket.messages[ticket.messages.length - 1];

    res.json({ success: true, newMessage: savedMessage, ticketId });

  } catch (err) {
    console.log("Reply Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================
// USER GET TICKETS
// =====================
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search
    const search = req.query.search?.trim() || "";

    // Base filter
    let filter = { submittedBy: userId };

    if (search !== "") {
      filter = {
        submittedBy: userId,
        $or: [
          { subject: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { priority: { $regex: search, $options: "i" } }
        ]
      };
    }

    // Sorting
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Total Documents
    const totalRecords = await SupportTicket.countDocuments({ submittedBy: userId });

    // Filtered count
    const filteredRecords = await SupportTicket.countDocuments(filter);

    // Fetch paginated data BUT only selected fields
    const tickets = await SupportTicket.find(filter)
      .select("subject status priority lastReply createdAt") // <<< IMPORTANT
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Response
    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalRecords,
        filteredRecords,
        totalPages: Math.ceil(filteredRecords / limit),
      },
      data: tickets
    });

  } catch (err) {
    console.error("Get User Tickets Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// =====================
// USER GET TICKETS DETAILS
// =====================
exports.getSingleTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    // Populate sender (User/Admin)
    const ticket = await SupportTicket.findById(ticketId)
      .populate("messages", "name email")
      .select("subject status priority messages createdAt");

    if (!ticket) {
      return res.status(200).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Format messages to your required structure
    const formattedMessages = ticket.messages.map(m => ({
      sender: m.sender.name,
      senderModel: m.senderModel,
      message: m.message,
      attachments: m.attachments.map(a => a.url),
      _id: m._id,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    // Final response
    res.json({
      success: true,
      data: {
        _id: ticket._id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        messages: formattedMessages,
        createdAt: ticket.createdAt
      }
    });

  } catch (err) {
    console.error("Get Single Ticket Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// =====================
// USER GET DATA REQUESTS
// =====================
exports.getUserDataRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search
    const search = req.query.search?.trim() || "";

    // Sorting
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // -----------------------------
    // AGGREGATION PIPELINE
    // -----------------------------
    const pipeline = [
      { $match: { userId } },

      // Category join
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // Country join
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country"
        }
      },
      { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
    ];

    //  SEARCH FIX (Category + Country added)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "category.title": { $regex: search, $options: "i" } },
            { "country.name": { $regex: search, $options: "i" } },
            { NumberOfData: { $regex: search, $options: "i" } },
            { downloadType: { $regex: search, $options: "i" } },
          ]
        }
      });
    }

    // Total records (without search)
    const totalRecords = await DataRequest.countDocuments({ userId });

    // Filtered count
    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const countResult = await DataRequest.aggregate(filteredCountPipeline);
    const filteredRecords = countResult[0]?.count || 0;

    // Data fetch
    pipeline.push(
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    );

    const requests = await DataRequest.aggregate(pipeline);

    // Format Response
    const formattedData = requests.map(item => ({
      categoryName: item.category?.title || "",
      countryName: item.country?.name || "",
      NumberOfData: item.NumberOfData,
      fileType: item.downloadType,
      createdAt: item.createdAt,
      generatedFilePath: item.generatedFilePath
    }));

    // Final Response
    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalRecords,
        filteredRecords,
        totalPages: Math.ceil(filteredRecords / limit),
      },
      data: formattedData
    });

  } catch (err) {
    console.error("Get User Data Request Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// =====================
// USER GET DATA PAYMENT
// =====================
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";

    let filter = {
      userId,
      status: { $ne: "open" },
    };

    if (search !== "") {
      filter = {
        userId,
        status: { $ne: "open" },
        $or: [
          { gateway: { $regex: search, $options: "i" } },
          { transactionId: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } }
        ]
      };
    }

    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const totalRecords = await Payment.countDocuments({ userId });
    const filteredRecords = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select("gateway transactionId initiatedAt conversion totals status createdAt invoiceUrl");

    const formatted = payments.map(p => ({
      paymentId: p._id,
      gateway: p.gateway,
      transactionId: p.transactionId,
      initiatedAmount: p.initiatedAt,
      invoiceUrl: p.invoiceUrl,

      conversion: {
        amountBase: `${p.conversion.fromAmount} ${p.conversion.fromCurrency}`,
        amountFee: `${p.conversion.toAmount} ${p.conversion.toCurrency}`,
        amountTotal: `${p.conversion.totalAmount} ${p.conversion.toCurrency}`
      },

      Amount: {
        amountBase: `${p.totals.firstAmount} ${p.totals.fromCurrency}`,
        amountFee: `${p.conversion.totalCharge} ${p.conversion.fromCurrency}`,
        amountTotal: `${p.totals.totalAmount} ${p.totals.toCurrency}`
      },


      statusTimeAgo: moment(p.initiatedAt).fromNow(), // ← dynamic time ago
      status: p.status,
      createdAt: p.createdAt
    }));

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalRecords,
        filteredRecords,
        totalPages: Math.ceil(filteredRecords / limit)
      },
      data: formatted
    });

  } catch (err) {
    console.error("Get User Payments Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// =====================
// FRONTEND DASHBOARD
// =====================
module.exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "firstName lastName email mobile address city state country profileImage"
    );

    // --------------------- LEADS COUNT ---------------------            
    const totalLeadsAgg = await DataRequest.aggregate([
      {
        $match: { userId }
      },
      {
        $group: {
          _id: null,
          totalLeads: {
            $sum: { $toInt: "$NumberOfData" }
          }
        }
      }
    ]);

    const totalLeads = totalLeadsAgg[0]?.totalLeads || 0;
    // --------------------- PAYMENT TOTAL SUM --------------- 
    const paymentResult = await Payment.aggregate([
      { $match: { userId, status: "success" } },

      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $toDouble: {
                $ifNull: ["$totals.totalAmount", 0]
              }
            }
          }
        }
      },

      // ROUND in PROJECT (correct place)
      {
        $project: {
          _id: 0,
          totalAmount: { $round: ["$totalAmount", 2] }
        }
      }
    ]);

    const totalPayment = paymentResult.length > 0 ? paymentResult[0].totalAmount : 0;

    const openTickets = await SupportTicket.countDocuments({
      submittedBy: userId,
      status: "open",
    });

    const closedTickets = await SupportTicket.countDocuments({
      submittedBy: userId,
      status: "closed",
    });

    const subscription = await UserSubscription.findOne({ userId, status: "active" })
      .populate("planId")
      .lean();

    let usedPercentage = 0;

    if (subscription) {
      const totalLeadsPlan = subscription.totalLeads ?? 0;
      const remainingLeads = subscription.remainingLeads ?? 0;
      const usedLeads = totalLeadsPlan - remainingLeads;

      usedPercentage = totalLeadsPlan > 0 ? +((usedLeads / totalLeadsPlan) * 100).toFixed(2) : 0;

    }



    const subscriptionInfo = await UserSubscription.findOne({ userId })
      .sort({ endDate: -1 })
      .populate("planId")
      .lean();

    let expireInfo = null;
    if (subscriptionInfo) {

      // ---------------- EXPIRE LOGIC (FIXED) ----------------
      const today = new Date();
      const endDate = new Date(subscriptionInfo.endDate);

      const diffTime = endDate - today;
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) diffDays = 0;

      let status = "active";
      let description = "";
      let title = "Subscription Active";

      if (endDate < today) {
        status = "expired";
        title = "Subscription Expired";
        description = `Your subscription expired on ${endDate.toDateString()}.`;
      } else if (diffDays <= 5) {
        status = "soon";
        title = "Subscription Expiring Soon";
        description = `Your subscription will expire on ${endDate.toDateString()} (${diffDays} day${diffDays !== 1 ? "s" : ""} left).`;
      } else {
        status = "active";
        title = "Subscription Active";
        description = `Your subscription is active until ${endDate.toDateString()}.`;
      }

      expireInfo = {
        status,
        title,
        endDate,
        daysLeft: diffDays,
        description
      };
    }


    // --------------------- RESPONSE ---------------------
    return res.json({
      success: true,
      data: {
        user,
        usedPercentage,
        totalLeads,
        totalPayment,
        openTickets,
        closedTickets,
        expire: expireInfo
      }
    });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// =====================
// Newsletter Subscription
// =====================
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(200).json({
        success: false,
        message: "Email is required.",
      });

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing)
      return res.status(200).json({
        success: false,
        message: "This email is already subscribed!",
      });

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to the newsletter!",
      data: newSubscriber,
    });
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while subscribing.",
    });
  }
};





// ================================
//payment gateway integration file
// ================================
const { createStripePayment, createRazorpayPayment, createPaypalPayment, createBraintreePayment, captureBraintreePayment, createPayHerePayment } = require('../helpers/payment');
const { title } = require('process');

module.exports.createPayment = async (req, res) => {
  try {
    const { amount, currency, productId, gateway, billingType, charge } = req.body;
    const userId = req.user._id;

    if (!userId || !amount || !currency || !productId || !gateway)
      return res.status(200).json({ success: false, message: "Missing fields" });

    let paymentData;

    switch (gateway.toLowerCase()) {
      case "stripe":
        paymentData = await createStripePayment({ amount, currency, productId, billingType, userId, charge });
        break;

      case "paypal":
        paymentData = await createPaypalPayment({ amount, currency, productId, billingType, userId, charge });
        break;

      case "razorpay":
        paymentData = await createRazorpayPayment({ amount, currency, productId, billingType, userId, charge });
        break;

      case "braintree":
        paymentData = await createBraintreePayment({ amount, currency, productId, billingType, userId, charge });
        break;

      case "payhere":
        paymentData = await createPayHerePayment({ amount, currency, productId, billingType, userId, charge });
        break;

      default:
        return res.status(200).json({ success: false, message: "Invalid payment gateway" });
    }

    res.json({ success: true, ...paymentData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Payment creation error" });
  }
};

// ================================
// Capture endpoint for Braintree
// ================================
module.exports.captureBraintree = async (req, res) => {
  try {
    const { paymentId, nonce, amount } = req.body;
    if (!paymentId || !nonce || !amount) {
      return res.status(200).json({ success: false, message: "Missing fields" });
    }

    const result = await captureBraintreePayment({ paymentId, nonce, amount });
    res.json({ success: result.success, result });
  } catch (err) {
    console.error("Braintree capture error:", err);
    res.status(500).json({ success: false, message: "Braintree capture error" });
  }
};

// ==========================================
// Resend code 
// ==========================================
module.exports.resendcode = async (req, res) => {
  try {
    const { email } = req.body;


    if (!email) {
      return res.status(200).json({
        success: false,
        message: "Email is required.",
        status: "0"
      });
    }

    const user = await User.findOne({ email });


    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found.",
        status: "0"
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: false,
        message: "Email already verified.",
        status: "0"
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes


    // Save OTP and expiry
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    const contact = await Contact.findOne({}, { logo: 1, favicon: 1 }).lean();

    const emailVars = {
      firstName: user.firstName,
      site_name: "GrowLead",
      site_logo: `${process.env.BASE_URL}${contact.logo}`,
      otp
    };

    //  Send via template
    await sendTemplateEmail("resend_otp", email, emailVars);

    return res.json({
      success: true,
      message: "OTP resent to your email.",
      status: "1",
      userId: user._id,
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
      status: "0"
    });
  }
};

// ==========================================
// Get Hero Section 
// ==========================================
module.exports.getHeroSection = async (req, res) => {
  try {
    const heroSection = await Herosection.find().sort({ createdAt: -1 }).limit(1);

    if (heroSection.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const data = {
      title: heroSection[0].title || "",
      description: heroSection[0].description || "",
      backgroundImg: heroSection[0].backgroundImg || "",
      mainImg: heroSection[0].mainImg || ""
    };

    res.json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error("Hero Section API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ==========================================
// Get login Section 
// ==========================================
module.exports.getLoginSectionJson = async (req, res) => {
  try {
    // Latest record
    const row = await Logonsection.findOne().sort({ createdAt: -1 });

    if (!row) {
      return res.json({}); // no record found, empty object
    }

    const data = {
      _id: row._id,
      title: row.title || "",
      description: row.description || "",
      image: row.image || "",
      createdAt: row.createdAt
    };

    res.json(data); // single object

  } catch (err) {
    console.error(err);
    res.json({}); // Return empty object on error
  }
};

// ==========================================
// Get All PaymentGateway
// ===========================================
module.exports.getAllGateways = async (req, res) => {
  try {
    const contact = await Contact.findOne({});

    const currencySymbol = contact?.currencySymbol || "$";
    const currency = contact?.currency || "USD";
    const gateways = await PaymentGateway.find({}, {
      name: 1,
      fixedCharge: 1,
      iconName: 1
    });

    const data = gateways.map(gw => ({
      ...gw.toObject(),
      currencySymbol,
      currency
    }));

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, data: [] });
  }
};

// ==========================================
// Get All Seo
// ===========================================
exports.getAllSeo = async (req, res) => {
  try {
    const seo = await Seo.find({}, {
      _id: 0,
      type: 1,
      metaTitle: 1,
      metaDescription: 1,
      metaKeywords: 1
    }).lean();

    res.json({
      success: true,
      data: seo
    });

  } catch (err) {
    console.error("SEO API Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
