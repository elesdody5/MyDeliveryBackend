const AppError = require("../utils/appError");
const User = require("./../models/userModel");
const Shop = require("./../models/shopModel");
const Review = require("./../models/reviewModel");
const catchAsync = require("../utils/catchAsync");
const ErrorMsgs = require("../utils/ErrorMsgsConstants");

const { handleUpdatingAndStoringElement } = require("../utils/firebaseStorage");
const Notification = require("./../models/notificationModel");

const { sendSingleNotificationUsingFCM } = require("../utils/sendNotification");
var mongoose = require("mongoose");

//@desc Get All Users
//@route Get /api/v1/users
//access PUBLIC
exports.getAllUsers = catchAsync(async (req, res, next) => {
  //We pass object with key(Field we wanna return or not) : Value -> 0 dont return it with the result , 1 return it
  let cityId = req.headers["cityid"] || "67360845822f9777a4d8d3b3";
  let users = await User.find({"address.city":cityId}, { password: 0 });

  res.status(200).json({
    status: "success",
    users,
  });
});

//@desc Get Users By ID
//@route Get /api/v1/users/user
//access PUBLIC
exports.getUserById = catchAsync(async (req, res, next) => {
  let { userId } = req.query;
  if (!userId) {
    return next(new AppError(ErrorMsgs.NO_USER_ID, 400));
  }
  let user = await User.findById(userId);
  //Here we checking for the userType --> if its delivery we will calculate avgRating and send it with the user document, if it is not we will just send the user.
  if (user.userType == "delivery") {
    let avgRating = null;
    let sum = null;
    let reviews = await Review.find({ delivery: req.query.userId });

    let rates = reviews.map((review) => review.rating);

    if (rates.length == 0) {
      //Here this delivery has no rates yet, so we will set the avg rating to be 0
      avgRating = 0;
    } else {
      sum = rates.reduce(
        (previousValue, currentValue) => previousValue + currentValue,
        0
      );
      avgRating = (sum / rates.length).toFixed(1);
    }
    //Concatinating the delivery doc with the calculated avg rating
    user = { ...user._doc, avgRating };
    res.status(200).json({
      status: "success",
      user,
    });
  } else {
    res.status(200).json({
      status: "success",
      user,
    });
  }
});

//@desc Get Users By special Type(User, Delivery, Vendor)
//@route Get /api/v1/users/type
//access PUBLIC
exports.getUserByType = catchAsync(async (req, res, next) => {
  let { userType } = req.query;
  let userTypeArray = ["user", "vendor", "delivery"];
  let cityId = req.headers["cityid"] || "67360845822f9777a4d8d3b3";

  if (!userType) {
    return next(new AppError(ErrorMsgs.NO_USERTYPE, 400));
  }
  !userTypeArray.includes(userType)
    ? next(new AppError(ErrorMsgs.NO_USERTYPE, 400))
    : (userType = userType);

  let users = await User.find({ userType ,"address.city":cityId});

  res.status(200).json({
    status: "success",
    users,
  });
});

//@desc Update User By ID
//@route PATCH /api/v1/users/user
//access PUBLIC
exports.updateUserById = catchAsync(async (req, res, next) => {
  let { userId } = req.query;
  handleUpdatingAndStoringElement("users", req, res, userId);
});

//@desc Get Users By service
//@route Get /api/v1/users/service
//access PUBLIC
exports.getUsersByService = catchAsync(async (req, res, next) => {
  let { serviceId } = req.query;
  let users = await User.find({
    service: mongoose.Types.ObjectId(serviceId),
  });
  res.status(200).json({
    status: "success",
    users,
  });
});

//@desc Update notificationToken ==> update token to a value provided in query or clear it if there is no value passed
//@route PATCH /api/v1/users/notificationToken
//access PUBLIC
exports.updateNotificationToken = catchAsync(async (req, res, next) => {
  const notificationToken = req.query.notificationToken;
  let foundUser;
  if (notificationToken) {
    foundUser = await User.findByIdAndUpdate(
      req.query.userId,
      { notificationToken },
      {
        new: true,
        runValidators: true,
      }
    );
  } else {
    foundUser = await User.findByIdAndUpdate(
      req.query.userId,
      { notificationToken: null },
      {
        new: true,
        runValidators: true,
      }
    );
  }
  res.status(200).json({
    status: "success",
    foundUser,
  });
});

