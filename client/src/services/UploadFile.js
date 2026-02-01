import AuthFetch from "./AuthFetch";

const UploadFile = async (file, endpoint = "/upload") => {
  if (!file) throw new Error("No file selected");

  const fd = new FormData();
  fd.append("file", file);

  const res = await AuthFetch(endpoint, {
    method: "POST",
    body: fd,
  });

  if (!res) throw new Error("Upload failed (no response)");
  if (res.status === 401) throw new Error("Session expired. Please login again.");

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Upload failed");

  return data; // { url, path }
};

export default UploadFile;
