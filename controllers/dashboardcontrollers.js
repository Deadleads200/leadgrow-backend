const Brand = require('../models/Brand');
const PricingPlan = require('../models/PricingPlan');
const Faq = require('../models/Faq');
const Review = require('../models/Review');
const Blog = require('../models/Blog');
const Contact = require('../models/Contact');
const Category = require('../models/Category');
const Country = require('../models/Countrie');
const State = require('../models/States');
const User = require('../models/User');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/Ticket');
const UserSubscription = require("../models/UserSubscription");
const DataRequest = require('../models/DataRequest');
const ExcelJS = require("exceljs");
const LeadDetail = require('../models/LeadDetail');
const LoginHistory = require('../models/LoginHistory');
const Notification = require('../models/Notification');
const Admin = require('../models/AdminTable')
const AdminPasswordResetToken = require('../models/AdminPasswordResetToken')
const UserContact = require('../models/Usercontact')
const Newsletter = require('../models/NewsLetter');
const Herosection = require('../models/Herosection');
const Logonsection = require('../models/Loginsection')
const Growing = require('../models/Growingsection');
const GrowWorking = require('../models/GrowWorking');
const GrowTool = require('../models/GrowTool');
const PaymentGateway = require('../models/PaymentGateway');
const PageSection = require('../models/PageSection');
const Seo = require('../models/Seo');
const EmailTemplate = require("../models/EmailTemplate");
const LeadSetting = require("../models/LeadSetting");
const { normalizeHtml } = require("../helpers/Htmlnormalize")

//helper
const getTransporter = require('../helpers/emailHelper');
const sendResetLink = require('../helpers/sendresetlink');
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");



//==========================================dashboard start==================================//



module.exports.dashboard = async (req, res) => {
  try {
    const admin = await Admin.find();

    // -------------------------
    // TODAY DATE RANGE
    // -------------------------
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // -------------------------
    // USER STATS
    // -------------------------
    const [
      Usercount,
      activeUsers,
      bannedusers,
      emailVerifiedUsers,
      todayNewUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: true, emailVerified: true }),
      User.countDocuments({ status: false }),
      User.countDocuments({ emailVerified: false }),
      User.countDocuments({
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      })
    ]);

    // -------------------------
    // PAYMENT COUNTS
    // -------------------------
    const contact = await Contact.findOne({});
    const currencySymbol = contact?.currencySymbol;

    const [
      todayPendingPaymentCountRaw,
      todaySuccessPaymentCount,
      todayFailedPaymentCountRaw
    ] = await Promise.all([
      Payment.countDocuments({ status: "open" }),
      Payment.countDocuments({ status: "success" }),
      Payment.countDocuments({ status: "failed" })
    ]);

    const todayPendingPaymentCount =
      currencySymbol + "" + todayPendingPaymentCountRaw;

    const todayFailedPaymentCount =
      currencySymbol + "" + todayFailedPaymentCountRaw;


    // -------------------------
    // PAYMENT TOTAL AMOUNTS 
    // -------------------------
    const paymentSum = async (status) => {
      const result = await Payment.aggregate([
        {
          $match: {
            status
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totals.totalAmount" }
          }
        }
      ]);

      return result.length ? result[0].totalAmount : 0;
    };
    const [
      pendingSum,
      successSum,
      failedSum
    ] = await Promise.all([
      paymentSum("open"),
      paymentSum("success"),
      paymentSum("failed")
    ]);

    const todayPendingPaymentAmount = Number(pendingSum.toFixed(2));

    const todaySuccessPaymentAmount =
      currencySymbol + "" + Number(successSum.toFixed(2));

    const todayFailedPaymentAmount = Number(failedSum.toFixed(2));

    // -------------------------
    // TICKETS // TodayPlans
    // -------------------------
    const [
      todayPendingTickets,
      todayCloseTickets,
      todayPlans
    ] = await Promise.all([
      SupportTicket.countDocuments({ status: "open" }),
      SupportTicket.countDocuments({ status: "closed" }),
      PricingPlan.countDocuments()
    ]);

    // -------------------------
    // 1. DETERMINE DATE RANGE BASED ON FILTER
    // -------------------------
    const filter = req.query.filter || "yearly";
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate, endDate;
    let chartTitle = `${currentYear} Yearly Payments`;


    switch (filter) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "yesterday":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "week":
        // Start of current week (Sunday)
        startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "lastMonth":
        // First day of last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // Last day of last month
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case "custom":
        if (req.query.start && req.query.end) {
          startDate = new Date(req.query.start);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(req.query.end);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Default to yearly if dates are missing
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        }
        break;

      default: // YEARLY (Default)
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        break;
    }

    // -------------------------
    // 2. FETCH YEARLY SALES DATA (Filtered by Date)
    // -------------------------
    const yearlySalesRaw = await Payment.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          total: { $sum: "$totals.totalAmount" }
        }
      }
    ]);

    // Initialize 12 months with 0
    const yearlySales = Array(12).fill(0);
    yearlySalesRaw.forEach(item => {
      yearlySales[item._id.month - 1] = Number(item.total.toFixed(2));
    });

    if (req.xhr || req.headers['x-requested-with'] === 'xmlhttprequest') {
      return res.json({
        success: true,
        yearlySales, // Updated Bar Chart Data
        chartTitle,

      });
    }

    // =========================
    // TOP 5 CATEGORIES BY DATA REQUEST
    // =========================
    // =========================
    // HEAVY DASHBOARD AGGREGATIONS
    // =========================

    // OPTIMIZED: all heavy aggregates run in parallel
    const [
      topCategories,
      topCountriesPerCategory,
      topPlans,
      osLoginsRaw
    ] = await Promise.all([

      // =========================
      // TOP 5 CATEGORIES BY DATA REQUEST
      // =========================
      DataRequest.aggregate([
        {
          $group: {
            _id: "$categoryId",
            totalRequests: { $sum: 1 }
          }
        },
        { $sort: { totalRequests: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" },
        {
          $project: {
            categoryId: "$_id",
            categoryName: "$category.title",
            totalRequests: 1
          }
        }
      ]),

      // =========================
      // TOP 5 COUNTRIES (CASE-INSENSITIVE)
      // =========================
      User.aggregate([
        {
          $match: {
            country: { $exists: true, $ne: "", $ne: null }
          }
        },
        {
          $addFields: {
            countryNormalized: {
              $toLower: { $trim: { input: "$country" } }
            }
          }
        },
        {
          $group: {
            _id: "$countryNormalized",
            totalRequests: { $sum: 1 }
          }
        },
        { $sort: { totalRequests: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "countries",
            let: { countryNorm: "$_id" },
            pipeline: [
              {
                $addFields: {
                  nameNormalized: {
                    $toLower: { $trim: { input: "$name" } }
                  }
                }
              },
              {
                $match: {
                  $expr: { $eq: ["$nameNormalized", "$$countryNorm"] }
                }
              }
            ],
            as: "countryData"
          }
        },
        {
          $unwind: {
            path: "$countryData",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 0,
            countryName: { $ifNull: ["$countryData.name", "$_id"] },
            categoryName: { $literal: "Users" },
            totalRequests: 1
          }
        }
      ]),

      // =========================
      // TOP USED PLANS
      // =========================
      UserSubscription.aggregate([
        {
          $group: {
            _id: "$planId",
            totalUsers: { $sum: 1 }
          }
        },
        { $sort: { totalUsers: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "pricingplans",
            localField: "_id",
            foreignField: "_id",
            as: "plan"
          }
        },
        { $unwind: "$plan" },
        {
          $project: {
            _id: 0,
            planName: "$plan.name",
            totalUsers: 1
          }
        }
      ]),

      // =========================
      // LOGIN HISTORY OS STATS
      // =========================
      LoginHistory.aggregate([
        {
          $group: {
            _id: "$os",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])

    ]);

    // Prepare arrays for chart
    const osLabels = osLoginsRaw.map(l => l._id || "Unknown");
    const osSeries = osLoginsRaw.map(l => l.count);


    res.render("Dashboard", {
      admin,

      // user stats
      Usercount,
      activeUsers,
      bannedusers,
      emailVerifiedUsers,
      todayNewUsers,

      // payment stats
      todayPendingPaymentCount,
      todayPendingPaymentAmount,

      todaySuccessPaymentCount,
      todaySuccessPaymentAmount,

      todayFailedPaymentCount,
      todayFailedPaymentAmount,


      // tickets & plans
      todayPendingTickets,
      todayCloseTickets,
      todayPlans,
      osChartData: { labels: osLabels, series: osSeries },


      //  NEW (FOR CHART)
      currentYear,
      yearlySales,
      //category
      topCategories,
      topCountriesPerCategory,
      topPlans,

      // Filter Params (to keep selected state in UI)
      filter: "yearly",
      filterStart: req.query.start || "",
      filterEnd: req.query.end || ""
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


//==========================================dashboard end==================================//

module.exports.getstate = async (req, res) => {
  try {
    const admin = await Admin.find();

    res.render('States', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};




// Manage Users
module.exports.Activeusers = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Activeusers', {
      admin
    })
  } catch (error) {
    console.log(error);

  }


};
module.exports.Bannedusers = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Bannedusers', {
      admin
    })
  } catch (error) {
    console.log(error);

  }


};
module.exports.Allusers = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Allusers', {
      admin
    })
  } catch (error) {
    console.log(error);
  }

};


module.exports.Pendingpayment = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Pendingpayment', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};

