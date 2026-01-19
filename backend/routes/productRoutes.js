import express from "express";
const router = express.Router();
import {add , hi } from "../controllers/productController.js";


router.post("/add", add);
router.get("/",hi);

export default router;