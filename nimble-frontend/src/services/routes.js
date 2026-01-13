// src/services/routes.js
import api from "./api";

export const getAllRoutes = async () => {
  try {
    const res = await api.get("/routes/");
    return res.data;
  } catch (err) {
    console.log("Error fetching routes:", err);
    return [];
  }
};