module.exports.Successfulpayment = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Successfulpayment', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};
module.exports.Rejectedpayment = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Rejectedpayment', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};
module.exports.Paymenthistory = async (req, res) => {
  try {
    const admin = await Admin.find();
    const contact = await Contact.findOne({});
    const currencySymbol = contact?.currencySymbol;
    const currency = contact?.currency;
    // All-time totals
    const paymentSum = async (status) => {
      const result = await Payment.aggregate([
        { $match: { status } },
        { $group: { _id: null, totalAmount: { $sum: "$totals.totalAmount" } } }
      ]);
      return result.length ? result[0].totalAmount : 0;
    };

    // Individual totals
    const success = await paymentSum("success");
    const pending = await paymentSum("open");
    const failed = await paymentSum("failed");
    const initiated = await paymentSum("initiated");

    // GRAND TOTAL = sum of all
    const grandTotal = success + pending + failed + initiated;

    const totals = {
      success,
      pending,
      failed,
      initiated,
      grandTotal,

    };

    res.render('Paymenthistory', {
      admin,
      totals,
      currencySymbol,
      currency
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};




module.exports.Pendingtickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Pendingtickets', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};
module.exports.Closedtickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Closedtickets', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};
module.exports.Answeredtickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Answeredtickets', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};
module.exports.Alltickets = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Alltickets', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};
module.exports.ticketdetails = async (req, res) => {
  try {
    const ticketId = req.params.id;

    // Ticket fetch + populate user + messages.sender
    const ticket = await SupportTicket.findById(ticketId); // बस इतना ही

    const admin = await Admin.find();

    if (!ticket) {
      return res.status(404).send("Ticket not found");
    }

    res.render("ticketdetails", {
      ticket, admin
    });

  } catch (error) {
    console.log("ticketdetails error:", error);
    return res.status(500).send("Server error");
  }
};


//====================
// Subscriptionhistory
//====================
module.exports.Subscriptionhistory = async (req, res) => {
  try {
    const admin = await Admin.find();

    // Total subscriptions
    const totalSubscriptions = await UserSubscription.countDocuments();

    // Active subscriptions
    const activeSubscriptions = await UserSubscription.countDocuments({
      status: "active"
    });

    // Monthly subscriptions
    const monthlySubscriptions = await UserSubscription.countDocuments({
      billingType: "monthly"
    });

    // Yearly subscriptions
    const yearlySubscriptions = await UserSubscription.countDocuments({
      billingType: "yearly"
    });

    // Top used plans
    const topPlans = await UserSubscription.aggregate([
      {
        $group: {
          _id: "$planId",
          totalUsed: { $sum: 1 }
        }
      },
      { $sort: { totalUsed: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "pricingplans",          // plans collection name
          localField: "_id",
          foreignField: "_id",
          as: "planDetails"
        }
      },
      {
        $unwind: "$planDetails"
      },
      {
        $project: {
          _id: 0,
          planId: "$_id",
          planName: "$planDetails.name",
          totalUsed: 1
        }
      }
    ]);

    res.render('Subscriptionhistory', {
      admin,
      totalSubscriptions,
      activeSubscriptions,
      monthlySubscriptions,
      yearlySubscriptions,
      topPlans
    })
  } catch (error) {
    console.log(error);

  }

};
//====================
// Leadhistory
//====================
module.exports.Leadhistory = async (req, res) => {
  try {
    const admin = await Admin.find();
    // ===============================
    // TOTAL LEADS (sum of NumberOfData)
    // ===============================
    const totalLeadsResult = await DataRequest.aggregate([
      {
        $group: {
          _id: null,
          totalLeads: {
            $sum: {
              $toInt: { $ifNull: ["$NumberOfData", "0"] }
            }
          }
        }
      }
    ]);

    const totalLeads = totalLeadsResult.length
      ? totalLeadsResult[0].totalLeads
      : 0;


    // ===============================
    // TOP CATEGORY (most used)
    // ===============================
    const topCategoryResult = await DataRequest.aggregate([
      {
        $group: {
          _id: "$categoryId",
          count: {
            $sum: {
              $toInt: { $ifNull: ["$NumberOfData", "0"] }
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryName: "$category.title",
          count: 1
        }
      }
    ]);


    const topCategory = topCategoryResult.length
      ? topCategoryResult[0].categoryName
      : "N/A";


    res.render('Leadhistory', {
      admin,
      totalLeads,
      topCategory
    })
  } catch (error) {
    console.log(error);

  }

};
//====================
// Loginhistory
//====================
module.exports.Loginhistory = async (req, res) => {
  try {
    const admin = await Admin.find();
    const totalUsersResult = await LoginHistory.aggregate([
      {
        $group: {
          _id: "$userId"
        }
      },
      {
        $count: "totalUsers"
      }
    ]);
    const osBreakdownResult = await LoginHistory.aggregate([
      {
        $group: {
          _id: "$os",
          count: { $sum: 1 }
        }
      }
    ]);

    // Prepare object with default 0
    const osCounts = {
      Android: 0,
      Windows: 0,
      Other: 0
    };

    osBreakdownResult.forEach(item => {
      const os = item._id?.toLowerCase() || "other";
      if (os.includes("android")) osCounts.Android = item.count;
      else if (os.includes("windows")) osCounts.Windows = item.count;
      else osCounts.Other += item.count;
    });

    const totalUsers = totalUsersResult.length ? totalUsersResult[0].totalUsers : 0;
    res.render('Loginhistory', {
      admin,
      totalUsers, osCounts
    })
  } catch (error) {
    console.log(error);

  }

};

module.exports.Notificationhistory = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Notificationhistory', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};


module.exports.getnotification = async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false })
      .sort({ createdAt: -1 })

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.json(err);
  }

};


module.exports.notificationread = async (req, res) => {
  try {
    const id = req.params.id;

    await Notification.findByIdAndUpdate(id, { isRead: true });

    res.redirect(`/notificationhistory`);
  } catch (err) {
    res.redirect("/notificationhistory");
  }

};

//========================================== Manage Frontend==========================================//


// ==========================================
// Renader Brand
// ==========================================
module.exports.addbrand = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Addbrand', {
      admin
    })
  } catch (error) {
    console.log(error);

  }

};

// ==========================================
// Get Json Data Brand
// ==========================================
module.exports.getBrandJson = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });

    const data = brands.map((b) => ({
      _id: b._id,
      image: b.image ? b.image : ""
    }));

    res.json({ data });
  } catch (err) {
    res.json({ data: [] });
  }
};

// ==========================================
// Add + Edit Brand
// ==========================================
module.exports.saveBrand = async (req, res) => {
  try {
    const { id } = req.body;
    let fileName = null;

    if (req.file) {
      fileName = "/uploads/brand/" + req.file.filename;
    }

    // EDIT MODE
    if (id) {
      const brand = await Brand.findById(id);
      if (!brand) return res.json({ success: false, message: "Brand not found!" });

      // Delete old image only if new uploaded
      if (fileName && brand.image) {
        const oldPath = path.join(__dirname, "..", brand.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Update only if new image uploaded
      brand.image = fileName ? fileName : brand.image;

      await brand.save();
      return res.json({ success: true, message: "Brand Updated Successfully" });
    }

    // ADD MODE
    if (!fileName) {
      return res.json({ success: false, message: "Brand image is required!" });
    }

    const newBrand = new Brand({ image: fileName });
    await newBrand.save();
    return res.json({ success: true, message: "Brand Added Successfully" });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};



// ==========================================
// Delete Brand
// ==========================================
module.exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) return res.json({ success: false, message: "Brand not found!" });

    // delete image
    if (brand.image) {
      const imagePath = path.join(__dirname, "..", brand.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Brand.findByIdAndDelete(id);

    res.json({ success: true, message: "Brand Deleted Successfully" });

  } catch (err) {
    res.json({ success: false, message: "Delete failed!" });
  }
};



//==========================================Pricing plan ==========================================//

module.exports.getpricingplan = async (req, res) => {
  try {
    const plans = await PricingPlan.find().sort({ createdAt: -1 });
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "subscriptions" }).lean();
    res.render('Pricingplan', {
      plans, admin, section
    })
  } catch (error) {
    res.send(err.message);
  }


};
// ==========================================
// Add + Edit  Form Pricing Plan  
// ==========================================
module.exports.Addpricingplan = async (req, res) => {
  try {

    const id = req.params.id || null;
    const admin = await Admin.find();

    let plan = null;
    if (id) plan = await PricingPlan.findById(id);

    res.render("Addpricingplan", {
      plan,
      admin
    });

  } catch (err) {
    res.send(err.message);
  }

};

module.exports.Addpricingplanpage = async (req, res) => {
  try {

    const admin = await Admin.find();

    let plan = null;
    res.render("Addpricingplan", {
      plan,
      admin
    });

  } catch (err) {
    res.send(err.message);
  }

};

// ==========================================
// Add + Edit Pricing Plan  
// ==========================================
module.exports.savePricingPlan = async (req, res) => {
  try {
    const {
      id,
      name,
      planType,
      shortDescription,
      monthlyLeadLimit,
      yearlyLeadLimit,
      monthlyPrice,
      yearlyPrice,
      expiredDaysMonthly,
      expiredDaysYearly,
      monthlyCredit,
      yearlyCredit,
      monthlyDescription,
      yearlyDescription,
      monthlyFeatures,
      yearlyFeatures,
      isPremium
    } = req.body;


    const existingPlan = await PricingPlan.findOne({ planType, _id: { $ne: id } });

    if (
      existingPlan &&
      (!id || existingPlan._id.toString() !== id) &&
      !req.body.forceSave
    ) {
      return res.json({
        success: false,
        warning: `A plan with type "${planType}" already exists. Do you want to continue?`
      });
    }


    // FIX → Convert checkbox "on" to Boolean
    const isPremiumValue = isPremium === "on" ? true : false;

    // If ID exists → EDIT
    if (id) {
      const plan = await PricingPlan.findById(id);
      if (!plan) {
        return res.json({ success: false, message: "Plan not found!" });
      }

      plan.name = name;
      plan.planType = planType;
      plan.shortDescription = shortDescription;
      plan.monthlyLeadLimit = monthlyLeadLimit,
        plan.yearlyLeadLimit = yearlyLeadLimit,
        plan.monthlyPrice = monthlyPrice;
      plan.yearlyPrice = yearlyPrice;
      plan.expiredDaysMonthly = expiredDaysMonthly;
      plan.expiredDaysYearly = expiredDaysYearly;
      plan.monthlyCredit = monthlyCredit;
      plan.yearlyCredit = yearlyCredit;
      plan.monthlyDescription = monthlyDescription;
      plan.yearlyDescription = yearlyDescription;
      plan.monthlyFeatures = monthlyFeatures;
      plan.yearlyFeatures = yearlyFeatures;
      plan.isPremium = isPremiumValue; // FIXED

      await plan.save();

      return res.json({
        success: true,
        message: "Pricing Plan Updated Successfully"
      });
    }

    // Else → ADD NEW PLAN
    const newPlan = new PricingPlan({
      name,
      planType,
      shortDescription,
      monthlyLeadLimit,
      yearlyLeadLimit,
      monthlyPrice,
      yearlyPrice,
      expiredDaysMonthly,
      expiredDaysYearly,
      monthlyCredit,
      yearlyCredit,
      monthlyDescription,
      yearlyDescription,
      monthlyFeatures,
      yearlyFeatures,
      isPremium: isPremiumValue // FIXED
    });

    await newPlan.save();

    return res.json({
      success: true,
      message: "Pricing Plan Added Successfully",
    });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// ==========================================
// Get Pricing Json
// ==========================================
exports.getPricingJSON = async (req, res) => {
  const all = await PricingPlan.find().sort({ createdAt: -1, _id: -1 });
  const contactSettings = await Contact.findOne({});
  const currencySymbol = contactSettings?.currencySymbol;
  const currencyCode = contactSettings?.currency;

  const planOrder = {
    basic: 1,
    standard: 2,
    Premium: 3,

  };

  // Sort plans by planType order
  all.sort((a, b) => {
    return (planOrder[a.planType]) - (planOrder[b.planType]);
  });
  const data = all.map(p => ({
    ...p.toObject(),
    currencySymbol,
    currencyCode
  }));
  res.json({ data });
};

// ==========================================
// Toggle Pricing  
// ==========================================
exports.togglePricing = async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);
    if (!plan) return res.json({ success: false, message: "Plan not found" });

    plan.status = plan.status === true ? false : true;
    await plan.save();

    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ==========================================
// Delete Pricing Plan  
// ==========================================
module.exports.deletepricing = async (req, res) => {
  try {
    await PricingPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Pricing Plan Deleted Successfully" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== FAQ ==========================================//
module.exports.getfaqpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "faq" }).lean();

    res.render('Faq', { admin, section })
  } catch (error) {
    console.log(error);

  }
};

