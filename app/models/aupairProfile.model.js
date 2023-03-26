const mongoose = require("mongoose");

const AupairProfile = mongoose.model(
  "AupairProfile",
  new mongoose.Schema({
    telefone: mongoose.Schema.Types.Mixed,
    cep: mongoose.Schema.Types.Mixed,
    logradouro: mongoose.Schema.Types.Mixed,
    numero: mongoose.Schema.Types.Mixed,
    complemento: mongoose.Schema.Types.Mixed,
    cidade: mongoose.Schema.Types.Mixed,
    estado: mongoose.Schema.Types.Mixed,
    data_de_nascimento: mongoose.Schema.Types.Mixed,
    escolaridade: mongoose.Schema.Types.Mixed,
    idiomas: mongoose.Schema.Types.Mixed,
    religiao: mongoose.Schema.Types.Mixed,
    genero: mongoose.Schema.Types.Mixed,
    nacionalidade: mongoose.Schema.Types.Mixed,
    habilitacao: mongoose.Schema.Types.Mixed,
    quantidade_criancas: mongoose.Schema.Types.Mixed,
    experiencia_trabalho: mongoose.Schema.Types.Mixed,
    natacao: mongoose.Schema.Types.Mixed,
    carro_exclusivo: mongoose.Schema.Types.Mixed,
    receber_newsletter: mongoose.Schema.Types.Mixed,
    data_disponibilidade: mongoose.Schema.Types.Mixed,
    numero_identificacao_nacional: mongoose.Schema.Types.Mixed,
    resumo: mongoose.Schema.Types.Mixed,
    passaporte: mongoose.Schema.Types.Mixed,
    habilitacao_pid: mongoose.Schema.Types.Mixed,
    firstLogin: {
      type: Boolean,
      default: false
    },
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  })
);

module.exports = AupairProfile;
