const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  name: {
    required: true,
    type: String,
  },
  category: {
    required: false,
    type: [],
  },
  power_socket: {
    required: false,
    type: [],
  },
});

module.exports = mongoose.model("user", dataSchema);