// ==========================
// LOAD JSON (Datatable)
// ==========================
exports.getFAQJson = async (req, res) => {
  const data = await Faq.find().sort({ createdAt: -1 });
  res.json({ data });
};
// ==========================
// SAVE FAQ  (ADD / UPDATE)
// ==========================
exports.saveFAQ = async (req, res) => {
  try {
    const { id, question, answer } = req.body;

    if (id) {
      await Faq.findByIdAndUpdate(id, { question, answer });
      return res.json({ success: true, message: "FAQ Updated Successfully" });
    }

    await Faq.create({ question, answer });
    return res.json({ success: true, message: "FAQ Added Successfully" });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ==========================
// DELETE FAQ
// ==========================
exports.deleteFAQ = async (req, res) => {
  try {
    await Faq.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "FAQ Deleted Successfully" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== Testimonials ==========================================//
module.exports.getReviewPage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "testimonials" }).lean();
    res.render('Review', { admin, section });
  } catch (error) {
    console.log(error);

  }
};

// ==========================
// Review Json
// ==========================
module.exports.getReviewsJson = async (req, res) => {
  try {
    const data = await Review.find().sort({ createdAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ data: [] });
  }
};



// ==========================
// Add + Edit Review
// ==========================
module.exports.saveReview = async (req, res) => {
  try {
    const {
      id,
      name,
      username,
      review: reviewText,
      rating
    } = req.body;


    let filePath = null;
    if (req.file) filePath = '/uploads/review/' + req.file.filename;

    if (id) {
      // Edit
      const doc = await Review.findById(id);
      if (!doc) return res.json({ success: false, message: 'Review not found' });

      // delete old image if new uploaded
      if (filePath && doc.image) {
        const oldFile = path.join(__dirname, '..', doc.image);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      doc.name = name;
      doc.username = username
      doc.review = reviewText;
      doc.rating = Number(rating) || 0;
      doc.image = filePath ? filePath : doc.image;

      await doc.save();
      return res.json({ success: true, message: 'Review updated successfully', data: doc });
    }

    // // Add new
    // if (!filePath) {
    //   return res.json({ success: false, message: 'Please upload an image' });
    // }

    const newReview = await Review.create({
      image: filePath || '',
      name,
      username,
      review: reviewText,
      rating: Number(rating) || 0
    });

    return res.json({ success: true, message: 'Review added successfully', data: newReview });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ==========================
// DELETE Review
// ==========================
module.exports.deleteReview = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Review.findById(id);
    if (!doc) return res.json({ success: false, message: 'Not found' });

    // delete image file
    if (doc.image) {
      const file = path.join(__dirname, '..', doc.image);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }

    await Review.findByIdAndDelete(id);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};


//========================================== Blogs ==========================================//

module.exports.getblogpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "blogs" }).lean();

    res.render('Addblogs', { admin, section });
  } catch (error) {
    console.log(error);

  }
};
// ================================
//  GET JSON FOR DATATABLE
// ================================
module.exports.getblogjson = async (req, res) => {
  const blogs = await Blog.find().sort({ _id: -1 });
  res.json({ data: blogs });
};

