import React, { createContext, useContext, useState } from "react";
import API_URL from "../services/api";

const FarmerAuthContext = createContext(null);

export const initialDemoFarmer = {
  farmerId: "BV-2847",
  name: "Demo Farmer (రైతు సోదరుడు)",
  mobile: "+91 98765 43210",
  preferredLanguage: "te",
  location: "Vijayawada, Andhra Pradesh",
  crops: ["Chilli", "Rice"],
  createdAt: new Date().toISOString(),
};

export const FarmerAuthProvider = ({ children }) => {
  const [farmer, setFarmer] = useState(() => {
    try {
      const saved = localStorage.getItem("bv_farmer");
      return saved ? JSON.parse(saved) : initialDemoFarmer;
    } catch (error) {
      console.error("Error loading farmer:", error);
      return initialDemoFarmer;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const authStatus = localStorage.getItem("bv_auth_status");
    return authStatus === "true";
  });

  const [activeCase, setActiveCase] = useState(() => {
    try {
      const saved = localStorage.getItem("bv_active_case");

      return saved
        ? JSON.parse(saved)
        : {
            caseId: "CASE-BV-7821",
            farmerId: "BV-2847",
            crop: "Chilli",
            problemTitle: "Leaf Spot Symptoms / ఆకుల మచ్చల సమస్య",
            symptoms:
              "Small dark circular spots appearing on lower leaves, mild yellowing",
            status: "Monitoring",
            updatedAt: new Date().toISOString(),
          };
    } catch (error) {
      console.error("Error loading active case:", error);
      return null;
    }
  });

  // =====================================================
  // SAFE JSON RESPONSE HANDLER
  // =====================================================

  const parseResponse = async (response) => {
    const text = await response.text();

    if (!text) {
      throw new Error(
        `Server returned an empty response (${response.status})`
      );
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Invalid server response:", text);

      throw new Error(
        `Server returned invalid JSON (${response.status})`
      );
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (credentials) => {
    try {
      const phone = credentials?.phone || credentials?.mobile || "";
      const password = credentials?.password || "1234";

      console.log("Attempting farmer login...");

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });

      const data = await parseResponse(response);

      console.log("Login response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.farmer) {
        throw new Error("Login successful but farmer data is missing.");
      }

      setFarmer(data.farmer);
      setIsAuthenticated(true);

      localStorage.setItem(
        "bv_farmer",
        JSON.stringify(data.farmer)
      );

      localStorage.setItem(
        "bv_auth_status",
        "true"
      );

      if (data.token) {
        localStorage.setItem(
          "bv_token",
          data.token
        );
      }

      return true;

    } catch (error) {
      console.error("Login API Error:", error);
      throw error;
    }
  };

  // =====================================================
  // SIGNUP
  // =====================================================

  const signup = async (newFarmerData) => {
    try {
      const crops = newFarmerData.crops
        ? Array.isArray(newFarmerData.crops)
          ? newFarmerData.crops
          : newFarmerData.crops
              .split(",")
              .map((crop) => crop.trim())
              .filter(Boolean)
        : ["Chilli"];

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFarmerData.name,
          phone: newFarmerData.phone,
          password: newFarmerData.password || "1234",
          location: newFarmerData.location || "",
          crops,
          preferredLanguage:
            newFarmerData.preferredLanguage || "te",
        }),
      });

      const data = await parseResponse(response);

      console.log("Signup response:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      if (data.farmer) {
        setFarmer(data.farmer);

        localStorage.setItem(
          "bv_farmer",
          JSON.stringify(data.farmer)
        );
      }

      setIsAuthenticated(true);

      localStorage.setItem(
        "bv_auth_status",
        "true"
      );

      if (data.token) {
        localStorage.setItem(
          "bv_token",
          data.token
        );
      }

      return true;

    } catch (error) {
      console.error("Signup API Error:", error);
      throw error;
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    setIsAuthenticated(false);

    localStorage.removeItem("bv_token");
    localStorage.setItem("bv_auth_status", "false");
  };

  // =====================================================
  // UPDATE FARMER
  // =====================================================

  const updateFarmer = (newData) => {
    const updated = {
      ...farmer,
      ...newData,
    };

    setFarmer(updated);

    localStorage.setItem(
      "bv_farmer",
      JSON.stringify(updated)
    );
  };

  // =====================================================
  // ACTIVE CASE
  // =====================================================

  const updateActiveCase = (newCase) => {
    setActiveCase(newCase);

    localStorage.setItem(
      "bv_active_case",
      JSON.stringify(newCase)
    );
  };

  return (
    <FarmerAuthContext.Provider
      value={{
        farmer,
        isAuthenticated,
        login,
        signup,
        logout,
        updateFarmer,
        activeCase,
        updateActiveCase,
      }}
    >
      {children}
    </FarmerAuthContext.Provider>
  );
};

export const useFarmer = () => {
  const context = useContext(FarmerAuthContext);

  if (!context) {
    throw new Error(
      "useFarmer must be used inside FarmerAuthProvider"
    );
  }

  return context;
};