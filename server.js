const express = require("express");
const cors = require("cors");
const helmet = require('helmet')
const dbConfig = require("./app/config/db.config");
require('dotenv').config()

const swaggerUI = require("swagger-ui-express")
const swaggerDocument = require("./swagger.json")

const helmet = require('helmet')

const app = express()

app.use(helmet.frameguard())

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument))

app.use(function (req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; frame-src 'self'"
  );
  next();
});

var corsOptions = {
  origin: "*"
};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;
const Idioma = db.idioma;
const Escolaridade = db.escolaridade;
const Religiao = db.religiao;

db.mongoose
  .connect(process.env.MONGODB_URI || `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Webbstars application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "aupair"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'aupair' to roles collection");
      });

      new Role({
        name: "family"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'family' to roles collection");
      });
    }
  });

  Idioma.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Idioma({
        descricao: "Inglês"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Inglês' to idioma collection");
      });

      new Idioma({
        descricao: "Francês"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Francês' to idioma collection");
      });

      new Idioma({
        descricao: "Espanhol"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Espanhol' to idioma collection");
      });
    }
  });

  Escolaridade.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Escolaridade({
        descricao: "Ensino Fundamental"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Ensino Fundamental' to escolaridade collection");
      });

      new Escolaridade({
        descricao: "Ensino Médio"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Ensino Médio' to escolaridade collection");
      });

      new Escolaridade({
        descricao: "Ensino Superior"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Ensino Superior' to escolaridade collection");
      });
    }
  });

  Religiao.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Religiao({
        descricao: "Católica"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Católica' to religiao collection");
      });

      new Religiao({
        descricao: "Evangélica"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Evangélica' to religiao collection");
      });

      new Religiao({
        descricao: "Judaica"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Judaica' to religiao collection");
      });
    }
  });


}