// ================================
//  CREATE + UPDATE BLOG
// ================================
module.exports.saveblog = async (req, res) => {
  try {
    const { id, title, shortDescription, description, isRecent } = req.body;
    let image = "";
    let thumbnail = "";

    // convert isRecent to real boolean
    const isRecentBool =
      isRecent === "true" ||
      isRecent === true ||
      isRecent === "1" ||
      isRecent === 1;

    if (req.file) {
      image = "/uploads/blogs/main/" + req.file.filename;
      thumbnail = req.thumbnailPath || ""; // from middleware
    }

    // ======== UPDATE ========
    if (id) {
      const oldBlog = await Blog.findById(id);

      // Remove old image if new uploaded
      if (req.file && oldBlog.image) {
        const oldPath = path.join(__dirname, "..", oldBlog.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        // Also delete old thumbnail
        if (oldBlog.thumbnail) {
          const oldThumbPath = path.join(__dirname, "..", oldBlog.thumbnail);
          if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
        }
      }

      await Blog.findByIdAndUpdate(id, {
        title,
        shortDescription,
        description,
        isRecent: isRecentBool,   // FIX ADDED
        image: req.file ? image : oldBlog.image,
        thumbnail: req.file ? thumbnail : oldBlog.thumbnail
      });

      return res.json({
        success: true,
        message: "Blog updated successfully!"
      });
    }

    if (!req.file) {
      return res.json({ success: false, message: "Blog image is required!" });
    }



    // ======== CREATE ========
    await Blog.create({
      title,
      shortDescription,
      description,
      image,
      thumbnail,
      isRecent: isRecentBool      // FIX ADDED
    });

    return res.json({
      success: true,
      message: "Blog created successfully!"
    });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};


// ================================
//  DELETE BLOG
// ================================
module.exports.deleteblog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (blog.image) {
      const imgPath = path.join(__dirname, "..", blog.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (blog.thumbnail) {
        const thumbPath = path.join(__dirname, "..", blog.thumbnail);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Blog deleted successfully!"
    });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//========================================== Contact US ==========================================//

module.exports.getcontactpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Contactpage', { admin })
  } catch (error) {
    console.log(error);

  }
}

// ================================
//  GEt Contact Json
// ================================
module.exports.getContactjson = async (req, res) => {
  try {
    const data = await Contact.findOne();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ================================
//  Add + Update Contact
// ================================

module.exports.saveContact = async (req, res) => {
  try {
    const payload = { ...req.body };
    const existing = await Contact.findOne();

    // --- LOGO ---
    if (req.files?.logo?.length > 0) {
      payload.logo = `/uploads/contact/${req.files.logo[0].filename}`;

      if (existing?.logo) {
        const oldLogo = path.join(process.cwd(), existing.logo);
        if (fs.existsSync(oldLogo)) fs.unlinkSync(oldLogo);
      }
    } else if (existing?.logo) {
      payload.logo = existing.logo;
    }

    // --- FAVICON ---
    if (req.files?.favicon?.length > 0) {
      payload.favicon = `/uploads/contact/${req.files.favicon[0].filename}`;

      if (existing?.favicon) {
        const oldFavicon = path.join(process.cwd(), existing.favicon);
        if (fs.existsSync(oldFavicon)) fs.unlinkSync(oldFavicon);
      }
    } else if (existing?.favicon) {
      payload.favicon = existing.favicon;
    }

    // --- Update or Create ---
    if (existing) {
      await Contact.updateOne({ _id: existing._id }, payload);
      return res.json({ success: true, msg: "Contact updated" });
    } else {
      await Contact.create(payload);
      return res.json({ success: true, msg: "Contact created" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

//========================================== Categories ==========================================//

module.exports.getcategory = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Category', { admin })
  } catch (error) {
    console.log(error);

  }

}
// ================================
// Categories Json
// ================================
module.exports.getCategoriesJSON = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1, _id: -1 });
    res.json({ data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ================================
// Add / Update category
// ================================
module.exports.saveCategory = async (req, res) => {
  try {
    const { id, title, status } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "Title is required" });

    if (id) {
      // Update
      const category = await Category.findByIdAndUpdate(
        id,
        { title, status: status === "true" },
        { new: true }
      );
      if (!category) return res.json({ success: false, message: "Category not found" });
      return res.json({ success: true, message: "Category updated successfully" });
    }

    // Add new
    const category = await Category.create({ title, status: status === "true" });
    console.log("Category created:", category);
    res.json({ success: true, message: "Category added successfully" });
  } catch (err) {
    console.error("saveCategory error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ================================
//  Delete Category
// ================================
module.exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ================================
// Toggle Status
// ================================
module.exports.toggleStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.json({ success: false, message: "Category not found" });

    category.status = !category.status;
    await category.save();
    res.json({ success: true, message: `Category ${category.status ? "enabled" : "disabled"} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



//========================================== Countries ==========================================//

module.exports.getcountries = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Countries', { admin })
  } catch (error) {
    console.log(error);

  }

}

// ================================
// Add or Update Country
// ================================
module.exports.saveCountry = async (req, res) => {
  try {
    const { id, name, status } = req.body;

    if (!name || name.trim() === "") {
      return res.json({ success: false, message: "Country name is required" });
    }

    const statusValue = status === "true"; // convert string to boolean
    const trimmedName = name.trim();

    // --- Check for duplicate country (case-insensitive) ---
    const existingCountry = await Country.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") } // "i" = case-insensitive
    });

    if (existingCountry) {
      // Agar ID diya hai aur update kar rahe hain
      if (!id || existingCountry._id.toString() !== id) {
        return res.json({ success: false, message: "Country already exists" });
      }
    }

    if (id) {
      const country = await Country.findByIdAndUpdate(
        id,
        { name: name.trim(), status: statusValue },
        { new: true }
      );
      if (!country) return res.json({ success: false, message: "Country not found" });

      return res.json({ success: true, message: "Country updated successfully" });
    }

    await Country.create({ name: name.trim(), status: statusValue });
    res.json({ success: true, message: "Country added successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Delete Country 
// ================================
module.exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findByIdAndDelete(id);
    if (!country) return res.json({ success: false, message: "Country not found" });

    res.json({ success: true, message: "Country deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ================================
// Toggle Status
// ================================
module.exports.CounteytoggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findById(id);
    if (!country) return res.json({ success: false, message: "Country not found" });

    country.status = !country.status;
    await country.save();

    res.json({ success: true, message: `Country ${country.status ? "Enabled" : "Disabled"} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Get Countries JSON 
// ================================
module.exports.getCountriesJSON = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";


    const searchLower = search.toLowerCase();

    let statusQuery = [];
    if (searchLower.includes("en")) statusQuery.push({ status: true });
    if (searchLower.includes("dis")) statusQuery.push({ status: false });

    const query = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          ...statusQuery
        ],
      }
      : {};


    const totalRecords = await Country.countDocuments();
    const filteredRecords = await Country.countDocuments(query);

    const data = await Country.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    res.json({
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//========================================== States ==========================================//

// ================================
// Get States JSON 
// ================================
module.exports.getStatesJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const searchLower = search.toLowerCase();

    let statusQuery = [];
    if (searchLower.includes("en")) statusQuery.push({ status: true });
    if (searchLower.includes("dis")) statusQuery.push({ status: false });

    const query = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          ...statusQuery
        ],
      }
      : {};


    const total = await State.countDocuments();
    const filtered = await State.countDocuments(query);

    const states = await State.find(query)
      .populate("country", "name")
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = states.map(s => ({
      _id: s._id,
      name: s.name,
      status: s.status,
      country: s.country?.name || "N/A",
      countryId: s.country?._id || null   // add this line

    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Add/Update State
// ================================
module.exports.saveState = async (req, res) => {
  try {
    const { id, name, country, status } = req.body;
    if (!name || !country)
      return res.json({ success: false, message: "All fields are required" });

    if (id) {
      const state = await State.findByIdAndUpdate(
        id,
        { name, country, status: status === "true" },
        { new: true }
      );
      if (!state) return res.json({ success: false, message: "State not found" });
      return res.json({ success: true, message: "State updated successfully" });
    }

    await State.create({ name, country, status: status === "true" });
    res.json({ success: true, message: "State added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Delete State
// ================================
module.exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findByIdAndDelete(id);
    if (!state) return res.json({ success: false, message: "State not found" });
    res.json({ success: true, message: "State deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Toggle Status ---
module.exports.togglestatesStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findById(id);
    if (!state) return res.json({ success: false, message: "State not found" });
    state.status = !state.status;
    await state.save();
    res.json({ success: true, message: `State ${state.status ? "enabled" : "disabled"} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Get Countries JSON 
// ================================
module.exports.getCountries = async (req, res) => {
  try {
    const countries = await Country.find({ status: true }).sort({ name: 1 });
    res.json({ success: true, data: countries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//========================================== Active Users ==========================================//

// ================================
// Get Users JSON for DataTable 
// ================================
module.exports.getactiveUsersJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // Base query: only active users
    let query = {
      status: true,
      emailVerified: true
    };
    // Apply search if present
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { zip: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments({ status: true }); // only active
    const filtered = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = users.map(u => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      mobile: u.mobile,
      address: u.address,
      city: u.city,
      state: u.state,
      zip: u.zip,
      country: u.country,
      ip: u.ip,
      status: u.status
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// deleteUser
// ================================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }


    if (user.profileImage) {
      const imagePath = path.join(
        __dirname,
        "..",
        user.profileImage
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await User.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Delete User Error:", error);
    res.json({
      success: false,
      message: "Something went wrong"
    });
  }
};
// ================================
// Toggle User Status
// ================================
module.exports.toggleuserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.json({ success: false, message: "User not found" });

    user.status = !user.status;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.status ? "activated" : "deactivated"} successfully`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================================
// Toggle User Email Verification
// ================================
module.exports.toggleEmailVerification = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Flip email verification
    user.emailVerified = !user.emailVerified;

    await user.save();

    res.json({
      success: true,
      message: user.emailVerified
        ? "Email marked as verified"
        : "Email verification removed",
      emailVerified: user.emailVerified
    });

  } catch (err) {
    console.log("Email Verify Toggle Error:", err);
    res.json({ success: false, message: "Server error" });
  }
};

//========================================== Banned Users ==========================================//
// ================================
// Get All User Json
// ================================
module.exports.getbannedUsersJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // Base query: only active users
    let query = { status: false };

    // Apply search if present
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { zip: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments({ status: true }); // only active
    const filtered = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = users.map(u => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      mobile: u.mobile,
      address: u.address,
      city: u.city,
      state: u.state,
      zip: u.zip,
      country: u.country,
      ip: u.ip,
      status: u.status
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
//========================================== All Users ==========================================//
// ================================
// Get All User Json
// ================================
module.exports.getUsersJson = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";


    const searchLower = search.toLowerCase();

    // Status filter
    let statusQuery = [];
    if (searchLower.includes("ac")) statusQuery.push({ status: true });
    if (searchLower.includes("ba")) statusQuery.push({ status: false });

    const query = search
      ? {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
          { country: { $regex: search, $options: "i" } },
          { zip: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
          ...statusQuery
        ]
      }
      : {};


    const total = await User.countDocuments();
    const filtered = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = users.map(u => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      mobile: u.mobile,
      address: u.address,
      city: u.city,
      state: u.state,
      zip: u.zip,
      country: u.country,
      ip: u.ip,
      status: u.status,
      emailVerified: u.emailVerified
    }));

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//========================================== Users Details ==========================================//
// ================================
// Get User Details
// ================================
module.exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).send("User not found");

    const admin = await Admin.find();

    // Find active subscription
    const subscription = await UserSubscription.findOne({ userId: id, status: "active" })
      .populate("planId")
      .lean();

    // Safely prepare planInfo
    const planInfo = subscription
      ? {
        planName: subscription.planId?.name || "No Plan",
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        totalLeads: subscription.totalLeads ?? 0,
        usedLeads: subscription.totalLeads - subscription.remainingLeads ?? 0,
        remainingLeads: subscription.remainingLeads ?? 0,
        billingType: subscription.billingType ?? "-",
      }
      : {
        planName: "No Plan",
        totalLeads: 0,
        usedLeads: 0,
        remainingLeads: 0,
        billingType: "-",
      };

    res.render("Userdetails", { user, admin, planInfo });

  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};


//========================================== Send notification ==========================================//

module.exports.Sendnotification = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render('Sendnotification', { admin })
  } catch (error) {
    console.log(error);

  }

};
// ================================
// Get User Emils
// ================================
module.exports.fetchusersemail = async (req, res) => {
  try {
    const users = await User.find({}, "firstName lastName email");

    res.json({ success: true, users });
  } catch (err) {
    res.json({ success: false });
  }
};
// ================================
// Send Email
// ================================



module.exports.sendEmail = async (req, res) => {
  try {
    const { type, subject, message, users } = req.body;

    let emailList = [];

    if (type === "all") {
      const allUsers = await User.find({}, "email");
      emailList = allUsers.map(u => u.email);
    }

    if (type === "specific") {
      emailList = users;
    }

    if (!emailList.length) {
      return res.json({
        success: false,
        message: "No users selected."
      });
    }

    let customizedMessage = normalizeHtml(message)

    const contact = await Contact.findOne().lean();
    console.log(contact.email);

    const mailOptions = {
      from: contact.email,
      to: emailList,
      subject,
      html: customizedMessage,
    };

    const transporter = await getTransporter();
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Email sent successfully!"
    });

  } catch (err) {
    console.log("EMAIL ERROR:", err);
    res.json({
      success: false,
      message: "Email sending failed."
    });
  }
};

//========================================== Payment ==========================================//
// ================================
// Get Panding Payments
// ================================
exports.getpandingPayments = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";
    const contactSettings = await Contact.findOne({});
    const currencySymbol = contactSettings?.currencySymbol;
    const currencyCode = contactSettings?.currency;
    // Default only pending payments
    let query = { status: "open" };

    if (search) {
      query = {
        $and: [
          { status: "open" },
          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } }
            ]
          }
        ]
      };
    }

    const totalRecords = await Payment.countDocuments({ status: "open" });
    const filteredRecords = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ initiatedAt: -1 });

    const data = payments.map(p => ({
      ...p.toObject(),
      amountWithSymbol: `${currencySymbol}${p.amount}`, // e.g. $100
      currencySymbol,
      currencyCode
    }));
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });

  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};

// ================================
// Get Faild Payments
// ================================
exports.getfaildPayments = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    const contactSettings = await Contact.findOne({});
    const currencySymbol = contactSettings?.currencySymbol;
    const currencyCode = contactSettings?.currency;
    // Default only pending payments
    let query = { status: "failed" };

    if (search) {
      query = {
        $and: [
          { status: "failed" },
          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } }
            ]
          }
        ]
      };
    }

    const totalRecords = await Payment.countDocuments({ status: "failed" });
    const filteredRecords = await Payment.countDocuments(query);


    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ initiatedAt: -1 });

    const data = payments.map(p => ({
      ...p.toObject(),
      currencySymbol,
      currencyCode
    }));
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });

  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};
// ================================
// Get Success Payments 
// ================================
exports.getsuccessPayments = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";
    const contact = await Contact.findOne({});
    const currencySymbol = contact?.currencySymbol;
    const currencyCode = contact?.currency;
    // Default only pending payments
    let query = { status: "success" };

    if (search) {
      query = {
        $and: [
          { status: "success" },
          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } }
            ]
          }
        ]
      };
    }

    const totalRecords = await Payment.countDocuments({ status: "success" });
    const filteredRecords = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ initiatedAt: -1 });

    const data = payments.map(p => ({
      ...p.toObject(),
      currencySymbol,
      currencyCode
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });

  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};

// ================================
// Get Payments list
// ================================
exports.getPaymentslist = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    const contactSettings = await Contact.findOne({});
    const currencySymbol = contactSettings?.currencySymbol;
    const currencyCode = contactSettings?.currency;
    // Default only pending payments
    let query = {};

    if (search) {
      query = {
        $and: [

          {
            $or: [
              { gateway: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } }
            ]
          }
        ]
      };
    }

    const totalRecords = await Payment.countDocuments({});
    const filteredRecords = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("userId")
      .skip(start)
      .limit(length)
      .sort({ initiatedAt: -1 });

    const data = payments.map(p => ({
      ...p.toObject(),
      currencySymbol,
      currencyCode
    }));
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });

  } catch (err) {
    console.error("Payment list error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};

// ================================
// Paymen details
// ================================
const moment = require("moment");

module.exports.Paymendetails = async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("userId");
  const admin = await Admin.find();
  const user = payment?.userId || null;

  const contact = await Contact.findOne({});
  const currencySymbol = contact?.currencySymbol;
  res.render("Paymentdetails", {
    payment,
    user,
    moment,
    admin,
    currencySymbol
  });
};
// ================================
// Payment History details
// ================================
module.exports.Paymenthistorydetails = async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("userId");
  const admin = await Admin.find();
  const contact = await Contact.findOne({});
  const currencySymbol = contact?.currencySymbol;
  res.render("Paymenthistorydetails", {
    payment,
    user: payment?.userId || null,
    moment,
    admin,
    currencySymbol
  });
};




//========================================== Support Ticket  ==========================================//

// ================================
// Get Open Support Tickets
// ================================
exports.getOpenSupportTickets = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = { status: "open" };

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy"
        }
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } } // keep tickets even if user is missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({ status: "open" });

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(filteredCountPipeline);
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } },  // sort by lastReply
      { $skip: start },
      { $limit: length }
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map(t => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "-",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "-"
      }
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Support Ticket List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};




