const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String
  },
});

const City = new mongoose.model('City', citySchema);
module.exports = City;