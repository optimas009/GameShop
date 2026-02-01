import {Link} from 'react-router-dom';

import "../../css/Footer.css";

const Footer = ()=>{
    return(
        <div>
        <ul className="footer-up">
            

                <li><Link to = "https://www.facebook.com/shams.tahmid19/" > facebook </Link></li>
                <li><Link to = "https://www.linkedin.com/in/tahmid-shams-665b49233/" > Linkedin </Link></li>
                <li><Link to = "https://github.com/optimas009"> Git </Link></li>


        </ul>
        </div>
    

    );
}
export default Footer;