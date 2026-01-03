import "./CSS/Profile.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "./AuthFetch";

const Profile = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState({ name: "", email: "" });
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      // ✅ 1) load real user from server (NOT localStorage)
      const meRes = await AuthFetch("/me");
      if (!meRes) return;
      if (meRes.status === 401) return;

      const meData = await meRes.json();
      setMe({ name: meData?.name || "User", email: meData?.email || "" });

      // (optional) keep local user updated
      //localStorage.setItem("user", JSON.stringify(meData));

      // ✅ 2) load library
      const libRes = await AuthFetch("/library");
      if (!libRes) return;
      if (libRes.status === 401) return;

      const libData = await libRes.json();
      setLibrary(Array.isArray(libData.library) ? libData.library : []);
    } catch (e) {
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-wrap">
        <h1 className="profile-title">Profile</h1>

        <div className="profile-card">
          <div className="profile-name">{me.name || "User"}</div>
          <div className="profile-email">{me.email || ""}</div>
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
                  <p>
                    <b>Purchased for :</b> ${g.price}
                  </p>
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
