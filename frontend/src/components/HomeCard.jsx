import "../pages/home/home.css";
function HomeCard(props){
    return (
        <div className="home-card">
            <img src="/bg3.jpg" />


            <h1>product {props.name}</h1>
            
        </div>  
    )

}

export default HomeCard;