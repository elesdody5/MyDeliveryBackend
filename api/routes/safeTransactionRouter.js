const express = require("express");
const router = express.Router(); 
const {
  getAllSafeTransactions,
  addSafeTransaction
} = require("./../controllers/safeTransactionController");
router.route("/").get(getAllSafeTransactions);
router.route("/").post(addSafeTransaction);
module.exports = router;