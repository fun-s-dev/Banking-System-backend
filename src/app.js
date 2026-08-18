const express = require('express')
const cookieParser = require('cookie-parser')
// create and then config
const app = express()

app.use(express.json())
app.use(cookieParser())

/**
 * - routes required
 */
const authRouter = require('./routes/auth.routes')
const accountRouter = require('./routes/account.routes')
const transactionRoutes = require('./routes/transaction.routes')

/**
 * - use routes
 */
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/auth", authRouter)

module.exports = app