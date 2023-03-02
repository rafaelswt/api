const mongoose = require("mongoose");

const Escolaridade = mongoose.model(
  "Escolaridade",
  new mongoose.Schema({
    descricao: String
  })
);

module.exports = Escolaridade;
