const express = require("express");
const router = express.Router();
const dashboardroutes = require("../controllers/dashboardcontrollers");
const upload = require("../middewares/upload");
const { AuthMiddleware } = require('../middewares/authMiddleware');

router.get('/', AuthMiddleware, dashboardroutes.dashboard)
router.get('/state', AuthMiddleware, dashboardroutes.getstate)

//manage users
router.get('/activeusers', AuthMiddleware, dashboardroutes.Activeusers)
router.get('/bannedusers', AuthMiddleware, dashboardroutes.Bannedusers)
router.get('/allusers', AuthMiddleware, dashboardroutes.Allusers)

//payment getway
router.get('/pendingpayment', AuthMiddleware, dashboardroutes.Pendingpayment)
router.get('/successfulpayment', AuthMiddleware, dashboardroutes.Successfulpayment)
router.get('/rejectedpayment', AuthMiddleware, dashboardroutes.Rejectedpayment)
router.get('/paymenthistory', AuthMiddleware, dashboardroutes.Paymenthistory)


// Support Ticket
router.get('/pendingtickets', AuthMiddleware, dashboardroutes.Pendingtickets)
router.get('/closedtickets', AuthMiddleware, dashboardroutes.Closedtickets)
router.get('/answeredtickets', AuthMiddleware, dashboardroutes.Answeredtickets)
router.get('/alltickets', AuthMiddleware, dashboardroutes.Alltickets)
router.get('/ticketdetails/:id', AuthMiddleware, dashboardroutes.ticketdetails)


// report
router.get('/subscriptionhistory', AuthMiddleware, dashboardroutes.Subscriptionhistory);
router.get('/leadhistory', AuthMiddleware, dashboardroutes.Leadhistory);
router.get('/loginhistory', AuthMiddleware, dashboardroutes.Loginhistory);
router.get('/notificationhistory', AuthMiddleware, dashboardroutes.Notificationhistory);
router.get('/latestnotification', AuthMiddleware, dashboardroutes.getnotification);
router.get('/readnotification/:id', dashboardroutes.notificationread)

// Frontend Managment

//Manage Brand
router.get('/addbrand', AuthMiddleware, dashboardroutes.addbrand)
router.post('/brandsave', AuthMiddleware, upload.singleWithSizeError('Brand'), upload.validateDimensions, dashboardroutes.saveBrand)
router.get('/brandgetjson', AuthMiddleware, dashboardroutes.getBrandJson)
router.delete('/deletebrand/:id', AuthMiddleware, dashboardroutes.deleteBrand)

//Manage Pricing Plan
router.get('/pricingplan', AuthMiddleware, dashboardroutes.getpricingplan)
router.get('/addpricingplan/:id', AuthMiddleware, dashboardroutes.Addpricingplan)
router.get('/addpricingplan', AuthMiddleware, dashboardroutes.Addpricingplanpage)

router.post('/pricingsave', AuthMiddleware, dashboardroutes.savePricingPlan)
router.get('/pricingplanjson', dashboardroutes.getPricingJSON)
router.patch('/pricingplans/toggle/:id', AuthMiddleware, dashboardroutes.togglePricing)
router.delete('/pricingplans/delete/:id', AuthMiddleware, dashboardroutes.deletepricing)

//Manage Faq
router.get('/faq', AuthMiddleware, dashboardroutes.getfaqpage)
router.get('/faqjson', dashboardroutes.getFAQJson)
router.post('/faqsave', AuthMiddleware, dashboardroutes.saveFAQ)
router.delete('/faqdelete/:id', AuthMiddleware, dashboardroutes.deleteFAQ)


//Manage Testimonials
router.get('/reviews', AuthMiddleware, dashboardroutes.getReviewPage)
router.get('/reviewsjson', dashboardroutes.getReviewsJson)
router.post('/reviewssave', AuthMiddleware, upload.singleWithSizeError('review'), upload.validateDimensions, dashboardroutes.saveReview)
router.delete('/reviewsdelete/:id', AuthMiddleware, dashboardroutes.deleteReview)


//Manage Blog
router.get("/blogs", AuthMiddleware, dashboardroutes.getblogpage);
router.get("/blogjson", dashboardroutes.getblogjson);   
router.post("/blogsave", AuthMiddleware, upload.singleWithSizeError("image"), upload.validateDimensions, upload.generateThumbnail, dashboardroutes.saveblog);
router.delete("/blogdelete/:id", AuthMiddleware, dashboardroutes.deleteblog);


