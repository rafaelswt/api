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
const paypal = require('paypal-rest-sdk');

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
    if (req.userRoles.includes("ROLE_AUPAIR")) {
      const vagas = await Vaga.find({
        $and: [
          { ativo: { $ne: false } },
          { "aupair.0": { $ne: mongoose.Types.ObjectId(req.userId) } },
          { "candidaturas.aupairId": { $ne: mongoose.Types.ObjectId(req.userId) } }
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
    else if (req.userRoles.includes("ROLE_AGENCY")) {

    // Recupere as vagas que correspondem aos critérios da agência
    const vagas = await Vaga.find({})
      .select("-aupair -candidaturas") // Exclua os campos "aupair" e "candidaturas"
      .lean();

      // Verifique se foram encontradas vagas
      if (vagas.length === 0) {
        return res.status(404).json({ message: "Nenhuma vaga encontrada." });
      }
  
      // Retorne as vagas
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
  if (!req.query.roles === "ROLE_AUPAIR") {
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
    if (!req.userRoles.includes("ROLE_FAMILY") && !req.userRoles.includes("ROLE_AGENCY")) {
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
      pais: pais,
      estado_provincia: req.body.estado_provincia,
      quantidade_criancas: req.body.quantidade_criancas,
      descricao: req.body.descricao,
      natacao: req.body.natacao,
      habilitacao: req.body.habilitacao,
      carro_exclusivo: req.body.carro_exclusivo,
      user: req.userId,
      exclusivo_agencia: req.userRoles.includes("ROLE_AGENCY") ? true : false
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
      nome_completo,
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
      passaporte,
    } = req.body;

    const dob = new Date(data_de_nascimento);
    const ageInMs = Date.now() - dob.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears < 18) {
      return res.status(400).json({ message: "Aupair must be at least 18 years old to create a profile" });
    }

    const newAupair = new AupairProfile({
      nome_completo,
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
      passaporte,
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

exports.updateAupairProfile = async (req, res) => {
  try {
    // Encontra o perfil da aupair pelo ID do usuário
    const profile = await AupairProfile.findOne({ user: req.userId });

    if (!profile) {
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }

    // Verifica se o usuário tem permissão para editar a vaga
    if (profile.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Você não tem permissão para editar este perfil.' });
    }

    // Atualiza os atributos do perfil com os valores enviados na requisição
    profile.nome_completo = req.body.nome_completo || profile.nome_completo;
    profile.telefone = req.body.telefone || profile.telefone;
    profile.cep = req.body.cep || profile.cep;
    profile.logradouro = req.body.logradouro || profile.logradouro;
    profile.numero = req.body.numero || profile.numero;
    profile.complemento = req.body.complemento || profile.complemento;
    profile.cidade = req.body.cidade || profile.cidade;
    profile.estado = req.body.estado || profile.estado;
    profile.data_de_nascimento = req.body.data_de_nascimento || profile.data_de_nascimento;
    profile.escolaridade = req.body.escolaridade || profile.escolaridade;
    profile.idiomas = req.body.idiomas || profile.idiomas;
    profile.religiao = req.body.religiao || profile.religiao;
    profile.genero = req.body.genero || profile.genero;
    profile.nacionalidade = req.body.nacionalidade || profile.nacionalidade;
    profile.habilitacao = req.body.habilitacao || profile.habilitacao;
    profile.quantidade_criancas = req.body.quantidade_criancas || profile.quantidade_criancas;
    profile.experiencia_trabalho = req.body.experiencia_trabalho || profile.experiencia_trabalho;
    profile.natacao = req.body.natacao || profile.natacao;
    profile.carro_exclusivo = req.body.carro_exclusivo || profile.carro_exclusivo;
    profile.receber_newsletter = req.body.receber_newsletter || profile.receber_newsletter;
    profile.data_disponibilidade = req.body.data_disponibilidade || profile.data_disponibilidade;
    profile.numero_identificacao_nacional = req.body.numero_identificacao_nacional || profile.numero_identificacao_nacional;
    profile.tipo_documento = req.body.tipo_documento || profile.tipo_documento;
    profile.passaporte = req.body.passaporte || profile.passaporte;

    // Salva o perfil atualizado no banco de dados
    const updatedProfile = await profile.save();

    res.json(updatedProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
  }
};

exports.findMatches = (req, res) => {
  if (!req.query.roles === "ROLE_AUPAIR") {
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
exports.consultarVagaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const vaga = await Vaga.findOne({ _id: id, user: req.userId }).populate('user');
    if (!vaga) {
      return res.status(404).json({ mensagem: 'Vaga não encontrada.' });
    }
    res.json(vaga);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao consultar a vaga.' });
  }
};

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

    const user = await User.findById(vaga.user).populate("roles");

    const aupairProfile = await AupairProfile.findOne({ user: req.userId }).lean();

    const userAupair = await User.findById(aupairProfile.user).populate("roles");

    // Configurar o transporter do nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: 'Aupamatch <aupamatch.webbstars@gmail.com>',
      to: user.email,
      subject: 'Nova candidatura na vaga',
      html: `
      <p>Olá,</p>
      <p>Uma nova candidatura foi feita para a sua vaga de Au Pair.</p>
      <p>Segue abaixo algumas informações sobre a candidata/o:</p>
      <ul>
        <li>Nome completo: ${aupairProfile.nome_completo}</li>
        <li>Email: ${userAupair.email}</li>
        <li>Idiomas: ${aupairProfile.idiomas.join(", ")}</li>
        <li>Experiência de trabalho: ${aupairProfile.experiencia_trabalho} anos</li>
        <li>Gênero: ${aupairProfile.genero}</li>
        <li>Religião: ${aupairProfile.religiao}</li>
        <li>Data de disponibilidade: ${aupairProfile.data_disponibilidade}</li>
        <li>Número de crianças que pode cuidar: ${aupairProfile.quantidade_criancas}</li>
        <li>Possui habilitação: ${aupairProfile.habilitacao ? 'Sim' : 'Não'}</li>
        <li>Nacionalidade: ${aupairProfile.nacionalidade}</li>
      </ul>
      <p>Entre em contato com a candidata/o para mais informações sobre o perfil dela/e.</p>
    `
    };
  
    await transporter.sendMail(mailOptions);
  
    res.status(200).json({
      message: 'Um email foi enviado com a candidadura da aupair',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno do servidor' });
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

exports.updateUserCredentials = async (req, res) => {
  try {
    const { password, name, currentPassword } = req.body;

    // Find the user by their ID
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres' });
    }

    // Verify if the current password is correct

    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid current password.' });
    }

    // Update the user's email and/or password if provided
    if (password) {
      user.password = bcrypt.hashSync(password, 8);
    }
    if (name) {
      user.name = name;
    }

    // Save the updated user in the database
    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating user credentials.' });
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
    if (!req.userRoles.includes("ROLE_AUPAIR")) {
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

  if (req.userRoles.includes("ROLE_AUPAIR")) {
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

const generateResetCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 30); // código válido por 30 minutos
  return { code, expires, isValid: false }; // retorna também a informação de validade
};

exports.sendResetToken = async (req, res) => {
  try {
    const { email } = req.body;
  
    // Verifica se o email existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email não encontrado' });
    }
  
    const { code, expires, isValid } = generateResetCode();
    user.passwordResetCode = code;
    user.passwordResetExpires = expires;
    user.passwordResetCodeValid = isValid; // salva a informação de validade
    await user.save();
   
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
      text: `Codigo para redefinir sua senha: ${code}`,
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

exports.validateResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Verifica se o email existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email não encontrado' });
    }

    // Verifica se o code de reset de senha é válido
    if (user.passwordResetCode !== code) {
      return res.status(400).json({ message: 'Code inválido' });
    }

    // Verifica se o code de reset de senha expirou
    if (user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ message: 'Code expirado' });
    }

    // Atualiza o campo passwordResetCodeValid para true
    user.passwordResetCodeValid = true;
    await user.save();

    res.status(200).json({ message: 'Code válido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Rota para redefinir a senha
exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica se o email existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email não encontrado' });
    }

    if (!user.passwordResetCodeValid) {
      return res.status(400).json({ message: 'Código não validado' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres' });
    }

    // Define a nova senha e limpa o código de redefinição de senha
    user.passwordResetCodeValid = false; // código utilizado, invalida o código
    user.password = bcrypt.hashSync(password, 8);
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
        roles: roles,
        pagamentoMaisCandidaturas: user.pagamentoMaisCandidaturas,
        pagamentoPublicador: user.pagamentoPublicador
      };

      res.json(userProfile);
    });
};

exports.loginHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    const loginHistory = user.loginHistory.map(({ _id, ipAddress, date }) => ({
      _id,
      ipAddress,
      date,
    }));
    res.status(200).send(loginHistory);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Erro interno do servidor" });
  }
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

exports.agenciarVaga = async (req, res) => {
  try {
    const vagaId  = req.params.id;

    // Verificar se o usuário tem permissão de agenciar a vaga
    if (!req.userRoles.includes('ROLE_AGENCY')) {
      return res.status(403).json({ message: 'Você não tem permissão para agenciar uma vaga.' });
    }

    // Verificar se a vaga existe
    const vaga = await Vaga.findById(vagaId);
    if (!vaga) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }

    // Verificar se a vaga já está agenciada por outra agência
    if (vaga.exclusivo_agencia) {
      return res.status(403).json({ message: 'Esta vaga já está agenciada por outra agência.' });
    }

    // Atualizar a vaga com o ID da agência agenciadora
    vaga.agenciaAgenciadora = req.userId;
    vaga.exclusivo_agencia = true;
    const vagaAgenciada = await vaga.save();

    res.status(200).json(vagaAgenciada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro do servidor.' });
  }
};

paypal.configure({
  mode: 'sandbox',
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET
});

// controller for handling the cancel URL
exports.cancel = (req, res) => {
  res.send('Payment cancelled');
};

/* paypal.webProfile.create({
  name: "Webbstars",
  presentation: {
    brand_name: "Webbstars",
    logo_image: "https://www.example.com/logo.png",
    locale_code: "US"
  },
  input_fields: {
    no_shipping: 1,
    address_override: 0
  }
}, function (error, profile) {
  if (error) {
    console.log(error);
  } else {
    console.log("Web experience profile created with ID: " + profile.id);
  }
}); */

// controller for handling the return URL
exports.success = (req, res) => {
  const paymentId = req.query.paymentId;
  const payerId = req.query.PayerID;
  const details = { 'payer_id': payerId };
  const vagaId = req.query.vagaId

  // check if payment has already been processed
  User.findOne({ 'purchaseHistory.paymentId': paymentId }, (err, user) => {
    if (user) {
      res.send('Payment has already been processed.');
    } else {

      paypal.payment.execute(paymentId, details, (error, payment) => {
        if (error) {
          console.error(error);
          res.status(500).send('Error processing payment');
        } else {
          // payment successful, update your database or perform any other required action

          const userId = payment.transactions[0].custom;

          let shouldUpdatePaymentStatus = true; // Adicione essa variável antes do switch case
          switch(payment.transactions[0].item_list.items[0].name) {
            case 'Candidatar em mais que 5 vagas':
              paymentStatusField = 'pagamentoMaisCandidaturas';
              break;
            case 'Publicador de Vagas':
              paymentStatusField = 'pagamentoPublicador';
              break;
            case 'Vaga Patrocinada':
              shouldUpdatePaymentStatus = false; // Adicione esse if dentro do switch case
              Vaga.findByIdAndUpdate(vagaId, { vaga_patrocinada: true }, { new: true }, (err, updatedVaga) => {
                if (err) {
                  console.error(err);
                  res.status(500).send('Error processing payment');
                } else {
                  console.log('Vaga patrocinada atualizada');
                }})
              break;
            default:
              console.error('Invalid payment type:', paymentType);
              res.status(500).send('Error processing payment');
          }
            // update the user's payment status in the database
            User.findOneAndUpdate(
              { _id: userId },
              { 
                ...(shouldUpdatePaymentStatus && {[paymentStatusField]: true}), // Adicione esse if antes da linha que atualiza o usuário
                $push: { // add an entry to the purchase history array
                  purchaseHistory: {
                    product: payment.transactions[0].item_list.items[0].name,
                    value: parseFloat(payment.transactions[0].amount.total),
                    paymentId: paymentId // add payment ID to the purchase history
                  }
                }
              },
              { new: true },
              (err, user) => {
                if (err) {
                  console.error(err);
                  res.status(500).send('Error processing payment');
                } else {
                  // check the user's roles and update the user object accordingly
                  const confirmationHtml = `
                  <div style="background-color: #fff; border: 1px solid #ccc; margin: 50px auto; max-width: 400px; padding: 20px;">
                    <img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/checkout-logo-medium.png" alt="PayPal" style="float: left; margin-right: 20px;">
                    <div style="font-size: 16px; color: #444; margin-top: 40px;">
                      Seu pagamento de <strong>${payment.transactions[0].item_list.items[0].name}</strong> no valor de <strong>R$${parseFloat(payment.transactions[0].amount.total).toFixed(2)}</strong> foi concluído. Você pode voltar para o site da <a href="https://www.aupamatch.com/" style="color: #0070ba; text-decoration: none;">Aupamatch</a>.
                    </div>
                    <div style="clear: both;"></div>
                  </div>
                  `;
                  res.send(confirmationHtml);
                }
              }
            );
        }
      });
    }
  });
};


exports.pagamentoPublicador = async (req, res) => {

  if (!req.userRoles.includes("ROLE_FAMILY") && !req.userRoles.includes("ROLE_AGENCY")) {
    return res.status(403).json({ message: 'Você não tem permissão para acessar o pagamento do publicador de vagas.' });
  }

  const user = await User.findById(req.userId);

  if (user.pagamentoPublicador) {
    res.status(400).json({ message: 'O pagamento já foi efetuado.' });
    return;
  }

  let baseUrl = '';

  if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://aupamatch-api3.onrender.com/';
  } else {
    baseUrl = 'http://localhost:8080/';
  }
  const paymentData = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: `${baseUrl}api/success`,
      cancel_url: `${baseUrl}api/cancel`
    },
    transactions: [{
      item_list: {
        items: [{
          name: 'Publicador de Vagas',
          sku: '001',
          price: '100.00',
          currency: 'BRL',
          quantity: 1
        }]
      },
      amount: {
        currency: 'BRL',
        total: '100.00'
      },
      description: 'Ative a opção de publicador de vaga',
      custom: req.userId // add the ID of the user to the custom field
    }],
      experience_profile_id: 'XP-GP98-JA8J-GJRQ-LK9N'
  };

  paypal.payment.create(paymentData, (error, payment) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
      res.json({ approvalUrl });;
    }
  });
};

