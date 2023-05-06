const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Vaga = db.vaga;
const validator = require("validator");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const axios = require('axios');

exports.signup = (req, res) => {

  const { email, password, name } = req.body;

  // Verifica se o email é válido
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  // Verifica se a senha tem pelo menos 8 caracteres
  if (!validator.isLength(password, { min: 8 })) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
  }

  // Cria o usuário se todos os campos estiverem válidos
  const user = new User({
    email,
    password: bcrypt.hashSync(password, 8),
    name,
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (req.body.roles === "user") {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
    else if (req.body.roles === "aupair") {
      Role.findOne({ name: "aupair" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
    else if (req.body.roles === "family") {
      Role.findOne({ name: "family" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "Family was registered successfully!" });
        });
      });
    }
    else if (req.body.roles === "agency") {
      Role.findOne({ name: "agency" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "Agency was registered successfully!" });
        });
      });
    }
  });
};

const AupairProfile = require("../models/aupairProfile.model.js");

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Encontra o usuário com o email fornecido
    const user = await User.findOne({ email }).populate("roles", "-__v");

    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    // Verifica se a senha fornecida é válida
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Senha inválida"
      });
    }

    // Gera o token de autenticação
    const authorities = user.roles.map((role) => "ROLE_" + role.name.toUpperCase());

    const token = jwt.sign({ id: user.id, roles: authorities }, config.secret, {
      expiresIn: 86400 // 24 horas
    });

    // Verifica se o usuário já possui um perfil de au pair
    const profile = await AupairProfile.findOne({ user: user._id });

    const firstLogin = !profile;

    // Obtém a localização do usuário a partir do endereço IP
    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    ipAddress = ipAddress.split(',')[0];
    console.log(ipAddress)
    const ipstackApiKey = process.env.IPSTACK_API; // substitua pela sua API key do IP Geolocation API
    const ipstackApiUrl = `http://api.ipstack.com/${firstIpAddress}?access_key=${ipstackApiKey}`;
    const response = await axios.get(ipstackApiUrl);
    const location = response.data.city + ', ' + response.data.region_name + ', ' + response.data.country_name;

    // Registra o login do usuário no histórico de login
    user.loginHistory.push({ firstIpAddress, location });
    await user.save();

    // Retorna os dados do usuário e o token de autenticação
    res.status(200).send({
      id: user._id,
      email: user.email,
      name: user.name,
      roles: authorities,
      accessToken: token,
      firstLogin
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Erro interno do servidor" });
  }
};


