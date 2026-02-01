import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthFetch from "../../services/AuthFetch";
import UploadFile from "../../services/UploadFile";
import MediaUtil from "../../services/MediaUtil";
import DeleteUpload from "../../services/DeleteUpload";


import "../../css/Form.css";

const AddGame = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    price: "",
    developer: "",
    sizeGB: "",
    platform: "",
    genre: "",
    description: "",

    trailerUrl: "",
    modesText: "",
    languagesText: "",
    onlineRequired: false,
    crossplay: false,
    controllerSupport: false,

    min_os: "",
    min_cpu: "",
    min_ram: "",
    min_gpu: "",
    min_storage: "",

    rec_os: "",
    rec_cpu: "",
    rec_ram: "",
    rec_gpu: "",
    rec_storage: "",
  });

  //media state 
  const [coverMedia, setCoverMedia] = useState("");
  const [screenshots, setScreenshots] = useState([]);

  //uploading state
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingShots, setUploadingShots] = useState(false);

  //popup state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error
  const [nextRoute, setNextRoute] = useState("");

  const openPopup = (type, msg, routeAfterOk = "") => {
    setMessageType(type);
    setMessage(msg);
    setNextRoute(routeAfterOk);
  };

  const handleOk = () => {
    const route = nextRoute;
    setMessage("");
    setMessageType("");
    setNextRoute("");
    if (route) navigate(route, { replace: true });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toCommaArray = (text) =>
    String(text || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  //Cover upload
  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setUploadingCover(true);
      const data = await UploadFile(file, "/admin/upload-game?type=cover");

      if (!data?.path) throw new Error("Upload failed");
      setCoverMedia(data.path); // store "/uploads/..."
    } catch (err) {
      openPopup("error", err.message || "Cover upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  // Screenshots upload (multiple)
  const handleScreenshotsFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    try {
      setUploadingShots(true);
      const uploaded = await Promise.all(
        files.map((f) => UploadFile(f, "/admin/upload-game?type=screenshot"))
      );
      const paths = uploaded.map((u) => u?.path).filter(Boolean);

      setScreenshots((prev) => {
        const merged = [...prev, ...paths];
        return Array.from(new Set(merged));
      });
    } catch (err) {
      openPopup("error", err.message || "Screenshots upload failed");
    } finally {
      setUploadingShots(false);
    }
  };

  const removeScreenshot = async (p) => {
    try {
      await DeleteUpload(p);
    } catch { }
    setScreenshots((prev) => prev.filter((x) => x !== p));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || form.price === "") {
      openPopup("error", "Title and price are required");
      return;
    }

    if (uploadingCover || uploadingShots) {
      openPopup("error", "Please wait until uploads finish.");
      return;
    }

    const payload = {
      title: form.title,
      price: Number(form.price),
      developer: form.developer,
      sizeGB: form.sizeGB ? Number(form.sizeGB) : 0,
      platform: form.platform,
      genre: form.genre,
      description: form.description,


      coverMedia,
      screenshots,


      trailerUrl: form.trailerUrl,
      modes: toCommaArray(form.modesText),
      languages: toCommaArray(form.languagesText),
      onlineRequired: Boolean(form.onlineRequired),
      crossplay: Boolean(form.crossplay),
      controllerSupport: Boolean(form.controllerSupport),

      minimumRequirements: {
        os: form.min_os,
        cpu: form.min_cpu,
        ram: form.min_ram,
        gpu: form.min_gpu,
        storage: form.min_storage,
      },
      recommendedRequirements: {
        os: form.rec_os,
        cpu: form.rec_cpu,
        ram: form.rec_ram,
        gpu: form.rec_gpu,
        storage: form.rec_storage,
      },
    };

    try {
      const res = await AuthFetch("/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res) {
        openPopup("error", "Failed to add game. Please try again.");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        openPopup("error", "Session expired. Please login again.", "/login");
        return;
      }

      if (res.status === 403) {
        openPopup("error", "Admin access required", "/games");
        return;
      }

      if (!res.ok) {
        openPopup("error", data.message || "Failed to add game");
        return;
      }

      openPopup("success", "Game added!", "/update");
    } catch {
      openPopup("error", "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="admin-page">
      {message && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className={`msg-modal ${messageType}`}>
            <h3>{messageType === "success" ? "Success" : "Error"}</h3>
            <p>{message}</p>
            <button type="button" onClick={handleOk}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="admin-wrap">
        <h1 className="admin-title">Add Game</h1>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-grid">
            <div className="admin-field">
              <label className="admin-label">Title *</label>
              <input
                className="admin-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Game title"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Price *</label>
              <input
                className="admin-input"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Price"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Developer</label>
              <input
                className="admin-input"
                name="developer"
                value={form.developer}
                onChange={handleChange}
                placeholder="Developer"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Size (GB)</label>
              <input
                className="admin-input"
                name="sizeGB"
                value={form.sizeGB}
                onChange={handleChange}
                placeholder="Size in GB"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Platform</label>
              <input
                className="admin-input"
                name="platform"
                value={form.platform}
                onChange={handleChange}
                placeholder="PC / PS5 / Xbox"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Genre</label>
              <input
                className="admin-input"
                name="genre"
                value={form.genre}
                onChange={handleChange}
                placeholder="Genre"
              />
            </div>

            {/*COVER UPLOAD*/}
            <div className="admin-field admin-span-2">
              <label className="admin-label">
                Cover Image (Upload) {uploadingCover ? "— Uploading..." : ""}
              </label>
              <input
                className="admin-input"
                type="file"
                accept="image/*"
                onChange={handleCoverFile}
                disabled={uploadingCover}
              />
              {coverMedia ? (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={MediaUtil.toAbsoluteMediaUrl(coverMedia)}
                    alt="cover"
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                  <div style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="admin-btn secondary"
                      onClick={async () => {
                        try {
                          await DeleteUpload(coverMedia);
                        } catch { }
                        setCoverMedia("");
                      }}
                    >
                      Remove Cover
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Trailer */}
            <div className="admin-field admin-span-2">
              <label className="admin-label">Trailer URL (YouTube)</label>
              <input
                className="admin-input"
                name="trailerUrl"
                value={form.trailerUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            {/* Screenshots upload */}
            <div className="admin-field admin-span-2">
              <label className="admin-label">
                Screenshots (Upload multiple) {uploadingShots ? "— Uploading..." : ""}
              </label>
              <input
                className="admin-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleScreenshotsFiles}
                disabled={uploadingShots}
              />

              {screenshots.length > 0 ? (
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {screenshots.map((p) => (
                    <div key={p} style={{ width: 140 }}>
                      <img
                        src={MediaUtil.toAbsoluteMediaUrl(p)}
                        alt="screenshot"
                        style={{ width: "100%", borderRadius: 8 }}
                      />
                      <button
                        type="button"
                        className="admin-btn secondary"
                        style={{ marginTop: 6, width: "100%" }}
                        onClick={() => removeScreenshot(p)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="admin-field admin-span-2">
              <label className="admin-label">Description</label>
              <textarea
                className="admin-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Game description..."
                rows={5}
              />
            </div>

            {/* Gameplay */}
            <div className="admin-field admin-span-2">
              <label className="admin-label">Modes (comma separated)</label>
              <input
                className="admin-input"
                name="modesText"
                value={form.modesText}
                onChange={handleChange}
                placeholder="Single-player, Multiplayer, Co-op"
              />
            </div>

            <div className="admin-field admin-span-2">
              <label className="admin-label">Languages (comma separated)</label>
              <input
                className="admin-input"
                name="languagesText"
                value={form.languagesText}
                onChange={handleChange}
                placeholder="English, Bengali, Hindi"
              />
            </div>

            <div className="admin-field admin-span-2">
              <label className="admin-label">Options</label>
              <div className="admin-checkrow">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    name="onlineRequired"
                    checked={form.onlineRequired}
                    onChange={handleChange}
                  />
                  Online Required
                </label>

                <label className="admin-check">
                  <input
                    type="checkbox"
                    name="crossplay"
                    checked={form.crossplay}
                    onChange={handleChange}
                  />
                  Crossplay
                </label>

                <label className="admin-check">
                  <input
                    type="checkbox"
                    name="controllerSupport"
                    checked={form.controllerSupport}
                    onChange={handleChange}
                  />
                  Controller Support
                </label>
              </div>
            </div>

            {/* Requirements */}
            <div className="admin-field admin-span-2">
              <label className="admin-label">Minimum Requirements</label>
              <div className="admin-req-grid">
                <input className="admin-input" name="min_os" value={form.min_os} onChange={handleChange} placeholder="OS" />
                <input className="admin-input" name="min_cpu" value={form.min_cpu} onChange={handleChange} placeholder="CPU" />
                <input className="admin-input" name="min_ram" value={form.min_ram} onChange={handleChange} placeholder="RAM" />
                <input className="admin-input" name="min_gpu" value={form.min_gpu} onChange={handleChange} placeholder="GPU" />
                <input className="admin-input" name="min_storage" value={form.min_storage} onChange={handleChange} placeholder="Storage" />
              </div>
            </div>

            <div className="admin-field admin-span-2">
              <label className="admin-label">Recommended Requirements</label>
              <div className="admin-req-grid">
                <input className="admin-input" name="rec_os" value={form.rec_os} onChange={handleChange} placeholder="OS" />
                <input className="admin-input" name="rec_cpu" value={form.rec_cpu} onChange={handleChange} placeholder="CPU" />
                <input className="admin-input" name="rec_ram" value={form.rec_ram} onChange={handleChange} placeholder="RAM" />
                <input className="admin-input" name="rec_gpu" value={form.rec_gpu} onChange={handleChange} placeholder="GPU" />
                <input className="admin-input" name="rec_storage" value={form.rec_storage} onChange={handleChange} placeholder="Storage" />
              </div>
            </div>
          </div>

          <div className="admin-actions">
            <button className="admin-btn primary" type="submit">
              Add Game
            </button>

            <button
              className="admin-btn secondary"
              type="button"
              onClick={async () => {
                try {
                  await Promise.all([
                    coverMedia ? DeleteUpload(coverMedia) : Promise.resolve(),
                    ...screenshots.map((p) => DeleteUpload(p)),
                  ]);
                } catch { }
                navigate("/update");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGame;
