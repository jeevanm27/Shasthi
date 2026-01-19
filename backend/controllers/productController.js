const Product = require("../models/productModel");


const add = (req,res) => {
  
}


const hi =(req,res) => {
    res.status(201).json({message: "User created successfully"});
}


module.exports = {add , hi }