// middleware/authMiddleware.js
module.exports.AuthMiddleware = (req, res, next) => {

  if (req.session && req.session.adminId) {
    return next();
  }
  return res.redirect('/loginpage');
};
