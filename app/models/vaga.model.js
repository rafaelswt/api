const mongoose = require("mongoose");

const Vaga = mongoose.model(
  "Vaga",
  new mongoose.Schema({
    escolaridade: String,
    idiomas: Array,
    religiao: Array,
    genero: String,
    numero_identificacao_nacional: String,
    nacionalidade: String,
    faixa_etaria: String,
    resumo: String,
    passaporte: String,
    habilitacao_pid: String,
    experiencia_trabalho: String,
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
    views: {
      type: Number,
      default: 0
    },
    user: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    aupair: [
      {
        aupairId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Aupair"
        },
        saved: {
          type: Boolean,
          default: false
        }
      }
    ]
  })
);

module.exports = Vaga;