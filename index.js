const express = require("express");
const app = express();
const cors = require("cors");

const passport = require("passport");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const { PrismaClient } = require("./generated/prisma");

const models = require("./models/index");
const routes = require("./routes/index");
const authRoutes = require("./routes/auth");

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

require("./config/passport");

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: "a santa at nasa",
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

// app.use(passport.session());

app.use((req, res, next) => {
  req.context = {
    models,
    me: models.users[1],
  };
  next();
});

app.use("/session", routes.session);
app.use("/users", routes.user);
app.use("/messages", routes.message);
app.use("/auth", authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ errors: err });
});

app.get("/", (req, res) => {
  res.json({
    message: "index",
  });
});

app.listen(process.env.APP_PORT, () => {
  console.log(`App listen on PORT: ${process.env.APP_PORT}`);
});
