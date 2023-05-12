const mongoose = require('mongoose');

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
  power:{
    required: true,
    type: Number
  }
});

module.exports = mongoose.model('Data', dataSchema);