import axios from "axios";

const API = axios.create({
  baseURL: "https://resqai-backend-r1xp.onrender.com",
});

API.interceptors.request.use((config) => {
  const stored = localStorage.getItem("resqai_session");
  if (!stored) return config;

  try {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    localStorage.removeItem("resqai_session");
  }

  return config;
});

export const login = async (phone, password) => {
  const response = await API.post("/auth/login", { phone, password });
  return response.data;
};

export const createIncident = async (incident) => {
  const response = await API.post("/incidents/", incident);
  return response.data;
};


// =====================================================
// INCIDENTS
// =====================================================

export const getIncidents = async () => {

  const response = await API.get(
    "/incidents/"
  );

  return response.data;
};


// =====================================================
// RESPONDERS
// =====================================================

export const getResponders = async () => {

  const response = await API.get(
    "/responders/"
  );

  return response.data;
};


// =====================================================
// ASSIGN RESPONDER TO INCIDENT
// =====================================================

export const assignResponder = async (
  incidentId,
  responderId
) => {

  const response = await API.post(
    `/incidents/${incidentId}/assign`,
    null,
    {
      params: {
        responder_id: responderId,
      },
    }
  );

  return response.data;
};


// =====================================================
// UPDATE INCIDENT STATUS
// =====================================================

export const updateIncidentStatus = async (
  incidentId,
  status
) => {

  const response = await API.patch(
    `/incidents/${incidentId}/status`,
    null,
    {
      params: {
        status: status,
      },
    }
  );

  return response.data;
};


// =====================================================
// GET RESPONDER ASSIGNMENTS
// =====================================================

export const getResponderAssignments = async (
  responderId
) => {

  const response = await API.get(
    `/incidents/responder/${responderId}/assignments`
  );

  return response.data;
};
