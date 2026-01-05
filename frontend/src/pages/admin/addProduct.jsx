import axios from "axios";
import {useState} from "react";
import Footer from "../../components/Footer.jsx";
import Head from "../../components/Header.jsx";
import "../admin/addproduct.css"

function AddProduct (){
    const [name , setName] = useState(""); 
    const [CP , setCp] = useState(0);
    const [Discount , setDiscount] = useState("");
    const [SP , setSp] = useState("");
    const [Weight , setWeight] = useState("");
    const [Category , setCategory] = useState("");
    const [Availability , setAvailability] = useState("");
    

    return(
        <div>
            <Head />
            <form className ="addform" >
            <label htmlFor="name" >Name of the product :</label>
            <input
               name = "name"
               type ="text"
               onChange = {(e) => setName(e.target.value)}
               />


            <br></br>

            
            <label >Cost Price</label>
            <input 
            name ="CP"
            type="number"
            onChange ={(e) => setCp(e.target.value)}/>


            <br></br>

            


             <label >Discount</label>
            <input 
            name ="Discount"
            type="number"
            onChange ={(e) => setDiscount(e.target.value)}/>

            <br></br>


             <label >Category</label>
            <input 
            name ="Category"
            type="text"
            onChange ={(e) => setCategory(e.target.value)}/>


            <br></br>


             <label >Availability</label>
            <input 
            name ="CP"
            type="number"
            onChange ={(e) => setAvailability(e.target.value)}/>

            <br></br>





            </form>
            <Footer />
        </div>
    )
       
}

export default AddProduct;