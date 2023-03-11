const config = require("../config/auth.config");
const { vaga, user, candidatura, familia_has_vaga } = require("../models");
const db = require("../models");
const User = db.user;
const Vaga = db.vaga;
const Candidatura = db.candidatura;
const mongoose = require('mongoose');
const Familia_has_vaga = db.familia_has_vaga;
const AupairProfile = db.aupairProfile;
mongoose.Promise = global.Promise;
const nodemailer = require("nodemailer");

async function calcularScore(vaga, aupair) {
  const scoreFields = ["natacao", "escolaridade", "idiomas", "religiao", "habilitacao", "quantidade_criancas", "experiencia_trabalho", "genero", "nacionalidade", "carro_exclusivo", "receber_newsletter", "data_disponibilidade"];
  let score = 0;

  for (let j = 0; j < scoreFields.length; j++) {
    if (vaga[scoreFields[j]] !== undefined && aupair[scoreFields[j]] !== undefined) {
      if (Array.isArray(vaga[scoreFields[j]]) && Array.isArray(aupair[scoreFields[j]])) {
        const intersection = vaga[scoreFields[j]].filter(value => aupair[scoreFields[j]].includes(value));
        if (intersection.length > 0) {
          score += intersection.length / aupair[scoreFields[j]].length;
        }
      } else {
        if (vaga[scoreFields[j]].toString() === aupair[scoreFields[j]].toString()) {
          score += 1;
        }
      }
    }
  }

  return `${(score * 100 / scoreFields.length).toFixed(0)}%`;
}

exports.listarVagas = async (req, res) => {
  try {
    if (req.userRoles.includes("ROLE_FAMILY")) {
      const vagas = await Vaga.find({ user: mongoose.Types.ObjectId(req.userId) }).lean();
      return res.json(vagas);
    }

    if (req.userRoles.includes("ROLE_AUPAIR")) {
      const vagas = await Vaga.find({ "aupair.0": { $ne: mongoose.Types.ObjectId(req.userId) } }).lean();

      if (!vagas) {
        return res.status(404).json({ message: "Nenhuma vaga encontrada." });
      }

      const aupair = await AupairProfile.findOne({ user: req.userId }).lean();

      if (!aupair) {
        return res.status(404).json({ message: "Perfil de Au Pair não encontrado." });
      }

      for (let i = 0; i < vagas.length; i++) {
        vagas[i].score = "0%";
        vagas[i].views += 1;
        await Vaga.updateOne({ _id: vagas[i]._id }, { $inc: { views: 1 } });

        vagas[i].score = await calcularScore(vagas[i], aupair);
      }

      return res.json(vagas);
    }

    return res.status(403).json({ message: "Acesso negado." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar vagas." });
  }
}

exports.vaga = (req, res) => {
  Vaga.findById(req.query.vagaID)
    .exec((err, vaga) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!vaga) {
        return res.status(404).send({ message: "Vaga não encontrada." });
      }

      res.json(vaga);
    });
}

exports.candidaturas = (req, res) => {
  if (req.query.roles === "ROLE_FAMILY") {
    Vaga.find({})

      .exec((err, vaga) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.json(vaga);
      }
      )
  }
  else if (req.query.roles === "ROLE_AUPAIR") {
    Vaga.find({ 'aupair': mongoose.Types.ObjectId(req.query.userID) })
      .exec((err, vaga) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        if (!vaga) {
          return res.status(404).send({ message: "Vaga não encontrada." });
        }


        res.json(vaga);
      });

  }
};

exports.criarvaga = async (req, res) => {
  try {
    // // Verifica se o usuário já possui uma vaga cadastrada
    // const vagaExistente = await Vaga.findOne({ user: req.userId });
    // if (vagaExistente) {
    //   return res.status(400).json({ message: 'Usuário já possui uma vaga cadastrada.' });
    // }


    // // Verifica se o o dado passo é permitido
    // const idiomasPermitidos = ["Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Português"];

    // let idiomas;

    // if (req.body.idiomas && idiomasPermitidos.includes(req.body.idiomas)) {
    //   idiomas = req.body.idiomas;
    // } else {
    //   idiomas = ["Não especificado"];
    // }

    // Verifique se o usuário tem a função "ROLE_FAMILY"
    if (!req.userRoles.includes("ROLE_FAMILY")) {
      return res.status(403).json({ message: 'Você não tem permissão para criar uma vaga.' });
    }


    const vaga = new Vaga({
      escolaridade: req.body.escolaridade,
      idiomas: req.body.idiomas,
      religiao: req.body.religiao,
      genero: req.body.genero,
      numero_identificacao_nacional: req.body.numero_identificacao_nacional,
      nacionalidade: req.body.nacionalidade,
      faixa_etaria: req.body.faixa_etaria,
      resumo: req.body.resumo,
      passaporte: req.body.passaporte,
      experiencia_trabalho: req.body.experiencia_trabalho,
      receber_newsletter: req.body.receber_newsletter,
      data_disponibilidade: req.body.data_disponibilidade,
      data_finalizacao_vaga: req.body.data_finalizacao_vaga,
      titulo_vaga: req.body.titulo_vaga,
      vaga_patrocinada: req.body.vaga_patrocinada,
      pais: req.body.pais,
      estado_provincia: req.body.estado_provincia,
      quantidade_criancas: req.body.quantidade_criancas,
      descricao: req.body.descricao,
      natacao: req.body.natacao,
      habilitacao: req.body.habilitacao,
      carro_exclusivo: req.body.carro_exclusivo,
      user: req.userId
    });

    const novaVaga = await vaga.save();

    res.status(201).json(novaVaga);
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      res.status(400).json({ message: `Erro de validação: ${error.message}` });
    } else {
      res.status(500).json({ message: 'Erro ao criar a vaga.' });
    }
  }
}

