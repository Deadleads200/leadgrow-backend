
const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

const path=require('path')

dotenv.config();
const app = express();

app.use('/webhook',require('./routes/webhookroute'));

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files (assets)
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'Example_file')));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Simple Session Setup (no MongoStore) ---
app.use(session({
  secret: "9a96a4335d47f0b8e5e379a482cf3b664ee45c272af82389a9976635e1dd1ee3f9b3223c3a47e31b",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
  },
}));
// Routes

const DashRoutes = require("./routes/dashboardroutes");
app.use("/api", require('./routes/authroutes'));
app.use("/", DashRoutes);


// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
