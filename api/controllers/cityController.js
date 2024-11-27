const catchAsync = require("../utils/catchAsync");
const City = require("../models/cityModel");

//@desc Get all cities
//@route Get /api/v1/city/
//access PUBLIC
exports.getAllCities = catchAsync(async (req, res, next) => {
    let cities = await City.find({});
    res.status(200).json({
      status: "success",
      cities,
    });
  });

// @desc city
// @route POST /api/v1/city 
// access PUBLIC
exports.addCity = catchAsync(async (req, res, next) => {
    let city = await City.create(req.body);
    res.status(200).json({
      status: "success",
      city,
    });
  });