// ================================
// Get Closed Support Tickets
// ================================
exports.getClosedSupportTickets = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = { status: "closed" };

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy"
        }
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } } // keep tickets even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({ status: "closed" });

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(filteredCountPipeline);
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { lastReply: -1 } },  // sort by lastReply
      { $skip: start },
      { $limit: length }
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map(t => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "-",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "-"
      }
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Support Ticket List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};


// ================================
// Get Answered Support Tickets
// ================================
exports.getAnsweredSupportTickets = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = { status: "answered" };

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy"
        }
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } } // keep tickets even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({ status: "answered" });

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(filteredCountPipeline);
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { lastReply: -1 } },  // sort by lastReply
      { $skip: start },
      { $limit: length }
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map(t => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "-",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "-"
      }
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Support Ticket List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};


// ================================
// Get Answered Support Tickets
// ================================
exports.getSupportTicketsjson = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = {}; // no status filter, get all tickets

    // Base aggregation
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy"
        }
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } } // keep tickets even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { subject: { $regex: search, $options: "i" } },
            { priority: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { "submittedBy.firstName": { $regex: search, $options: "i" } },
            { "submittedBy.lastName": { $regex: search, $options: "i" } },
            { "submittedBy.email": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // --- Total and filtered counts ---
    const totalRecords = await SupportTicket.countDocuments({});

    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await SupportTicket.aggregate(filteredCountPipeline);
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // --- Fetch paginated data ---
    let dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length }
    ];
    let data = await SupportTicket.aggregate(dataPipeline);

    // Flatten submittedBy for DataTables
    data = data.map(t => ({
      _id: t._id,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      lastReply: t.lastReply,
      submittedBy: {
        firstName: t.submittedBy?.firstName || "-",
        lastName: t.submittedBy?.lastName || "",
        email: t.submittedBy?.email || "-"
      }
    }));

    return res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Support Ticket List Error:", err);
    return res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};



// ================================
// Close Ticket
// ================================
// routes/ticket.js (or controller)
exports.updateTicketStatus = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body; // new status from frontend

    if (!ticketId) return res.status(200).json({ success: false, message: "Ticket ID missing" });
    if (!status) return res.status(200).json({ success: false, message: "Status missing" });

    const allowedStatuses = ["open", "answered", "closed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(200).json({ success: false, message: "Invalid status" });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return res.status(200).json({ success: false, message: "Ticket not found" });

    if (!req.session?.adminId) return res.status(200).json({ success: false, message: "Unauthorized" });

    ticket.status = status;
    ticket.lastReply = new Date();
    await ticket.save();

    return res.json({ success: true, message: `Ticket status updated to "${status}" successfully!` });

  } catch (err) {
    console.log("Update Ticket Status Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




// ================================
// DELETE message from a ticket
// ================================
exports.deleteTicketMessage = async (req, res) => {
  try {
    const { ticketId, messageId } = req.params;

    console.log("Delete Ticket Message:", { ticketId, messageId });
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    const message = ticket.messages.find(msg => msg._id.toString() === messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (message.attachments && message.attachments.length > 0) {
      await Promise.all(
        message.attachments.map(async (a) => {
          try {
            const filePath = path.join(__dirname, "..", a.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.warn("Attachment not found or failed to delete:", a.url, err.message);
          }
        })
      );
    }

    ticket.messages = ticket.messages.filter(msg => msg._id.toString() !== messageId);
    await ticket.save();

    res.json({ success: true, messageId });

  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


//========================================== Support Ticket  ==========================================//qew

// ================================
// Get Subscription History
// ================================

exports.getSubscriptionHistory = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim();

    const totalRecords = await UserSubscription.countDocuments();

    const pipeline = [
      // USER JOIN
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },

      // PLAN JOIN
      {
        $lookup: {
          from: "pricingplans",
          localField: "planId",
          foreignField: "_id",
          as: "plan"
        }
      },
      {
        $unwind: {
          path: "$plan",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // =================================================
    // SEARCH 
    // =================================================
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { billingType: { $regex: search, $options: "i" } },   // billingType
            { status: { $regex: search, $options: "i" } },        // status
            { "plan.name": { $regex: search, $options: "i" } },   // plan name
            { "user.firstName": { $regex: search, $options: "i" } }, // user fname
            { "user.lastName": { $regex: search, $options: "i" } }   // user lname
          ]
        }
      });
    }

    // PAGINATION + SORT
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length },

      // FINAL SHAPE
      {
        $project: {
          plan: { $ifNull: ["$plan.name", "N/A"] },
          billingType: 1,
          status: 1,
          totalLeads: 1,
          remainingLeads: 1,
          startDate: 1,
          endDate: 1,
          createdAt: 1,
          user: {
            firstName: { $ifNull: ["$user.firstName", ""] },
            lastName: { $ifNull: ["$user.lastName", ""] },
            email: { $ifNull: ["$user.email", ""] }
          }
        }
      }
    );

    const data = await UserSubscription.aggregate(pipeline);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: search ? data.length : totalRecords,
      data
    });

  } catch (err) {
    console.error(err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};



//========================================== Lead   ==========================================//
// ================================
// Get Lead Json
// ================================
exports.getLeadJSON = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // -------------------------
    // AGGREGATION PIPELINE
    // -------------------------
    let pipeline = [];

    // Lookups
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country"
        }
      },
      { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "states",
          localField: "stateId",
          foreignField: "_id",
          as: "state"
        }
      },
      { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } }
    );

    // -------------------------
    // SEARCH FILTER
    // -------------------------
    if (search) {
      const regex = new RegExp(search, "i");

      pipeline.push({
        $match: {
          $or: [
            { NumberOfData: regex },
            { downloadType: regex },
            { "user.firstName": regex },
            { "user.lastName": regex },

            // FULL NAME SEARCH SUPPORT
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$user.firstName", " ", "$user.lastName"] },
                  regex: regex
                }
              }
            },

            { "user.email": regex },
            { "category.title": regex },
            { "country.name": regex },
            { "state.name": regex }
          ]
        }
      });
    }

    // -------------------------
    // TOTAL COUNT (before filter)
    // -------------------------
    const totalRecords = await DataRequest.countDocuments();

    // -------------------------
    // Filtered count
    // -------------------------
    const filteredData = await DataRequest.aggregate([...pipeline, { $count: "count" }]);
    const recordsFiltered = filteredData[0]?.count || 0;

    // -------------------------
    // PAGINATION + SORT
    // -------------------------
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length }
    );

    // -------------------------
    // FINAL DATA FETCH
    // -------------------------
    const finalData = await DataRequest.aggregate(pipeline);

    // -------------------------
    // FORMAT OUTPUT
    // -------------------------
    const formatted = finalData.map(d => ({
      _id: d._id,
      NumberOfData: d.NumberOfData,
      downloadType: d.downloadType,
      user: d.user ? `${d.user.firstName} ${d.user.lastName}` : "-",
      email: d.user?.email || "-",
      category: d.category?.title || "-",
      country: d.country?.name || "-",
      state: d.state?.name || "-",
      generatedFilePath: d.generatedFilePath || "-",
      createdAt: d.createdAt
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data: formatted
    });

  } catch (err) {
    console.error("Lead JSON Error:", err);

    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};





// ================================
// Get Login History Json
// ================================
exports.getLoginHistoryJSON = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = {}; // base: all records

    // Aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",           // collection name in MongoDB
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } } // keep records even if user missing
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { ip: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { browser: { $regex: search, $options: "i" } },
            { os: { $regex: search, $options: "i" } },
            { "user.firstName": { $regex: search, $options: "i" } },
            { "user.lastName": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // Total records
    const totalRecords = await LoginHistory.countDocuments();

    // Filtered records count
    const filteredCountArr = await LoginHistory.aggregate([...pipeline, { $count: "count" }]);
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // Fetch paginated data
    let data = await LoginHistory.aggregate([
      ...pipeline,
      { $sort: { loginAt: -1 } },
      { $skip: start },
      { $limit: length }
    ]);

    // Flatten user info for DataTables
    data = data.map(d => ({
      _id: d._id,
      ip: d.ip,
      location: d.location,
      browser: d.browser,
      os: d.os,
      loginAt: d.loginAt,
      user: d.user ? `${d.user.firstName} ${d.user.lastName}` : "-",
      email: d.user?.email || "-"
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Login History Error:", err);
    res.json({ draw: 0, recordsTotal: 0, recordsFiltered: 0, data: [] });
  }
};

// ================================
// Get Single Login History Json
// ================================
exports.getSingleUserLoginHistoryJSON = async (req, res) => {
  try {
    const userId = req.params.id;

    // DataTables params
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const searchValue = req.query["search[value]"]?.trim() || "";
    const orderColumnIndex = parseInt(req.query.order?.[0]?.column) || 0;
    const orderDir = req.query.order?.[0]?.dir === "asc" ? 1 : -1;
    const orderColumns = ["loginAt", "ip", "location", "browser", "os"];
    const sortField = orderColumns[orderColumnIndex] || "loginAt";

    // Validate user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.json({
        draw,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: []
      });
    }

    // Base filter: only this user
    let filter = { userId };

    // Search filter
    if (searchValue) {
      filter.$or = [
        { ip: { $regex: searchValue, $options: "i" } },
        { location: { $regex: searchValue, $options: "i" } },
        { browser: { $regex: searchValue, $options: "i" } },
        { os: { $regex: searchValue, $options: "i" } }
      ];
    }

    // Total records for this user
    const recordsTotal = await LoginHistory.countDocuments({ userId });
    const recordsFiltered = await LoginHistory.countDocuments(filter);

    // Fetch paginated & sorted data
    const history = await LoginHistory.find(filter)
      .sort({ [sortField]: orderDir })
      .skip(start)
      .limit(length)
      .lean();

    // Format for DataTables
    const data = history.map(h => ({
      loginAt: h.loginAt,
      loginAtFormatted: moment(h.loginAt).format("DD MMM YYYY, hh:mm A"),
      timeAgo: moment(h.loginAt).fromNow(),
      ip: h.ip || "-",
      location: h.location || "-",
      browser: h.browser || "-",
      os: h.os || "-"
    }));

    res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Login history JSON error:", err);
    res.status(500).json({
      draw: req.query.draw || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};



exports.SingleUserLoginHistoryPage = async (req, res) => {
  try {
    const userId = req.params.id;

    const admin = await Admin.find();

    const userExists = await User.findOne({ _id: userId }, {
      firstName: 1,
      lastName: 1,
    });
    res.render("Userlogindetails", {
      userId,
      admin,
      userExists // agar admin header ke liye use hota hai
    });
  } catch (err) {
    console.error("Login history page error:", err);
    res.status(500).send("Server error");
  }
};


// ================================
// Get Notification History
// ================================
exports.getNotificationJSON = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    const matchQuery = {};

    // Base pipeline
    const pipeline = [
      { $match: matchQuery },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }
    ];

    // Search
    if (search) {
      const regex = { $regex: search, $options: "i" };
      pipeline.push({
        $match: {
          $or: [
            { subject: regex },
            { message: regex },
            { "user.firstName": regex },
            { "user.lastName": regex },
            { "user.email": regex }
          ]
        }
      });
    }

    // Total count
    const totalRecords = await Notification.countDocuments();

    // Filtered count
    const filteredCountPipeline = [...pipeline, { $count: "count" }];
    const filteredCountArr = await Notification.aggregate(filteredCountPipeline);
    const recordsFiltered = filteredCountArr[0]?.count || 0;

    // Fetch paginated data
    const dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: length },

      {
        $project: {
          _id: 1,
          subject: 1,
          message: 1,
          createdAt: 1,

          // FIX: return as userId object
          userId: {
            firstName: { $ifNull: ["$user.firstName", ""] },
            lastName: { $ifNull: ["$user.lastName", ""] },
            email: { $ifNull: ["$user.email", "-"] }
          }
        }
      }
    ];

    const data = await Notification.aggregate(dataPipeline);

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Notification List Error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};



