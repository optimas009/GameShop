import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthFetch from "./AuthFetch";
import "./CSS/Games.css";

const UpdateGame = () => {
    const { id } = useParams();
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

    useEffect(() => {
        const loadGame = async () => {
            const res = await AuthFetch("/games");
            if (!res || res.status === 401) return;

            const list = await res.json();
            const game = Array.isArray(list) ? list.find((x) => x._id === id) : null;

            if (!game) {
                alert("Game not found");
                navigate("/update", { replace: true });
                return;
            }

            setForm({
                title: game.title || "",
                price: game.price ?? "",
                developer: game.developer || "",
                sizeGB: game.sizeGB ?? "",
                platform: game.platform || "",
                genre: game.genre || "",
                imageUrl: game.imageUrl || "",
                description: game.description || ""
            });
        };

        loadGame();
    }, [id, navigate]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title || form.price === "") {
            alert("Title and price are required");
            return;
        }

        const payload = {
            ...form,
            price: Number(form.price),
            sizeGB: form.sizeGB ? Number(form.sizeGB) : 0
        };

        const res = await AuthFetch(`/games/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || "Update failed");
            return;
        }

        alert("Updated!");
        navigate("/update");
    };

    return (
        <div className="games-wrap">
            <h1 className="games-title">Update Game (Admin)</h1>

            <form onSubmit={handleSubmit} className="game-form">
                <input className="sgbox" name="title" value={form.title} onChange={handleChange} placeholder="Title *" />
                <input className="sgbox" name="price" value={form.price} onChange={handleChange} placeholder="Price *" />
                <input className="sgbox" name="developer" value={form.developer} onChange={handleChange} placeholder="Developer" />
                <input className="sgbox" name="sizeGB" value={form.sizeGB} onChange={handleChange} placeholder="Size (GB)" />
                <input className="sgbox" name="platform" value={form.platform} onChange={handleChange} placeholder="Platform" />
                <input className="sgbox" name="genre" value={form.genre} onChange={handleChange} placeholder="Genre" />
                <input className="sgbox" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" />
                <input className="sgbox" name="description" value={form.description} onChange={handleChange} placeholder="Description" />

                <button className="admin-btn" type="submit">Save Changes</button>
                <button className="admin-btn" type="button" onClick={() => navigate("/update")}>Cancel</button>
            </form>
        </div>
    );
};

export default UpdateGame;
