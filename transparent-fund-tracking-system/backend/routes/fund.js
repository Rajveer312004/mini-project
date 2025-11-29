const express = require("express");
const router = express.Router();
const { addScheme, useFund, getScheme, getSchemeCount } = require("../controllers/fundController");

router.post("/add", addScheme);
router.post("/use", useFund);
router.get("/:id", getScheme);
router.get("/", getSchemeCount);

module.exports = router;
