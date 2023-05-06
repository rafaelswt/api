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

  app.put(
    "/api/vaga/:id",
    [authJwt.verifyToken],
    controller.updateVaga
  );

  app.get(
    "/api/vagas/:id",
    [authJwt.verifyToken],
    controller.consultarVagaPorId
  );

  app.get(
    "/api/delcandidatura",
    [authJwt.verifyToken],
    controller.deleteCandidatura
  );

  app.post(
    "/api/perfil",[authJwt.verifyToken], controller.createAupairProfile
  );

  app.put(
    "/api/perfil",[authJwt.verifyToken], controller.updateAupairProfile
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
    controller.criarCandidatura
  )

  app.get(
    "/api/vagas/candidaturas",
    [authJwt.verifyToken],
    controller.getCandidaturasByUserId
  )

  app.get(
    "/api/minhas-candidaturas",
    [authJwt.verifyToken],
    controller.getCandidaturasByAupairId
  )

  app.delete(
    "/api/vagas/:id/candidaturas",[authJwt.verifyToken], controller.deleteCandidatura
  );

  app.get(
    "/api/userprofile",
    [authJwt.verifyToken],
    controller.userprofile
  );

  app.get(
    "/api/login-history",
    [authJwt.verifyToken],
    controller.loginHistory
  );

  app.put(
    "/api/userprofile",
    [authJwt.verifyToken],
    controller.updateUserCredentials
  );

  app.patch(
    "/api/update-user",
    [authJwt.verifyToken],
    controller.updateUserCredentials
  );

  app.put(
    "/api/vaga/:id/toggle",
    [authJwt.verifyToken],
    controller.statusVaga
  );

  app.post(
    "/api/send-token",
    controller.sendResetToken
  );

  app.post(
    "/api/validate-token/",
    controller.validateResetCode
  );

  app.patch(
    "/api/reset-password/",
    controller.resetPassword
  );

  

};