//@desc Notify the shops provided in the order and all the delivery boys
//@route PATCH /api/v1/users/notifyDeliveryAndShops
//access PUBLIC
exports.notifyDeliveryAndShops = catchAsync(async (req, res, next) => {
  //Get the notification token from the id of the shop wants to be notified and assign it to the registeration token

  //We are hanlding if we want to nofiy only one shop or Multiple shops
  if (req.body.shopIds.length > 1) {
    //Here we returning actual shops docs
    let shopsToBeNotified = await Shop.find().where("_id").in(req.body.shopIds);

    //We are mapping to get the shop owners ids
    let shopOwnersIds = shopsToBeNotified.map((shop) => shop.owner);

    //Finding the actual owner docs(In user collection)
    let shopOwnersDocs = await User.find().where("_id").in(shopOwnersIds);

    const shopOwnerRegistrationTokens = shopOwnersDocs
      .map((owner) => owner.notificationToken)
      .filter((token) => token);

    //This condition is to make sure that there is shopOwnerRegisterationsTokens in the array.
    if (shopOwnerRegistrationTokens.length > 0) {
      for (let i = 0; i < shopOwnerRegistrationTokens.length; i++) {
        sendSingleNotificationUsingFCM(shopOwnerRegistrationTokens[i], {
          userType: "vendor",
          type: "order",
        });
      }
    }
  } else {
    let shopId = req.body.shopIds[0];

    let shopToBeNotified = await Shop.findOne({ _id: shopId });

    let shopOwnerId = shopToBeNotified.owner;

    let shopOwnerDoc = await User.findOne({ _id: shopOwnerId });

    let shopOwnerRegistrationToken = shopOwnerDoc.notificationToken;

    if (shopOwnerRegistrationToken !== null) {
      await sendSingleNotificationUsingFCM(shopOwnerRegistrationToken, {
        type: "order",
        userType: "vendor",
        shopId: String(shopToBeNotified._id),
      });
    }
  }

  //Filter in find for all the delivery boys to notify them.
  const users = await User.find({ userType: "delivery" });
  const userRegistrationTokens = users
    .map((user) => user.notificationToken)
    .filter((token) => token);
  // Will be sent to all the delivery in the system

  if (userRegistrationTokens.length > 0) {
    for (let i = 0; i < userRegistrationTokens.length; i++) {
      await sendSingleNotificationUsingFCM(userRegistrationTokens[i], {
        userType: "delivery",
        type: "order",
      });
    }
  }
  res.json({
    success: "success",
  });
});

//@desc Delete user by id
//@route Delete /api/v1/users/user ==> Pass user id to be deleted in the query params
//access PUBLIC
exports.deleteUserById = catchAsync(async (req, res, next) => {
  let { userId } = req.query;
  let deletedUser = await User.findOneAndDelete({
    _id: userId,
  });
  res.status(200).json({
    status: "success",
    deletedUser,
  });
});

//@desc Notify all users in the system
//@route Delete /api/v1/users/notifyAllUsers
//access PUBLIC
exports.notifyAllUsers = catchAsync(async (req, res, next) => {
  let userType = req.query.userType;
  const users = await User.find({ userType });

  // let data = [...users,...vendors]
  const userRegistrationTokens = users
    .map((user) => user.notificationToken)
    .filter((token) => token);

  if (userRegistrationTokens.length > 0) {
    for (let i = 0; i < userRegistrationTokens.length; i++) {
      await sendSingleNotificationUsingFCM(userRegistrationTokens[i], {
        title: req.body.title || "",
        msg: req.body.msg || "",
      });
    }
  }

  await Notification.create({ ...req.body, userType });
  res.status(200).json({
    status: "success",
  });
});
exports.notifySingleUser = catchAsync(async (req, res, next) => {
  let userId = req.query.userId;
  const user = await User.findOne({ _id: userId });
  let notificationToken = user.notificationToken;

  if (notificationToken !== "") {
    await sendSingleNotificationUsingFCM(notificationToken, {
      title: req.body.title || "",
      msg: req.body.msg || "",
      type: req.body.type || "",
      metadata: req.body.metadata || "",
    });
  }

  // let message = {
  //   to: String(notificationToken),
  //   data: {
  //     title: req.body.title || "",
  //     msg: req.body.msg || "",
  //     type: req.body.type || "",
  //     metadata: req.body.metadata || "",
  //   },
  // };
  // fcm.send(message, (err, response) => {
  //   if (err) {
  //     console.log("Something has gone wrong!", err);
  //   } else {
  //     console.log("Successfully sent with response: ", response.results);
  //   }
  // });

  res.status(200).json({
    status: "success",
  });
});
