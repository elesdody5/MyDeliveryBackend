const express = require("express");
const router = express.Router(); 
const {
  getAllSafeTransactions,
  addSafeTransaction,
  deleteSafeTransaction
} = require("./../controllers/safeTransactionController");
router.route("/").get(getAllSafeTransactions);
router.route("/").post(addSafeTransaction);
router.route("/").delete(deleteSafeTransaction);
module.exports = router;