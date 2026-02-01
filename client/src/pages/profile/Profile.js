import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import LibraryRow from "./LibraryRow";

import "../../css/Profile.css";

const Profile = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState({ name: "", email: "" });
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const loadAll = async () => {
    try {
      setLoading(true);

      const meRes = await AuthFetch("/me");
      if (!meRes || meRes.status === 401) return;

      const meData = await meRes.json().catch(() => ({}));
      setMe({
        name: meData?.name || "User",
        email: meData?.email || "",
      });

      const libRes = await AuthFetch("/library");
      if (!libRes || libRes.status === 401) return;

      const libData = await libRes.json().catch(() => ({}));
      setLibrary(Array.isArray(libData.library) ? libData.library : []);
    } catch {
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const renderEmpty = () => {
    return (
      <p className="profile-empty">
        No purchased games yet.{" "}
        <span className="profile-link" onClick={() => navigate("/games")}>
          Browse games
        </span>
      </p>
    );
  };

  const renderLibrary = () => {
    if (loading) return <p>Loading...</p>;
    if (!library || library.length === 0) return renderEmpty();

    return (
      <div className="library-list">
        {library.map((g) => {
          const id = String(g.gameId || g._id);
          const isOpen = openId === id;

          return (
            <LibraryRow
              key={id}
              game={g}
              isOpen={isOpen}
              toggle={toggle}
              setLibrary={setLibrary} 
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-wrap">
        <h1 className="profile-title">Profile</h1>

        <div className="profile-card">
          <div className="profile-name">{me.name || "User"}</div>
          <div className="profile-email">{me.email || ""}</div>
        </div>

        <button className="mypost" type="button" onClick={() => navigate("/my-posts")}>
          My Posts
        </button>

        <h2 className="profile-subtitle">Your Library</h2>

        {renderLibrary()}
      </div>
    </div>
  );
};

export default Profile;
