const semver = require('semver');
const AppError = require("../utils/appError");
const User = require("./../models/userModel");
const { format } = require("util");
const QuickOrder = require("./../models/quickOrderModel");
const catchAsync = require("../utils/catchAsync");
const ErrorMsgs = require("./../utils/ErrorMsgsConstants");
const Record = require("../models/recordModel");
const cloudinary = require("../utils/cloudinaryConfiguration");
const { notifyDeliveryUsers} = require("../utils/sendNotification");
const { handleUpdatingAndStoringElement } = require("../utils/firebaseStorage");
const { bucket } = require("../utils/firebaseConfiguration");
const { SafeTransaction, AddingType, TransactionType } = require('../models/safeTransactionModel');


async function addRecordsToQuickOrders(quickOrders) {
  const quickOrderIds = quickOrders.map((quickOrder) => quickOrder._id);

  const foundRecords = await Record.find({ quickOrder: { $in: quickOrderIds } });

  return quickOrders
    .map((quickOrder) => {
      const matchedRecord = foundRecords.find(
        (foundRecord) =>
          String(quickOrder._id) === String(foundRecord.quickOrder)
      );

      if (matchedRecord) {
        return { ...quickOrder._doc, audio: matchedRecord.audio };
      } else {
        return { ...quickOrder._doc };
      }
    })
    .filter(
      (element, index, self) =>
        index === self.findIndex((e) => e._id === element._id)
    );
}

