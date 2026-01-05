import React from "react";
import "./headfoot.css";
import { Link } from "react-router-dom";

function Header() {
  return (
    <>
      <header>
        <h1 id="hh1">Shasthi Masala</h1>

        <nav>
          <Link to = "/headfoot">Home</Link>
          <Link to = "/products">Products</Link>
          <Link to = "/cart">Cart</Link>
          <Link to = "/aboutus">About Us</Link>
        </nav>
      </header>

      

      <hr />
    </>
  );
}

export default Header;
