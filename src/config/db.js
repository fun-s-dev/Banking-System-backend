const mongoose = require("mongoose")



function connectToDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("MongoDB connected successfully")
    })
    .catch((err)=>{
        console.log("MongoDB connection failed", err)
        process.exit(1)
    })
}

module.exports = connectToDB
