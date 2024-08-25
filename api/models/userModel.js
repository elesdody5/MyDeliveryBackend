const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
    minLength: 8,
  },
  passwordConfirm: {
    type: String,
  },
  address: {
    longitude: {
      type: String,
    },
    lattitude: {
      type: String,
    },
  },
  fullAddress: {
    type: String,
  },
  passwordChangedAt: Date,
  photo: { type: String },
  phone: {
    type: String,
  },
  userType: {
    type: String,
  },
  isFirstTime: {
    type: Boolean,
  },
  score: {
    type: Number,
    default: null,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    default: null,
  },
  notificationToken: {
    type: String,
    default: null,
  },
  blocked: {
    type: Boolean,
    default: null,
  },

  adminBlocked: {
    type: Boolean,
    default: false,
  },

  code: {
    type: Number,
    default: null,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalOrdersMoney: {
    type: Number,
    default: 0,
  },
  accountBalance: {
    type: Number,
    default: 0,
  },
});

userSchema.pre("save", async function (next) {
  //Only run this function if password was modified
  if (!this.isModified("password")) return next(); //if the signle document isnt changed
  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});
/*Function takes the password that the user passes it in the body(not hased)
and the real password of the user that is stored in DB(hashed)*/
userSchema.methods.correctPassword = async function (
  //this method is available for any document in the DB
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimestamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  //This token will be sent to the user and then user can create new PASSWORD
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