//Mange Contact US
router.get("/contact", AuthMiddleware, dashboardroutes.getcontactpage);
router.post("/saveContact", AuthMiddleware, upload.fieldsWithSizeError([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 }
  ]), upload.validateDimensions, dashboardroutes.saveContact);
router.get("/getContactjson", dashboardroutes.getContactjson);


//Manage Categories
router.get('/category', AuthMiddleware, dashboardroutes.getcategory);
router.get("/getcategoryjson", dashboardroutes.getCategoriesJSON);
router.post("/savecategory", AuthMiddleware, dashboardroutes.saveCategory);
router.delete("/categorydelete/:id", AuthMiddleware, dashboardroutes.deleteCategory);
router.post("/categorystatus/:id", AuthMiddleware, dashboardroutes.toggleStatus);


// Manage Countries
router.get('/countries', AuthMiddleware, dashboardroutes.getcountries)
router.get("/getcountriesjson", dashboardroutes.getCountriesJSON);
router.post("/savecountry", AuthMiddleware, AuthMiddleware, dashboardroutes.saveCountry);
router.delete("/countrydelete/:id", AuthMiddleware, dashboardroutes.deleteCountry);
router.post("/countrystatus/:id", AuthMiddleware, dashboardroutes.CounteytoggleStatus);


//Manage States
router.get("/getstatesjson", dashboardroutes.getStatesJson);
router.post("/savestate", AuthMiddleware, dashboardroutes.saveState);
router.delete("/statedelete/:id", AuthMiddleware, dashboardroutes.deleteState);
router.post("/statestatus/:id", AuthMiddleware, dashboardroutes.togglestatesStatus);
router.get("/getcountries", AuthMiddleware, dashboardroutes.getCountries);


//Manage User
router.get("/getactiveusersjson", dashboardroutes.getactiveUsersJson);
router.post("/userstatus/:id", dashboardroutes.toggleuserStatus);
router.post("/emailverify/:id", dashboardroutes.toggleEmailVerification);
router.get("/getbannedusersjson", dashboardroutes.getbannedUsersJson);
router.get("/getbannedusersjson", dashboardroutes.getbannedUsersJson);
router.get("/getuserjson", dashboardroutes.getUsersJson);
router.get('/userdetails/:id', dashboardroutes.getUserDetails)
router.delete("/userdelete/:id", dashboardroutes.deleteUser);

// Send Notifiction 
router.get('/sendnotification', AuthMiddleware, dashboardroutes.Sendnotification)
router.get('/fetch-users-email', AuthMiddleware, dashboardroutes.fetchusersemail)
router.post("/send-email", AuthMiddleware, dashboardroutes.sendEmail);


//Manage Payment
router.get("/allpaymentlist", dashboardroutes.getPaymentslist);
router.get("/pandingpaymentlist", dashboardroutes.getpandingPayments);
router.get("/faildpaymentlist", dashboardroutes.getfaildPayments);
router.get("/successpaymentlist", dashboardroutes.getsuccessPayments);
router.get('/paymentdetails/:id', dashboardroutes.Paymendetails)
router.get('/paymenthistorydetails/:id', dashboardroutes.Paymenthistorydetails)


//Manage Support Ticket
router.get('/opensupportticketjson', dashboardroutes.getOpenSupportTickets);
router.get('/answeredsupportticketjson', dashboardroutes.getAnsweredSupportTickets);
router.get('/closedsupportticketjson', dashboardroutes.getClosedSupportTickets);
router.get('/allsupportticketjson', dashboardroutes.getSupportTicketsjson);
router.post("/ticket/update-status/:id", AuthMiddleware, dashboardroutes.updateTicketStatus);//close ticket
router.delete("/ticket/message/delete/:ticketId/:messageId", AuthMiddleware, dashboardroutes.deleteTicketMessage);//ticket message delete

//Report
router.get('/subscriptionhistoryjson', dashboardroutes.getSubscriptionHistory)
router.get('/leadhistoryjson', dashboardroutes.getLeadJSON)
router.get('/loginhistoryjson', dashboardroutes.getLoginHistoryJSON);
router.get("/loginhistoryjson/:id", dashboardroutes.getSingleUserLoginHistoryJSON);
router.get("/loginhistory/:id", dashboardroutes.SingleUserLoginHistoryPage);

router.get('/notificationhistoryjson', dashboardroutes.getNotificationJSON)


//login page section
router.get("/loginpage", dashboardroutes.loginpage);//get login-page
router.post("/signup", dashboardroutes.signup);//signup 
router.post("/login", dashboardroutes.login);// login
router.get("/logout", dashboardroutes.logout);//logout


