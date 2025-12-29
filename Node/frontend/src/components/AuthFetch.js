
const API_BASE_URL = "http://localhost:5000";

const AuthFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("session-expired"));
    return response; // ✅ IMPORTANT
  }

  return response;
};

export default AuthFetch;
