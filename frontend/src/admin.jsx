
import React from 'react';
import AdminCard from './components/adminCard';
import Head from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import './components/adminCard.css';

function Admin() {
  return (
    <div>
      <Head />
    <div className = "container" >
    <AdminCard name = "Add products" path="/admin/create" />
    <AdminCard name = "Edit products" />
    <AdminCard name = "Customer Details" />
    <AdminCard name = "Sales and track record " />
    </div>

    <Footer />

    </div>
    

  );
}

export default Admin;