//========================================== login   ==========================================//
// ================================
// Get Login Page
// ================================
exports.loginpage = async (req, res) => {
  if (req.session.adminId) {
    return res.redirect("/");
  }
  const contact = await Contact.findOne({}, { logo: 1, favicon: 1 }).lean();
  res.render("Login", {
    logo: contact?.logo || "/images/logos/logo.png",
    favicon: contact?.favicon || "/images/logos/favicon(1).png"
  });
};
// ================================
// Post Signup
// ================================
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.json({ success: false, message: "All fields are required" });

    const existing = await Admin.findOne({ email });
    if (existing)
      return res.json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, password: hashed });
    await admin.save();

    res.json({ success: true, message: "Admin registered successfully" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ================================
// Post Login 
// ================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if fields are empty
    if (!email || !password) {
      return res.render('Login', { error: "All fields are required", email });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render('Login', { error: "Invalid email or password", email });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.render('Login', { error: "Invalid email or password", email });
    }

    // --- Save session ---
    req.session.adminId = admin._id;
    req.session.adminEmail = admin.email;

    // --- Redirect to dashboard ---
    res.redirect('/');
  } catch (err) {
    console.error("Login Error:", err);
    res.render('Login', { error: "Server error, please try again later" });
  }
};

// ================================
// Post Logout 
// ================================
exports.logout = (req, res) => {
  req.session.destroy((err) => {

    res.redirect('/loginpage')
  });
};
// ================================
// Middleware: Protect Routes
// ================================
exports.requireLogin = (req, res, next) => {
  if (!req.session.adminId) return res.redirect("/loginpage");
  next();
};


//=====================================Forget password==========================================//



// ================================
//  GET: Forget Password Page
// ================================
module.exports.getForgetPassword = (req, res) => {
  console.log("Forget Password page hit");
  const success = req.session.success || null;
  const error = req.session.error || null;
  req.session.success = null;
  req.session.error = null;
  console.log("Forget Password page hit");

  res.render("Forgetpassword", { success, error });
  console.log("Forget");

};

