const mongoose = require("mongoose");

const UserScehma = mongoose.Schema({
    name : {type:String,required:true},
    email : {type:String,required:true}
})

const User = mongoose.model("User" , UserScehma );
module.exports = User ;