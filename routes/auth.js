const express = require("express");
const router = express.Router();

const { body, validationResult } = require("express-validator");

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const passport = require("passport");
const jwt = require("jsonwebtoken");

const userController = require("../controllers/userController");

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
  body("email")
    .notEmpty()
    .withMessage("Email must be filled")
    .isEmail()
    .trim()
    .custom(async (value) => {
      const user = await prisma.user.findFirst({
        where: {
          email: value,
        },
      });
      if (user) {
        throw new Error("Email already in use");
      }
    }),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must have at least 8 letters"),
  body("repeat_password")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Repeat password must match"),
  (req, res, next) => {
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
    next();
  },
  userController.createUser
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
    return res.json({ userId: user.id, token });
  })(req, res);
});

module.exports = router;
