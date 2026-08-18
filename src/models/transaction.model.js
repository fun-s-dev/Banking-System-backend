const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema({

        fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true, "fromAccount is required"],
        index:true
      },
        toAccount:{
           type:mongoose.Schema.Types.ObjectId,
           ref:"Account",
           required:[true, "toAccount is required"],
           index:true 
      },
        status:{
            type:String,
            enum:{
                values:["pending", "completed", "failed", "reversed"],
                message:"status must be either pending, completed, failed or reversed" 
            },
            default:"pending"
        },
        amount:{
            type:Number,
            required:[true, "amount is required"],
            min:[1, "amount must be greater than 0"]
        },
        idempotencyKey:{
            type:String,
            required:[true, "idempotencyKey is required"],
            index:true,
            unique:true
        }

},{
    timestamps:true

})



const transactionModel = mongoose.model("Transaction", transactionSchema)

module.exports = transactionModel