const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  }
});

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    passwordResetExpires: Date,
    passwordResetCode: String,
    passwordResetCodeValid: {
      type: Boolean,
      default: false
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    ],
    loginHistory: [loginHistorySchema]
  })
);

module.exports = User;
