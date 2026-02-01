import AuthFetch from "./AuthFetch";

const DeleteUpload = async (filePath) => {
  const p = String(filePath || "").trim();
  if (!p) return;

  const res = await AuthFetch("/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: p }),
  });

  if (!res) throw new Error("Delete failed (no response)");

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Delete failed");
};

export default DeleteUpload;
