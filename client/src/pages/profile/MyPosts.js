import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import PostCard from "../feed/PostCard";

import "../../css/NewsFeed.css";

const ensureArrays = (p) => {
  if (!p) return p;
  return {
    ...p,
    media: Array.isArray(p.media) ? p.media : [],
    youtubeUrls: Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [],
  };
};

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/home", { replace: true });
  }, [token, navigate]);

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

  const loadMyPosts = async () => {
    setLoading(true);
    try {
      const res = await AuthFetch("/my-posts");
      if (!res || res.status === 401) return;

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
    loadMyPosts();
  }, []);

  const removePostLocal = (postId) => {
    setPosts((prev) => prev.filter((p) => String(p._id) !== String(postId)));
  };

  return (
    <div className="feed-page">
      <div className="feed-wrap">
        <div className="feed-topbar">
          <h1 className="feed-title">MY POSTS</h1>
        </div>

        <div className="my-posts-actions">
          <button className="btn btn--ghost" type="button" onClick={() => navigate("/create-post")}>
            Create Post
          </button>
        </div>

        {loading ? (
          <p className="feed-empty">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="feed-empty">You have no posts yet.</p>
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

export default MyPosts;

