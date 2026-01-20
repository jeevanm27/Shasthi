import express from "express";
const router = express.Router();
import {Create , hi ,get } from "../controllers/productController.js";


router.post("/add", Create);
router.get("/",hi);
router.get("/get",get);
export default router;