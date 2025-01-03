import axios from "axios";

// Define your API base URL
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: apiUrl,
});

// Add a request interceptor to handle token expiration and refresh
apiClient.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      // Decode token to check expiration
      const payload = JSON.parse(atob(token.split(".")[1])); // Decoding the JWT payload
      const now = Date.now() / 1000;

      if (payload.exp < now) {
        // Token has expired, attempt to refresh
        const refreshToken = sessionStorage.getItem("refreshToken");

        if (!refreshToken) {
          console.error("Refresh token missing, logging out.");
          sessionStorage.clear();
          window.location.href = "/login"; // Redirect to login if no refresh token
          return Promise.reject("No refresh token available");
        }

        try {
          const response = await axios.post(`${apiUrl}/refresh-token`, {
            refreshToken,
          });

          sessionStorage.setItem("token", response.data.accessToken); // Save new token
          config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        } catch (error) {
          console.error("Failed to refresh token:", error);
          sessionStorage.clear();
          window.location.href = "/login"; // Redirect to login if refresh fails
          return Promise.reject(error);
        }
      } else {
        // Token is still valid
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Export the configured Axios instance
export default apiClient;
