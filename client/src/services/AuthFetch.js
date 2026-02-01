const API_BASE_URL = "http://localhost:5000/api";

const AuthFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

 
  const skip401Handler = options.skip401Handler;

  const { skip401Handler: _skip, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.headers || {}),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (response.status === 401 && !skip401Handler) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("session-expired"));
  }

  return response;
};

export default AuthFetch;
