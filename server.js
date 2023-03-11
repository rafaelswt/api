const express = require("express");
const cors = require("cors");
const helmet = require('helmet')
const validator = require('validator');
const dbConfig = require("./app/config/db.config");
require('dotenv').config()
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express()

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: ["'self'", "https://aupamatch-api3.render.com/"]
  }
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

      new Role({
        name: "agency"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'agency' to roles collection");
      });
    }
  });
}
