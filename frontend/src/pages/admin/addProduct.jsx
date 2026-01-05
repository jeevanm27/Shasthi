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
    const [Tag , setTag] = useState("");
    const [Availability , setAvailability] = useState("");


    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({name});
        alert("clicked btn");   
    }





    return(
        <div>
            <Head />
            <form className ="addform" onSubmit={handleSubmit} >
            <label htmlFor="name" >Name of the product :</label>
            <input
               name = "name"
               type ="text"
               onChange = {(e) => setName(e.target.value)}
               
               />


            <br></br>

            
            <label >Cost Price:</label>
            <input 
            name ="CP"
            type="number"
            onChange ={(e) => setCp(e.target.value)}/>


            <br></br>

            


             <label >Discount:</label>
            <input 
            name ="Discount"
            type="number"
            onChange ={(e) => setDiscount(e.target.value)}/>

            <br></br>


             <label  >Tag:</label>
            <select className="opt"  onChange = {(e) => setTag(e.target.value)}>
                <option className="opt"  value ="new">New Arrivals</option>
                <option className="opt"  value ="best">Best sellers</option>
                <option className="opt"  value ="Nan">None</option>
                

            </select>


            <br></br>


             <label >Availability:</label>
             <select className="opt" onChange = {(e) => setAvailability(e.target.value)}>
                <option className="opt"  value ="new">out of stock</option>
                <option className="opt"  value ="best">Available</option>
                
             </select>
           

            <br></br>

             <label  >Type or Category:</label>
            <select className="opt"  onChange = {(e) => setCategory(e.target.value)}>
                <option className="opt"  value ="Masala">Masala</option>
                <option className="opt"  value ="Thokku">Thokku</option>
                <option className="opt"  value ="Health Mix">Health Mix</option>
                

            </select>

            
            <br></br>


            <button type ="submit" id="btn">Submit</button>





            </form>
            <Footer />
        </div>
    )
       
}

export default AddProduct;    