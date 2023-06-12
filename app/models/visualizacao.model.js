const mongoose = require('mongoose')

const VisualizacaoSchema = new mongoose.Schema({
  vaga: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vaga',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  data: {
    type: Date,
    default: Date.now
  }
})

const Visualizacao = mongoose.model('Visualizacao', VisualizacaoSchema)

module.exports = Visualizacao
