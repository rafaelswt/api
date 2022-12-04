const mongoose = require("mongoose");

const User = mongoose.model(
  "Vaga",
  new mongoose.Schema({
    escolaridade: String,
    experiencia: String,
    quantidade_criancas: String,
    descricao: String,
    natacao: Boolean,
    habilitacao: Boolean,
    carro_exclusivo: Boolean,
    escolha: Boolean,
    score : String,
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
