import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Admin from "./admin"
import styles from "./App.module.css";
import Head from "./pages/home/headfoot.jsx";
import AddProduct from './pages/admin/addProduct.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div
            className={styles.App}
            style={{
              backgroundImage: "url('/bg3.jpg')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "cover",
              height: "100vh",
              width: "100vw"
            }}
          >
            <h1 style={{ textAlign: "center" }}>shasthi masala on progress🚧 🔥</h1>
            <Link to="/admin">
              <button>admin page</button>
            </Link>
            <button>products listing</button>
            <button>products details</button>
            <button>about page</button>
            <Link to="/headfoot">
              <button>Header and footer</button>
            </Link>
          </div>
        } />
        <Route path="/admin" element={<Admin />} />
        <Route path="/headfoot" element={<Head />} />
        <Route path ='/admin/create' element={<AddProduct/>} />
      </Routes>
    </Router>
  )
}

export default App