exports.pagamentoMaisCandidaturas = async (req, res) => {

  if (!req.userRoles.includes("ROLE_AUPAIR")) {
    return res.status(403).json({ message: 'Este pagamento é reservado às Aupairs' });
  }

  const user = await User.findById(req.userId);

  if (user.pagamentoMaisCandidaturas) {
    res.status(400).json({ message: 'O pagamento já foi efetuado.' });
    return;
  }

  let baseUrl = '';

  if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://aupamatch-api3.onrender.com/';
  } else {
    baseUrl = 'http://localhost:8080/';
  }
  const paymentData = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: `${baseUrl}api/success`,
      cancel_url: `${baseUrl}api/cancel`
    },
    transactions: [{
      item_list: {
        items: [{
          name: 'Candidatar em mais que 5 vagas',
          sku: '001',
          price: '25.00',
          currency: 'BRL',
          quantity: 1
        }]
      },
      amount: {
        currency: 'BRL',
        total: '25.00'
      },
      description: 'Ative a opção de candidatar em mais que 5 vagas',
      custom: req.userId // add the ID of the user to the custom field
    }],
      experience_profile_id: 'XP-GP98-JA8J-GJRQ-LK9N'
  };

  paypal.payment.create(paymentData, (error, payment) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
      res.json({ approvalUrl });;
    }
  });
};

