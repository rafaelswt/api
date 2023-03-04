const mongoose = require("mongoose");

const Aupair = mongoose.model(
  "Aupair",
  new mongoose.Schema({
    telefone: String,
    cep: String,
    logradouro: String,
    numero: String,
    complemento: String,
    cidade: String,
    estado: String, 
    data_de_nascimento: Date,
    genero: String,
    numero_identificacao_nacional: String,
    nacionalidade: String,
    resumo: String,
    passaporte: String,
    habilitacao_pid: String,
    habilitacao: Boolean,
    quantidade_criancas: String,
    experiencia_trabalho: String,
    natacao: Boolean,
    carro_exclusivo: Boolean,
    receber_newsletter: Boolean,
    data_disponibilidade: Date,
    escolaridade: String,
    idiomas: Array,
    religiao: Array,
    firstLogin: {
      type: Boolean,
      default: false
    },
    aupair: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Aupair"
      }
    ]
  })
);

module.exports = Aupair;
