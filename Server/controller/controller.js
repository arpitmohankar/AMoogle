const mongoose = require("mongoose");
var UserDB = require("../model/model");

exports.create = (req, res) => {
  const user = new UserDB({
    active: "yes",
    status: "0",
  });

  user
    .save(user)
    .then((data) => {
      res.send(data._id);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Some error occoured while creating a create operation",
      });
    });
};

exports.leavingUserUpdate = (req, res) => {
  const userid = req.params.id;
  console.log("Leaving userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { active: "no", status: "0" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};
exports.updateOnOtherUserClosing = (req, res) => {
  const userid = req.params.id;
  console.log("Leaving userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { active: "yes", status: "0" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};

exports.newUserUpdate = (req, res) => {
  const userid = req.params.id;

 
  UserDB.findOne({ _id: userid })
    .then((user) => {
      if (user) {
      
        UserDB.updateOne({ _id: userid }, { $set: { active: "yes" } })
          .then((data) => {
            if (!data) {
              res.status(404).send({
                message: `Cannot update user with ${userid} Maybe user not found!`,
              });
            } else {
              res.send("1 document updated");
            }
          })
          .catch((err) => {
            res.status(500).send({ message: "Error update user information" });
          });
        console.log("omeID exists in the database.");
    
      } else {
      
        console.log("omeID does not exist in the database.");

     

        const newUser = new UserDB({
          active: "yes",
          status: "0",
        });
        newUser
          .save(newUser)
          .then((data) => {
          
            const newUserID = data._id;

            var newOmeID = newUserID;

            res.send({ omeID: newOmeID });
          })
          .catch((err) => {
            console.error("Error saving new user to the database:", err);
           
          });
      }
    })
    .catch((err) => {
      console.error("Error querying the database:", err);
      
    });
};

exports.updateOnEngagement = (req, res) => {
  const userid = req.params.id;
  console.log("Revisited userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { status: "1" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};
exports.updateOnNext = (req, res) => {
  const userid = req.params.id;
  console.log("Revisited userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { status: "0" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};
function isValidObjectId(id) {
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    const objectId = new mongoose.Types.ObjectId(id);
    const idString = objectId.toString();

    if (id === idString) {
      return true;
    }
  }

  return false;
}
exports.remoteUserFind = (req, res) => {
  const omeID = req.body.omeID;

  if (isValidObjectId(omeID)) {
    UserDB.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(omeID) },
          active: "yes",
          status: "0",
        },
      },
      { $sample: { size: 1 } },
    ])
      .limit(1)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Error occurred while retrieving user information.",
        });
      });
  } else {
    console.log("Invalid ID");
  }
};

exports.getNextUser = (req, res) => {
  const omeID = req.body.omeID;
  const remoteUser = req.body.remoteUser;
  let excludedIds = [omeID, remoteUser];

  UserDB.aggregate([
    {
      $match: {
        _id: { $nin: excludedIds.map((id) => new mongoose.Types.ObjectId(id)) },
        active: "yes",
        status: "0",
      },
    },
    { $sample: { size: 1 } },
  ])
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Error occured while retriving user information.",
      });
    });
};
exports.deleteAllRecords = (req, res) => {
  UserDB.deleteMany({})
    .then(() => {
      res.send("All records deleted successfully");
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while deleting all records",
      });
    });
};