exports.createAupairProfile = async (req, res) => {
  try {
    const {
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      cidade,
      estado,
      data_de_nascimento,
      escolaridade,
      idiomas,
      religiao,
      genero,
      nacionalidade,
      numero_identificacao_nacional,
      resumo,
      passaporte,
      habilitacao_pid,
      habilitacao,
      quantidade_criancas,
      experiencia_trabalho,
      natacao,
      carro_exclusivo,
      receber_newsletter,
      data_disponibilidade,
    } = req.body;

    const newAupair = new AupairProfile({
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      cidade,
      estado,
      data_de_nascimento,
      escolaridade,
      idiomas,
      religiao,
      genero,
      nacionalidade,
      numero_identificacao_nacional,
      resumo,
      passaporte,
      habilitacao_pid,
      habilitacao,
      quantidade_criancas,
      experiencia_trabalho,
      natacao,
      carro_exclusivo,
      receber_newsletter,
      data_disponibilidade,
      user: req.userId
    });

    const savedAupair = await newAupair.save();

    res.status(201).json(savedAupair);
  } catch (err) {
    console.error(err);
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(422).json({ message: "Validation Error", errors: err.errors });
    } else {
      res.status(500).json({ message: "Server Error" });
    }
  }
};

exports.getAupairProfile = async (req, res) => {
  try {
    const aupair = await AupairProfile.findOne({ 'user.0': mongoose.Types.ObjectId(req.userId) });

    if (!aupair) {
      return res.status(404).json({ message: "Perfil não encontrado", firstLogin: true });
    }

    res.status(200).json(aupair);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteAupairProfile = async (req, res) => {
  try {
    const deletedAupair = await AupairProfile.findOneAndDelete({ "user.0": req.userId });

    if (!deletedAupair) {
      return res.status(404).json({ message: "Perfil não encontrado" });
    }

    res.status(200).json({ message: "Perfil deletado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.findMatches = (req, res) => {
  if (req.query.roles === "ROLE_FAMILY") {
    Vaga.find({ 'user.0': mongoose.Types.ObjectId(req.query.id), 'aupair': { $ne: [] } })
      .exec((err, vaga) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        if (!vaga) {
          return res.status(404).send({ message: "Vaga Not found." });
        }

        res.json(vaga);
      });
  }
  else if (req.query.roles === "ROLE_AUPAIR") {
    Vaga.find({ 'aupair.0': mongoose.Types.ObjectId(req.query.id) })
      .exec((err, vaga) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        if (!vaga) {
          return res.status(404).send({ message: "Vaga não encontrada." });
        }

        res.json(vaga);
      });

  }
};

exports.deletarVaga = async (req, res, next) => {
  try {
    const vaga = await Vaga.findById(req.params.id);

    if (!vaga) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }

    await vaga.remove();

    res.status(200).json({ message: 'Vaga deletada com sucesso' });
  } catch (error) {
    next(error);
  }
};

exports.deleteCandidatura = (req, res) => {
  Candidatura.find({ 'vaga.0': mongoose.Types.ObjectId(req.query.vagaID) }).deleteOne().exec()
  Vaga.findById(req.query.vagaID)
    .exec((err, vaga) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      vaga.escolha = false

      vaga.aupair.pull(req.query.aupairID);

      vaga.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.send({ message: "Candidatura Deletada com sucesso" });
      });
    });

}

exports.candidatarse = (req, res) => {
  const candidatura = new Candidatura({
    vaga: req.query.vagaID,
    aupair: req.userId,
    escolha: false
  })

  Vaga.findById(req.query.vagaID)
    .exec((err, vaga) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      candidatura.user = vaga.user
      candidatura.save()

      vaga.aupair.push(req.query.aupairID);
      vaga.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.send({ message: "Candidatura Feita" });
      });


      if (!vaga) {
        return res.status(404).send({ message: "Vaga não encontrada." });
      }
    });

};

