const express = require("express");

const router = express.Router();

module.exports = router;

const power_socket = require("../models/power_socket");

const user = require("../models/user");

const not_your_power_socket = "This isn't your power socket";
const user_not_found = "user not found";
const power_socket_not_found = "power socket not found";
const category_not_found = "category not found";
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
async function findUser(req, res, next) {
  try {
    const user_id = req.params.user_id;
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }
    req.target_user = target_user; // Store the found user in the request object
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    // Handle the error if needed
    res.status(404).json({ error: "User not found" });
  }
}

// register new power socket
router.post("/user/:user_id/power_socket", findUser,async (req, res) => {
  let user_id = req.params.user_id;
  const data = new power_socket({
    user: user_id,
    category: req.body.category,
    name: req.body.name,
    power: [],
  });
  try {
    // register power_socket to table
    const new_power_socket = await data.save();

    // update power_socket array
    let power_socket = req.target_user.power_socket;
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
    if (error == update_failed) {
      res.status(500).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// get all power sockets
router.get("/user/:user_id/power_socket", findUser,async (req, res) => {
  try {
    // return power_socket array
    let power_socket_array = req.target_user.power_socket;
    res.status(200).json(power_socket_array);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

// get one power socket
router.get("/user/:user_id/power_socket/:id", findUser,async (req, res) => {
  const power_socket_id = req.params.id;
  try {
    // find power socket
    const target_power_socket = await power_socket.findById(power_socket_id);
    if (target_power_socket == null) {
      throw power_socket_not_found;
    }

    // verify power_socket is owned by the user
    let verified = false;
    let power_socket_array = req.target_user.power_socket;
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
    if (error == power_socket_not_found) {
      res.status(404).json({ message: error });
    } else if (error == not_your_power_socket) {
      res.status(401).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// edit power socket
router.patch("/user/:user_id/power_socket/:id", findUser, async (req, res) => {
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

    // verify power_socket is owned by the user
    let verified = false;
    let power_socket_array = req.target_user.power_socket;
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
    if (error == power_socket_not_found) {
      res.status(404).json({ message: error });
    } else if (error == not_your_power_socket) {
      res.status(401).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// delete one power socket
router.delete("/user/:user_id/power_socket/:id", findUser, async (req, res) => {
  const user_id = req.params.user_id;
  const power_socket_id = req.params.id;
  try {
    // find power socket
    const target_power_socket = await power_socket.findById(power_socket_id);
    if (target_power_socket == null) {
      throw power_socket_not_found;
    }

    // verify power_socket is owned by the user
    verified = false;
    let power_socket_array = req.target_user.power_socket;
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
      let power_socket_array = req.target_user.power_socket;
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
    if ( error == power_socket_not_found) {
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
router.delete("/user/:user_id/power_socket", findUser, async (req, res) => {
  const user_id = req.params.user_id;
  try {
    // delete power sockets from power socket table one at a time
    const target_power_sockets = req.target_user.power_socket;
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
    if (update_array_result == null) {
      throw delete_failed;
    } else {
      res.status(200).json(update_array_result);
    }
  } catch (error) {
    if (error == delete_failed) {
      res.status(500).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

//__________________CATEGORY______________________________________

// add a category
router.post("/user/:user_id/category", async (req, res) => {
  const user_id = req.params.user_id;
  const new_category = req.body.new_category;
  const options = { new: true };
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }
    // update category array
    if (target_user.category != undefined) {
      target_user.category.push(new_category);
    } else {
      categories = [new_category];
    }

    const result = await user.findByIdAndUpdate(
      user_id,
      { category: target_user.category },
      options
    );
    if (result == null) {
      throw update_failed;
    } else {
      res.status(200).json(result);
    }
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

// get all categories
router.get("/user/:user_id/category", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // update category array
    let categories = target_user.category;
    res.status(200).json(categories);
  } catch (error) {
    if (error == user_not_found) {
      res.status(404).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// get one category index
router.get("/user/:user_id/category/:category_name", async (req, res) => {
  const user_id = req.params.user_id;
  const target_category = req.params.category_name;
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // find category index
    let categories = target_user.category;
    let notfound = 1;
    for (let i = 0; i < categories.length; i++) {
      if (categories[i] == target_category) {
        res.status(200).json({ index: i });
        notfound = 0;
      }
    }
    if (notfound) {
      throw category_not_found;
    }
  } catch (error) {
    if (error == user_not_found || error == category_not_found) {
      res.status(404).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// edit a category
router.patch("/user/:user_id/category", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }
    if (target_user.category.length == 0) {
      throw category_not_found;
    }
    let not_found = 1,
      target_index = -1;
    const origin_name = req.body.origin_name;
    const new_name = req.body.new_name;
    for (let i = 0; i < target_user.category.length; i++) {
      if (target_user.category[i] == origin_name) {
        target_index = i;
        not_found = 0;
      }
    }
    if (not_found) {
      throw category_not_found;
    } else {
      // edit name in user category array
      target_user.category[target_index] = new_name;
      const options = { new: true };
      const result = await user.findByIdAndUpdate(
        user_id,
        { category: target_user.category },
        options
      );
      if (result == null) {
        throw update_failed;
      }

      // edit all power sockets to new category name
      for (let i = 0; i < target_user.power_socket.length; i++) {
        let power_socket_id = target_user.power_socket[i];
        let current_power_socket = await power_socket.findById(power_socket_id);
        if (current_power_socket.category == origin_name) {
          const one_by_one_result = await power_socket.findByIdAndUpdate(
            power_socket_id,
            { category: new_name },
            options
          );
          if (one_by_one_result == null) {
            throw update_failed;
          }
        }
      }
      res.status(200).json(result);
    }
  } catch (error) {
    if (error == user_not_found || error == category_not_found) {
      res.status(404).json({ message: error });
    } else if (error == update_failed) {
      res.status(500).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// delete one category
router.delete("/user/:user_id/category/:category_name", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // find target category
    if (target_user.category.length == 0) {
      throw category_not_found;
    }
    let not_found = 1,
      target_index = -1;
    const category_name = req.params.category_name;
    for (let i = 0; i < target_user.category.length; i++) {
      if (target_user.category[i] == category_name) {
        target_index = i;
        not_found = 0;
      }
    }
    if (not_found) {
      throw category_not_found;
    } else {
      // remove category in user category array
      target_user.category.splice(target_index, 1);
      const options = { new: true };
      const result = await user.findByIdAndUpdate(
        user_id,
        { category: target_user.category },
        options
      );
      if (result == null) {
        throw update_failed;
      }

      // edit all power sockets to no category
      for (let i = 0; i < target_user.power_socket.length; i++) {
        let power_socket_id = target_user.power_socket[i];
        let current_power_socket = await power_socket.findById(power_socket_id);
        if (current_power_socket.category == category_name) {
          const one_by_one_result = await power_socket.findByIdAndUpdate(
            power_socket_id,
            { category: "" },
            options
          );
          if (one_by_one_result == null) {
            throw update_failed;
          }
        }
      }
      res.status(200).json(result);
    }
  } catch (error) {
    if (error == user_not_found || error == category_not_found) {
      res.status(404).json({ message: error });
    } else if (error == update_failed) {
      res.status(500).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// delete all categories
router.delete("/user/:user_id/category", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    // find user
    const target_user = await user.findById(user_id);
    if (target_user == null) {
      throw user_not_found;
    }

    // remove all categories in user category array
    target_user.category.length = 0;
    const options = { new: true };
    const result = await user.findByIdAndUpdate(
      user_id,
      { category: target_user.category },
      options
    );
    if (result == null) {
      throw update_failed;
    }

    // edit all power sockets to no category
    for (let i = 0; i < target_user.power_socket.length; i++) {
      let power_socket_id = target_user.power_socket[i];
      const one_by_one_result = await power_socket.findByIdAndUpdate(
        power_socket_id,
        { category: "" },
        options
      );
      if (one_by_one_result == null) {
        throw update_failed;
      }
    }
    res.status(200).json(result);
  } catch (error) {
    if (error == user_not_found || error == category_not_found) {
      res.status(404).json({ message: error });
    } else if (error == update_failed) {
      res.status(500).json({ message: error });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

class Power {
  constructor(start_time, end_time, consumption) {
    this.start_time = start_time;
    this.end_time = end_time;
    this.consumption = consumption;
  }
}

// post power socket consumption data
router.post(
  "/user/:user_id/power_socket/:power_socket_id/consumption",
  async (req, res) => {
    const user_id = req.params.user_id;
    try {
      // find user
      const target_user = await user.findById(user_id);
      if (target_user == null) {
        throw user_not_found;
      }

      // find power_socket
      const power_socket_id = req.params.power_socket_id;
      const target_power_socket = await power_socket.findById(power_socket_id);
      if (target_power_socket == null) {
        throw power_socket_not_found;
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
        // update power_socket array
        const start_time = req.body.start_time;
        const end_time = req.body.end_time;
        const consumption = req.body.consumption;
        const new_power = new Power(start_time, end_time, consumption);
        target_power_socket.power.push(new_power);
        const options = { new: true };
        const result = await power_socket.findByIdAndUpdate(
          power_socket_id,
          { power: target_power_socket.power },
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
  }
);

// get total comsumption
router.get(
  "/user/:user_id/consumption/start/:start_time/end/:end_time",
  async (req, res) => {
    const user_id = req.params.user_id;
    const start_time = req.params.start_time;
    const end_time = req.params.end_time;
    try {
      // find user
      const target_user = await user.findById(user_id);
      if (target_user == null) {
        throw user_not_found;
      }
      // calculate comsumption
      let total_comsumption = 0,
        no_power_socket = false;
      if (target_user.power_socket.length == 0) {
        no_power_socket = true;
      }
      if (no_power_socket) {
        total_comsumption = 0;
      } else {
        const power_sockets = target_user.power_socket;
        for (let i = 0; i < power_sockets.length; i++) {
          const current_power_socket = await power_socket.findById(
            power_sockets[i]
          );
          const number_of_power = current_power_socket.power.length;
          for (let j = 0; j < number_of_power; j++) {
            const current_power = current_power_socket.power[j];
            if (
              current_power.start_time >= start_time &&
              current_power.end_time <= end_time
            ) {
              total_comsumption += current_power.consumption;
            }
          }
        }
      }
      res.status(200).json(total_comsumption);
    } catch (error) {
      if (error == user_not_found) {
        res.status(404).json({ message: error });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
);

// get total comsumption of a power socket
router.get(
  "/user/:user_id/power_socket/:power_socket_id/consumption/start/:start_time/end/:end_time",
  async (req, res) => {
    const user_id = req.params.user_id;
    const power_socket_id = req.params.power_socket_id;
    const start_time = req.params.start_time;
    const end_time = req.params.end_time;
    try {
      // find user
      const target_user = await user.findById(user_id);
      if (target_user == null) {
        throw user_not_found;
      }

      // find power socket
      const target_power_socket = await power_socket.findById(power_socket_id);
      if (target_power_socket == null) {
        throw power_socket_not_found;
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
        // calculate comsumption
        let total_comsumption = 0;
        const number_of_power = target_power_socket.power.length;

        for (let i = 0; i < number_of_power; i++) {
          const current_power = target_power_socket.power[i];
          if (
            current_power.start_time >= start_time &&
            current_power.end_time <= end_time
          ) {
            total_comsumption += current_power.consumption;
          }
        }
        res.status(200).json(total_comsumption);
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
  }
);

// get category consumption
router.get(
  "/user/:user_id/category/:category_name/consumption/start/:start_time/end/:end_time",
  async (req, res) => {
    const user_id = req.params.user_id;
    const category_name = req.params.category_name;
    const start_time = req.params.start_time;
    const end_time = req.params.end_time;
    try {
      // find user
      const target_user = await user.findById(user_id);
      if (target_user == null) {
        throw user_not_found;
      }
      // calculate comsumption
      let total_comsumption = 0,
        no_power_socket = false;
      if (target_user.power_socket.length == 0) {
        no_power_socket = true;
      }
      if (no_power_socket) {
        total_comsumption = 0;
      } else {
        const power_sockets = target_user.power_socket;
        for (let i = 0; i < power_sockets.length; i++) {
          const current_power_socket = await power_socket.findById(
            power_sockets[i]
          );
          const number_of_power = current_power_socket.power.length;
          if (current_power_socket.category == category_name) {
            for (let j = 0; j < number_of_power; j++) {
              const current_power = current_power_socket.power[j];
              if (
                current_power.start_time >= start_time &&
                current_power.end_time <= end_time
              ) {
                total_comsumption += current_power.consumption;
              }
            }
          }
        }
      }
      res.status(200).json(total_comsumption);
    } catch (error) {
      if (error == user_not_found) {
        res.status(404).json({ message: error });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
);

function power_bill(power_consumption, time) {
  var date = new Date(time * 1000);
  let month = date.getMonth;
  let range = [240, 660, 1000, 1400, 2000];
  let rate = [];
  if (month >= 6 && month <= 9) {
    rate = [1.63, 2.38, 3.52, 4.8, 5.83, 7.69];
  } else {
    rate = [1.63, 2.1, 2.89, 3.94, 4.74, 6.03];
  }
  let power_bill = 0;
  let previous_range = 0;
  for (let i = 0; i < range.length; i++) {
    if (power_consumption > range[i]) {
      power_bill += rate[i] * (range[i] - previous_range);
    } else {
      power_bill += rate[i] * (power_consumption - previous_range);
      return power_bill;
    }
    previous_range = range[i];
  }
  power_bill += rate[rate.length - 1] * (power_consumption - previous_range);
  return power_bill;
}

// get total power bill
router.get(
  "/user/:user_id/bill/start/:start_time/end/:end_time",
  async (req, res) => {
    const user_id = req.params.user_id;
    const start_time = req.params.start_time;
    const end_time = req.params.end_time;
    try {
      // find user
      const target_user = await user.findById(user_id);
      if (target_user == null) {
        throw user_not_found;
      }
      // calculate comsumption
      let total_comsumption = 0,
        no_power_socket = false;
      if (target_user.power_socket.length == 0) {
        no_power_socket = true;
      }
      if (no_power_socket) {
        total_comsumption = 0;
      } else {
        const power_sockets = target_user.power_socket;
        for (let i = 0; i < power_sockets.length; i++) {
          const current_power_socket = await power_socket.findById(
            power_sockets[i]
          );
          const number_of_power = current_power_socket.power.length;
          for (let j = 0; j < number_of_power; j++) {
            const current_power = current_power_socket.power[j];
            if (
              current_power.start_time >= start_time &&
              current_power.end_time <= end_time
            ) {
              total_comsumption += current_power.consumption;
            }
          }
        }
      }
      res.status(200).json(power_bill(total_comsumption, start_time));
    } catch (error) {
      if (error == user_not_found) {
        res.status(404).json({ message: error });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
);

// get power socket power bill
router.get(
  "/user/:user_id/power_socket/:power_socket_id/bill/start/:start_time/end/:end_time",
  async (req, res) => {
    const user_id = req.params.user_id;
    const power_socket_id = req.params.power_socket_id;
    const start_time = req.params.start_time;
    const end_time = req.params.end_time;
    try {
      // find user
      const target_user = await user.findById(user_id);
      if (target_user == null) {
        throw user_not_found;
      }

      // find power socket
      const target_power_socket = await power_socket.findById(power_socket_id);
      if (target_power_socket == null) {
        throw power_socket_not_found;
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
        // calculate comsumption
        let total_comsumption = 0;
        const number_of_power = target_power_socket.power.length;

        for (let i = 0; i < number_of_power; i++) {
          const current_power = target_power_socket.power[i];
          if (
            current_power.start_time >= start_time &&
            current_power.end_time <= end_time
          ) {
            total_comsumption += current_power.consumption;
          }
        }
        res.status(200).json(power_bill(total_comsumption, start_time));
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
  }
);

// get category consumption
router.get(
  "/user/:user_id/category/:category_name/bill/start/:start_time/end/:end_time",
  async (req, res) => {
    const user_id = req.params.user_id;
    const category_name = req.params.category_name;
    const start_time = req.params.start_time;
    const end_time = req.params.end_time;
    try {
      // find user
      const target_user = await user.findById(user_id);
      if (target_user == null) {
        throw user_not_found;
      }
      // calculate comsumption
      let total_comsumption = 0,
        no_power_socket = false;
      if (target_user.power_socket.length == 0) {
        no_power_socket = true;
      }
      if (no_power_socket) {
        total_comsumption = 0;
      } else {
        const power_sockets = target_user.power_socket;
        for (let i = 0; i < power_sockets.length; i++) {
          const current_power_socket = await power_socket.findById(
            power_sockets[i]
          );
          const number_of_power = current_power_socket.power.length;
          if (current_power_socket.category == category_name) {
            for (let j = 0; j < number_of_power; j++) {
              const current_power = current_power_socket.power[j];
              if (
                current_power.start_time >= start_time &&
                current_power.end_time <= end_time
              ) {
                total_comsumption += current_power.consumption;
              }
            }
          }
        }
      }
      res.status(200).json(power_bill(total_comsumption, start_time));
    } catch (error) {
      if (error == user_not_found) {
        res.status(404).json({ message: error });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
);