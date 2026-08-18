const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();


/**
 * - POST /api/accounts/
 * - create new account
 * - protected route
 */

router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)


/**
 * - GET /api/accounts/
 * - get all accounts of logged-in user
 * - protected route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)
 

/**
 * - GET /api/accounts/balance/:accountId
 * - get balance of logged-in user
 * - protected route
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports = router