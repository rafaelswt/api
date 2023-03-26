const mongoose = require("mongoose");

const AupairProfile = mongoose.model(
  "AupairProfile",
  new mongoose.Schema({
    telefone: String,
    cep: String,
    logradouro: String,
    numero: String,
    complemento: String,
    cidade: String,
    estado: String, 
    data_de_nascimento: Date,
    escolaridade: {
      type: String,
      enum: ["Ensino Médio", "Graduação", "Pós-Graduação"],
    },
    idiomas: {
      type: [String],
      enum: ["Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Português", "Outro"]
    },
    religiao: {
      type: String,
      enum: ["Cristianismo", "Islamismo", "Judaísmo", "Budismo", "Outra"]
    },
    genero: {
      type: String,
      enum: ["Masculino", "Feminino", "Outro"],
    },
    nacionalidade: {
      type: String,
      enum: ["Brasileira", "Americana", "Espanhola", "Portuguesa", "Outra"],
    },
    habilitacao: {
      type: Boolean,
      default: false
    },
    quantidade_criancas: {
      type: String,
      enum: ['Não especificado', '1', '2', '3 ou mais'],
      default: ['Não especificado']
    },
    experiencia_trabalho: {
      type: String,
      enum: ['0', '1-3', '4-6', '7-10', '10+'],
      default: ['0']
    },
    natacao: {
      type: Boolean,
      default: false
    },
    carro_exclusivo: {
      type: Boolean,
      default: false
    },
    receber_newsletter: {
      type: Boolean,
      default: false
    },
    data_disponibilidade: {
      type: Date,
      default: null
    },
    numero_identificacao_nacional: String,
    resumo: String,
    passaporte: String,
    habilitacao_pid: String,
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