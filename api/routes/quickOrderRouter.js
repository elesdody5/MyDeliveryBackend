const express = require("express");
const router = express.Router(); //We created sub application for quickOrders
const { uploadPhoto, resizePhoto } = require("../utils/multerConfiguration");
const { protect } = require("./../controllers/authController");
const {
  addQuickOrder,
  deleteQuickOrder,
  getQuickOrderById,
  updateQuickOrder,
  getQuickOrdersForDelivery,
  getAllQuickOrders,
  deleteMultipleQuickOrders,
  getQuickOrdersForUser,
  updateQuickOrders,
  getQuickOrdersByStatus,
  getDeliveryQuickOrdersDebts,
  settleDeliveryQuickOrders
  
} = require("./../controllers/quickOrderController");

const {
  checkForIdExistenceAndValidityQuickOrder,
  checkForIdExistenceAndValidityUser,

} = require("../utils/checkForId");

router
  .route("/")
  .post(uploadPhoto, resizePhoto, addQuickOrder)
  .delete(checkForIdExistenceAndValidityQuickOrder, deleteQuickOrder)
  .patch(
    uploadPhoto,
    resizePhoto,
    checkForIdExistenceAndValidityQuickOrder,
    updateQuickOrder
  )
  .get(getAllQuickOrders);

router.get(
  "/quickOrder",
  checkForIdExistenceAndValidityQuickOrder,
  getQuickOrderById
);

router.get(
  "/quickOrder",
  checkForIdExistenceAndValidityQuickOrder,
  getQuickOrderById
);
router.get("/status",getQuickOrdersByStatus);

router.delete("/deleteMany", deleteMultipleQuickOrders);
router.patch("/updateMultipleQuickOrders",updateQuickOrders)

router.route("/quickOrdersForDelivery").get(getQuickOrdersForDelivery);
router.route("/getDeliveryQuickOrdersDebts").get(getDeliveryQuickOrdersDebts);
router.route("/settleDeliveryQuickOrders").post(settleDeliveryQuickOrders);
router
  .route("/quickOrdersForUser")
  .get(checkForIdExistenceAndValidityUser, getQuickOrdersForUser);

module.exports = router;
