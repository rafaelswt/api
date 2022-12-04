const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const { mongoose } = require("../models");
const db = require("../models");
const Aupair = db.aupair;

parseUser = (req, res, next) => {
  Aupair.findOne({'aupair.0': mongoose.Types.ObjectId(req.userId)}).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    req.aupair = user

  });

  next();
};

const profileUser = {
  parseUser
};
module.exports = profileUser;
