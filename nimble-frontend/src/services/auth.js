import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ================= REGISTER ================= */
export const registerUser = async (data) => {
  try {
    const response = await api.post("/auth/register/", {
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      password2: data.password2,
      role: data.role, // ✅ FIXED: Use the role selected by the user (passenger/driver)
    });
    return response.data;
  } catch (err) {
    console.log("Register Error Details:", err.response?.data);
    return { errors: err.response?.data || "Network Error" };
  }
};

/* ================= LOGIN ================= */
export const loginUser = async ({ email, password }) => {
  try {
    const response = await api.post("/auth/login/", { email, password });
    
    // Destructure the data from Django
    const { access, refresh, user } = response.data;

    // Save tokens
    await AsyncStorage.setItem("access_token", access);
    await AsyncStorage.setItem("refresh_token", refresh);
    
    // Return the whole thing so LoginScreen has it immediately
    return { access, refresh, user }; 
  } catch (err) {
    return { errors: err.response?.data || "Invalid Credentials" };
  }
};
/* ================= GET CURRENT USER ================= */
export const updateProfile = async (formData) => {
  try {
    const response = await api.patch('/auth/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    // 💡 THE FIX: Extract the actual error from Django
    const serverError = error.response?.data;
    const statusCode = error.response?.status;
    
    console.log("--- DEBUG: PROFILE UPDATE FAILED ---");
    console.log("Status Code:", statusCode);
    console.log("Server Response:", JSON.stringify(serverError, null, 2));
    
    // Return the errors so the Screen can show an Alert
    return { 
      errors: serverError || "Network Error",
      status: statusCode 
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/profile/');
    return response.data;
  } catch (error) {
    console.log("Fetch User Error:", error.response?.data || error.message);
    return null;
  }
};

/* ================= LOGOUT ================= */
export const logoutUser = async () => {
  // ✅ FIXED: Clear all auth-related keys
  await AsyncStorage.multiRemove(["access_token", "refresh_token", "user_role", "user_name"]);
};