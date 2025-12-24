const express = require("express");
const router = express.Router();
const {create , hi } = require ("../controllers/productcontroller");


router.post("/create" , create);
router.get("/",hi);

module.exports= router ;