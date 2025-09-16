const { Router } = require("express");
const { param, validationResult } = require("express-validator");
const passport = require("passport");

const userController = require("../controllers/userController");

const router = Router();

router.use(passport.authenticate("jwt", { session: false }));

const sendValidationResults = (req, res, next) => {
  const validations = validationResult(req);
  if (!validations.isEmpty()) {
    res.status(400).json({
      errors: validations.array(),
    });
  }
  next();
};

router.use(
  "/:id",
  param("id").isNumeric().withMessage("User Id should be a number"),
  sendValidationResults
);

router.get("/:id", userController.getUser);

router.put("/:id", userController.updateUser);

router.delete("/:id", userController.deleteUser);

router.get("/", userController.getAllUser);

module.exports = router;
