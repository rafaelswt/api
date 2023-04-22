const mongoose = require("mongoose");

const VagaSchema = new mongoose.Schema({
  escolaridade: {
    type: String,
    default: "Qualquer Escolaridade"
  },
  idiomas: {
    type: [String],
    default: ["Qualquer Idioma"]
  },
  religiao: {
    type: String,
    default: "Qualquer Religião"
  },
  genero: {
    type: String,
    default: "Qualquer Gênero"
  },
  nacionalidade: {
    type: String,
    default: "Qualquer Nacionalidade"
  },
  faixa_etaria: {
    type: [String],
    default: ["Qualquer Idade"]
  },
  experiencia_trabalho: {
    type: String,
    default: '0'
  },
  quantidade_criancas: {
    type: String,
    default: 'Não especificado'
  },
  resumo: String,
  receber_newsletter: {
    type: Boolean,
    default: false
  },
  data_disponibilidade: {
    type: Date,
    default: null
  },
  data_finalizacao_vaga: {
    type: Date,
    default: null
  },
  titulo_vaga: {
    type: String,
    default: 'Vaga sem título'
  },
  vaga_patrocinada: {
    type: Boolean,
    default: false
  },
  pais: {
    type: String,
    default: ''
  },
  estado_provincia: {
    type: String,
    default: ''
  },
  descricao: {
    type: String,
    default: ''
  },
  natacao: {
    type: Boolean,
    default: false
  },
  habilitacao: {
    type: Boolean,
    default: false
  },
  carro_exclusivo: {
    type: Boolean,
    default: false
  },
  score: String,
  views: {
    type: Number,
    default: 0
  },
  ativo: {
    type: Boolean,
    default: true
  },
  user: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  aupair: [{
    aupairId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Aupair"
    },
    saved: {
      type: Boolean,
      default: false
    }
  }],
  candidaturas: [{
    aupairId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Aupair"
    },
    data_candidatura: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pendente', 'aceita', 'rejeitada'],
      default: 'pendente'
    }
  }]
}, { timestamps: true });

const Vaga = mongoose.model("Vaga", VagaSchema);

module.exports = Vaga;