//@desc Add quick order and notify all delivery boys
//@route POST /api/v1/quickOrders/
//access PUBLIC
//NOTE we pass here the user who made the quick order in the body of the req.
exports.addQuickOrder = catchAsync(async (req, res, next) => {
  let createdOrder;

  if (!req.file) {
    createdOrder = await QuickOrder.create(req.body);
  } else {
    const fileName = `quickOrders/${req.file.originalname}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream();

    await new Promise((resolve, reject) => {
      blobStream.on("finish", resolve);
      blobStream.on("error", reject);
      blobStream.end(req.file.buffer);
    });

    const photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    const orderDataWithPhoto = { ...req.body, photo: photoUrl };
    createdOrder = await QuickOrder.create(orderDataWithPhoto);
  }

  await notifyDeliveryUsers(req.query.userType);

  res.status(200).json({
    status: "success",
    createdOrder,
  });
});

//@desc Delete quick order by passing quick order ID
//@route DELETE /api/v1/quickOrders/
//access PUBLIC
exports.deleteQuickOrder = catchAsync(async (req, res, next) => {
  let { quickOrderId } = req.query;
  let deletedQuickOrder = await QuickOrder.findOneAndDelete({
    _id: quickOrderId,
  });

  let foundRecord = await Record.findOne({ quickOrder: quickOrderId });

  if (foundRecord) {
    cloudinary.uploader
      .destroy(foundRecord.public_id, { resource_type: "video" })
      .then((result, err) => {
        res.status(200).json({
          status: "success",
        });
      });
  } else {
    res.status(200).json({
      status: "success",
    });
  }
});
//@desc Get quick order by passing quick order ID
//@route GET /api/v1/quickOrders/
//access PUBLIC
exports.getQuickOrderById = catchAsync(async (req, res, next) => {
  let { quickOrderId } = req.query;
  let foundQuickOrder = await QuickOrder.findOne({
    _id: quickOrderId,
  })
    .populate("user")
    .populate("delivery");
  let data;

  let foundRecord = await Record.findOne({ quickOrder: quickOrderId });

  if (foundRecord) {
    data = {
      ...foundQuickOrder._doc,
      audio: foundRecord.audio,
    };
    res.status(200).json({
      status: "success",
      data,
    });
  } else {
    res.status(200).json({
      status: "success",
      foundQuickOrder,
    });
  }
});
//@desc Update quick order by passing quick order ID and deliveryId
//@route GET /api/v1/quickOrders/
//access PUBLIC
exports.updateQuickOrder = catchAsync(async (req, res, next) => {
  let { deliveryId, quickOrderId } = req.query;
  let quickOrder = await QuickOrder.findOne({ _id: quickOrderId });

  let delivery = await User.findOne({ _id: deliveryId });

  if (delivery !== null && delivery.blocked) return next(new AppError("لقد تم حظرك يرجي تسجيل الخروج لعدم تلقي الاشعارات", 400));

  if (deliveryId && delivery === null) {
    return next(new AppError("لا يوجد مستخدم ", 400));
  }

  if (quickOrder.delivery) {
    if (deliveryId) {
      return next(new AppError("لقد تم استلام الطلب من طيار اخر", 400));
    } else {
      handleUpdatingAndStoringElement("quickOrders", req, res, quickOrderId);
    }
  } else if (quickOrder.delivery === null) {
    req.body = { ...req.body, delivery: deliveryId };
    handleUpdatingAndStoringElement("quickOrders", req, res, quickOrderId);
  }
});
function isUpdatedVersion(version) {
  if (version == null || version === "") return false;
  const latestUpdatedVersion = "1.9.0";
  if (semver.gt(version, latestUpdatedVersion)) {
    return true;
  } else {
    return false;
  }
}
//@desc Get quick orders by passing deliveryId
//@route GET /api/v1/quickOrders/quickOrdersForDelivery
//access PUBLIC
//Note if we didnt pass deliveryId we will get all quickorders that are not assigned for delivery
exports.getQuickOrdersForDelivery = catchAsync(async (req, res, next) => {
  let status = req.query?.status;
  let version = req.query.version;
  if (req.query.deliveryId) {
    let quickOrders = status
      ? await QuickOrder.find({
        delivery: req.query.deliveryId,
        status,
      })
        .populate("delivery")
        .populate("user")
        .sort({ _id: -1 })
        .limit(500)
      : await QuickOrder.find({
        delivery: req.query.deliveryId,
      })
        .populate("delivery")
        .populate("user")
        .sort({ _id: -1 })
        .limit(500);

    let data = await addRecordsToQuickOrders(quickOrders);
    res.status(200).json({
      status: "success",
      data: data
    });

  } else {
    //Todo need to handled in iOS
    // if (!isUpdatedVersion(version)) {
    //   return next(new AppError(ErrorMsgs.APP_NOT_UPDATED, 400));
    // }
    let quickOrders = status
      ? await QuickOrder.find({
        delivery: null,
        status,
      })
        .populate("delivery")
        .populate("user")
        .sort({ _id: -1 })
        .limit(500)
      : await QuickOrder.find({
        delivery: null,
      })
        .populate("delivery")
        .populate("user")
        .sort({ _id: -1 })
        .limit(500);

    let data = await addRecordsToQuickOrders(quickOrders);

    res.status(200).json({
      status: "success",
      data: data,
    });
  }
}
);
//@desc Get all quick orders
//@route GET /api/v1/quickOrders/
//access PUBLIC
exports.getAllQuickOrders = catchAsync(async (req, res, next) => {
  let quickOrders = await QuickOrder.find()
    .populate("user")
    .populate("delivery")
    .sort({ _id: -1 })
    .limit(500);

  let data = await addRecordsToQuickOrders(quickOrders);

  res.status(200).json({
    status: "success",
    data: data,
  });
}
);

//@desc Delete multiple quick orders
//@route Delete /api/v1/quickOrders/
//access PUBLIC
exports.deleteMultipleQuickOrders = catchAsync(async (req, res, next) => {
  if (req.body.quickOrders.length === 0) {
    return next(new AppError(ErrorMsgs.INVALID_QUICK_ORDERS, 400));
  }
  let { quickOrders } = req.body;
  let public_ids = [];
  for (let i = 0; i < quickOrders.length; i++) {
    let foundRecord = await Record.findOne({ quickOrder: quickOrders[i] });
    if (foundRecord) {
      public_ids.push(foundRecord.public_id);
    }
  }

  //Public_ids are array of the records to be deleted => we delete through the public_id
  if (public_ids.length) {
    await cloudinary.api.delete_resources(public_ids, {
      resource_type: "video",
    });
  }

  let deletedQuickOrder = await QuickOrder.deleteMany({
    _id: {
      $in: quickOrders,
    },
  });
  res.status(200).json({
    status: "success",
    count: deletedQuickOrder.deletedCount,
  });
});

exports.getQuickOrdersForUser = catchAsync(async (req, res, next) => {
  let { userId } = req.query;
  let status = req.query?.status;

  let quickOrders = status
    ? await QuickOrder.find({ user: userId, status }).populate("delivery")
    : await QuickOrder.find({ user: userId }).populate("delivery");


  let data = await addRecordsToQuickOrders(quickOrders);

  res.status(200).json({
    status: "success",
    count: quickOrders.length,
    data: data.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    }),
  });
}
);
//@desc Set multiple quick orders delivery to be null
//@route patch /api/v1/quickOrders/updateMultipleQuickOrders
//access PUBLIC
exports.updateQuickOrders = catchAsync(async (req, res, next) => {
  let quickOrdersNumber = req.body.quickOrders.length;
  if (quickOrdersNumber === 0) {
    return next(new AppError("من فضلك ادخل الاوردرات صحيحا", 400));
  }
  let { status, deliveryId, ordersTotalMoney, profit } = req.query;
  let { quickOrders } = req.body;

  await QuickOrder.updateMany(
    {
      _id: {
        $in: quickOrders,
      },
    },
    {
      $set: { status: status },
    }
  );
//Todo to be removed 
  let user;
  if (deliveryId != null) {
    const update = {
      $inc: {
        totalOrders: quickOrdersNumber,
        totalOrdersMoney: ordersTotalMoney,
        accountBalance: profit
      }
    };

    user = await User.findByIdAndUpdate(
      deliveryId,
      update,
      { new: true }
    );

  }
  res.status(200).json({
    status: "success",
    user
  });
});

//@desc Get quick orders by status by passing status of the quickOrder as a query param
//@route GET /api/v1/quickOrders/status
//access PUBLIC
exports.getQuickOrdersByStatus = catchAsync(async (req, res, next) => {
  let quickOrders = await QuickOrder.find({ status: req.query.status })
    .populate("user")
    .populate("delivery")
    .sort({ _id: -1 })
    .limit(500);
  let data = await addRecordsToQuickOrders(quickOrders);
  res.status(200).json({
    status: "success",
    data: data
  });
});

async function getDeliveryQuickOrdersWithDebts(deliveryId) {
  let quickOrders = deliveryId ? await QuickOrder.find({
    delivery: deliveryId,
    debt: { $gt: 0 } // Filter: debt greater than 0
  })
    .populate("delivery")
    .populate("user")
    .sort({ _id: -1 })
    .limit(500)
    : await QuickOrder.find({
      debt: { $gt: 0 } // Filter: debt greater than 0
    })
      .populate("delivery")
      .populate("user")
      .sort({ _id: -1 })
      .limit(500);

  return await addRecordsToQuickOrders(quickOrders);

}

//@desc Get Delivery quickorders that contains debts
//@route GET /api/v1/debtsQuickOrders?deliveryId
//acess PUBLIC
exports.getDeliveryQuickOrdersDebts = catchAsync(async (req, res, next) => {

  let deliveryId = req.query.deliveryId;
  let quickOrders = await getDeliveryQuickOrdersWithDebts(deliveryId);
  res.status(200).json({ status: "success", data: quickOrders });

});

//@desc settle delivery delivered quickOrders
//@route POST /api/v1/settleDeliveryQuickOrders?deliveryId
//acess PUBLIC
exports.settleDeliveryQuickOrders = catchAsync(async(req, res, next)=>{
  let quickOrdersNumber = req.body.quickOrders.length;
  if ( quickOrdersNumber === 0) {
    return next(new AppError("من فضلك ادخل الاوردرات صحيحا", 400));
  }
  let { deliveryId, userAddedId, ordersTotalMoney ,profit} = req.query;
  let { quickOrders } = req.body;

  await QuickOrder.updateMany(
    {
      _id: {
        $in: quickOrders,
      },
    },
    {
      $set: { status: "done"},
    }
  );
  let user;
  if (deliveryId != null) {
    const update = {
      $inc: {
        totalOrders: quickOrdersNumber,
        totalOrdersMoney: ordersTotalMoney,
        accountBalance: profit
      }
    };

   user =  await User.findByIdAndUpdate(
      deliveryId,
      update,
      { new: true }
    );
    await SafeTransaction.create({
      user:userAddedId,
      delivery:deliveryId,
      amount:ordersTotalMoney,
      transactionType: TransactionType.SETTLE,
      addingType: AddingType.ADDING
  });
  }

  res.status(200).json({
    status: "success",
    user
  });
});
