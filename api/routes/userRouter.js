const express = require("express");
const router = express.Router(); //We created sub application for users

const { uploadPhoto, resizePhoto } = require("../utils/multerConfiguration");
const {
  signup,
  updatePassword,
  protect,
  loginWithPhone,
  forgetPassword,
  verifyAndReset,
  verifyPhoneNumber,
} = require("./../controllers/authController");

let {
  getAllUsers,
  getUserById,
  getUserByType,
  updateUserById,
  getUsersByService,
  updateNotificationToken,
  notifyDeliveryAndShops,
  deleteUserById,
  notifyAllUsers,
  notifySingleUser,
} = require("./../controllers/userController");

let {
  checkForIdExistenceAndValidityService,
  checkForIdExistenceAndValidityUser,
} = require("../utils/checkForId");

//Passing uploaduserphoto and resizeuserphoto middlewares before signing up
router.post("/signup", uploadPhoto, resizePhoto, signup);
router.patch("/updateMyPassword", protect, updatePassword);
router.post("/loginWithPhone", loginWithPhone);
router.get("/type", getUserByType);
router.get(
  "/service",
  checkForIdExistenceAndValidityService,
  getUsersByService
);

router.get("/verifyPhoneNumber", verifyPhoneNumber);

// Endpoint for updating the token
router.patch("/notificationToken", updateNotificationToken);

router.route("/").get(getAllUsers);

router
  .route("/user")
  .get(getUserById)
  .patch(
    checkForIdExistenceAndValidityUser,
    uploadPhoto,
    resizePhoto,
    updateUserById
  )
  .delete(checkForIdExistenceAndValidityUser, deleteUserById);
router.route("/forgetPassword").post(forgetPassword);
router.route("/verifyAndReset").post(verifyAndReset);
router.route("/notifyDeliveryAndShops").post(notifyDeliveryAndShops);
router.route("/notifyAllUsers").post(notifyAllUsers);
router
  .route("/notifySingleUser")
  .post(checkForIdExistenceAndValidityUser, notifySingleUser);

module.exports = router;
