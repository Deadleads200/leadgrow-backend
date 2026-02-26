const mongoose = require("mongoose");
require("./config/db");
const fs = require("fs");
const path = require("path");

// ================= MODELS =================
const MODELS = [
  require("./models/AdminPasswordResetToken"),
  require("./models/AdminTable"),
  require("./models/Blog"),
  require("./models/Brand"),
  require("./models/Category"),
  require("./models/Contact"),
  require("./models/Countrie"),
  require("./models/DataRequest"),
  require("./models/EmailTemplate"),
  require("./models/Faq"),
  require("./models/Growingsection"),
  require("./models/GrowTool"),
  require("./models/GrowWorking"),
  require("./models/Herosection"),
  require("./models/LeadDetail"),
  require("./models/LeadSetting"),
  require("./models/LoginHistory"),
  require("./models/Loginsection"),
  require("./models/NewsLetter"),
  require("./models/Notification"),
  require("./models/PageSection"),
  require("./models/Payment"),
  require("./models/Review"),
  require("./models/Seo"),
  require("./models/States"),
  require("./models/Ticket"),
  require("./models/Usercontact"),
  require("./models/UserResetPasswordToken"),
  require("./models/UserSubscription"),
  require("./models/PricingPlan"),
  require("./models/PaymentGateway"),
    require("./models/User"),



];

// ================= FILES =================
const FILES = [
  "./database/adminpasswordresettokens.json",
  "./database/admins.json",
  "./database/blogs.json",
  "./database/brands.json",
  "./database/categories.json",
  "./database/contacts.json",
  "./database/countries.json",
  "./database/datarequests.json",
  "./database/emailtemplates.json",
  "./database/faqs.json",
  "./database/growings.json",
  "./database/growtools.json",
  "./database/growworkings.json",
  "./database/herosections.json",
  "./database/leaddetails.json",
  "./database/leadsettings.json",
  "./database/loginhistories.json",
  "./database/logonsections.json",
  "./database/newsletters.json",
  "./database/notifications.json",
  "./database/pagesections.json",
  "./database/payments.json",
  "./database/reviews.json",
  "./database/seos.json",
  "./database/states.json",
  "./database/supporttickets.json",
  "./database/usercontacts.json",
  "./database/userresetpasswordtokens.json",
  "./database/usersubscriptions.json",
  "./database/pricingplans.json",
   "./database/paymentgateways.json",
     "./database/users.json",


];

// ================= CLEAN MONGO EXPORT =================
function cleanValue(value) {
  if (value && typeof value === "object") {
    if (value.$oid) return value.$oid;
    if (value.$date) return value.$date;
  }
  return value;
}

// ================= IMPORT FUNCTION =================
async function insertAll() {
  try {
    for (let i = 0; i < MODELS.length; i++) {
      const Model = MODELS[i];
      const filePath = path.join(__dirname, FILES[i]);

      console.log(` Importing ${FILES[i]} → ${Model.collection.name}`);

      //  Read JSON
      let jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      //  Clean $oid / $date
      jsonData = jsonData.map(item => {
        const newItem = {};
        for (let key in item) {
          newItem[key] = cleanValue(item[key]);
        }
        return newItem;
      });

      //  Convert ObjectId & Dates (SAFE)
      const preparedData = jsonData.map(item => {
        const newItem = { ...item };

        Object.keys(newItem).forEach(key => {

          // _id + foreign keys
          if (
            (key === "_id" || key.toLowerCase().endsWith("id")) &&
            typeof newItem[key] === "string" &&
            mongoose.Types.ObjectId.isValid(newItem[key])
          ) {
            newItem[key] = new mongoose.Types.ObjectId(newItem[key]);
          }

          // Dates
          if (
            key.toLowerCase().includes("date") ||
            key === "createdAt" ||
            key === "updatedAt"
          ) {
            if (newItem[key]) {
              newItem[key] = new Date(newItem[key]);
            }
          }
        });

        return newItem;
      });

      //CLEAR COLLECTION (REAL RESTORE)
      await Model.deleteMany({});

      // INSERT (REAL IMPORT)
      const result = await Model.insertMany(preparedData, {
        ordered: false,
        runValidators: false,
      });

      console.log(`Imported ${result.length} records`);
    }

    console.log(" ALL COLLECTIONS IMPORTED SUCCESSFULLY!");
    process.exit(0);

  } catch (err) {
    console.error(" IMPORT FAILED:", err);
    process.exit(1);
  }
}

insertAll();
