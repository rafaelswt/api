const mongoose = require("mongoose");

const User = mongoose.model(
  "Vaga",
  new mongoose.Schema({
    escolaridade: String,
    experiencia: String,
    filhos: String,
    descricao: String,
    natacao: Boolean,
    habilitacao: Boolean,
    carro: Boolean,
    escolha: Boolean,
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    aupair: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Aupair"
      }
    ]
  })
);

module.exports = User;
