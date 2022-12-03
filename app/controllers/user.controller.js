const config = require("../config/auth.config");
const { vaga, user, candidatura, familia_has_vaga } = require("../models");
const db = require("../models");
const User = db.user;
const Vaga = db.vaga;
const Candidatura = db.candidatura;
const mongoose = require('mongoose');
const Familia_has_vaga = db.familia_has_vaga;
const Aupair = db.aupair;
mongoose.Promise = global.Promise;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");

};

exports.vagas = (req, res) => {
  if(req.query.roles  === "ROLE_FAMILY")
  {
    Vaga.find({'user':  mongoose.Types.ObjectId(req.query.userID)})
    .exec((err, vaga) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      res.json(vaga);
    } 
  )
}
  else if(req.query.roles === "ROLE_AUPAIR")
  {
    Vaga.find({$and: [{'aupair': {$ne : mongoose.Types.ObjectId(req.query.userID)}}, {"escolha" : 'false'} ]})
    .exec((err, vagas) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!vagas) {
        return res.status(404).send({ message: "Nenhuma Vaga não encontrada." });
      }

      res.json(vagas);
    });

  }
};

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
  if(req.query.roles  === "ROLE_FAMILY")
  {
    Vaga.find({   })

    .exec((err, vaga) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      res.json(vaga);
    } 
  )
}
  else if(req.query.roles === "ROLE_AUPAIR")
  {
    Vaga.find({'aupair':  mongoose.Types.ObjectId(req.query.userID)})
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

exports.criarvaga = (req, res) => {
  const vaga = new Vaga({
    escolaridade: req.body.escolaridade,
    experiencia: req.body.experiencia,
    filhos: req.body.filhos,
    descricao: req.body.descricao,
    natacao: req.body.natacao,
    carro: req.body.carro,
    habilitacao: req.body.habilitacao,
    email: req.body.email,
    id: req.body.id,
    escolha : false
  });

  const familia_has_vaga = new Familia_has_vaga({
    vaga : vaga._id,
    user: req.body.id
  });
  familia_has_vaga.save()

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

      res.send({ message: "Vaga foi registrada com sucesso" });
    });
  })
  
};

exports.criar_aupair = (req, res) => {
  User.findOne({ "_id": mongoose.Types.ObjectId(req.userId) }, (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    console.log(req.userId)

    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado." });
    }

    const aupair = new Aupair({
      telefone: req.body.telefone,
      cep: req.body.cep,
      logradouro: req.body.logradouro,
      numero: req.body.numero,
      cidade: req.body.cidade,
      estado: req.body.estado, 
      data_de_nascimento: req.body.data_de_nascimento,
      genero: req.body.genero,
      cpf: req.body.cpf,
      nacionalidade: req.body.nacionalidade,
      resumo: req.body.resumo,
      idioma : req.body.idioma,
      passaporte: req.body.passaporte,
      quantidade_criancas: req.body.quantidade_criancas,
      carro_exclusivo: req.body.carro_exclusivo,
      receber_newsletter: req.body.receber_newsletter,
      data_disponibilidade: req.body.data_disponibilidade,
      escolaridade: req.body.escolaridade,
      experiencia: req.body.experiencia,
      natacao: req.body.natacao,
      habilitacao: req.body.habilitacao,
    });

    aupair.aupair = req.userId;
    aupair.save(err => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      res.send({ message: "Perfil registrado com sucesso" });
    });
  })
  
};

exports.aupair_profile = (req, res) => {
  Aupair.findOne({'aupair.0': mongoose.Types.ObjectId(req.userId)})
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "Aupair Not found." });
      }

      res.json(user);

    });
};

exports.aupair_profile_delete = (req, res) => {
  Aupair.findOneAndDelete({'aupair.0': mongoose.Types.ObjectId(req.userId)})
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "Perfil não encontrado " });
      }

      res.send({ message: "Perfil deletado com sucesso" });
    });
};


exports.findMatches = (req, res) => {
  if(req.query.roles  === "ROLE_FAMILY")
  {
    Vaga.find({ 'user.0': mongoose.Types.ObjectId(req.query.id), 'aupair' : { $ne : [] } })
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
  else if(req.query.roles === "ROLE_AUPAIR")
  {
    Vaga.find({'aupair.0': mongoose.Types.ObjectId(req.query.id)})
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

exports.deleteVaga = (req, res) => {
  Vaga.findByIdAndDelete(req.query.vagaID)
  .exec((err, vaga) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!vaga) {
      return res.status(404).send({ message: "Vaga não encontrada." });
    }

    res.send({ message: "A vaga foi deletada com Sucesso" });
  }); 

}

exports.deleteCandidatura = (req, res) => {
  Candidatura.find({'vaga.0': mongoose.Types.ObjectId(req.query.vagaID)}).deleteOne().exec()
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
    aupair: req.query.aupairID,
    user: req.query.userID,
    escolha: false
  })
    candidatura.save()

    Vaga.findById(req.query.vagaID)
    .exec((err, vaga) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }   
      
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
    Candidatura.find({$or: [{"user.0" : mongoose.Types.ObjectId(req.query.id)}, {"aupair.0" : mongoose.Types.ObjectId(req.query.id)} ]})
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


exports.userprofile = (req, res) => {
  User.findById(req.query.userID
  )
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      res.json(user);

    });
};