exports.match = (req, res) => {
  Candidatura.findById(req.query.candidaturaID)
    .exec((err, candidatura) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      candidatura.escolha = true

      candidatura.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.send({ message: "Match Feito" });
      });


      if (!candidatura) {
        return res.status(404).send({ message: "Candidatura não encontrada." });
      }
    });

  Vaga.findById(req.query.vagaID)
    .exec((err, vaga) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!vaga) {
        return res.status(404).send({ message: "Vaga não encontrada." });
      }

      vaga.escolha = true
      vaga.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
      });


    });

};


exports.getcandidaturas = (req, res) => {
  Candidatura.find({ $or: [{ "user.0": mongoose.Types.ObjectId(req.query.id) }, { "aupair.0": mongoose.Types.ObjectId(req.query.id) }] })
    .exec((err, candidatura) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!candidatura) {
        return res.status(404).send({ message: "Vaga não encontrada." });
      }

      res.json(candidatura);
    });

};

exports.favoritarVaga = async (req, res) => {
  try {
    const idAupair = req.userId;

    const vaga = await Vaga.findById(req.params.id);
    if (!vaga) {
      return res.status(404).send({
        message: "Vaga não encontrada."
      });
    }

    const index = vaga.aupair.findIndex(aupair => aupair._id.toString() === idAupair);
    if (index !== -1) {
      if (vaga.aupair[index].saved) {
        vaga.aupair[index].saved = false;
        await vaga.save();
        return res.status(200).json({ message: "Vaga desfavoritada com sucesso" });
      }
      vaga.aupair[index].saved = true;
    } else {
      vaga.aupair.push({ _id: idAupair, saved: true });
    }

    await vaga.save();

    res.status(200).json({ message: "Vaga favoritada com sucesso" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listarVagasSalvas = async (req, res) => {
  try {
    const idAupair = req.userId;

    const vagas = await Vaga.find({
      aupair: {
        $elemMatch: {
          _id: idAupair,
          saved: true
        }
      }
    }).populate("user", "nome email");

    res.status(200).json(vagas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listarMinhasVagas = async (req, res) => {

  if (!req.userRoles.includes("ROLE_FAMILY")) {
    return res.status(403).json({ message: 'Você não tem permissão para essa página.' });
  }
  try {
    // Busca todas as vagas do usuário atual
    const vagas = await Vaga.find({ user: req.userId }).populate("user", "name email");

    res.status(200).send(vagas);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error retrieving user's jobs" });
  }
};

exports.SendEmail = async (req, res) => {
  try {
    // Configurar o transporter do nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Obter todos os perfis de Au pair
    const aupairs = await AupairProfile.find();

    // Obter todas as vagas
    const vagas = await Vaga.find();

    // Iterar sobre cada perfil de Au pair
    for (let i = 0; i < aupairs.length; i++) {
      const aupair = aupairs[i];

      // Buscar o usuário completo do Au pair
      const user = await User.findById(aupair.user).populate("roles");

      // Obter as vagas com as melhores pontuações para o perfil de Au pair atual
      const vagasOrdenadas = vagas
        .map((vaga) => ({
          vaga,
          score: calcularScore(vaga, aupair),
        }))
        .sort((a, b) => b.score - a.score);

      // Enviar um e-mail com as três vagas com melhores pontuações
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Vagas de Au pair da semana",
        html: `
          <p>Olá ${user.name}, aqui estão as três melhores vagas de Au pair da semana:</p>
          <ul>
          ${vagasOrdenadas
            .slice(0, 3)
            .map(({ vaga }) => `
              <li>
                <p><strong>${vaga.titulo_vaga}</strong></p>
                <p>${vaga.descricao}</p>
                <ul>
                  <li>Escolaridade: ${vaga.escolaridade}</li>
                  <li>Idiomas: ${vaga.idiomas.join(", ")}</li>
                  <li>Religião: ${vaga.religiao}</li>
                  <li>Gênero: ${vaga.genero}</li>
                  <li>Nacionalidade: ${vaga.nacionalidade}</li>
                  <li>Faixa Etária: ${vaga.faixa_etaria.join(", ")}</li>
                  <li>Experiência de Trabalho: ${vaga.experiencia_trabalho}</li>
                  <li>Quantidade de Crianças: ${vaga.quantidade_criancas}</li>
                  <li>Natação: ${vaga.natacao ? "Sim" : "Não"}</li>
                  <li>Habilitação: ${vaga.habilitacao ? "Sim" : "Não"}</li>
                </ul>
              </li>
            `)
            .join("")}
          </ul>
        `,
      });
    }

    res.status(200).json({ message: "E-mails enviados com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao enviar e-mails" });
  }
};