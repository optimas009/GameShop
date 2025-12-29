import "./CSS/Footer.css";
import {Link} from 'react-router-dom';

const Footer = ()=>{
    return(
        <div>
        <ul className="footer-up">
            

                <li><Link to = "" > facebook </Link></li>
                <li><Link to = "" > Linkedin </Link></li>
                <li><Link to = "https://github.com/optimas009"> Git </Link></li>


        </ul>
        </div>
    

    );
}
export default Footer;