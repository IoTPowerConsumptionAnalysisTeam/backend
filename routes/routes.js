const express = require("express");

const router = express.Router();

module.exports = router;

const power_socket = require("../models/power_socket");

const user = require("../models/user");

//register user
router.post("/user", async (req, res) => {
  const data = new user({
    name: req.body.name,
  });
  try {
    const dataToSave = await data.save();
    console.log(dataToSave);
    res.status(200).json(dataToSave._id);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//register new power socket
router.post("/power_socket", async (req, res) => {
  const data = new power_socket({
    user: req.query.user_token,
    category: req.body.category,
    name: req.body.name,
    power: [],
  });
  try {
    // find user
    const target_user = await user.findById(req.query.user_token);
    if (target_user == null) {
      throw "user not found";
    }

    //register power_socket to table
    const new_power_socket = await data.save(req.query.user_token);

    // update power_socket array
    let power_socket = target_user.power_socket;
    power_socket.push(new_power_socket._id);
    const options = { new: true };
    const result = await user.findByIdAndUpdate(
      req.query.user_token,
      { power_socket: power_socket },
      options
    );
    res.status(200).json("Registered succeed!");
  } catch (error) {
    if (error == "user not found") {
      res.status(404).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});
