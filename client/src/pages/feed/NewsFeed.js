import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import PostCard from "./PostCard"

import "../../css/NewsFeed.css";

const ensureArrays = (p) => {
  if (!p) return p;
  return {
    ...p,
    media: Array.isArray(p.media) ? p.media : [],
    youtubeUrls: Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [],
  };
};

const NewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const loadMe = async () => {
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const res = await AuthFetch("/me", { skip401Handler: true });
      if (!res || !res.ok) return setIsAdmin(false);
      const me = await res.json().catch(() => null);
      setIsAdmin(me?.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  };

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await AuthFetch("/feed", { skip401Handler: true });
      const data = await res.json().catch(() => ({}));

      const arr = Array.isArray(data.posts) ? data.posts : [];
      setPosts(arr.map(ensureArrays));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
    loadFeed();
    
  }, []);

  const handleTopRight = () => {
    if (token) navigate("/create-post");
    else navigate("/login");
  };

  const removePostLocal = (postId) => {
    setPosts((prev) => prev.filter((p) => String(p._id) !== String(postId)));
  };

  return (
    <div className="feed-page">
      <div className="feed-wrap">
        <div className="feed-topbar">
          <h1 className="feed-title">NEWSFEED</h1>

          <button className="btn btn--ghost btn--topright" type="button" onClick={handleTopRight}>
            {token ? "Post something" : "Login to post"}
          </button>
        </div>

        {loading ? (
          <p className="feed-empty">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="feed-empty">No posts yet.</p>
        ) : (
          <div className="feed-list">
            {posts.map((p) => (
              <PostCard key={p._id} post={p} isAdmin={isAdmin} onDeleteLocal={removePostLocal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;


