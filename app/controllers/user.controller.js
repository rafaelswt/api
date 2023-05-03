const config = require("../config/auth.config");
const { vaga, user, candidatura, familia_has_vaga } = require("../models");
const db = require("../models");
const User = db.user;
const Vaga = db.vaga;
var bcrypt = require("bcryptjs");
const Visualizacao = db.visualizacao
const Candidatura = db.candidatura;
const mongoose = require('mongoose');
const AupairProfile = db.aupairProfile;
mongoose.Promise = global.Promise;
const nodemailer = require("nodemailer");

async function calcularScore(vaga, aupair) {
  const scoreFields = ["escolaridade", "idiomas", "religiao", "quantidade_criancas", "experiencia_trabalho", "genero", "nacionalidade", "habilitacao", "carro_exclusivo", "natacao", "faixa_etaria"];
  let score = 0;

  aupair.faixa_etaria = obterFaixaEtaria(aupair.data_de_nascimento);

  for (let j = 0; j < scoreFields.length; j++) {
    if (vaga[scoreFields[j]] !== undefined && aupair[scoreFields[j]] !== undefined) {
      if (Array.isArray(vaga[scoreFields[j]]) && Array.isArray(aupair[scoreFields[j]])) {
        const intersection = vaga[scoreFields[j]].filter(value => aupair[scoreFields[j]].includes(value));
        if (intersection.length > 0) {
          score += intersection.length / aupair[scoreFields[j]].length;
        }
        else if (scoreFields[j] === "faixa_etaria") {
          if (vaga[scoreFields[j]].includes("Qualquer Idade") ||
            (aupair.data_de_nascimento !== undefined &&
              vaga[scoreFields[j]].includes(aupair.data_de_nascimento))) {
            score += 1;
          }
        }
        else if (scoreFields[j] === "idiomas") {
          if (vaga[scoreFields[j]].includes("Qualquer Idioma")) {
            score += 1;
          }
        }
      } else {
        if (vaga[scoreFields[j]]?.toString() === aupair[scoreFields[j]]?.toString() ||
          vaga[scoreFields[j]] === "Qualquer Nacionalidade" ||
          vaga[scoreFields[j]] === "Qualquer Gênero" ||
          vaga[scoreFields[j]] === "Qualquer Religião" ||
          vaga[scoreFields[j]] === "Qualquer Escolaridade" ||
          vaga[scoreFields[j]] === "Não especificado"
        ) {
          score += 1;
        }
        else if (scoreFields[j] === "habilitacao" || scoreFields[j] === "natacao") {
          if (vaga[scoreFields[j]] === false) {
            score += 1;
          }
        }
      }
    }
  }

  return `${(score * 100 / scoreFields.length).toFixed(0)}%`;
}

function obterFaixaEtaria(dataDeNascimento) {
  const agora = new Date();
  let idade = agora.getFullYear() - dataDeNascimento.getFullYear();
  const mesAtual = agora.getMonth();
  const mesDeNascimento = dataDeNascimento.getMonth();

  if (mesAtual < mesDeNascimento || (mesAtual === mesDeNascimento && agora.getDate() < dataDeNascimento.getDate())) {
    idade--;
  }

  if (idade >= 51) {
    return "51+";
  } else if (idade >= 41) {
    return "41-50";
  } else if (idade >= 31) {
    return "31-40";
  } else if (idade >= 22) {
    return "22-30";
  } else if (idade >= 18) {
    return "18-21";
  } else {
    return "Qualquer Idade";
  }
}