exports.pagamentoVagaPatrocinada = async (req, res) => {

  if (req.userRoles.includes("ROLE_AUPAIR")) {
    return res.status(403).json({ message: 'Este pagamento é reservado às Famílias e Agências' });
  }

  const vaga = await Vaga.findById(req.params.id);

  if (vaga.vaga_patrocinada) {
    res.status(400).json({ message: 'A vaga já é patrocinada.' });
    return;
  }

  if (vaga.user.toString() !== req.userId) {
    return res.status(403).json({ message: 'Você não tem permissão para editar esta vaga.' });
  }

  let baseUrl = '';

  if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://aupamatch-api3.onrender.com/';
  } else {
    baseUrl = 'http://localhost:8080/';
  }

  console.log()
  const paymentData = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: `${baseUrl}api/success?vagaId=${req.params.id}`,
      cancel_url: `${baseUrl}api/cancel`
    },
    transactions: [{
      item_list: {
        items: [{
          name: 'Vaga Patrocinada',
          sku: '001',
          price: '25.00',
          currency: 'BRL',
          quantity: 1
        }]
      },
      amount: {
        currency: 'BRL',
        total: '25.00'
      },
      description: 'Mudar o atributo da vaga para patrocinada',
      custom: req.userId
    }],
      experience_profile_id: 'XP-GP98-JA8J-GJRQ-LK9N'
  };

  paypal.payment.create(paymentData, (error, payment) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
      res.json({ approvalUrl });;
    }
  });
};
exports.getCompraHistory = async (req, res) => {
  
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }
    const compraHistory = user.purchaseHistory;
    res.status(200).send(compraHistory);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Erro interno do servidor" });
  }
};











