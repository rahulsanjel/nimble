import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ================= LOGIN ================= */
export const loginUser = async ({ email, password }) => {
  try {
    const response = await api.post("/auth/login/", { email, password });
    const { access, refresh } = response.data;

    await AsyncStorage.setItem("access_token", access);
    await AsyncStorage.setItem("refresh_token", refresh);

    return response.data;
  } catch (err) {
    console.log("Login error:", err.response?.data || err.message);
    return { errors: err.response?.data || err.message };
  }
};

/* ================= GET CURRENT USER ================= */
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/profile/");
    const user = response.data;

    // If the driver has an assigned bus, fetch its details
    if (user.assigned_bus) {
      try {
        const busResponse = await api.get(`/buses/${user.assigned_bus}/`);
        user.assigned_bus = busResponse.data;
      } catch (err) {
        console.log("Failed to fetch assigned bus:", err.response?.data || err.message);
      }
    }

    return user;
  } catch (err) {
    console.log(
      "Get current user error:",
      err.response?.status,
      err.response?.data || err.message
    );
    return null;
  }
};


/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (data) => {
  try {
    const response = await api.patch("/auth/profile/", data);
    return response.data;
  } catch (err) {
    return { errors: err.response?.data || err.message };
  }
};

/* ================= LOGOUT ================= */
export const logoutUser = async () => {
  await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
};
