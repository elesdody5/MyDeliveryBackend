const express = require("express");
const router = express.Router(); 
const {
  getAllSafeTransactions,
} = require("./../controllers/safeTransactionController");
router.route("/").get(getAllSafeTransactions);
module.exports = router;