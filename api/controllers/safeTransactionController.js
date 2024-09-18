const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { SafeTransaction, AddingType, TransactionType }  = require("./../models/safeTransactionModel");
const ErrorMsgs = require("./../utils/ErrorMsgsConstants");

exports.getAllSafeTransactions = catchAsync(async (req, res, next) => {
    let transactions = await SafeTransaction.find()
    .populate("user")
    .populate("delivery")
    .sort({ _id: -1 })
    .limit(500);
    

    let totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
   
    res.status(200).json({
      totalAmount: totalAmount,
      transactions: transactions,
    });
  });

  exports.addSafeTransaction = catchAsync(async (req, res, next) => {
    let transaction = await SafeTransaction.create(req.body);   
    res.status(200).json({
      transaction
    });
  });