//forgrtpassword
router.get('/forget-password', dashboardroutes.getForgetPassword);                          // get forgetpassword
router.post('/forget-password', dashboardroutes.postForgetPassword);                        //post forgetpassword
router.get('/reset-password/:token', dashboardroutes.getResetPassword);                     // get reset-password
router.post('/reset-password', dashboardroutes.postResetPassword);


//contact US
router.get('/contactus', dashboardroutes.getetintouch);
router.get('/contactusjson', dashboardroutes.getintouchjson);
router.delete("/contactusdelete/:id", dashboardroutes.deleteContactJSON);


//newsletter
router.get('/newsletter', AuthMiddleware, dashboardroutes.newsletterpage);
router.get('/newsletterjson', dashboardroutes.getNewsletterJson);

//profile page
router.get('/profile', AuthMiddleware, dashboardroutes.getprofile);
router.post('/changepassword', AuthMiddleware, dashboardroutes.changePassword);
router.put("/adminimage", AuthMiddleware, upload.singleWithSizeError("image"), dashboardroutes.updateProfileImage);

//upload lead
router.get("/uploadleads", dashboardroutes.getUploadleadspage);
router.get("/manualleadsjson", dashboardroutes.getManualLeads);
router.get("/manuallead/:id", dashboardroutes.getLeadDetailById);
router.post("/leadsuploadexcel", upload.singleWithSizeError("excelFile"), dashboardroutes.uploadLeadsFromExcel);


// Hero Section
router.get('/herosection', AuthMiddleware, dashboardroutes.getherosectionpage);
router.get('/herosectionjson', dashboardroutes.getherosectionjson);
router.post('/herosectionsave', AuthMiddleware, upload.fieldsWithSizeError([
    { name: 'backgroundImg', maxCount: 1 },
    { name: 'mainImg', maxCount: 1 }
]),upload.validateDimensions, dashboardroutes.saveherosection);

//  growing section 
router.get('/growing', AuthMiddleware, dashboardroutes.getgrowing);
router.get('/growingjson', dashboardroutes.getgrowingjson);
router.post('/growingsave', dashboardroutes.savegroving);
router.delete('/growingdelete/:id', AuthMiddleware, dashboardroutes.deletegroving);

//  grow working section
router.get('/growingworking', AuthMiddleware, dashboardroutes.getGrowWorking);
router.get('/growworkingjson', dashboardroutes.getGrowWorkingJson);
router.post('/growworkingsave', dashboardroutes.saveGrowWorking);
router.delete('/growworkingdelete/:id', AuthMiddleware, dashboardroutes.deleteGrowWorking);

//growingtool section
router.get('/growingtool', AuthMiddleware, dashboardroutes.getGrowTool);
router.get('/growtooljson', dashboardroutes.getGrowToolJson);
router.post('/growtoolsave', upload.singleWithSizeError("image"), dashboardroutes.saveGrowTool);
router.delete('/growtooldelete/:id', AuthMiddleware, dashboardroutes.deleteGrowTool);

// login section
router.get('/loginsection', dashboardroutes.getLoginSection);
router.get('/loginsectionjson', dashboardroutes.getLoginSectionJson);
router.post('/loginsectionsave', upload.singleWithSizeError("image"),upload.validateDimensions, dashboardroutes.saveLoginSection);

//payment getway (checkout)
router.get("/paymentgateway",AuthMiddleware, dashboardroutes.getPaymentPage);
router.get("/paymentgatewayjson",AuthMiddleware, dashboardroutes.getPaymentJson);
router.post("/paymentgatewaysave",AuthMiddleware, dashboardroutes.savePaymentGateway);
router.delete("/paymentgatewaydelete/:id",AuthMiddleware, dashboardroutes.deletePaymentGateway);


//generte description by Ai
router.post('/generateDescription', dashboardroutes.generateDescription);
router.post('/generateMetaAll', dashboardroutes.generateMetaAll);

//seo setting
router.post("/savesection", dashboardroutes.updateSectionByType);
router.get("/seo", dashboardroutes.getSeoPage);
router.get("/seo/:type", dashboardroutes.getSeoByType);
router.post("/seo/save", dashboardroutes.saveSeo);

// email templates
router.get("/emailtemplates", AuthMiddleware, dashboardroutes.emailTemplateListPage);
router.get("/emailtemplates/json", dashboardroutes.EmailTemplateJson);
router.post("/updateemailtemplate/:type", dashboardroutes.updateEmailTemplate);
 

//upload lead (leadsetting)
router.get("/getleadsetting",dashboardroutes.getleadsetting)
router.post("/leadsettingupdate", dashboardroutes.updateLeadSettings);
module.exports = router;
