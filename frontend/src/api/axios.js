import axios from "axios";

// Replace with your backend URL
const api = axios.create({
    baseURL: "http://localhost:3000", // backend server URL
    withCredentials: true,           // for cookies/session
});

export default api;
