const mongoose = require("mongoose");

const User = mongoose.model(
  "Vaga",
  new mongoose.Schema({
    escolaridade: String,
    idioma: String,
    religiao: String,
    genero: String,
    numero_identificacao_nacional: String,
    nacionalidade: String,
    resumo: String,
    passaporte: String,
    habilitacao_pid: String,
    expereriencia_trabalho: String,
    receber_newsletter: Boolean,
    data_disponibilidade: Date,
    data_criacao_vaga: Date,
    data_finalizacao_vaga: Date,
    titulo_vaga: String,
    vaga_patrocinada: Boolean,
    pais: String,
    estado_provincia:String,
    quantidade_criancas: String,
    descricao: String,
    natacao: Boolean,
    habilitacao: Boolean,
    carro_exclusivo: Boolean,
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
