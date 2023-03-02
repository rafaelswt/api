const db = require("../models");
const ROLES = db.ROLES;
const Aupair = db.aupair;
const mongoose = require('mongoose'); 

checkDuplicateProfile = (req, res, next) => {
  Aupair.findOne({'aupair.0': mongoose.Types.ObjectId(req.userId)})
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(404).send({ message: "Failed! Profile Already Registred" });
        return
      }

      next();
    });
  
};


const verifyAupairProfile = {
  checkDuplicateProfile
};

module.exports = verifyAupairProfile;
