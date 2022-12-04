const mongoose = require("mongoose");

const Aupair = mongoose.model(
  "Aupair",
  new mongoose.Schema({
    telefone: String,
    cep: String,
    logradouro: String,
    numero: String,
    cidade: String,
    estado: String, 
    data_de_nascimento: String,
    genero: String,
    cpf: String,
    nacionalidade: String,
    resumo: String,
    passaporte: String,
    habilitacao: Boolean,
    quantidade_criancas: String,
    experiencia_trabalho: String,
    natacao: Boolean,
    carro_exclusivo: Boolean,
    receber_newsletter: Boolean,
    data_disponibilidade: String,
    escolaridade: String,
    aupair: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Aupair"
      }
    ]
  })
);

module.exports = Aupair;
