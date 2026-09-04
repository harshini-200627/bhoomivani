const API_URL = "https://bhoomivani-1.onrender.com";

export default API_URL;

export async function analyzeCrop(data) {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to connect to BhūmiVāṇī backend");
  }

  return await response.json();
}

export async function getWeather(lat, lon) {
  const response = await fetch(
    `${API_URL}/api/weather?lat=${lat}&lon=${lon}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  return await response.json();
}

export async function getCases(farmerId) {
  const response = await fetch(
    `${API_URL}/api/cases?farmerId=${farmerId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch cases");
  }

  return await response.json();
}

export async function saveCase(caseData) {
  const response = await fetch(`${API_URL}/api/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(caseData),
  });

  if (!response.ok) {
    throw new Error("Failed to save case");
  }

  return await response.json();
}