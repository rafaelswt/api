const mongoose = require('mongoose')

const AupairProfileSchema = new mongoose.Schema({
  nome_completo: String,
  telefone: String,
  cep: String,
  logradouro: String,
  numero: String,
  complemento: String,
  cidade: String,
  estado: String,
  data_de_nascimento: Date,
  escolaridade: String,
  idiomas: [String],
  religiao: String,
  genero: String,
  nacionalidade: String,
  passaporte: String,
  habilitacao: {
    type: Boolean,
    default: false
  },
  quantidade_criancas: {
    type: String,
    default: 'Não especificado'
  },
  experiencia_trabalho: {
    type: String,
    default: '0'
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
  tipo_documento: String,
  firstLogin: {
    type: Boolean,
    default: false
  },
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
})

const AupairProfile = mongoose.model('AupairProfile', AupairProfileSchema)

module.exports = AupairProfile
