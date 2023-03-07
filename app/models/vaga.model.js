const mongoose = require("mongoose");

const VagaSchema = new mongoose.Schema({
  escolaridade: {
    type: String,
    enum: ["Qualquer Escolaridade", "Ensino Médio", "Graduação", "Pós-Graduação"],
    default: "Qualquer Escolaridade"
  },
  idiomas: {
    type: [String],
    enum: ["Qualquer Idioma", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Português"],
    default: ["Qualquer Idioma"]
  },
  religiao: {
    type: String,
    enum: ["Qualquer Religião", "Cristianismo", "Islamismo", "Judaísmo", "Budismo"],
    default: "Qualquer Religião"
  },
  genero: {
    type: String,
    enum: ["Qualquer Gênero", "Masculino", "Feminino"],
    default: "Qualquer Gênero"
  },
  nacionalidade: {
    type: String,
    enum: ["Qualquer Nacionalidade", "Brasileira", "Americana", "Espanhola", "Portuguesa", "Alemã", "Argentina", "Chinesa", "Japonesa"],
    default: "Qualquer Nacionalidade"
  },
  faixa_etaria: {
    type: [String],
    enum: ["Qualquer Idade",'18-21', '22-30', '31-40', '41-50', '51+'],
    default: ["Qualquer Idade"]
  },
  experiencia_trabalho: {
    type: String,
    enum: ['0', '1-3', '4-6', '7-10', '10+'],
    default: '0'
  },
  quantidade_criancas: {
    type: String,
    enum: ['Não especificado', '1', '2', '3 ou mais'],
    default: 'Não especificado'
  },
  resumo: String,
  passaporte: String,
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
  }]
}, { timestamps: true });

const Vaga = mongoose.model("Vaga", VagaSchema);

module.exports = Vaga;
