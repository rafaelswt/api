const config = require("../config/auth.config");
const { vaga, user, candidatura } = require("../models");
const db = require("../models");
const User = db.user;
const Vaga = db.vaga;
const Candidatura = db.candidatura;
const mongoose = require('mongoose');
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
    Vaga.find({'aupair': {$ne : mongoose.Types.ObjectId(req.query.userID)}})
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

      res.send({ message: "Vaga foi registrada com sucesso" });
    });
  })
  
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

    vaga.aupair.pull(req.query.userID);
    
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


