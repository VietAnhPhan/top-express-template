const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const passport = require("passport");
const jwt = require("jsonwebtoken");

router.post(
  "/sign-up",
  body("name").trim(),
  body("username")
    .trim()
    .custom(async (value) => {
      const user = await prisma.user.findFirst({
        where: {
          username: value,
        },
      });
      if (user) {
        throw new Error("Username already in use");
      }
    }),
  body("email").notEmpty().withMessage("Email mus be filled").isEmail().trim(),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must have at least 8 letters"),
  body("repeat_password")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Repeat password must match"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        // return res.status(400).render("signup", {
        //   title: "Failed to create the user",
        //   errors: errors.array(),
        // });
        // next(errors.array());
        // throw new Error(errors);
        return res.json({
          title: "Fail to create the user",
          errors: errors.array(),
        });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const user = {
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        isAdmin: req.body.isAdmin ? true : false,
      };

      await prisma.user.create({
        data: user,
      });

      const userAuth = {
        username: req.body.username,
        password: req.body.password,
      };

      const token = jwt.sign(userAuth, "jwt_secret");
      return res.json({ userAuth, token });

      //   const createdUser = await prisma.user.findFirst({
      //     where: {
      //       user_name: user.user_name,
      //     },
      //   });

      //   res.render("index", { title: "Home page", user: createdUser });

      //   req.login(createdUser, (err) => {
      //     if (!err) {
      //       res.redirect("/");
      //     } else {
      //       next(err);
      //     }
      //   });
    } catch (error) {
      //   console.log(`Error creating user: ${error}`);
      //   res.status(500).send("Can not create new user");
      next(error);
    }
  }
);

router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        error: err ? err.message : null,
        info: info,
        user: user,
      });
    }
    const token = jwt.sign(user, "jwt_secret");
    return res.json({ user, token });
  })(req, res);
});

module.exports = router;
