import "./CSS/Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* 🚀 Hero Section: Main Brand Identity */}
      <section className="home-hero">
        <div className="hero-content">
          <h1>🎮 GameShop</h1>
          <p className="hero-subtitle">
            A premium MERN stack ecosystem featuring secure authentication, 
            Role-Based Access Control (RBAC), and a seamless digital library.
          </p>
          <button className="cta-btn" onClick={() => navigate("/games")}>
            Explore Catalog
          </button>
        </div>
      </section>

      {/* 🛠 Tech Architecture Section */}
      <section className="home-section">
        <h2 className="section-title">🛠 Tech Architecture</h2>
        <div className="tech-grid">
          <div className="tech-tag">MongoDB</div>
          <div className="tech-tag">Express.js</div>
          <div className="tech-tag">React.js</div>
          <div className="tech-tag">Node.js</div>
          <div className="tech-tag">JWT Auth</div>
          <div className="tech-tag">Bcrypt.js</div>
          <div className="tech-tag">Nodemailer</div>
        </div>
      </section>

      {/* ✨ Features Section: Logic from your Backend */}
      <section className="home-section">
        <h2 className="section-title">✨ System Features</h2>

        <div className="features">
          {/* User Features */}
          <div className="feature-card">
            <div className="card-icon">👤</div>
            <h3>Player Profile</h3>
            <ul>
              <li><b>JWT Auth:</b> Secure session management</li>
              <li><b>Verification:</b> Email-based account security</li>
              <li><b>Library:</b> Permanent access to paid games</li>
              <li><b>Smart Cart:</b> Duplicate prevention logic</li>
            </ul>
          </div>

          {/* Admin Features */}
          <div className="feature-card admin-highlight">
            <div className="card-icon">🛡️</div>
            <h3>Admin Forge</h3>
            <ul>
              <li><b>RBAC:</b> Role-Based Access Control</li>
              <li><b>Catalog CRUD:</b> Manage game database</li>
              <li><b>Inventory:</b> Real-time price & meta updates</li>
              <li><b>Secure:</b> Admin-only protected endpoints</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 📝 Technical Footer */}
      <section className="home-footer">
        <p>
          Engineered with <b>Node.js</b> and <b>Mongoose</b>. 
          Verified tokens expire in 60 minutes for maximum security.
        </p>
      </section>
    </div>
  );
};

export default Home;