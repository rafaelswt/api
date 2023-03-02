const mongoose = require("mongoose");

const Religiao = mongoose.model(
  "Religiao",
  new mongoose.Schema({
    descricao: String
  })
);

module.exports = Religiao;
