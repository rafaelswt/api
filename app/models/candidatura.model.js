const mongoose = require("mongoose");

const Candidatura = mongoose.model(
  "Candidatura",
  new mongoose.Schema({
    escolha: Boolean,
    vaga: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vaga"
      }
    ],
    aupair: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Aupair"
      }
    ],
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  })
);

module.exports = Candidatura;
