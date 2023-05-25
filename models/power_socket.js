const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  user: {
    required: true,
    type: String,
  },
  category: {
    required: true,
    type: String,
  },
  name: {
    required: true,
    type: String,
  },
  power: {
    required: false,
    type: [],
  },
});

module.exports = mongoose.model("power_socket", dataSchema);
