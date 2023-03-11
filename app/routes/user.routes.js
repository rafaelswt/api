const { authJwt, verifySignUp } = require("../middlewares");
const controller = require("../controllers/user.controller");

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
    "/api/perfil",[authJwt.verifyToken], controller.createAupairProfile
  );

  app.get(
    "/api/perfil",[authJwt.verifyToken], controller.getAupairProfile
  );

  app.delete(
    "/api/perfil/",[authJwt.verifyToken], controller.deleteAupairProfile
  );

  app.post(
    "/api/favoritar/:id",
    [authJwt.verifyToken],
    controller.favoritarVaga
  );

  app.get('/api/aupair/vagas-salvas',
   [authJwt.verifyToken], 
   controller.listarVagasSalvas);

  app.get('/api/familia/minhas-vagas',
   [authJwt.verifyToken], 
   controller.listarMinhasVagas);

  app.get(
    "/api/candidatar",
    [authJwt.verifyToken],
    controller.candidatarse
  )

  app.get(
    "/api/userprofile",
    [authJwt.verifyToken],
    controller.userprofile
  );
};
