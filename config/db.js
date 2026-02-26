const mongoose=require('mongoose')
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.MONGODB_URl)

const db=mongoose.connection

db.once('open',()=>{
    console.log('MongoDB connected');
    
})
