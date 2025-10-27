import axios from "axios";

// Replace with your backend URL
const api = axios.create({
    baseURL: "http://localhost:5000", // backend server URL
});

export default api;
