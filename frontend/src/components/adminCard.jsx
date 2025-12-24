import './admincard.css';
import { useNavigate } from "react-router-dom";


function AdminCard (props){
const navigate = useNavigate();
    
    return (
        <div className = "admincard" onClick ={() =>  navigate(props.path)} >

            <h1>{props.name}</h1>

        
        </div>
    )
}


export default AdminCard ;