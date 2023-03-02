const mongoose = require("mongoose");

const Idioma = mongoose.model(
  "Idioma",
  new mongoose.Schema({
    descricao: String
  })
);

module.exports = Idioma;
