import React from 'react';
import Head from '../../components/Header.jsx';
import Footer from "../../components/Footer.jsx";
import "./Home.css";
import HomeCard from "../../components/HomeCard.jsx"

function Headfoot (){

    return (
    <div>

    <Head />

    <div className ="homepage">
        <div class="homeimg"><img  src="/home.png" /></div>
        
        <div className="Best">
            <h1>Best Sellers</h1>

            

        </div>

        <div className="new">
            <h1>New Arrivals</h1>

        </div>

        <div className="cust">
            <h1>Customer Favorites</h1>

        </div>


      
    </div>

    <Footer />

    </div>
    )
};


export default Headfoot;