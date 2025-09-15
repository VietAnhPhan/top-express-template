const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const extractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passportField: "password",
    },
    async (username, password, done) => {
      try {
        const user = await prisma.user.findFirst({
          where: {
            username: username,
          },
        });

        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await db.query("SELECT * FROM User WHERE id = ($1)", [id]);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "jwt_secret",
    },
    async (jwtPayload, done) => {
      try {
        const user = await prisma.user.findFirst({
          where: {
            id: jwtPayload.id,
          },
        });

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
