import React from 'react';
import {useState, useEffect} from 'react';
import axios from 'axios';
import Head from '../../components/Header.jsx';
import Footer from "../../components/Footer.jsx";
import "./home.css";
import HomeCard from "../../components/HomeCard.jsx"

function Headfoot (){
    const [pro,setPro] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:3000/api/Product/get")
        .then(res => {setPro(res.data[0]);
        
        })
        .catch(err => console.error("Error fetching products:", err));
    }, [])

    return (
    <div>

    <Head />
    
    {pro && <h1>{pro.Name}</h1>}

    <div className ="homepage">
        <div class="homeimg"><img  src="/home.png" /></div>
        <h1>Best Sellers</h1>
        <div className="Best">
            
            <HomeCard name="1"/>
            <HomeCard name="2"/>
            <HomeCard name="3"/>
            <HomeCard name="4"/>
            <HomeCard name="5"/>
            <HomeCard name="6"/>
            <HomeCard name="7"/>
            <HomeCard name="8"/>

            

        </div>
<h1>New Arrivals</h1>
        <div className="Best">
             <HomeCard name="1"/>
            <HomeCard name="2"/>
            <HomeCard name="3"/>
            <HomeCard name="4"/>
            <HomeCard name="5"/>
            <HomeCard name="6"/>
            <HomeCard name="7"/>
            <HomeCard name="8"/>

        </div>

       
            <h1>Customer reviews</h1>
             <div className="Best">
             <HomeCard link="/cust.webp" name="1"/>
            <HomeCard link="/cust.webp" name="2"/>
            <HomeCard link="/cust.webp" name="3"/>
            <HomeCard link="/cust.webp" name="4"/>  
            <HomeCard link="/cust.webp" name="5"/>
            <HomeCard link="/cust.webp" name="6"/>
            <HomeCard link="/cust.webp" name="7"/>
            <HomeCard link="/cust.webp" name="8"/>

        </div>


      
    </div>

    <Footer />

    </div>
    )
};


export default Headfoot;