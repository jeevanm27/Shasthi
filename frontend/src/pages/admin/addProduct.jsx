import axios from "axios";
import {useState} from "react";
import Footer from "../../components/Footer.jsx";
import Head from "../../components/Header.jsx";


function AddProduct (){
    const [name , setName] = useState(""); 
    const [CP , setCp] = useState("");
    const [Discount , setDiscount] = useState("");
    const [SP , setSp] = useState("");
    const [Weight , setWeight] = useState("");
    const [Category , setCategory] = useState("");
    const [Availability , setAvailability] = useState("");
    

    return(
        <div>
            <Head />
            <form className ="addform" >
            <label htmlFor="name" >name of the product :</label>
            <input
               name = "name"
               type ="text"
               onChange = {(e) => setName(e.target.value)}
              
            
            />
            <label htmlFor=""></label>

            </form>
            <Footer />
        </div>
    )
       
}

export default AddProduct;