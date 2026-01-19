import express from "express";
import mongoose from "mongoose";
import ProductRoutes from "./routes/productRoutes.js";
import cors from "cors";


const app = express();
const port = 3000;

app.use(cors());

app.use(express.json());


const url =
"mongodb+srv://shasthiuser:Shasthi123@cluster0.iyhqs0m.mongodb.net/shasthidb";



mongoose.connect(url)
.then(() => console.log("database connected"))
.catch(err => console.log(err));

//product routes 

app.use("/api/Product",ProductRoutes);

app.listen(3000, () =>{
    console.log(`backend started at ${port}`);
})