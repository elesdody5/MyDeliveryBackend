const mongoose = require("mongoose");

const quickOrderSchema = new mongoose.Schema({
  address: {
    type: String,
  },
  inCity: {
    type: Boolean,
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  userPhone: {
    type: String,
  },
  description: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: {
    type: String,
  },
  useType: {
    type: String,
  },
  count: {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  photo: { type: String },
  debt: { type: Number, default: 0 },
  price: {
    type: Number,
  },
  withDeliveryTime: {
    type: String,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    default: "67360845822f9777a4d8d3b3",
  },
});

const QuickOrder = new mongoose.model("QuickOrder", quickOrderSchema);
module.exports = QuickOrder;