// ================================
//  POST: Handle Forget Password
// ================================
module.exports.postForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(200).json({ success: false, message: "Email not found" });
    }

    // Delete any old tokens
    await AdminPasswordResetToken.deleteMany({ adminId: admin._id });

    // Create a new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await new AdminPasswordResetToken({
      adminId: admin._id,
      token,
      expiresAt,
    }).save();

    //  Instead of req.get("host"), use BASE_URL from .env or relative link
    const baseURL = process.env.BASE_URL;
    console.log(baseURL);

    const resetLink = `${baseURL}/reset-password/${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px">
        <h2>Password Reset Request</h2>
        <p>Hello Admin,</p>
        <p>You requested to reset your password.</p>
        <p>
          <a href="${resetLink}"
             style="display:inline-block;padding:10px 20px;
             background:#007bff;color:#fff;text-decoration:none;border-radius:5px">
             Reset Password
          </a>
        </p>
        <p>This link will expire in <b>30 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br/>
        <p>Thanks,<br/>GrowLead Team</p>
      </div>
    `;
    const transporter = await getTransporter();

    const contact = await Contact.findOne().lean();
    console.log(contact.email);
    await transporter.sendMail({
      from: `"GrowLead" <${contact.email}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });
    return res.status(200).json({ success: true, message: "Password reset link sent to your email!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to send reset link" });
  }
};

// ================================
//  GET: Reset Password Page
// ================================
module.exports.getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenDoc = await AdminPasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(200).json({ success: false, message: "Invalid or expired link" });
    }

    res.render("Resetpassword", { token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================================
//  POST: Reset Password
// ================================
module.exports.postResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const tokenDoc = await AdminPasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(200).json({ success: false, message: "Invalid or expired token" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({ success: false, message: "Passwords do not match" });
    }


    const admin = await Admin.findById(tokenDoc.adminId);
    if (!admin) {
      return res.status(200).json({ success: false, message: "User not found" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    await AdminPasswordResetToken.findByIdAndDelete(tokenDoc._id);

    return res.status(200).json({ success: true, message: "Password changed successfully!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


//=====================================User Contact Us==========================================//


module.exports.getetintouch = async (req, res) => {
  try {
    const admin = await Admin.find()
    res.render('Usercontact', {
      admin
    })
  } catch (error) {
    console.log(error);
  }
}


// ================================
//  Get In Touch Json
// ================================
module.exports.getintouchjson = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    let query = {};

    //  Searching
    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { message: regex }
      ];
    }

    // Total Records
    const totalRecords = await UserContact.countDocuments();

    // Filtered Records Count
    const filteredRecords = await UserContact.countDocuments(query);

    // Fetch Data
    const data = await UserContact.find(query)
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    // Send Response
    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });

  } catch (err) {
    console.error("Contact List Error:", err);
    res.json({ draw: 0, recordsTotal: 0, recordsFiltered: 0, data: [] });
  }
};
// ================================
// DELETE CONTACT 
// ================================
module.exports.deleteContactJSON = async (req, res) => {
  try {
    const id = req.params.id;

    const contact = await UserContact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    await UserContact.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Contact deleted successfully!"
    });

  } catch (err) {
    console.error("Delete Contact Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact"
    });
  }
};




//=====================================newsletter==========================================//

module.exports.newsletterpage = async (req, res) => {
  try {
    const admin = await Admin.find()
    res.render('Newsletter', {
      admin
    })
  } catch (error) {
    console.log(error);
  }
}

// ================================
// get newsletter json
// ================================
module.exports.getNewsletterJson = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;

    const search = req.query["search[value]"]?.trim() || "";

    let query = {};

    // Search filter
    if (search) {
      query = {
        email: { $regex: search, $options: "i" }
      };
    }

    // Total documents
    const total = await Newsletter.countDocuments();

    // Filtered documents
    const filtered = await Newsletter.countDocuments(query);

    // Pagination + sorting
    const data = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .skip(start)
      .limit(length);

    // Response
    return res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

//=====================================profile==========================================//

module.exports.getprofile = async (req, res) => {
  try {
    const admin = await Admin.find()
    res.render('Profile', {
      admin
    })
  } catch (error) {
    console.log(error);
  }
}


// ================================
// Update Profile (Name + Password)
// ================================
exports.changePassword = async (req, res) => {
  try {
    const { name, currentPassword, newPassword, confirmPassword } = req.body;

    if (!req.session.adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again."
      });
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (name && name.trim() !== "") {
      admin.name = name.trim();
    }

    if (currentPassword || newPassword || confirmPassword) {

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.json({
          success: false,
          message: "All password fields are required"
        });
      }

      if (newPassword !== confirmPassword) {
        return res.json({
          success: false,
          message: "New password and confirm password do not match"
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      admin.password = await bcrypt.hash(newPassword, 10);
    }

    await admin.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      name: admin.name
    });

  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again"
    });
  }
};

// ================================
// Update Profile Image
// ================================

module.exports.updateProfileImage = async (req, res) => {
  try {

    const adminId = req.session.adminId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Find admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Delete old profile image if exists
    if (admin.profile) {
      const oldImagePath = path.join(__dirname, "..", admin.profile);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new image path in DB
    admin.profile = `/uploads/adminprofile/${req.file.filename}`;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profile: admin.profile
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//========================================== Upload Lead===========================================//

// ================================
// Upload lead Page
// ================================
module.exports.getUploadleadspage = async (req, res) => {
  try {
    const admin = await Admin.find()
    const categories = await Category.find()
    res.render('Uploadleads', {
      admin, categories
    })
  } catch (error) {
    console.log(error);
  }
}

// ================================
// getManualLeads json
// ================================
exports.getManualLeads = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query["search[value]"]?.trim() || "";

    // BASE FILTER → only manual
    let query = { type: "manual" };

    // SEARCH FILTER
    if (search) {
      query = {
        $and: [
          { type: "manual" },
          {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
              { city: { $regex: search, $options: "i" } },
              { state: { $regex: search, $options: "i" } },
              { country: { $regex: search, $options: "i" } }
            ]
          }
        ]
      };
    }

    const recordsTotal = await LeadDetail.countDocuments({ type: "manual" });
    const recordsFiltered = await LeadDetail.countDocuments(query);

    const leads = await LeadDetail.find(query)
      .populate("CategoryId", "title")
      .skip(start)
      .limit(length)
      .sort({ createdAt: -1 });

    const data = leads.map(row => ({
      _id: row._id,
      name: row.name || "",
      email: row.email || [],
      phone: row.phone || [],
      website: row.website || "",
      city: row.city || "",
      state: row.state || "",
      country: row.country || "",
      postcode: row.postcode || "",
      street: row.street || "",
      lat: row.lat || null,
      lon: row.lon || null,
      openingHours: row.openinghours || "",
      category: row.CategoryId?.title || "-",
    }));

    res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data
    });

  } catch (err) {
    console.error("Lead list error:", err);
    res.json({
      draw: 0,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: []
    });
  }
};

exports.getLeadDetailById = async (req, res) => {
  try {
    const lead = await LeadDetail.findOne({
      _id: req.params.id,
      type: "manual"
    }).populate("CategoryId", "title");;

    if (!lead) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      data: {
        category: lead.CategoryId?.title || "-",
        name: lead.name || "",
        email: lead.email || [],
        phone: lead.phone || [],
        website: lead.website || "",
        city: lead.city || "",
        state: lead.state || "",
        country: lead.country || "",
        postcode: lead.postcode || "",
        street: lead.street || "",
        lat: lead.lat || null,
        lon: lead.lon || null,
        openingHours: lead.openinghours || "",
        createdAt: lead.createdAt
      }
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
};
// ================================
// Update Lead Exceal file
// ================================
module.exports.uploadLeadsFromExcel = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Category and Excel file are required",
      });
    }

    // =============================
    // READ EXCEL FILE
    // =============================
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Invalid Excel file",
      });
    }

    // =============================
    // CONVERT EXCEL TO JSON
    // =============================
    const headers = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value
        ?.toString()
        .trim()
        .toLowerCase();
    });

    const sheetData = [];
    console.log("worksheet", worksheet.rowCount)
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      console.log('row', row)
      const obj = {};

      headers.forEach((key, index) => {
        if (key) {
          obj[key] = row.getCell(index)?.value;
        }
      });

      sheetData.push(obj);
    }

    console.log("sheetData", sheetData);

    let inserted = 0;
    let skipped = 0;
    const excelEmailSet = new Set();


    for (let row of sheetData) {

      let emails = [];
      if (row.email) {
        let emailValue = "";


        if (typeof row.email === "object") {
          emailValue = row.email.text || row.email.hyperlink || "";
        } else {
          emailValue = row.email.toString();
        }

        emails = emailValue
          .split(",")
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);
      }
      console.log('email',emails)
      if (emails.length === 0) {
        
        continue;
      }

      let isDuplicate = false;


      const exist = await LeadDetail.findOne({
        email: { $in: emails }
      });


      if (exist) {
        skipped++;
      } else {
        emails.forEach(e => excelEmailSet.add(e));

        await LeadDetail.create({
          CategoryId: categoryId,
          type: "manual",
          name: row.name || "",
          email: emails,
          phone: row.phone
            ? row.phone.toString().split(",").map(p => p.trim())
            : [],
          website: row.website
            ? typeof row.website === "object"
              ? row.website.hyperlink || row.website.text || ""
              : row.website.toString()
            : "",
          city: row.city || "",
          state: row.state || "",
          country: row.country || "",
          postcode: row.postcode || "",
          street: row.street || "",
          lat: row.lat || null,
          lon: row.lon || null,
          openinghours: row.openinghours || "",
          geoJsonData: row.geoJsonData || {},
        });

        inserted++;
      }
    }


    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.json({
      success: true,
      message: "Excel processed successfully",
      inserted,
      skipped,
      total: inserted + skipped,
    });

  } catch (error) {
    console.error("Upload Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};



//=====================================Hero Sction==========================================//



module.exports.getherosectionpage = async (req, res) => {
  try {
    const admin = await Admin.find();
    const herosection = await Herosection.find();
    const section = await PageSection.findOne({ type: "testimonials" }).lean();

    res.render('Herosection', { herosection, admin, section })
  } catch (error) {
    console.log(error);
    res.status(500).send('Error loading hero section page');
  }
};

// Get Hero Section JSON for DataTable
module.exports.getherosectionjson = async (req, res) => {
  try {
    const herosections = await Herosection.find().sort({ createdAt: -1 });

    const data = herosections.map((h) => ({
      _id: h._id,
      title: h.title || "",
      description: h.description || "",
      backgroundImg: h.backgroundImg ? h.backgroundImg : "",
      mainImg: h.mainImg ? h.mainImg : "",
      createdAt: h.createdAt
    }));

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.json({ data: [] });
  }
};


// ================================
// Save Hero Section (Add/Edit)
// ================================
module.exports.saveherosection = async (req, res) => {
  try {
    const { id, title, description } = req.body;

    if (!title || !description) {
      return res.json({ success: false, message: "Title & Description required" });
    }

    let bgPath, mainPath;

    if (req.files?.backgroundImg) {
      bgPath = "/uploads/herosection/" + req.files.backgroundImg[0].filename;
    }
    if (req.files?.mainImg) {
      mainPath = "/uploads/herosection/" + req.files.mainImg[0].filename;
    }

    // FIND EXISTING (ONLY ONE)
    let hero = await Herosection.findOne();

    // ================= CREATE FIRST TIME =================
    if (!hero) {
      if (!bgPath || !mainPath) {
        return res.json({ success: false, message: "Both images required first time" });
      }

      await Herosection.create({
        title,
        description,
        backgroundImg: bgPath,
        mainImg: mainPath
      });

      return res.json({ success: true, message: "Hero section created" });
    }

    // ================= UPDATE =================
    hero.title = title;
    hero.description = description;

    // 🔁 REPLACE BACKGROUND IMAGE
    if (bgPath) {
      if (hero.backgroundImg) {
        const oldBg = path.join(__dirname, "..", hero.backgroundImg);
        if (fs.existsSync(oldBg)) fs.unlinkSync(oldBg);
      }
      hero.backgroundImg = bgPath;
    }

    // 🔁 REPLACE MAIN IMAGE
    if (mainPath) {
      if (hero.mainImg) {
        const oldMain = path.join(__dirname, "..", hero.mainImg);
        if (fs.existsSync(oldMain)) fs.unlinkSync(oldMain);
      }
      hero.mainImg = mainPath;
    }

    await hero.save();

    res.json({ success: true, message: "Hero section updated" });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};


//========================================== growing===========================================//

// ================================
// growing section
// ================================
module.exports.getgrowing = async (req, res) => {
  try {
    const admin = await Admin.find()
    const section = await PageSection.findOne({ type: "growing" }).lean();

    res.render('Growing', { admin, section })
  } catch (error) {
    console.log(error);
  }
}

// ================================
// growing json
// ================================
module.exports.getgrowingjson = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "growing" });

    const growingdata = await Growing.find().sort({ createdAt: -1 });
    // console.log(growingdata);

    const data = growingdata.map((h) => ({
      _id: h._id,
      label: h.label || "",
      description: h.description || "",
      count: h.count || "",
      createdAt: h.createdAt
    }));

    res.json({ data, pageSection });
  } catch (err) {
    console.error(err);
    res.json({ data: [] });
  }
};

// ================================
// growing save update
// ================================
module.exports.savegroving = async (req, res) => {
  try {
    const { id, label, description, count } = req.body;

    // 1. Basic Validation
    if (!label || !description || count === undefined) {
      return res.status(400).json({
        success: false,
        message: "Label, Description, and Count are required."
      });
    }

    if (id) {
      // ========== UPDATE EXISTING ==========
      const updatedGrowing = await Growing.findByIdAndUpdate(
        id,
        {
          label: label,
          description: description,
          count: count
        },
        { new: true } // Returns the updated document
      );

      if (!updatedGrowing) {
        return res.status(404).json({
          success: false,
          message: "Record not found."
        });
      }

      return res.status(200).json({
        success: true,
        message: "Growing stat updated successfully."
      });

    } else {
      // ========== CREATE NEW ==========
      const newGrowing = new Growing({
        label: label,
        description: description,
        count: count
      });

      await newGrowing.save();

      return res.status(200).json({
        success: true,
        message: "Growing stat added successfully."
      });
    }

  } catch (error) {
    console.error("Save Growing Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while saving."
    });
  }
};

// ================================
// delete growing 
// ================================
module.exports.deletegroving = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedData = await Growing.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).json({ success: false, message: "Record not found!" });
    }

    return res.status(200).json({ success: true, message: "Growing stat deleted successfully!" });

  } catch (error) {
    console.error("Delete Error:", error); // Fixed: logged 'error' instead of 'err'
    return res.status(500).json({ success: false, message: "Delete failed!" });
  }
};


//========================================== growing working section===========================================//


module.exports.getGrowWorking = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "growleadworking" }).lean();

    res.render('Growworking', { admin, section });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
}


// ================================
// GET JSON DATA (For DataTable)
// ================================
module.exports.getGrowWorkingJson = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "growleadworking" });

    const dataList = await GrowWorking.find();
    // console.log(dataList);

    const data = dataList.map((row) => ({
      _id: row._id,
      title: row.title || "",
      shortDescription: row.shortDescription || "",
      createdAt: row.createdAt
    }));

    res.json({ data, pageSection });
  } catch (err) {
    console.error(err);
    res.json({ data: [] });
  }
};

// ================================
//  SAVE (CREATE / UPDATE)
// ================================
module.exports.saveGrowWorking = async (req, res) => {
  try {
    const { id, title, shortDescription } = req.body;

    // Validation
    if (!title || !shortDescription) {
      return res.status(400).json({
        success: false,
        message: "Title and Short Description are required."
      });
    }

    if (id) {
      // ========== UPDATE ==========
      const updatedData = await GrowWorking.findByIdAndUpdate(
        id,
        {
          title: title,
          shortDescription: shortDescription
        },
        { new: true }
      );

      if (!updatedData) {
        return res.status(404).json({
          success: false,
          message: "Record not found."
        });
      }

      return res.status(200).json({
        success: true,
        message: "Grow Working updated successfully."
      });

    } else {
      // ========== CREATE ==========
      const newData = new GrowWorking({
        title: title,
        shortDescription: shortDescription
      });

      await newData.save();

      return res.status(200).json({
        success: true,
        message: "Grow Working added successfully."
      });
    }

  } catch (error) {
    console.error("Save GrowWorking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong."
    });
  }
};

// ================================
// DELETE
// ================================
module.exports.deleteGrowWorking = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedData = await GrowWorking.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).json({ success: false, message: "Record not found!" });
    }

    return res.status(200).json({ success: true, message: "Deleted successfully!" });

  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({ success: false, message: "Delete failed!" });
  }
};

//=================================================== growing tool==========================//

// RENDER PAGE
module.exports.getGrowTool = async (req, res) => {
  try {
    const admin = await Admin.find();
    const section = await PageSection.findOne({ type: "functions" }).lean();

    res.render('Growtool', { admin, section });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

// ================================
//   GET JSON DATA
// ================================
module.exports.getGrowToolJson = async (req, res) => {
  try {
    const pageSection = await PageSection.findOne({ type: "functions" });

    const dataList = await GrowTool.find().sort({ createdAt: -1 });
    console.log(dataList);

    const data = dataList.map((row) => ({
      _id: row._id,
      title: row.title || "",
      description: row.description || "",
      image: row.image || "",
      createdAt: row.createdAt
    }));

    res.json({ data, pageSection });
  } catch (err) {
    console.error(err);
    res.json({ data: [] });
  }
};

// ================================
//  SAVE (CREATE / UPDATE)
// ================================
module.exports.saveGrowTool = async (req, res) => {
  try {
    const { id, title, description } = req.body;
    let image = null;
    if (req.file) {
      image = "/uploads/growtool/" + req.file.filename;
    }

    // Basic Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and Description are required."
      });
    }

    if (id) {
      // ========== UPDATE ==========
      const updateData = {
        title,
        description
      };

      // Only update image if a new one is uploaded
      if (image) {
        updateData.image = image;
      }

      const updatedTool = await GrowTool.findByIdAndUpdate(id, updateData, { new: true });

      if (!updatedTool) {
        return res.status(404).json({ success: false, message: "Record not found." });
      }

      return res.status(200).json({ success: true, message: "Grow Tool updated successfully." });

    } else {
      // ========== CREATE ==========
      if (!image) {
        return res.status(400).json({ success: false, message: "Image is required for new entries." });
      }

      const newTool = new GrowTool({
        title,
        description,
        image: image
      });

      await newTool.save();

      return res.status(200).json({ success: true, message: "Grow Tool added successfully." });
    }

  } catch (error) {
    console.error("Save GrowTool Error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

// ================================
//  DELETE
// ================================
module.exports.deleteGrowTool = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id);

    const deletedData = await GrowTool.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).json({ success: false, message: "Record not found!" });
    }

    return res.status(200).json({ success: true, message: "Deleted successfully!" });

  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({ success: false, message: "Delete failed!" });
  }
};


//=============================================login section==============// 

// GET VIEW (Render Page)
module.exports.getLoginSection = async (req, res) => {
  try {
    const admin = await Admin.find();
    const loginsection = await Logonsection.find()
    res.render('Loginsection', { admin, loginsection });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

// ================================
// GET JSON DATA (For DataTable)
// ================================
module.exports.getLoginSectionJson = async (req, res) => {
  try {
    const dataList = await Logonsection.find().sort({ createdAt: -1 });
    console.log(dataList);

    const data = dataList.map((row) => ({
      _id: row._id,
      title: row.title || "",
      description: row.description || "",
      image: row.image || "",
      createdAt: row.createdAt
    }));
    console.log(data);

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.json({ data: [] });
  }
};


// ================================
// SAVE (CREATE / UPDATE)
// ================================
module.exports.saveLoginSection = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.json({
        success: false,
        message: "Title and Description are required."
      });
    }

    let imagePath;

    if (req.file) {
      imagePath = "/uploads/loginsection/" + req.file.filename;
    }

    // ===== FIND EXISTING (ONLY ONE) =====
    let section = await Logonsection.findOne();

    // ===== CREATE FIRST TIME =====
    if (!section) {
      if (!imagePath) {
        return res.json({
          success: false,
          message: "Image is required first time."
        });
      }

      await Logonsection.create({
        title,
        description,
        image: imagePath
      });

      return res.json({
        success: true,
        message: "Login Section created successfully."
      });
    }

    // ===== UPDATE EXISTING =====
    section.title = title;
    section.description = description;

    //  New image aaye → old image folder se DELETE
    if (imagePath) {
      if (section.image) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          section.image
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      section.image = imagePath;
    }

    await section.save();

    res.json({
      success: true,
      message: "Login Section updated successfully."
    });

  } catch (error) {
    console.error("Save LoginSection Error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};


// ================================Payment Gatway==========================//

exports.getPaymentPage = async (req, res) => {
  try {
    const admin = await Admin.find();
    res.render("Paymentgateway", { admin });
  } catch (err) {
    console.log(err);
  }
};

// ==========================
// DATATABLE JSON
// ==========================
exports.getPaymentJson = async (req, res) => {
  const data = await PaymentGateway.find().sort({ createdAt: -1 });
  res.json({ data });
};

// ==========================
// SAVE (ADD / UPDATE)
// ==========================
exports.savePaymentGateway = async (req, res) => {
  try {
    let { id, name, secretKey, webhookUrl, fixedCharge, iconName } = req.body;

    //  ID is mandatory (kyunki create nahi karna)
    if (!id) {
      return res.json({
        success: false,
        message: "Gateway ID required for update"
      });
    }

    if (!name || !secretKey || !webhookUrl || !iconName) {
      return res.json({
        success: false,
        message: "All fields required"
      });
    }

    name = name.trim().toLowerCase();


    const updated = await PaymentGateway.findByIdAndUpdate(
      id,
      {
        name,
        secretKey,
        iconName,
        webhookUrl,
        fixedCharge
      },
      { new: true }
    );

    if (!updated) {
      return res.json({
        success: false,
        message: "Payment Gateway not found"
      });
    }

    return res.json({
      success: true,
      message: "Payment Gateway Updated Successfully"
    });

  } catch (err) {
    console.error("Update gateway error:", err);
    res.json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// DELETE
// ==========================
exports.deletePaymentGateway = async (req, res) => {
  try {
    await PaymentGateway.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Payment Gateway Deleted Successfully"
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//================================================ Seo Setting==========================//

// ================================
// get pagesection type 
// ================================
exports.updateSectionByType = async (req, res) => {
  try {
    let { type, title, shortDescription, label } = req.body;

    if (!type || !title || !shortDescription || !label) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    type = type.toLowerCase();

    const existing = await PageSection.findOne({ type });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `No section found for type '${type}'`
      });
    }

    existing.title = title;
    existing.shortDescription = shortDescription;
    existing.label = label;

    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: existing
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ================================
// Seo PAGE
// ================================
exports.getSeoPage = async (req, res) => {
  const admin = await Admin.find().lean();
  res.render("Seosettings", { admin });
};

// ================================
// GET SEO BY PAGE TYPE (TAB CLICK)
// ================================
exports.getSeoByType = async (req, res) => {
  try {
    const { type } = req.params;

    const seo = await Seo.findOne({ type }).lean();

    res.json(seo || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================================
// CREATE OR UPDATE (UPSERT)
// ================================
exports.saveSeo = async (req, res) => {
  try {
    const { type, metaTitle, metaDescription, metaKeywords } = req.body;

    if (!type) {
      return res.json({ success: false, message: "Page type missing" });
    }



    let imagePath = null;

    if (req.file) {
      imagePath = "/uploads/seo/" + req.file.filename;
    }

    // find existing seo by type
    const oldSeo = await Seo.findOne({ type });

    // delete old image if new uploaded
    if (req.file && oldSeo?.seoimage) {
      const oldImgPath = path.join(__dirname, "..", oldSeo.seoimage);
      if (fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
    }

    await Seo.updateOne(
      { type },
      {
        $set: {
          metaTitle,
          metaDescription,
          metaKeywords,
          ...(imagePath && { seoimage: imagePath })
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "SEO saved successfully!"
    });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

//=============================================== Emailtampleate ================================//
// Get JSON data for all templates
module.exports.emailTemplateListPage = async (req, res) => {
  try {
    const admin = await Admin.find().lean();
    const templates = await EmailTemplate.find().lean();

    res.render('Emailtemplatelist', { admin, templates });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading email template list");
  }
};

// ================================
// Get all templates JSON
// ================================
exports.EmailTemplateJson = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().lean();
    res.json({
      data: templates.map(t => ({
        _id: t._id,
        type: t.type,
        subject: t.subject,
        from_name: t.from_name,
        from_email: t.from_email,
        htmlContent: t.htmlContent,
        variables: t.variables
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: [] });
  }
};

// ================================
//  // Update Email Template
// ================================
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const { subject, from_name, from_email, htmlContent } = req.body;

    // Extract new variables from updated HTML
    const regex = /\{\{(.*?)\}\}/g;
    const newVariables = [];
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      if (!newVariables.includes(match[1])) newVariables.push(match[1]);
    }

    // Fetch existing template to preserve old variables
    const existingTemplate = await EmailTemplate.findOne({ type });
    let variables = newVariables;
    if (existingTemplate && existingTemplate.variables) {
      // Merge old variables with new ones, avoid duplicates
      variables = Array.from(new Set([...existingTemplate.variables, ...newVariables]));
    }

    const updated = await EmailTemplate.findOneAndUpdate(
      { type },
      { subject, from_name, from_email, htmlContent, variables, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Template updated', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};





const fetch = require('node-fetch');


// ================================
// Generate Description
// ================================
module.exports.generateDescription = async (req, res) => {
  try {
    const { name, prompt } = req.body;
    if (!name)
      return res.json({ success: false, message: "Product name is required." });


    const leadsetting = await LeadSetting.findOne({}, { "geminiApi.apiKey": 1, _id: 0 });
    const geminiApiKey = leadsetting?.geminiApi?.apiKey;


    const finalPrompt = `${prompt}: "${name}"`;

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
        }),
      }
    );


    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("Gemini API Error:", errText);
      return res
        .status(apiRes.status)
        .json({ success: false, message: "Gemini API request failed.", details: errText });
    }

    const data = await apiRes.json();

    const description =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "AI could not generate a description.";

    res.json({ success: true, description });
  } catch (err) {
    console.error(" AI Description Error:", err);
    res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

// ================================
// Generate  Seo Details
// ================================
module.exports.generateMetaAll = async (req, res) => {
  try {
    const { page } = req.body; // page = home, blog, contact, etc.
    if (!page)
      return res.json({ success: false, message: "Page type is required." });


    // ====== OPTIONAL AI-Generated META (Gemini API v1beta) ======

    const prompt = `You are an SEO expert.
Generate SEO metadata for "${page}" page.

Respond ONLY in valid JSON format like this:
{
  "metaTitle": "string (max 60 chars)",
  "metaKeywords": "comma separated keywords (max 5 keywords)",
  "metaDescription": "150-160 characters description"
}
Do NOT add explanation or extra text.`;

    const leadsetting = await LeadSetting.findOne({}, { "geminiApi.apiKey": 1, _id: 0 });
    const geminiApiKey = leadsetting?.geminiApi?.apiKey;
    if (!geminiApiKey)
      return res.json({ success: false, message: "Gemini API key not configured." });


    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );


    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("Gemini API Error:", errText);
      return res
        .status(apiRes.status)
        .json({ success: false, message: "Gemini API request failed.", details: errText });
    }

    const data = await apiRes.json();

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;


    const cleanedResult = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let meta;
    try {
      meta = JSON.parse(cleanedResult);
    } catch (e) {
      console.error("JSON Parse Error:", cleanedResult);
      return res.json({
        success: false,
        message: "AI returned invalid format"
      });
    }

    return res.json({
      success: true,
      metaTitle: meta.metaTitle || "",
      metaKeywords: meta.metaKeywords || "",
      metaDescription: meta.metaDescription || ""
    });


  } catch (err) {
    console.error("SEO Meta Generation Error:", err);
    res.status(500).json({ success: false, message: "AI generation failed." });
  }
};



//===============================
//leadsetting
//==============================
exports.getleadsetting = async (req, res) => {
  const admin = await Admin.find().lean();

  let setting = await LeadSetting.findOne().lean();
  if (!setting) {
    setting = await LeadSetting.create({});
  }

  res.render("Leadsetting", { admin, setting });
};


exports.updateLeadSettings = async (req, res) => {
  try {
    const updateData = {};


    for (const key in req.body) {
      updateData[key] = {
        enabled: req.body[key].enabled === true,
        apiKey: req.body[key].apiKey || ""
      };
    }

    await LeadSetting.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true }
    );

    return res.status(200).json({ success: true, message: "Lead settings updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err });
  }
};

