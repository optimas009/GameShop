import "../../Footer.css";


import {
  FaGithub,
  FaFacebookF,
  FaLinkedinIn,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="cyber-footer">
      <div className="footer-wide-container">
        {/* Left Column: Identity */}
        <div className="footer-column identity-col">
          <div className="footer-brand">
            
            <h3 className="footer-name-brand">MOHAMMAD TAHMID SHAMS</h3>
          </div>
          <p className="footer-version">SYSTEM_VERSION: 2.0.4_STABLE</p>
        </div>

        {/* Center Column: Contact */}
        <div className="footer-column contact-col">
          <a
            href="mailto:shamstahmid19@gmail.com"
            className="contact-row"
          >
            <FaEnvelope className="footer-small-icon" />
            <span className="contact-value">
              shamstahmid19@gmail.com
            </span>
          </a>

          <a
            href="tel:+8801730993325"
            className="contact-row"
          >
            <FaPhoneAlt className="footer-small-icon" />
            <span className="contact-value">
              01730993325
            </span>
          </a>
        </div>

        {/* Right Column: Socials */}
        <div className="footer-column socials-col">
          
          <div className="footer-social-grid">
            <a
              href="https://github.com/optimas009"
              target="_blank"
              rel="noreferrer"
              className="hex-node"
            >
              <FaGithub />
            </a>

            <a
              href="https://www.facebook.com/shams.tahmid19/"
              target="_blank"
              rel="noreferrer"
              className="hex-node"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.linkedin.com/in/tahmid-shams-665b49233/"
              target="_blank"
              rel="noreferrer"
              className="hex-node"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="bar-line"></div>
        <p className="copyright-text">
          © {new Date().getFullYear()} ALL_RIGHTS_RESERVED
        </p>
      </div>
    </footer>
  );
}
