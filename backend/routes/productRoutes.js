const express = require("express");
const router = express.Router();
const {add , hi } = require ("../controllers/productcontroller");


router.post("/add" , create);
router.get("/",hi);

module.exports= router ;