exports.listarVagas = async (req, res) => {
  try {
    if (req.userRoles.includes("ROLE_FAMILY")) {
      const vagas = await Vaga.find({ user: mongoose.Types.ObjectId(req.userId) })
        .lean();
      return res.json(vagas);
    }

    if (req.userRoles.includes("ROLE_AUPAIR")) {
      const vagas = await Vaga.find({
        $and: [
          { ativo: { $ne: false } },
          { "aupair.0": { $ne: mongoose.Types.ObjectId(req.userId) } }
        ]
      }).lean();

      if (!vagas) {
        return res.status(404).json({ message: "Nenhuma vaga encontrada." });
      }

      const profile = await AupairProfile.findOne({ user: req.userId }).lean();

      if (!profile) {
        return res.status(404).json({ message: "Perfil de Au Pair não encontrado." });
      }

      for (let i = 0; i < vagas.length; i++) {
        vagas[i].score = "0%";

        // Verifica se a usuária já visualizou a vaga antes de incrementar a contagem de visualizações
        const visualizacao = await Visualizacao.findOne({
          vaga: vagas[i]._id,
          usuario: req.userId
        });

        if (!visualizacao) {
          vagas[i].views += 1;
          await Vaga.updateOne({ _id: vagas[i]._id }, { $inc: { views: 1 } });

          // Registra a visualização da usuária na coleção "Visualizações"
          await Visualizacao.create({
            vaga: vagas[i]._id,
            usuario: req.userId
          });
        }

        vagas[i].score = await calcularScore(vagas[i], profile);

        const ObjectID = require('mongodb').ObjectID;
        const isSaved = vagas[i].aupair.find(a => String(a._id) === String(ObjectID(req.userId)))?.saved || false;

        // Adiciona o campo "isSaved" na própria vaga
        vagas[i].isSaved = isSaved;
      }

      // // Remove o array "aupair" da resposta
      const vagasSemAupair = vagas.map(vaga => {
        const { aupair, ...rest } = vaga;
        return rest;
      });

      return res.json(vagasSemAupair);
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

    let pais;

    if (req.body.pais) {
      if (req.body.pais === "br") {
        pais = "Brasil";
      } else if (req.body.pais === "usa") {
        pais = "Estados Unidos";
      } else {
        pais = req.body.pais;
      }
    } else {
      pais = "Não especificado";
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
      pais: pais,
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
  } catch (err) {
    console.error(err);
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(422).json({ message: "Validation Error", errors: err.errors });
    } else {
      res.status(500).json({ message: "Server Error" });
    }
  }
}

exports.createAupairProfile = async (req, res) => {

  const existingAupair = await AupairProfile.findOne({ user: req.userId });

  if (existingAupair) {
    return res.status(409).json({ message: "Aupair profile already exists" });
  }

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
      tipo_documento,
      habilitacao,
      quantidade_criancas,
      experiencia_trabalho,
      natacao,
      carro_exclusivo,
      receber_newsletter,
      data_disponibilidade,
    } = req.body;

    const dob = new Date(data_de_nascimento);
    const ageInMs = Date.now() - dob.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears < 18) {
      return res.status(400).json({ message: "Aupair must be at least 18 years old to create a profile" });
    }

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
      tipo_documento,
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

exports.updateVaga = async(req, res) => {
  try {
    // Verifica se a vaga existe
    const vaga = await Vaga.findById(req.params.id);

    if (!vaga) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }
    // Verifica se o usuário tem permissão para editar a vaga
    if (vaga.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Você não tem permissão para editar esta vaga.' });
    }

    // Atualiza os atributos da vaga com os valores enviados na requisição
    vaga.escolaridade = req.body.escolaridade || vaga.escolaridade;
    vaga.idiomas = req.body.idiomas || vaga.idiomas;
    vaga.religiao = req.body.religiao || vaga.religiao;
    vaga.genero = req.body.genero || vaga.genero;
    vaga.nacionalidade = req.body.nacionalidade || vaga.nacionalidade;
    vaga.faixa_etaria = req.body.faixa_etaria || vaga.faixa_etaria;
    vaga.experiencia_trabalho = req.body.experiencia_trabalho || vaga.experiencia_trabalho;
    vaga.quantidade_criancas = req.body.quantidade_criancas || vaga.quantidade_criancas;
    vaga.resumo = req.body.resumo || vaga.resumo;
    vaga.receber_newsletter = req.body.receber_newsletter || vaga.receber_newsletter;
    vaga.data_disponibilidade = req.body.data_disponibilidade || vaga.data_disponibilidade;
    vaga.data_finalizacao_vaga = req.body.data_finalizacao_vaga || vaga.data_finalizacao_vaga;
    vaga.titulo_vaga = req.body.titulo_vaga || vaga.titulo_vaga;
    vaga.vaga_patrocinada = req.body.vaga_patrocinada || vaga.vaga_patrocinada;
    vaga.pais = req.body.pais || vaga.pais;
    vaga.estado_provincia = req.body.estado_provincia || vaga.estado_provincia;
    vaga.descricao = req.body.descricao || vaga.descricao;
    vaga.natacao = req.body.natacao || vaga.natacao;
    vaga.habilitacao = req.body.habilitacao || vaga.habilitacao;
    vaga.carro_exclusivo = req.body.carro_exclusivo || vaga.carro_exclusivo;
    vaga.score = req.body.score || vaga.score;

    // Salva a vaga atualizada no banco de dados
    const updatedVaga = await vaga.save();

    res.json(updatedVaga);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar a vaga.' });
  }
}

