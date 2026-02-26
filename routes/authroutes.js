const express = require("express");
const router = express.Router();
const authcontroller = require('../controllers/authcontrollers')
const upload = require("../middewares/upload");
const verifytoken = require('../middewares/jwtverify')
const { AuthMiddleware } = require('../middewares/authMiddleware');
const dashboardcontrollers = require('../controllers/dashboardcontrollers')
 
router.post('/signup', authcontroller.signup)                             //sinup
router.post('/verifyotp', authcontroller.verifyOtp)                       //verify otp
router.post('/login', authcontroller.login)                               //login
router.put("/updateprofile", verifytoken, upload.singleWithSizeError("profileImage"), upload.validateDimensions, authcontroller.updateProfile);//update profile
router.get("/getprofile", verifytoken, authcontroller.getProfile);        //get profile
router.post('/sendresetlink', authcontroller.sendresetlink);              //send OTP to email
router.post('/resetpassword', authcontroller.resetPassword);              //reset password 
router.get('/blogs', authcontroller.getBlogs);                            //get blogs 
router.get('/blog/:id', authcontroller.getBlogDetails);                   //get Blog details 
router.get("/brands", authcontroller.getBrands);                          //get brands
router.get("/faqs", authcontroller.getFaq);                               //get faqs
router.get("/reviews", authcontroller.getReview);                         //get reviews
router.get("/contactus", authcontroller.getContactDetails);               //get contact us details
router.get("/pricingplans", authcontroller.getPricingPlans);              //get pricing plans monthly and annual
router.post("/getintouch", authcontroller.createMessage);                 //post conatct us  
router.post("/datarequest", verifytoken, authcontroller.createDataRequest);//post data request
router.get("/categories", authcontroller.getCategories);                   //get category
router.get("/countries", authcontroller.getCountries);                     //get Country
router.get("/states/:countryId", authcontroller.getStatesByCountry);       //get  State by country
router.post("/ticketcreate", verifytoken, upload.array("attachments"), authcontroller.createTicket);             //crate ticket
router.post("/ticketreply/:id", verifytoken, upload.array("attachments"), authcontroller.replyToTicket);         // replay ticket by user
router.post("/admin/ticketreply/:id", AuthMiddleware, upload.array("attachments"), authcontroller.replyToTicket);//rreplay ticket by admin
router.get("/usertickets", verifytoken, authcontroller.getUserTickets);             //get User Tickets
router.get("/ticketdetails/:ticketId", verifytoken, authcontroller.getSingleTicket);//get Single Ticket
router.get('/leadrequests', verifytoken, authcontroller.getUserDataRequests);       //get User Data Requests
router.get('/userpaymentlog', verifytoken, authcontroller.getUserPayments);         //get User Payments
router.get('/getuserdashboard', verifytoken, authcontroller.getDashboardData);      //get user dashboard data
router.post('/subscribenewsletter', authcontroller.subscribeNewsletter);            //subscribe newsletter
router.post('/checkout', verifytoken, authcontroller.createPayment);                //stripe checkout
router.post("/braintreecapture", authcontroller.captureBraintree);                  //barintree
router.post('/resendcode', authcontroller.resendcode);                              // resendcode 
router.get("/herosection", authcontroller.getHeroSection);                          //hero section
router.get('/growworking', dashboardcontrollers.getGrowWorkingJson);                //grow working
router.get('/growing', dashboardcontrollers.getgrowingjson);                        //growing
router.get('/growtools', dashboardcontrollers.getGrowToolJson);                     //grow tools (function)
router.get('/loginsectionjson', authcontroller.getLoginSectionJson);                // login section
router.get('/paymentgateways', authcontroller.getAllGateways);                      // payment get way checkout page 
router.get('/getallseo',authcontroller.getAllSeo)
module.exports = router  
