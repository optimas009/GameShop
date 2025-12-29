import "./CSS/Profile.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "./AuthFetch";

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLibrary = async () => {
    try {
      const res = await AuthFetch("/library");
      if (!res) return;
      if (res.status === 401) return;

      const data = await res.json();
      setLibrary(Array.isArray(data.library) ? data.library : []);
    } catch (e) {
      alert("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-wrap">
        <h1 className="profile-title">Profile</h1>

        <div className="profile-card">
          <div className="profile-name">{user.name || "User"}</div>
          <div className="profile-email">{user.email || ""}</div>
        </div>

        <h2 className="profile-subtitle">Your Library</h2>

        {loading ? (
          <p>Loading...</p>
        ) : library.length === 0 ? (
          <p className="profile-empty">
            No purchased games yet.{" "}
            <span className="profile-link" onClick={() => navigate("/games")}>
              Browse games
            </span>
          </p>
        ) : (
          <div className="library-grid">
            {library.map((g, idx) => (
              <div key={(g.gameId || idx).toString()} className="library-card">
                <div className="library-media">
                  {g.imageUrl ? (
                    <img className="library-img" src={g.imageUrl} alt={g.title} />
                  ) : (
                    <div className="library-img-placeholder">No image</div>
                  )}
                </div>

                <div className="library-info">
                  <h3 className="library-title">{g.title}</h3>
                  <p><b>Purchased for :</b> ${g.price}</p>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
