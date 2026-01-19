import mongoose from "mongoose";

const ProductScehma = mongoose.Schema({

    Name:{type:String,required:true},
    CP:{type:Number,required:true},
    Discount:{type:Number,required:false},
    SP :{type:Number,required:true,},
    Weight :{type:[Number],required:true},
    Category:{type:String,required:true},
    Availability:{type:Boolean,required:true,default:true},
    Tag:{type:String,required:false,default:"None"}
})


  
const Product = mongoose.model("Product",ProductScehma);
export {Product};