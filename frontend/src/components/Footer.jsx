import React from "react";
import "./headfoot.css";

function Footer() {
  return (
    <footer>
      <div className="foo1">
        <p>© Copyright reserved</p>
        <p>Delight your taste buds with the authentic flavors of Shasthi Masala!</p>
      </div>

      <div className="foo2">
        <p id="conus">Contact Us</p>
        <p>Shasthi Masala Pvt Ltd</p>

        <p>
          <a href="https://www.instagram.com/shashti_masala/" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </p>

        <p>
          <a href="https://www.instagram.com/shashti_masala/" target="_blank" rel="noreferrer">
            YouTube
          </a>
        </p>

        <a  href="https://wa.me/916381054192" className="phone">
          🟢📞 +91 6381054192
        </a>
      </div>
    </footer>
  );
}

export default Footer;
