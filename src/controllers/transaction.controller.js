const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const accountModel = require('../models/account.model')
const emailService = require('../services/email.service')
const mongoose = require('mongoose')

/**
 * POST /api/transactions
 * THE 10-STEP TRANSFER FLOW:
    * 1. Validate request body
    * 2. Validate idempotency key
    * 3. Check account status of both accounts
    * 4. Derive sender balance from ledger
    * 5. Create transaction with status pending
    * 6. Create DEBIT ledger entry for sender
    * 7. Create CREDIT ledger entry for receiver
    * 8. Update transaction status to completed
    * 9. Commit MongoDB transaction
    * 10. send email notification
 */

async function createTransactionController(req, res){
    /**
     * 1. Validate request body
     */
    const {fromAccount, toAccount, amount, idempotencyKey} = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: "From account, to account, amount and idempotency key are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
      _id: fromAccount})
    
      const toUserAccount = await accountModel.findOne({
        _id: toAccount
      })

      if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({
            message: "One or both accounts not found"
        })
      }

      /**
       * 2. Validate idempotency key
       */
      const isTransactionALreadyExists= await transactionModel.findOne({
        idempotencyKey
      }) 
      if(isTransactionALreadyExists){
        if(isTransactionALreadyExists.status === 'completed'){
          return res.status(200).json({
            message: "Transaction already completed"
          })
        }
        if(isTransactionALreadyExists.status === 'pending'){
          return res.status(200).json({
            message: "Transaction is still pending"
          })
        }
        if(isTransactionALreadyExists.status === 'failed'){
          return res.status(500).json({
            message: "Transaction has failed"
          })
        }
        if(isTransactionALreadyExists.status === 'reversed'){
          return res.status(500).json({
            message: "Transaction has been reversed"
          })
        }
      }

      /**
       * 3. Check account status of both accounts
       */
      if(fromUserAccount.status !== 'active' || toUserAccount.status !== 'active'){
        return res.status(400).json({
            message: "One or both accounts are not active"
        })
      }

      /**
       * 4. Derive sender balance from ledger
       */

      const balance = await fromUserAccount.getBalance()

      if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance. current balance is ${balance} and requested amount is ${amount}`
        })
      }
      let transaction
      try{

      
      /**
       * 5. Create transaction with status pending
       */
      const session = await mongoose.startSession()
      session.startTransaction()

      const transaction = (await transactionModel.create([{
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "pending"
      }], { session }))[0]

      

      const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: 'debit'
      }],{ session })

      await (()=>{
        return new Promise((resolve)=>setTimeout(resolve, 15*1000))
      })()

      const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: 'credit'
      }],{ session })


      // transaction.status= 'completed'
      // await transaction.save({ session })
      await transactionModel.findOneAndUpdate(
        {_id: transaction._id}, 
        {status: 'completed'}, 
        {session}
      )

      await session.commitTransaction()
      session.endSession()
    }catch(error){
      return res.status(400).json({
        message: "Transaction is Pending due to some issue, please retry after some time",
      })
    }

      /**
       * 10. send email notification
       */

      await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

      return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
      })


    }

async function createInitialFundsTransactionController(req, res){
   const {toAccount, amount, idempotencyKey} = req.body

   if(!toAccount || !amount || !idempotencyKey){
    return res.status(400).json({
        message: "To account, amount and idempotency key are required"
    })
   }

   const toUserAccount = await accountModel.findOne({
    _id: toAccount
   })

   if(!toUserAccount){
    return res.status(400).json({
        message: "To account not found"
    })
   }

   const fromUserAccount = await accountModel.findOne({
    
    user: req.user._id

   })

   if(!fromUserAccount){
       return res.status(400).json({
        message: "System user account not found"
       })
   }


   //initiating a session for transaction
    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: 'pending'
    })
  
    const debitLedgerEntry = await ledgerModel.create([{
      account: fromUserAccount._id,
      amount: amount,
      transaction: transaction._id,
      type: 'debit'
    
    }],{ session })

    const creditLedgerEntry = await ledgerModel.create([{
      account: toAccount,
      amount: amount,
      transaction: transaction._id,
      type: 'credit'
    }],{ session })

    transaction.status= 'completed'
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction: transaction
    })

}


module.exports = {
    createTransactionController,
    createInitialFundsTransactionController
}