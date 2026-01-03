import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "./AuthFetch";
import "./CSS/Games.css";

const AddGame = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    price: "",
    developer: "",
    sizeGB: "",
    platform: "",
    genre: "",
    imageUrl: "",
    description: ""
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // small validation
    if (!form.title || !form.price) {
      alert("Title and price are required");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      sizeGB: form.sizeGB ? Number(form.sizeGB) : 0
    };

    const res = await AuthFetch("/admin/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) return;

    if (res.status === 403) {
      alert("Admin access required");
      navigate("/games", { replace: true });
      return;
    }

    if (!res.ok) {
      alert(data.message || "Failed to add game");
      return;
    }


    alert("Game added!");
    navigate("/games");
  };

  return (
    <div className="games-wrap">
      <h1 className="games-title">Add Game (Admin)</h1>

      <form onSubmit={handleSubmit} className="game-form">
        <input className="sgbox" name="title" value={form.title} onChange={handleChange} placeholder="Title *" />
        <input className="sgbox" name="price" value={form.price} onChange={handleChange} placeholder="Price *" />
        <input className="sgbox" name="developer" value={form.developer} onChange={handleChange} placeholder="Developer" />
        <input className="sgbox" name="sizeGB" value={form.sizeGB} onChange={handleChange} placeholder="Size (GB)" />
        <input className="sgbox" name="platform" value={form.platform} onChange={handleChange} placeholder="Platform (PC/PS5/Xbox)" />
        <input className="sgbox" name="genre" value={form.genre} onChange={handleChange} placeholder="Genre" />
        <input className="sgbox" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" />
        <input className="sgbox" name="description" value={form.description} onChange={handleChange} placeholder="Description" />

        <button className="subbox" type="submit">Add Game</button>
      </form>
    </div>
  );
};

export default AddGame;
