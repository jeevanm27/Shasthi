const express = require("express");
const mongoose = require("mongoose");
const ProductRoutes = require("./routes/productroutes.js");
const app = express();
const port = 3000;


const url =
"mongodb+srv://shasthiuser:Shasthi123@cluster0.iyhqs0m.mongodb.net/shasthidb";



mongoose.connect(url)
.then(() => console.log("database connected"))
.catch(err => console.log(err));

//product routes 

app.use("/api/Product",ProductRoutes);

app.use(express.json());

app.listen(3000, () =>{
    console.log(`backend started at ${port}`);
})