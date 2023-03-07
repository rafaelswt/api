const { authJwt, verifySignUp } = require("../middlewares");
const controller = require("../controllers/user.controller");
const verifyAupairProfile = require("../middlewares/verifyAupairProfile");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/api/vagas",
    [authJwt.verifyToken],
    controller.listarVagas
  );

  app.post(
    "/api/vaga",[authJwt.verifyToken], controller.criarvaga
  );

  app.delete(
    "/api/vaga/:id",
    [authJwt.verifyToken],
    controller.deletarVaga
  );

  app.get(
    "/api/delcandidatura",
    [authJwt.verifyToken],
    controller.deleteCandidatura
  );


  app.post(
    "/api/perfil",[authJwt.verifyToken,
      verifyAupairProfile.checkDuplicateProfile], controller.createAupairProfile
  );

  app.get(
    "/api/perfil",[authJwt.verifyToken], controller.getAupairProfile
  );

  app.delete(
    "/api/perfil/",[authJwt.verifyToken], controller.deleteAupairProfile
  );


  app.get(
    "/api/candidatar",
    [authJwt.verifyToken],
    controller.candidatarse
  );

  app.get(
    "/api/matches",
    [authJwt.verifyToken],
    controller.findMatches
  );

  app.get(
    "/api/candidaturas",
    [authJwt.verifyToken],
    controller.candidaturas
  );

  app.get(
    "/api/userprofile",
    [authJwt.verifyToken],
    controller.userprofile
  );

  app.get(
    "/api/getcandidaturas",
    [authJwt.verifyToken],
    controller.getcandidaturas
  );

  app.get(
    "/api/match",
    [authJwt.verifyToken],
    controller.match
  );



  app.post(
    "/api/favoritar/",
    [authJwt.verifyToken],
    controller.favoritarVaga
  );

  app.get('/api/aupair/:idAupair/vagas-salvas', [authJwt.verifyToken], controller.listarVagasSalvas);



};
