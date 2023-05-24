const express = require("express");

const router = express.Router();

module.exports = router;

const power_socket = require("../models/power_socket");

const user = require("../models/user");

const not_your_power_socket = "This isn't your power socket";
const user_not_found = "user not found";
const power_socket_not_found = "power socket not found";
const update_failed = "update failed due to internal server error";
const delete_failed = "delete failed due to internal server error";

// register user
router.post("/user", async (req, res) => {
  const data = new user({
    name: req.body.name,
  });
  try {
    const dataToSave = await data.save();
    res.status(200).json(dataToSave._id);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// register new power socket
router.post("/power_socket", async (req, res) => {
  let user_id = req.body.user_id;
  const data = new power_socket({
    user: user_id,
    category: req.body.category,
    name: req.body.name,
    power: [],
  });
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // register power_socket to table
    const new_power_socket = await data.save();

    // update power_socket array
    let power_socket = target_user.power_socket;
    power_socket.push(new_power_socket._id);
    const options = { new: true };
    const result = await user.findByIdAndUpdate(
      user_id,
      { power_socket: power_socket },
      options
    );
    if (result == null) {
      throw update_failed;
    }
    res.status(200).json(new_power_socket);
  } catch (error) {
    if (error == user_not_found) {
      res.status(404).json({ message: error });
    } else if (error == update_failed) {
      res.status(500).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// get all power sockets
router.get("/power_socket", async (req, res) => {
  const user_id = req.body.user_id;
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // return power_socket array
    let power_socket_array = target_user.power_socket;
    res.status(200).json(power_socket_array);
  } catch (error) {
    if (error == user_not_found) {
      res.status(404).json({ message: error });
    } else {
      user_id;
      res.status(400).json({ message: error.message });
    }
  }
});

// get one power socket
router.get("/power_socket/:id", async (req, res) => {
  const user_id = req.body.user_id;
  const power_socket_id = req.params.id;
  try {
    // find power socket
    const target_power_socket = await power_socket.findById(power_socket_id);
    if (target_power_socket == null) {
      throw power_socket_not_found;
    }

    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // verify power_socket is owned by the user
    let verified = false;
    let power_socket_array = target_user.power_socket;
    let array_length = power_socket_array.length;
    for (let i = 0; i < array_length; i++) {
      if (power_socket_array[i] == power_socket_id) {
        verified = true;
        break;
      }
    }

    if (verified) {
      res.status(200).json(target_power_socket);
    } else {
      throw not_your_power_socket;
    }
  } catch (error) {
    if (error == user_not_found || error == power_socket_not_found) {
      res.status(404).json({ message: error });
    } else if (error == not_your_power_socket) {
      res.status(401).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// edit power socket
router.patch("/power_socket/:id", async (req, res) => {
  const user_id = req.body.user_id;
  let newData = req.body;
  delete newData.user;
  const power_socket_id = req.params.id;
  const options = { new: true };
  try {
    // find power socket
    const target_power_socket = await power_socket.findById(power_socket_id);
    if (target_power_socket == null) {
      throw power_socket_not_found;
    }

    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // verify power_socket is owned by the user
    let verified = false;
    let power_socket_array = target_user.power_socket;
    let array_length = power_socket_array.length;
    for (let i = 0; i < array_length; i++) {
      if (power_socket_array[i] == power_socket_id) {
        verified = true;
        break;
      }
    }

    if (verified) {
      // update power socket data
      const result = await power_socket.findByIdAndUpdate(
        power_socket_id,
        newData,
        options
      );
      res.status(200).json(result);
    } else {
      throw not_your_power_socket;
    }
  } catch (error) {
    if (error == user_not_found || error == power_socket_not_found) {
      res.status(404).json({ message: error });
    } else if (error == not_your_power_socket) {
      res.status(401).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// delete one power socket
router.delete("/power_socket/:id", async (req, res) => {
  const user_id = req.body.user_id;
  const power_socket_id = req.params.id;
  try {
    // find power socket
    const target_power_socket = await power_socket.findById(power_socket_id);
    if (target_power_socket == null) {
      throw power_socket_not_found;
    }

    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // verify power_socket is owned by the user
    verified = false;
    let power_socket_array = target_user.power_socket;
    let array_length = power_socket_array.length;
    let index = -1;
    for (let i = 0; i < array_length; i++) {
      if (power_socket_array[i] == power_socket_id) {
        verified = true;
        index = i;
        break;
      }
    }

    if (verified) {
      // delete power socket from power_socket table
      const delete_result = await power_socket.findByIdAndDelete(
        power_socket_id
      );
      if (delete_result == null) {
        throw delete_failed;
      }

      //delete power socket from user power_socket array
      let power_socket_array = target_user.power_socket;
      power_socket_array.splice(index, 1);

      const options = { new: true };
      const update_array_result = await user.findByIdAndUpdate(
        user_id,
        { power_socket: power_socket_array },
        options
      );
      res.status(200).json(update_array_result);
    } else {
      throw not_your_power_socket;
    }
  } catch (error) {
    if (error == user_not_found || error == power_socket_not_found) {
      res.status(404).json({ message: error });
    } else if (error == not_your_power_socket) {
      res.status(401).json({ message: error });
    } else if (error == delete_failed) {
      res.status(500).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// delete all power sockets
router.delete("/power_socket", async (req, res) => {
  const user_id = req.body.user_id;
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // delete power sockets from power socket table one at a time
    const target_power_sockets = target_user.power_socket;
    target_power_sockets.forEach(async function (power_socket_id) {
      const delete_result = await power_socket.findByIdAndDelete(
        power_socket_id
      );
      if (delete_result == null) {
        throw delete_failed;
      }
    });

    // empty user power_socket array
    const options = { new: true };
    const update_array_result = await user.findByIdAndUpdate(
      user_id,
      { power_socket: [] },
      options
    );
    if(update_array_result == null){
      throw delete_failed
    }
    else{
      res.status(200).json(update_array_result);
    }
  } catch (error) {
    if (error == user_not_found) {
      res.status(404).json({ message: error });
    } else if (error == delete_failed) {
      res.status(500).json({ message: error });
    } 
  }
});
