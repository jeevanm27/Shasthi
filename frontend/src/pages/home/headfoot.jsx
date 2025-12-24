import React from 'react';
import Head from '../../components/Header.jsx';
import Footer from "../../components/Footer.jsx";
import "./home.css";
import HomeCard from "../../components/HomeCard.jsx"

function Headfoot (){

    return (
    <div>

    <Head />

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

        <div className="cust">
            <h1>Customer Favorites</h1>

        </div>


      
    </div>

    <Footer />

    </div>
    )
};


export default Headfoot;