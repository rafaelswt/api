const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.vaga = require("./vaga.model")
db.candidatura = require("./candidatura.model")
db.aupair = require("./aupair.model")
db.idioma = require("./idioma.model")
db.religiao = require("./religiao.model")
db.escolaridade = require("./escolaridade.model")
db.familia_has_vaga = require("./familia_has_vaga.model")

db.ROLES = ["user", "aupair", "family"];

module.exports = db;