exports.deleteCandidatura = async (req, res) => {
  try {
    const vaga = await Vaga.findById(req.params.id);
    if (!vaga) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }

    // Encontrar a candidatura da Au Pair na vaga
    const candidatura = vaga.candidaturas.find(
      (candidatura) =>
        candidatura.aupairId.toString() === req.userId 
    );
    if (!candidatura) {
      return res
        .status(404)
        .json({ message: 'Candidatura não encontrada para essa Au Pair nesta vaga' });
    }

    // Remover a candidatura da lista de candidaturas da vaga
    vaga.candidaturas = vaga.candidaturas.filter(
      (candidatura) =>
        candidatura.aupairId.toString() !== req.userId
    );

    // Salvar as alterações na vaga
    await vaga.save();

    return res.status(200).json({ message: 'Candidatura removida com sucesso' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Erro ao apagar candidatura da Au Pair para vaga' });
  }

}

exports.criarCandidatura = async (req, res) => {
  try {
    const vagaID = req.query.vagaID;
    const userId = req.userId;

    // Procura a vaga correspondente ao ID fornecido
    const vaga = await Vaga.findById(vagaID);

    if (!vaga) {
      return res.status(404).json({ error: "Vaga não encontrada" });
    }

    // Verifica se a aupair já se candidatou a essa vaga
    const candidaturaExistente = vaga && vaga.candidaturas && vaga.candidaturas.find(
      (candidatura) => String(candidatura.aupairId) === userId
    );
    if (candidaturaExistente) {
      return res
        .status(400)
        .json({ error: "Aupair já se candidatou a essa vaga" });
    }

    // Adiciona uma nova candidatura à vaga
    vaga.candidaturas.push({ aupairId: userId });
    await vaga.save();

    return res.status(201).json({ message: "Candidatura criada com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.getCandidaturasByUserId = async (req, res) => {
  try {
    const vagas = await Vaga.find({ user: req.userId })
    const candidaturas = vagas.reduce((acc, vaga) => [...acc, ...vaga.candidaturas], []);
    res.json(candidaturas);
  } catch (error) {
    console.error(error);
    res.status(500).send('Ocorreu um erro ao buscar as candidaturas.');
  }
};

exports.getCandidaturasByAupairId = async (req, res) => {
  try {
    const vagas = await Vaga.aggregate([
      // Filtra vagas com candidaturas da aupair atual
      {
        $match: { "candidaturas.aupairId": mongoose.Types.ObjectId(req.userId) },
      },
      // Desconstrói o array "candidaturas" em documentos separados
      { $unwind: "$candidaturas" },
      // Filtra apenas as candidaturas da aupair atual
      {
        $match: { "candidaturas.aupairId": mongoose.Types.ObjectId(req.userId) },
      },
      // Junta as informações da vaga e da candidatura em um mesmo documento
      {
        $project: {
          _id: 1,
          escolaridade: 1,
          idiomas: 1,
          religiao: 1,
          genero: 1,
          nacionalidade: 1,
          faixa_etaria: 1,
          experiencia_trabalho: 1,
          quantidade_criancas: 1,
          receber_newsletter: 1,
          data_disponibilidade: 1,
          data_finalizacao_vaga: 1,
          titulo_vaga: 1,
          vaga_patrocinada: 1,
          pais: 1,
          estado_provincia: 1,
          descricao: 1,
          natacao: 1,
          habilitacao: 1,
          carro_exclusivo: 1,
          views: 1,
          user: 1,
          resumo: 1,
          passaporte: 1,
          aupair: "$candidaturas.aupair",
          candidatura: "$candidaturas",
        },
      },
    ]);
    res.json(vagas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao recuperar vagas candidatadas" });
  }
  
};

exports.deletarCandidatura = async (req, res) => {
  try {
    const vaga = await Vaga.findOne({ _id: req.params.idVaga, "candidaturas.aupairId": req.userId });
  
    if (!vaga) {
      return res.status(404).json({ mensagem: "Candidatura não encontrada." });
    }
  
    vaga.candidaturas = vaga.candidaturas.filter((candidatura) => candidatura.aupairId.toString() !== req.userId);
    await vaga.save();
  
    return res.status(200).json({ mensagem: "Candidatura deletada com sucesso." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: "Erro ao deletar candidatura." });
  }
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
    if (req.userRoles.includes("ROLE_FAMILY")) {
      const vagas = await Vaga.find({ user: mongoose.Types.ObjectId(req.userId) })
        .lean();
      return res.json(vagas);
    }

    if (req.userRoles.includes("ROLE_AUPAIR")) {
      const vagas = await Vaga.find({ "aupair.0": { $ne: mongoose.Types.ObjectId(req.userId) } })
        .lean();

      if (!vagas) {
        return res.status(404).json({ message: "Nenhuma vaga encontrada." });
      }

      const profile = await AupairProfile.findOne({ user: req.userId }).lean();

      if (!profile) {
        return res.status(404).json({ message: "Perfil de Au Pair não encontrado." });
      }

      const savedVagas = [];

      for (let i = 0; i < vagas.length; i++) {
        vagas[i].score = "0%";

        // Verifica se a usuária já visualizou a vaga antes de incrementar a contagem de visualizações
        const visualizacao = await Visualizacao.findOne({
          vaga: vagas[i]._id,
          usuario: req.userId
        });

        if (!visualizacao) {
          vagas[i].views += 1;
          await Vaga.updateOne({ _id: vagas[i]._id }, { $inc: { views: 1 } });

          // Registra a visualização da usuária na coleção "Visualizações"
          await Visualizacao.create({
            vaga: vagas[i]._id,
            usuario: req.userId
          });
        }

        vagas[i].score = await calcularScore(vagas[i], profile);

        const ObjectID = require('mongodb').ObjectID;
        const isSaved = vagas[i].aupair.find(a => String(a._id) === String(ObjectID(req.userId)))?.saved || false;

        // Adiciona o campo "isSaved" na própria vaga
        vagas[i].isSaved = isSaved;

        // Adiciona a vaga à lista de vagas salvas se o campo isSaved for verdadeiro
        if (isSaved) {
          savedVagas.push(vagas[i]);
        }
      }

      // // Remove o array "aupair" da resposta
      const vagasSemAupair = savedVagas.map(vaga => {
        const { aupair, ...rest } = vaga;
        return rest;
      });



      return res.json(vagasSemAupair);
    }

    return res.status(403).json({ message: "Acesso negado." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar vagas." });
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


exports.ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
  
    // Verifica se o email existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email não encontrado' });
    }
  
    // Cria um código de redefinição de senha e salva no banco de dados
    const resetCode = Math.floor(100000 + Math.random() * 900000);
    user.passwordResetCode = resetCode.toString();
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });
  
    // Envia um email com o código de redefinição de senha
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    const mailOptions = {
      from: 'Aupamatch <aupamatch.webbstars@gmail.com>',
      to: user.email,
      subject: 'Redefinir senha',
      text: `Clique neste link para redefinir sua senha: ${resetCode}`,
    };
  
    await transporter.sendMail(mailOptions);
  
    res.status(200).json({
      message: 'Um email foi enviado com um código para redefinir sua senha',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Rota para redefinir a senha
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    // Verifica se o email existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email não encontrado' });
    }

    // Verifica se o código de redefinição de senha é válido
    if (user.passwordResetCode !== code) {
      return res.status(400).json({ message: 'Código inválido' });
    }

    // Verifica se o código de redefinição de senha expirou
    if (user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ message: 'Código expirado' });
    }

    // Define a nova senha e limpa o código de redefinição de senha
    user.password = bcrypt.hashSync(password, 8),
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.userprofile = (req, res) => {
  User.findById(req.userId)
    .populate("roles", "-__v -_id")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      const roles = user.roles.map(role => "ROLE_" + role.name.toUpperCase());

      const userProfile = {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: roles
      };

      res.json(userProfile);
    });
};
exports.statusVaga = async (req, res) => {
  try {
    const { id } = req.params;
    const vaga = await Vaga.findById(id);
    
    if (!vaga) {
      return res.status(404).json({ error: "Vaga não encontrada." });
    }
    
    if (String(vaga.user) !== req.userId) {
      return res.status(401).json({ error: "Usuário não autorizado." });
    }

    vaga.ativo = !vaga.ativo;
    await vaga.save();
    
    return res.status(200).json(vaga);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao ativar/desativar a vaga." });
  }
};