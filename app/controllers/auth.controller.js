const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Vaga = db.vaga;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const user = new User({
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    name: req.body.name,

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

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.vaga = (req, res) => {
  const vaga = new Vaga({
    escolaridade: req.body.escolaridade,
    experiencia: req.body.experiencia,
    filhos: req.body.filhos,
    descricao: req.body.descricao,
    natacao: req.body.natacao,
    carro: req.body.carro,
    habilitacao: req.body.habilitacao,
    email: req.body.email,
    id: req.body.id
  });

  User.findOne({ id: req.body.id }, (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    vaga.user = req.body.id;
    vaga.save(err => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      res.send({ message: "Vaga was registered successfully!" });
    });
  })
  
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        email: user.email,
        name: user.name,
        roles: authorities,
        accessToken: token
      });
    });
};
