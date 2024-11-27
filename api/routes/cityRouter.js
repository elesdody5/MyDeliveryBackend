const express = require("express");
const router = express.Router(); 
const { protect } = require("./../controllers/authController");


const {
    getAllCities,
    addCity
} = require("../controllers/cityController");

router
  .route("/")
  .get(getAllCities)
  .post(addCity);

module.exports = router;
