const mongoose = require("mongoose");

const familia_has_vaga = mongoose.model(
  "familia_has_vaga",
  new mongoose.Schema({
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    vaga: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vaga"
      }
    ]
  })
);

module.exports = familia_has_vaga;
