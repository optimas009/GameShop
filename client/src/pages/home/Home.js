import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import PostCard from "../feed/PostCard";
import MediaUtil from "../../services/MediaUtil"; 

import "../../css/Home.css";

const ensureArrays = (p) => {
  if (!p) return p;
  return {
    ...p,
    media: Array.isArray(p.media) ? p.media : [],
    youtubeUrls: Array.isArray(p.youtubeUrls) ? p.youtubeUrls : [],
  };
};

const pickGoodRandomPost = (posts) => {
  const cleaned = posts.map(ensureArrays);

  const good = cleaned.filter((p) => {
    const text =
      p?.text || p?.content || p?.caption || p?.message || p?.body || "";
    return (
      (text && String(text).trim().length > 0) ||
      (p?.media?.length || 0) > 0 ||
      (p?.youtubeUrls?.length || 0) > 0
    );
  });

  const pool = good.length ? good : cleaned;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

const Home = () => {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const [feedPreview, setFeedPreview] = useState(null);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // role state
  const [role, setRole] = useState("guest"); // guest | user | admin

  
  useEffect(() => {
    const loadMe = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setRole("guest");

      try {
        const res = await AuthFetch("/me", { skip401Handler: true });
        if (!res || res.status === 401) return setRole("guest");

        const me = await res.json().catch(() => ({}));
        setRole(me?.role === "admin" ? "admin" : "user");
      } catch {
        setRole("guest");
      }
    };

    loadMe();
  }, []);

 
  useEffect(() => {
    const loadGames = async () => {
      setLoadingGames(true);
      try {
        const res = await AuthFetch("/games", { skip401Handler: true });
        const data = await res.json().catch(() => []);
        setGames(Array.isArray(data) ? data : []);
      } catch {
        setGames([]);
      } finally {
        setLoadingGames(false);
      }
    };
    loadGames();
  }, []);

  const featured = useMemo(() => games.slice(0, 4), [games]);

  const formatMoney = (n) => {
    const x = Number(n);
    if (Number.isNaN(x)) return "";
    return x.toFixed(2);
  };

  // ----- Random post preview -----
  useEffect(() => {
    const loadPreview = async () => {
      setLoadingFeed(true);
      try {
        const res = await AuthFetch("/feed", { skip401Handler: true });
        const data = await res.json().catch(() => ({}));
        const arr = Array.isArray(data?.posts) ? data.posts : [];
        setFeedPreview(pickGoodRandomPost(arr));
      } catch {
        setFeedPreview(null);
      } finally {
        setLoadingFeed(false);
      }
    };

    loadPreview();
  }, []);

  // Explore click route based on role
  const handleExplore = () => {
    if (role === "admin") navigate("/update");
    else navigate("/games");
  };

  return (
    <div className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-badge">MERN STACK GAME STORE • DIGITAL KEYS</div>
          <div className="home-hero-logo">🎮</div>

          <h1 className="home-hero-title">
            <span className="home-hero-title-accent">GameVault</span>
          </h1>

          <p className="home-hero-subtitle">
            Your destination for <strong>premium digital games</strong>. Browse thousands
            of titles, <em>own them instantly</em>, and join a thriving gaming community.
            All your favorites, <strong>one platform</strong>.
          </p>

          <div className="home-hero-actions">
            <button className="home-btn primary" onClick={handleExplore}>
              Explore Catalog
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {!loadingGames && featured.length > 0 && (
        <section className="featured-section">
          <div className="featured-inner">
            <div className="featured-header">
              <p className="featured-label">Featured</p>
              <h2 className="featured-title">Premium Picks</h2>
            </div>

            <div className="featured-grid">
              {featured.map((game) => {
                
                const coverSrc = MediaUtil.toAbsoluteMediaUrl(
                  game?.coverMedia || game?.imageUrl
                );

                return (
                  <div
                    key={game._id}
                    className="featured-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/game/${game._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/game/${game._id}`);
                    }}
                  >
                    {coverSrc && (
                      <div className="featured-card-thumb">
                        <img src={coverSrc} alt={game.title} />
                      </div>
                    )}

                    <div className="featured-card-content">
                      <div>
                        <h3 className="featured-card-title">{game.title}</h3>
                        <div className="featured-card-meta">
                          <span>{game.genre || "Genre"}</span>
                          <span>{game.platform || "Platform"}</span>
                        </div>
                      </div>

                      <div className="featured-card-price">
                        ${formatMoney(game.price || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* COMMUNITY */}
      <section className="community-section">
        <div className="community-inner">
          <div className="community-header">
            <p className="community-label">Community</p>
            <h2 className="community-title">Join &amp; Share Your Thoughts</h2>
            <p className="community-subtitle">
              See what other gamers are saying. Drop a post, share a moment, or start a discussion.
            </p>
          </div>

          <div className="community-card">
            {loadingFeed ? (
              <p className="community-empty">Loading a post...</p>
            ) : !feedPreview ? (
              <p className="community-empty">
                No community posts yet. Be the first to post something!
              </p>
            ) : (
              <div className="community-postcard-wrap">
                <PostCard post={feedPreview} isAdmin={false} onDeleteLocal={() => {}} />
              </div>
            )}

            <div className="community-actions">
              <button
                className="home-btn primary"
                onClick={() => {
                  navigate("/feed");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Visit Newsfeed
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        <div className="features-inner">
          <div className="features-header">
            <p className="features-label">The Experience</p>
            <h2 className="features-title">Built for Gamers</h2>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <h3>Discover New Worlds</h3>
              <p>
                Explore a curated catalog of premium games across every genre.
                Find your next favorite with detailed descriptions and ratings.
              </p>
            </div>

            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <h3>Play Instantly</h3>
              <p>
                Purchase a game and get your key instantly.
                No waiting—start your adventure in seconds.
              </p>
            </div>

            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <h3>Build Your Collection</h3>
              <p>
                Every purchase is saved to your personal library.
                Keep track of all your games in one place.
              </p>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <h3>Connect & Share</h3>
              <p>
                Join a community of gamers. Share moments, like posts,
                and connect with players worldwide.
              </p>
            </div>

            <div className="feature-item">
              <span className="feature-icon">💎</span>
              <h3>Exclusive Titles</h3>
              <p>
                Access indie gems and AAA blockbusters.
                We bring you the best games on the market.
              </p>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <h3>Safe & Trusted</h3>
              <p>
                Shop with confidence. Your account and purchases are protected
                with industry-leading security.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
