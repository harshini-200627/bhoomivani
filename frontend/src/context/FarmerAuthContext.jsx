import React, { createContext, useContext, useState } from 'react';

const FarmerAuthContext = createContext();

export const initialDemoFarmer = {
  farmerId: "BV-2847",
  name: "Demo Farmer (రైతు సోదరుడు)",
  phone: "+91 98765 43210",
  preferredLanguage: "te",
  location: "Vijayawada, Andhra Pradesh",
  crops: ["Chilli", "Rice"],
  createdAt: new Date().toISOString()
};

export const FarmerAuthProvider = ({ children }) => {
  const [farmer, setFarmer] = useState(() => {
    const saved = localStorage.getItem('bv_farmer');
    return saved ? JSON.parse(saved) : initialDemoFarmer;
  });

  const [activeCase, setActiveCase] = useState(() => {
    const saved = localStorage.getItem('bv_active_case');
    return saved ? JSON.parse(saved) : {
      caseId: "CASE-BV-7821",
      farmerId: "BV-2847",
      crop: "Chilli",
      problemTitle: "Leaf Spot Symptoms / ఆకుల మచ్చల సమస్య",
      symptoms: "Small dark circular spots appearing on lower leaves, mild yellowing",
      status: "Monitoring",
      updatedAt: new Date().toISOString()
    };
  });

  const updateFarmer = (newData) => {
    const updated = { ...farmer, ...newData };
    setFarmer(updated);
    localStorage.setItem('bv_farmer', JSON.stringify(updated));
  };

  const updateActiveCase = (newCase) => {
    setActiveCase(newCase);
    localStorage.setItem('bv_active_case', JSON.stringify(newCase));
  };

  return (
    <FarmerAuthContext.Provider value={{ farmer, updateFarmer, activeCase, updateActiveCase }}>
      {children}
    </FarmerAuthContext.Provider>
  );
};

export const useFarmer = () => useContext(FarmerAuthContext);
