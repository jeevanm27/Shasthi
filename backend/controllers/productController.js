import {Product}  from "../models/productModel.js";


export const add = async (req,res) => {
  try {
    console.log(req.body);

    const newProduct = new Product({
        Name: req.body.name,
        CP: req.body.CP,
        Discount: req.body.Discount,
        SP: req.body.SP,
        Weight: req.body.Weight,
        Tag: req.body.Tag,
        Availability: req.body.Availability,
        Category: req.body.Category
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error adding product",
      error: error.message
    });
  }
}


export const hi =(req,res) => {
    res.status(201).json({message: "User created successfully"});
}

