const {Router} = require('express');
const authMiddleware = require('../middleware/auth.middleware')
const transactionController = require('../controllers/transaction.controller')
const transactionRoutes = Router();

/**
 * POST /api/transactions
 * @description - create a new transaction
 * @access - private
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransactionController)


/**
 * POST /api/transactions/system/initial-funds
 * @description - create a new transaction for initial funds
 */

transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransactionController)

module.exports = transactionRoutes;