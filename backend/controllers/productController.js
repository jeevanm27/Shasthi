const Product = require("../models/productModel");


const create = async (req, res) => {
  try {
    console.log(req.body);

    res.status(201).json({
      message: "Create route working",
      data: req.body
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};


const hi =(req,res) => {
    res.status(201).json({message: "User created successfully"});
}


module.exports = {create , hi }