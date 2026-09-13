import { useCallback, useEffect, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Map as MapIcon,
  Users,
  Settings,
  Activity,
  RefreshCw,
  MapPin,
  User,
  Clock,
  ShieldAlert,
  UserCheck,
  X,
  ArrowRight,
  HeartPulse,
  Radio,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getIncidents,
  getResponders,
  assignResponder,
  login,
  createIncident,
  getResponderAssignments,
  updateIncidentStatus,
} from "./services/api";

import "./index.css";


// =====================================================
// LEAFLET ICON FIX
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


// =====================================================
// MAP AUTO FIT
// =====================================================

function MapAutoFit({ incidents }) {
  const map = useMap();

  useEffect(() => {
    const valid = incidents.filter(
      (item) =>
        typeof item.latitude === "number" &&
        typeof item.longitude === "number"
    );

    if (!valid.length) return;

    const bounds = L.latLngBounds(
      valid.map((item) => [
        item.latitude,
        item.longitude,
      ])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15,
    });
  }, [incidents, map]);

  return null;
}


// =====================================================
// SEVERITY MARKER
// =====================================================

function createSeverityIcon(severity) {
  let color = "#eab308";

  if (severity === "CRITICAL") {
    color = "#dc2626";
  }

  if (severity === "HIGH") {
    color = "#f97316";
  }

  return L.divIcon({
    html: `
      <div style="
        width:34px;
        height:34px;
        background:${color};
        border:4px solid white;
        border-radius:50%;
        box-shadow:0 3px 12px rgba(0,0,0,.35);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-weight:800;
        font-size:16px;
      ">!</div>
    `,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}


// =====================================================
// HELPERS
// =====================================================

function emergencyIcon(type) {
  switch (type) {
    case "FIRE":
      return "🔥";

    case "MEDICAL":
      return "🚑";

    case "ACCIDENT":
      return "⚠️";

    case "CRIME":
      return "🚔";

    case "NATURAL_DISASTER":
      return "🌪️";

    default:
      return "🚨";
  }
}


function emergencyClass(type) {
  switch (type) {
    case "FIRE":
      return "fire";

    case "MEDICAL":
      return "medical";

    case "ACCIDENT":
      return "accident";

    default:
      return "emergency";
  }
}


function severityClass(severity) {
  switch (severity) {
    case "CRITICAL":
      return "critical-label";

    case "HIGH":
      return "high-label";

    case "MEDIUM":
      return "medium-label";

    default:
      return "medium-label";
  }
}


function formatDate(value) {
  if (!value) return "Unknown";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "Unknown";
  }
}


// =====================================================
// MAP
// =====================================================

function IncidentMap({
  incidents,
  compact = false,
  onIncidentClick,
}) {
  const validIncidents = incidents.filter(
    (item) =>
      typeof item.latitude === "number" &&
      typeof item.longitude === "number"
  );

  const defaultCenter = [20.2961, 85.8245];

  const center =
    validIncidents.length > 0
      ? [
          validIncidents[0].latitude,
          validIncidents[0].longitude,
        ]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={validIncidents.length ? 13 : 7}
      scrollWheelZoom={true}
      style={{
        width: "100%",
        height: compact
          ? "430px"
          : "calc(100vh - 190px)",
        minHeight: compact ? "430px" : "500px",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapAutoFit
        incidents={validIncidents}
      />

      {validIncidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[
            incident.latitude,
            incident.longitude,
          ]}
          icon={createSeverityIcon(
            incident.severity
          )}
        >
          <Popup>
            <div
              style={{
                minWidth: "220px",
                fontFamily:
                  "Inter, Arial, sans-serif",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#89929b",
                  marginBottom: "5px",
                }}
              >
                RESQAI INCIDENT
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                }}
              >
                {emergencyIcon(
                  incident.emergency_type
                )}{" "}
                {incident.emergency_type ||
                  "EMERGENCY"}
              </h3>

              <p
                style={{
                  fontSize: "12px",
                  lineHeight: 1.4,
                }}
              >
                {incident.description ||
                  "No description"}
              </p>

              <p
                style={{
                  fontSize: "11px",
                }}
              >
                <b>Severity:</b>{" "}
                {incident.severity}
              </p>

              <p
                style={{
                  fontSize: "11px",
                }}
              >
                <b>Status:</b>{" "}
                {incident.status}
              </p>

              <button
                onClick={() =>
                  onIncidentClick(incident)
                }
                style={{
                  width: "100%",
                  border: "none",
                  background: "#151a21",
                  color: "white",
                  padding: "8px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
              >
                VIEW INCIDENT
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}


// =====================================================
// APP
// =====================================================

function AccessPortal({ onAuthenticated }) {
  const [mode, setMode] = useState("home");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await login(phone.trim(), password);
      const session = { ...data.user, token: data.access_token || null };
      localStorage.setItem("resqai_session", JSON.stringify(session));
      onAuthenticated(session);
    } catch (requestError) {
      if (!requestError?.response) {
        setError("Cannot reach the ResQAI backend. Confirm that Render is deployed and RESQAI_ALLOWED_ORIGINS includes http://localhost:5173.");
      } else if (requestError.response.status === 401) {
        setError("This Admin account was not found, or the password is incorrect. Confirm RESQAI_ADMIN_PHONE and RESQAI_ADMIN_PASSWORD in Render, then redeploy.");
      } else {
        setError(requestError.response.data?.detail || `Sign-in failed (server returned ${requestError.response.status}).`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "login") {
    return (
      <main className="access-shell">
        <section className="access-aside">
          <div className="brand-lockup"><span>✦</span><div><strong>ResQAI</strong><small>Emergency response network</small></div></div>
          <div className="access-message">
            <span className="card-kicker">SECURE ACCESS</span>
            <h1>Every second deserves a better response.</h1>
            <p>One connected system for citizens, field responders, and emergency coordinators.</p>
          </div>
          <div className="access-signal-card" aria-label="ResQAI network is online">
            <div className="signal-orbit"><span /><i /><b /></div>
            <div><span>LIVE NETWORK</span><strong>Response systems online</strong><small><i /> Protected, real-time coordination</small></div>
          </div>
          <div className="trust-line"><ShieldCheck size={17} /> Role-based access · Encrypted in transit</div>
        </section>
        <section className="login-pane">
          <button className="back-button" onClick={() => setMode("home")}>← Back to ResQAI</button>
          <form className="login-card" onSubmit={handleLogin}>
            <div className="login-icon"><LockKeyhole size={22} /></div>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your ResQAI workspace.</p>
            <label>Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="Enter registered phone number" required /></label>
            <label>Password<div className="password-field"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in securely"}<ArrowRight size={17} /></button>
            <small className="login-note"><LockKeyhole size={12} /> Your account routes you to the right workspace automatically.</small>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="landing-shell">
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />
      <nav className="landing-nav">
        <div className="brand-lockup"><span>✦</span><div><strong>ResQAI</strong><small>Emergency response network</small></div></div>
        <button className="nav-login" onClick={() => setMode("login")}>Sign in <ArrowRight size={16} /></button>
      </nav>
      <section className="landing-hero">
        <div>
          <span className="hero-chip"><span /> Live emergency coordination</span>
          <h1>When help matters,<br /><em>everyone moves faster.</em></h1>
          <p>ResQAI connects emergency reports, responders, and command teams in one calm, intelligent response network.</p>
          <div className="hero-actions"><button onClick={() => setMode("login")}>Access your workspace <ArrowRight size={17} /></button><a href="#roles">How it works</a></div>
        </div>
        <div className="hero-status-card">
          <div className="status-card-topline"><span><i /> LIVE COMMAND VIEW</span><span>24/7</span></div>
          <div className="radar"><span /><i /><b /></div>
          <div className="status-card-copy"><span>NETWORK STATUS</span><strong>Ready to respond</strong><p><i /> Systems operational</p></div>
          <div className="status-points"><div><strong>24/7</strong><span>coordination</span></div><div><strong>GPS</strong><span>incident context</span></div><div><strong>AI</strong><span>triage support</span></div></div>
        </div>
      </section>
      <section className="role-section" id="roles">
        <div className="section-heading"><span className="card-kicker">ONE PLATFORM, THREE WORKSPACES</span><h2>Built for the people in the moment.</h2></div>
        <div className="role-grid">
          <article><div className="role-icon citizen"><HeartPulse size={22} /></div><h3>Citizen</h3><p>Report an emergency quickly, share your location, and stay informed as help is coordinated.</p><span>Report · Track · Stay safe</span></article>
          <article><div className="role-icon responder"><Radio size={22} /></div><h3>Responder</h3><p>Receive assignments, view verified context, and update your status from the field.</p><span>Receive · Navigate · Resolve</span></article>
          <article><div className="role-icon admin"><ShieldCheck size={22} /></div><h3>Command center</h3><p>See the operational picture, dispatch teams, and manage incidents in real time.</p><span>Monitor · Coordinate · Deploy</span></article>
        </div>
      </section>
      <footer className="landing-footer"><span>© 2026 ResQAI</span><span><CheckCircle2 size={14} /> Designed for dependable response</span></footer>
    </main>
  );
}

function FieldWorkspace({ session, onSignOut }) {
  const isResponder = String(session.role).toUpperCase() === "RESPONDER";
  const [selectedType, setSelectedType] = useState("MEDICAL");
  const [description, setDescription] = useState("");
  const [reportState, setReportState] = useState("idle");
  const [reportError, setReportError] = useState("");
  const [location, setLocation] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(isResponder);
  const [assignmentError, setAssignmentError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const quickActions = [
    { type: "FIRE", label: "Fire", icon: "🔥", tone: "fire" },
    { type: "MEDICAL", label: "Medical", icon: "✚", tone: "medical" },
    { type: "ACCIDENT", label: "Accident", icon: "⚠", tone: "accident" },
    { type: "CRIME", label: "Safety", icon: "◈", tone: "safety" },
  ];

  const loadAssignments = useCallback(async (silent = false) => {
    if (!session.id) return;
    if (!silent) setAssignmentsLoading(true);
    try {
      setAssignmentError("");
      const data = await getResponderAssignments(session.id);
      setAssignments(Array.isArray(data) ? data : []);
    } catch {
      setAssignmentError("Could not refresh assignments. Please try again.");
    } finally {
      if (!silent) setAssignmentsLoading(false);
    }
  }, [session.id]);

  useEffect(() => {
    if (!isResponder) return undefined;
    loadAssignments();
    const timer = window.setInterval(() => loadAssignments(true), 15000);
    return () => window.clearInterval(timer);
  }, [isResponder, loadAssignments]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setReportError("Location is not supported by this browser.");
      return;
    }
    setReportError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setReportError("Location permission was not granted. You can still submit the report."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitIncident = async (event) => {
    event.preventDefault();
    const message = description.trim() || `I need help with a ${selectedType.toLowerCase()} emergency.`;
    setReportState("sending");
    setReportError("");
    try {
      await createIncident({ description: message, emergency_type: selectedType, reporter_id: session.id, ...location });
      setReportState("sent");
      setDescription("");
    } catch (error) {
      setReportState("idle");
      setReportError(error?.response?.data?.detail || "Your report could not be sent. Please try again.");
    }
  };

  const advanceAssignment = async (incident, status) => {
    setUpdatingId(incident.id);
    try {
      await updateIncidentStatus(incident.id, status);
      await loadAssignments(true);
    } catch {
      setAssignmentError("Status update failed. Please try again.");
    } finally {
      setUpdatingId("");
    }
  };

  const nextAction = (incident) => incident.status === "ASSIGNED"
    ? { label: "Accept assignment", status: "RESPONDING" }
    : { label: "Mark as arrived", status: "ARRIVED" };

  if (isResponder) {
    return <main className="field-shell responder-workspace">
      <header className="field-header"><div className="brand-lockup"><span>✦</span><div><strong>ResQAI</strong><small>Responder workspace</small></div></div><div className="field-header-actions"><span className="availability-pill"><i /> Available</span><button onClick={onSignOut}><LogOut size={16} /> Sign out</button></div></header>
      <section className="field-hero"><div><span className="hero-chip"><span /> Field unit online</span><h1>Ready when <em>it matters.</em></h1><p>Hi, {session.name || "Responder"}. Your live assignments and incident context are below.</p></div><div className="field-profile"><div className="profile-avatar">{(session.name || "R").slice(0, 1).toUpperCase()}</div><div><strong>{session.name || "Responder"}</strong><span>{session.phone || "Verified responder"}</span></div><ShieldCheck size={19} /></div></section>
      <section className="responder-status-card"><div className="status-icon"><Radio size={22} /></div><div><span>YOUR FIELD STATUS</span><strong>Available for dispatch</strong><p><i /> Assignment updates refresh automatically</p></div><button onClick={() => loadAssignments()} aria-label="Refresh assignments"><RefreshCw size={17} /></button></section>
      <section className="assignment-heading"><div><span className="card-kicker">LIVE ASSIGNMENTS</span><h2>{assignments.length ? `${assignments.length} active assignment${assignments.length > 1 ? "s" : ""}` : "No active assignments"}</h2></div><span className="assignment-refresh">Updates every 15 sec</span></section>
      {assignmentError && <div className="field-alert">{assignmentError}</div>}
      {assignmentsLoading ? <div className="field-empty">Loading your assignments…</div> : assignments.length ? <div className="assignment-grid">{assignments.map((incident) => { const action = nextAction(incident); return <article className={`assignment-card ${String(incident.severity || "MEDIUM").toLowerCase()}`} key={incident.id}><div className="assignment-card-top"><div className="assignment-type"><span>{emergencyIcon(incident.emergency_type)}</span><div><small>{incident.status === "ASSIGNED" ? "NEW DISPATCH" : "ACTIVE RESPONSE"}</small><h3>{incident.emergency_type || "EMERGENCY"}</h3></div></div><span className="severity">{incident.severity || "MEDIUM"}</span></div><p>{incident.description || "Emergency reported. Review the incident details and respond safely."}</p><div className="assignment-location"><MapPin size={16} /><span>{typeof incident.latitude === "number" ? `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}` : "Location is being shared"}</span></div><div className="assignment-actions"><a href={typeof incident.latitude === "number" ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}` : undefined} target="_blank" rel="noreferrer" className="directions-link"><MapPin size={15} /> Directions</a><button disabled={updatingId === incident.id} onClick={() => advanceAssignment(incident, action.status)}>{updatingId === incident.id ? "Updating…" : action.label}<ArrowRight size={15} /></button></div></article>; })}</div> : <div className="field-empty"><CheckCircle2 size={25} /><strong>You’re clear for now</strong><span>Keep this page open to receive new assignments.</span></div>}
    </main>;
  }

  return <main className="field-shell citizen-workspace">
    <header className="field-header"><div className="brand-lockup"><span>✦</span><div><strong>ResQAI</strong><small>Citizen safety workspace</small></div></div><div className="field-header-actions"><span className="availability-pill"><i /> Ready</span><button onClick={onSignOut}><LogOut size={16} /> Sign out</button></div></header>
    <section className="citizen-layout"><div className="citizen-main"><span className="hero-chip"><span /> Emergency support ready</span><h1>Hello, {session.name || "there"}.</h1><p>Help is one tap away. Choose the emergency type and share what is happening.</p><button className="sos-button" onClick={() => document.getElementById("quick-report")?.scrollIntoView({ behavior: "smooth" })}><span><AlertTriangle size={42} /><strong>SOS</strong><small>TAP TO REPORT</small></span></button><div className="location-ready"><MapPin size={21} /><div><strong>{location ? "Location attached" : "Location sharing ready"}</strong><span>{location ? "Your current coordinates will be included." : "Add your location so nearby teams can respond faster."}</span></div><button onClick={captureLocation}>{location ? "Updated" : "Share location"}</button></div></div><aside className="citizen-side"><div className="safety-orbit"><span /><i /><b /></div><span>RESQAI PROTECTION</span><strong>Calm support, fast coordination.</strong><p>Once you report, ResQAI sends the essential context to the response team.</p><div><ShieldCheck size={16} /> Secure report handling</div></aside></section>
    <section className="quick-report" id="quick-report"><div className="section-heading"><span className="card-kicker">QUICK REPORT</span><h2>What kind of help do you need?</h2><p>Select the closest option. You can add details below.</p></div><div className="quick-action-grid">{quickActions.map((action) => <button key={action.type} onClick={() => { setSelectedType(action.type); setReportState("idle"); }} className={`quick-action ${action.tone} ${selectedType === action.type ? "selected" : ""}`}><span>{action.icon}</span><strong>{action.label}</strong>{selectedType === action.type && <CheckCircle2 size={16} />}</button>)}</div></section>
    <form className="report-card" onSubmit={submitIncident}><div><span className="card-kicker">REPORT DETAILS</span><h2>Tell us what’s happening</h2><p>Your selected emergency: <strong>{selectedType}</strong></p></div><label>Brief description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="For example: There has been a road accident near the market. Two people may need medical help." rows="4" /></label>{reportError && <div className="field-alert">{reportError}</div>}{reportState === "sent" ? <div className="report-success"><CheckCircle2 size={19} /><div><strong>Report received</strong><span>Stay safe. The command team will review and coordinate help.</span></div><button type="button" onClick={() => setReportState("idle")}>Report another</button></div> : <button className="submit-report" disabled={reportState === "sending"}>{reportState === "sending" ? "Sending report…" : "Send emergency report"}<ArrowRight size={17} /></button>}</form>
  </main>;
}

function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("resqai_session")); } catch { return null; }
  });
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [respondersLoading, setRespondersLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [respondersError, setRespondersError] =
    useState("");

  const [activePage, setActivePage] =
    useState("dashboard");

  const [selectedIncident, setSelectedIncident] =
    useState(null);

  const [selectedResponder, setSelectedResponder] =
    useState("");

  const [assigning, setAssigning] =
    useState(false);

  const [assignMessage, setAssignMessage] =
    useState("");

  const [assignError, setAssignError] =
    useState("");


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!session || String(session.role).toUpperCase() !== "ADMIN") return;
    loadIncidents();
    loadResponders();
  }, [session]);


  // ===================================================
  // LOAD INCIDENTS
  // ===================================================

  async function loadIncidents() {
    try {
      setLoading(true);
      setError("");

      const data = await getIncidents();

      setIncidents(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to ResQAI server."
      );
    } finally {
      setLoading(false);
    }
  }


  // ===================================================
  // LOAD RESPONDERS
  // ===================================================

  async function loadResponders() {
    try {
      setRespondersLoading(true);
      setRespondersError("");

      const data = await getResponders();

      setResponders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(error);

      setRespondersError(
        "Unable to load responders."
      );
    } finally {
      setRespondersLoading(false);
    }
  }


  // ===================================================
  // ASSIGN RESPONDER
  // ===================================================

  async function handleAssignResponder() {
    if (!selectedIncident) {
      return;
    }

    if (!selectedResponder) {
      setAssignError(
        "Please select a responder."
      );
      return;
    }

    try {
      setAssigning(true);
      setAssignError("");
      setAssignMessage("");

      const result =
        await assignResponder(
          selectedIncident.id,
          selectedResponder
        );

      setAssignMessage(
        result.message ||
          "Responder assigned successfully."
      );

      // Refresh incidents
      const updated =
        await getIncidents();

      setIncidents(
        Array.isArray(updated)
          ? updated
          : []
      );

      // Update selected incident
      const updatedIncident =
        Array.isArray(updated)
          ? updated.find(
              (item) =>
                item.id ===
                selectedIncident.id
            )
          : null;

      if (updatedIncident) {
        setSelectedIncident(
          updatedIncident
        );
      }

      setSelectedResponder("");

    } catch (error) {
      console.error(
        "Assignment failed:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to assign responder.";

      setAssignError(message);

    } finally {
      setAssigning(false);
    }
  }


  // ===================================================
  // STATISTICS
  // ===================================================

  const criticalCount =
    incidents.filter(
      (item) =>
        item.severity === "CRITICAL"
    ).length;

  const highCount =
    incidents.filter(
      (item) =>
        item.severity === "HIGH"
    ).length;

  const mediumCount =
    incidents.filter(
      (item) =>
        item.severity === "MEDIUM"
    ).length;

  const resolvedCount =
    incidents.filter(
      (item) =>
        item.status === "RESOLVED"
    ).length;

  const assignedCount =
    incidents.filter(
      (item) =>
        item.status === "ASSIGNED"
    ).length;

  const mappedCount =
    incidents.filter(
      (item) =>
        typeof item.latitude ===
          "number" &&
        typeof item.longitude ===
          "number"
    ).length;


  const onlineResponders =
    responders.filter(
      (item) =>
        String(item.status)
          .toUpperCase() ===
        "ONLINE"
    ).length;

  const activeIncidents = incidents.filter(
    (item) => item.status !== "RESOLVED"
  ).length;

  const unassignedCount = incidents.filter(
    (item) =>
      item.status !== "RESOLVED" &&
      !item.assigned_responder_name &&
      item.status !== "ASSIGNED"
  ).length;

  const responseCoverage = activeIncidents
    ? Math.round(((activeIncidents - unassignedCount) / activeIncidents) * 100)
    : 100;


  // ===================================================
  // NAVIGATION
  // ===================================================

  function navigate(page) {
    setActivePage(page);
    setSelectedIncident(null);

    if (
      page === "dashboard" ||
      page === "incidents" ||
      page === "map"
    ) {
      loadIncidents();
    }

    if (page === "responders") {
      loadResponders();
    }
  }


  // ===================================================
  // DASHBOARD
  // ===================================================

  function DashboardPage() {
    return (
      <>
        <header className="header">
          <div>
            <div className="eyebrow">COMMAND CENTER / LIVE OVERVIEW</div>
            <h1>Emergency Dashboard</h1>
            <p>Real-time emergency response monitoring</p>
          </div>

          <div className="header-actions">
            <button className="refresh-button" onClick={() => {
              loadIncidents();
              loadResponders();
            }}>
              <RefreshCw size={15} /> Refresh data
            </button>
            <div className="admin system-status">
              <div className="online-dot" />
              System Online
            </div>
          </div>
        </header>


        <section className="attention-banner">
          <div className="attention-icon"><ShieldAlert size={20} /></div>
          <div>
            <strong>Response readiness</strong>
            <span>
              {unassignedCount > 0
                ? `${unassignedCount} active incident${unassignedCount === 1 ? "" : "s"} awaiting assignment.`
                : "All active incidents have a response path."}
            </span>
          </div>
          <div className="coverage-meter">
            <span>{responseCoverage}% covered</span>
            <div><i style={{ width: `${responseCoverage}%` }} /></div>
          </div>
          <button onClick={() => navigate("responders")}>Review team</button>
        </section>

        <section className="stats">

          <div className="stat-card critical">
            <div className="stat-card-top"><span>Critical</span><ShieldAlert size={17} /></div>
            <strong>
              {criticalCount}
            </strong>
            <small>
              Requires immediate action
            </small>
          </div>

          <div className="stat-card high">
            <div className="stat-card-top"><span>High priority</span><AlertTriangle size={17} /></div>
            <strong>
              {highCount}
            </strong>
            <small>
              Requires attention
            </small>
          </div>

          <div className="stat-card medium">
            <div className="stat-card-top"><span>Team available</span><Users size={17} /></div>
            <strong>
              {onlineResponders}
            </strong>
            <small>
              of {responders.length} responders online
            </small>
          </div>

          <div className="stat-card resolved">
            <div className="stat-card-top"><span>Resolved</span><UserCheck size={17} /></div>
            <strong>
              {resolvedCount}
            </strong>
            <small>
              Successfully handled
            </small>
          </div>

        </section>


        <section className="dashboard-grid">

          <div className="panel map-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Live Incident Map
                </h2>

                <p>
                  {mappedCount} mapped incidents
                </p>
              </div>

              <div className="map-header-meta">
                <span className="live-badge"><i /> LIVE</span>
                <button className="map-link" onClick={() => navigate("map")}>Open map</button>
              </div>

            </div>

            <IncidentMap
              incidents={incidents}
              compact={true}
              onIncidentClick={
                setSelectedIncident
              }
            />

          </div>


          <div className="panel recent-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Recent Incidents
                </h2>

                <p>
                  Latest emergency reports
                </p>
              </div>

              <button
                className="view-all"
                onClick={() =>
                  navigate("incidents")
                }
              >
                View All
              </button>

            </div>


            {loading && (
              <div className="loading">
                Loading incidents...
              </div>
            )}


            {error && (
              <div className="loading error-message">
                {error}
              </div>
            )}


            {!loading &&
              !error &&
              incidents.length === 0 && (
                <div className="loading">
                  No incidents reported.
                </div>
              )}


            <div className="incident-list">

              {incidents
                .slice(0, 5)
                .map((incident) => (

                  <div
                    className="incident"
                    key={incident.id}
                    onClick={() =>
                      setSelectedIncident(
                        incident
                      )
                    }
                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <div
                      className={`incident-icon ${emergencyClass(
                        incident.emergency_type
                      )}`}
                    >
                      {emergencyIcon(
                        incident.emergency_type
                      )}
                    </div>

                    <div className="incident-info">

                      <div className="incident-title-row">
                        <strong>{incident.emergency_type || "EMERGENCY"}</strong>
                        <span className="incident-time"><Clock size={11} /> {formatDate(incident.created_at || incident.timestamp)}</span>
                      </div>

                      <span>
                        {incident.description ||
                          "No description"}
                      </span>

                      {incident.assigned_responder_name && (
                        <span
                          style={{
                            color: "#2563eb",
                          }}
                        >
                          👨‍🚒{" "}
                          {incident.assigned_responder_name}
                        </span>
                      )}

                    </div>

                    <div className={`severity ${severityClass(incident.severity)}`}>
                      {incident.severity}
                    </div>

                  </div>
                ))}

            </div>

          </div>

        </section>

        <section className="operations-grid">
          <div className="operations-card">
            <div className="operations-card-header">
              <div>
                <span className="card-kicker">FIELD OPERATIONS</span>
                <h3>Deployment status</h3>
              </div>
              <Activity size={19} />
            </div>
            <div className="deployment-stats">
              <div><strong>{assignedCount}</strong><span>Assigned</span></div>
              <div><strong>{unassignedCount}</strong><span>Unassigned</span></div>
              <div><strong>{mappedCount}</strong><span>On map</span></div>
            </div>
          </div>
          <div className="operations-card priority-card">
            <div className="operations-card-header">
              <div>
                <span className="card-kicker">NEXT ACTION</span>
                <h3>{criticalCount ? "Critical queue needs attention" : "Critical queue is clear"}</h3>
              </div>
              <button onClick={() => navigate("incidents")}>Manage incidents</button>
            </div>
            <p>{criticalCount ? "Open the incident queue to assign a responder and coordinate the fastest response." : "Continue monitoring incoming reports and keep responders ready for deployment."}</p>
          </div>
        </section>
      </>
    );
  }


  // ===================================================
  // INCIDENTS PAGE
  // ===================================================

  function IncidentsPage() {
    return (
      <>
        <header className="header">

          <div>
            <h1>
              Incidents
            </h1>

            <p>
              All emergency reports received
              by ResQAI
            </p>
          </div>

          <button
            className="view-all"
            onClick={loadIncidents}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </header>


        <section className="stats">

          <div className="stat-card">
            <span>Total Reports</span>
            <strong>
              {incidents.length}
            </strong>
            <small>
              All recorded incidents
            </small>
          </div>

          <div className="stat-card critical">
            <span>Critical</span>
            <strong>
              {criticalCount}
            </strong>
            <small>
              Immediate response
            </small>
          </div>

          <div className="stat-card high">
            <span>Assigned</span>
            <strong>
              {assignedCount}
            </strong>
            <small>
              Responder assigned
            </small>
          </div>

          <div className="stat-card resolved">
            <span>Resolved</span>
            <strong>
              {resolvedCount}
            </strong>
            <small>
              Successfully handled
            </small>
          </div>

        </section>


        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Emergency Reports
              </h2>

              <p>
                Click an incident to manage it
              </p>
            </div>

            <span className="live-badge">
              ● LIVE
            </span>

          </div>


          {loading && (
            <div className="loading">
              Loading incidents...
            </div>
          )}


          {!loading &&
            incidents.length === 0 && (
              <div className="loading">
                No incidents found.
              </div>
            )}


          <div className="incident-list">

            {incidents.map((incident) => (

              <div
                className="incident"
                key={incident.id}
                onClick={() =>
                  setSelectedIncident(
                    incident
                  )
                }
                style={{
                  cursor: "pointer",
                }}
              >

                <div
                  className={`incident-icon ${emergencyClass(
                    incident.emergency_type
                  )}`}
                >
                  {emergencyIcon(
                    incident.emergency_type
                  )}
                </div>


                <div className="incident-info">

                  <strong>
                    {incident.emergency_type ||
                      "EMERGENCY"}
                  </strong>

                  <span>
                    {incident.description ||
                      "No description"}
                  </span>

                  <span>
                    👤{" "}
                    {incident.reporter_name ||
                      "Unknown User"}
                  </span>

                  {incident.assigned_responder_name && (
                    <span
                      style={{
                        color: "#2563eb",
                      }}
                    >
                      👨‍🚒 Assigned:{" "}
                      {
                        incident.assigned_responder_name
                      }
                    </span>
                  )}

                </div>


                <div
                  style={{
                    textAlign: "right",
                  }}
                >

                  <div
                    className={`severity ${severityClass(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "9px",
                      fontWeight: 700,
                      color:
                        incident.status ===
                        "ASSIGNED"
                          ? "#2563eb"
                          : incident.status ===
                            "RESOLVED"
                          ? "#16a34a"
                          : "#64748b",
                    }}
                  >
                    {incident.status}
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>
      </>
    );
  }


  // ===================================================
  // LIVE MAP
  // ===================================================

  function LiveMapPage() {
    return (
      <>
        <header className="header">

          <div>
            <h1>
              Live Incident Map
            </h1>

            <p>
              Real-time emergency locations
            </p>
          </div>

          <button
            className="view-all"
            onClick={loadIncidents}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </header>


        <div
          style={{
            background: "white",
            border:
              "1px solid #e8ebee",
            borderRadius: "12px",
            padding: "13px 18px",
            marginBottom: "18px",
            display: "flex",
            gap: "22px",
            flexWrap: "wrap",
            fontSize: "12px",
          }}
        >
          <strong>
            SEVERITY
          </strong>

          <span>
            🔴 Critical
          </span>

          <span>
            🟠 High
          </span>

          <span>
            🟡 Medium
          </span>

          <span
            style={{
              marginLeft: "auto",
              color: "#89929b",
            }}
          >
            📍 {mappedCount} mapped
          </span>
        </div>


        <div
          className="panel"
          style={{
            overflow: "hidden",
          }}
        >
          <IncidentMap
            incidents={incidents}
            compact={false}
            onIncidentClick={
              setSelectedIncident
            }
          />
        </div>
      </>
    );
  }


  // ===================================================
  // RESPONDERS
  // ===================================================

  function RespondersPage() {
    const online =
      responders.filter(
        (item) =>
          String(item.status)
            .toUpperCase() ===
          "ONLINE"
      ).length;

    const offline =
      responders.length - online;

    return (
      <>
        <header className="header">

          <div>
            <h1>
              Responders
            </h1>

            <p>
              Emergency response personnel
            </p>
          </div>

          <button
            className="view-all"
            onClick={loadResponders}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </header>


        <section className="stats">

          <div className="stat-card">
            <span>Total Responders</span>
            <strong>
              {responders.length}
            </strong>
            <small>
              Registered personnel
            </small>
          </div>

          <div className="stat-card resolved">
            <span>Online</span>
            <strong>
              {online}
            </strong>
            <small>
              Available
            </small>
          </div>

          <div className="stat-card critical">
            <span>Offline</span>
            <strong>
              {offline}
            </strong>
            <small>
              Unavailable
            </small>
          </div>

          <div className="stat-card high">
            <span>Assigned Incidents</span>
            <strong>
              {assignedCount}
            </strong>
            <small>
              Currently assigned
            </small>
          </div>

        </section>


        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Responder Network
              </h2>

              <p>
                Registered ResQAI responders
              </p>
            </div>

            <span className="live-badge">
              ● LIVE
            </span>

          </div>


          {respondersLoading && (
            <div className="loading">
              Loading responders...
            </div>
          )}


          {respondersError && (
            <div className="loading error-message">
              {respondersError}
            </div>
          )}


          {!respondersLoading &&
            !respondersError &&
            responders.length === 0 && (
              <div className="loading">
                No responders registered.
              </div>
            )}


          <div className="incident-list">

            {responders.map((responder) => {

              const status =
                String(
                  responder.status ||
                    "OFFLINE"
                ).toUpperCase();

              const isOnline =
                status === "ONLINE";

              return (
                <div
                  className="incident"
                  key={responder.id}
                >

                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background:
                        isOnline
                          ? "#dcfce7"
                          : "#f1f5f9",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexShrink: 0,
                    }}
                  >
                    <User
                      size={24}
                      color={
                        isOnline
                          ? "#16a34a"
                          : "#64748b"
                      }
                    />
                  </div>


                  <div className="incident-info">

                    <strong>
                      {responder.name ||
                        "Unknown Responder"}
                    </strong>

                    <span>
                      📞{" "}
                      {responder.phone ||
                        "No phone"}
                    </span>

                    <span>
                      ID:{" "}
                      {responder.id ||
                        "Unknown"}
                    </span>

                  </div>


                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "6px",
                      padding:
                        "7px 11px",
                      borderRadius: "20px",
                      background:
                        isOnline
                          ? "#dcfce7"
                          : "#f1f5f9",
                      color:
                        isOnline
                          ? "#15803d"
                          : "#64748b",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >

                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius:
                          "50%",
                        background:
                          isOnline
                            ? "#22c55e"
                            : "#94a3b8",
                      }}
                    />

                    {status}

                  </div>

                </div>
              );
            })}

          </div>

        </div>
      </>
    );
  }


  // ===================================================
  // INCIDENT DETAIL + ASSIGNMENT
  // ===================================================

  function IncidentDetailModal() {
    if (!selectedIncident) {
      return null;
    }

    const incident =
      selectedIncident;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "rgba(0,0,0,.50)",
          zIndex: 9999,
          display: "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          padding: "20px",
        }}
        onClick={() =>
          setSelectedIncident(null)
        }
      >

        <div
          style={{
            background: "white",
            width: "100%",
            maxWidth: "650px",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "18px",
            padding: "28px",
            boxShadow:
              "0 20px 70px rgba(0,0,0,.25)",
          }}
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          {/* HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              marginBottom: "22px",
            }}
          >

            <div>

              <div
                style={{
                  fontSize: "10px",
                  color: "#89929b",
                  fontWeight: 800,
                  marginBottom: "6px",
                }}
              >
                INCIDENT DETAILS
              </div>

              <h2
                style={{
                  margin: 0,
                }}
              >
                {emergencyIcon(
                  incident.emergency_type
                )}{" "}
                {incident.emergency_type ||
                  "EMERGENCY"}
              </h2>

            </div>


            <button
              onClick={() =>
                setSelectedIncident(null)
              }
              style={{
                border: "none",
                background: "#f1f5f9",
                width: "35px",
                height: "35px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>

          </div>


          {/* SEVERITY + STATUS */}

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >

            <span
              className={`severity ${severityClass(
                incident.severity
              )}`}
              style={{
                padding:
                  "7px 11px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >
              {incident.severity}
            </span>

            <span
              style={{
                padding:
                  "7px 11px",
                borderRadius: "8px",
                background:
                  incident.status ===
                  "ASSIGNED"
                    ? "#dbeafe"
                    : incident.status ===
                      "RESOLVED"
                    ? "#dcfce7"
                    : "#f1f5f9",
                color:
                  incident.status ===
                  "ASSIGNED"
                    ? "#1d4ed8"
                    : incident.status ===
                      "RESOLVED"
                    ? "#15803d"
                    : "#475569",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {incident.status}
            </span>

          </div>


          {/* DESCRIPTION */}

          <div
            style={{
              background: "#f7f8fa",
              borderRadius: "12px",
              padding: "18px",
              marginBottom: "18px",
            }}
          >

            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "#89929b",
                marginBottom: "7px",
              }}
            >
              EMERGENCY DESCRIPTION
            </div>

            <div
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              {incident.description ||
                "No description provided."}
            </div>

          </div>


          {/* REPORTER */}

          <div
            style={{
              borderBottom:
                "1px solid #edf0f2",
              paddingBottom: "18px",
              marginBottom: "20px",
            }}
          >

            <h3
              style={{
                fontSize: "14px",
                marginBottom: "13px",
              }}
            >
              👤 Reported By
            </h3>


            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "12px",
              }}
            >

              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#89929b",
                  }}
                >
                  NAME
                </div>

                <strong>
                  {incident.reporter_name ||
                    "Unknown User"}
                </strong>
              </div>


              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#89929b",
                  }}
                >
                  PHONE
                </div>

                <strong>
                  {incident.reporter_phone ||
                    "Not available"}
                </strong>
              </div>

            </div>

          </div>


          {/* LOCATION */}

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >

            <MapPin
              size={19}
              color="#e53935"
            />

            <div>

              <div
                style={{
                  fontSize: "10px",
                  color: "#89929b",
                  fontWeight: 700,
                }}
              >
                LOCATION
              </div>

              <strong
                style={{
                  fontSize: "13px",
                }}
              >
                {incident.latitude != null &&
                incident.longitude != null
                  ? `${Number(
                      incident.latitude
                    ).toFixed(6)}, ${Number(
                      incident.longitude
                    ).toFixed(6)}`
                  : "Location unavailable"}
              </strong>

            </div>

          </div>


          {/* =========================================
              ASSIGNMENT SECTION
          ========================================= */}

          <div
            style={{
              background:
                incident.status ===
                "ASSIGNED"
                  ? "#eff6ff"
                  : "#fff7ed",
              border:
                incident.status ===
                "ASSIGNED"
                  ? "1px solid #bfdbfe"
                  : "1px solid #fed7aa",
              borderRadius: "14px",
              padding: "18px",
              marginBottom: "20px",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >

              <UserCheck
                size={20}
                color={
                  incident.status ===
                  "ASSIGNED"
                    ? "#2563eb"
                    : "#ea580c"
                }
              />

              <div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "15px",
                  }}
                >
                  {incident.status ===
                  "ASSIGNED"
                    ? "Responder Assigned"
                    : "Assign Responder"}
                </h3>

                <p
                  style={{
                    margin:
                      "3px 0 0",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  {incident.status ===
                  "ASSIGNED"
                    ? "This incident has been assigned."
                    : "Choose a responder from the network."}
                </p>

              </div>

            </div>


            {/* ALREADY ASSIGNED */}

            {incident.assigned_responder_name && (

              <div
                style={{
                  background: "white",
                  borderRadius: "10px",
                  padding: "13px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                }}
              >

                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <User
                    size={19}
                    color="#16a34a"
                  />
                </div>

                <div>

                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                    }}
                  >
                    ASSIGNED RESPONDER
                  </div>

                  <strong
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    {
                      incident.assigned_responder_name
                    }
                  </strong>

                </div>

              </div>
            )}


            {/* SELECT RESPONDER */}

            {incident.status !==
              "ASSIGNED" && (

              <>
                <select
                  value={
                    selectedResponder
                  }
                  onChange={(event) => {
                    setSelectedResponder(
                      event.target.value
                    );

                    setAssignError("");
                    setAssignMessage("");
                  }}
                  disabled={assigning}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border:
                      "1px solid #dbe1e6",
                    borderRadius: "10px",
                    background: "white",
                    fontSize: "13px",
                    outline: "none",
                    marginBottom: "10px",
                  }}
                >

                  <option value="">
                    Select a responder...
                  </option>

                  {responders.map(
                    (responder) => (

                      <option
                        key={
                          responder.id
                        }
                        value={
                          responder.id
                        }
                      >
                        {responder.name ||
                          "Unknown Responder"}
                        {responder.phone
                          ? ` — ${responder.phone}`
                          : ""}
                      </option>

                    )
                  )}

                </select>


                {responders.length === 0 && (

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#dc2626",
                      marginBottom: "10px",
                    }}
                  >
                    No responders available.
                    Register a responder first.
                  </div>

                )}


                {assignError && (

                  <div
                    style={{
                      background: "#fee2e2",
                      color: "#b91c1c",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      marginBottom: "10px",
                    }}
                  >
                    ⚠️ {assignError}
                  </div>

                )}


                {assignMessage && (

                  <div
                    style={{
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      marginBottom: "10px",
                    }}
                  >
                    ✅ {assignMessage}
                  </div>

                )}


                <button
                  onClick={
                    handleAssignResponder
                  }
                  disabled={
                    assigning ||
                    !selectedResponder
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    background:
                      assigning ||
                      !selectedResponder
                        ? "#cbd5e1"
                        : "#e53935",
                    color: "white",
                    padding: "13px",
                    borderRadius: "10px",
                    cursor:
                      assigning ||
                      !selectedResponder
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 800,
                    fontSize: "12px",
                  }}
                >
                  {assigning
                    ? "ASSIGNING..."
                    : "🚨 ASSIGN INCIDENT"}
                </button>

              </>
            )}

          </div>


          {/* CREATED */}

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "9px",
              color: "#64748b",
              fontSize: "11px",
              marginBottom: "18px",
            }}
          >

            <Clock size={15} />

            Reported:{" "}
            {formatDate(
              incident.created_at
            )}

          </div>


          {/* AI */}

          {incident.ai_analysis && (

            <div
              style={{
                background:
                  "#f5f3ff",
                borderRadius: "12px",
                padding: "15px",
                marginBottom: "18px",
              }}
            >

              <strong
                style={{
                  fontSize: "12px",
                }}
              >
                🤖 ResQAI Analysis
              </strong>

              <pre
                style={{
                  whiteSpace:
                    "pre-wrap",
                  wordBreak:
                    "break-word",
                  fontFamily:
                    "inherit",
                  fontSize: "11px",
                  color: "#4b5563",
                  marginTop: "8px",
                }}
              >
                {typeof incident.ai_analysis ===
                "string"
                  ? incident.ai_analysis
                  : JSON.stringify(
                      incident.ai_analysis,
                      null,
                      2
                    )}
              </pre>

            </div>

          )}


          <button
            onClick={() =>
              setSelectedIncident(null)
            }
            style={{
              width: "100%",
              border: "none",
              background: "#151a21",
              color: "white",
              padding: "13px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            CLOSE
          </button>

        </div>

      </div>
    );
  }


  // ===================================================
  // ANALYTICS
  // ===================================================

  function AnalyticsPage() {
    const total = incidents.length;
    const active = incidents.filter((item) =>
      !["RESOLVED", "CLOSED"].includes(
        String(item.status || "").toUpperCase()
      )
    ).length;

    const critical = criticalCount;
    const high = highCount;
    const medium = mediumCount;
    const resolved = resolvedCount;

    const resolutionRate = total > 0
      ? Math.round((resolved / total) * 100)
      : 0;

    const emergencyTypes = {};
    incidents.forEach((item) => {
      const type = item.emergency_type || "OTHER";
      emergencyTypes[type] = (emergencyTypes[type] || 0) + 1;
    });

    const maxTypeCount = Math.max(
      1,
      ...Object.values(emergencyTypes)
    );

    const severityData = [
      { label: "Critical", value: critical, className: "critical" },
      { label: "High", value: high, className: "high" },
      { label: "Medium", value: medium, className: "medium" },
    ];

    return (
      <>
        <header className="header">
          <div>
            <h1>Analytics</h1>
            <p>ResQAI emergency response intelligence</p>
          </div>

          <button
            className="view-all"
            onClick={() => {
              loadIncidents();
              loadResponders();
            }}
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </header>

        <section className="stats">
          <div className="stat-card">
            <span>Total Incidents</span>
            <strong>{total}</strong>
            <small>All emergency reports</small>
          </div>

          <div className="stat-card critical">
            <span>Critical</span>
            <strong>{critical}</strong>
            <small>Immediate response</small>
          </div>

          <div className="stat-card high">
            <span>Active</span>
            <strong>{active}</strong>
            <small>Not yet resolved</small>
          </div>

          <div className="stat-card resolved">
            <span>Resolution Rate</span>
            <strong>{resolutionRate}%</strong>
            <small>{resolved} resolved incidents</small>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Severity Overview</h2>
                <p>Distribution of reported emergencies</p>
              </div>
            </div>

            <div style={{ padding: "10px 4px" }}>
              {severityData.map((item) => (
                <div key={item.label} style={{ marginBottom: "22px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "7px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div style={{
                    height: "12px",
                    background: "#eef1f4",
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}>
                    <div className={`analytics-bar ${item.className}`} style={{
                      width: `${total ? Math.max((item.value / total) * 100, item.value ? 4 : 0) : 0}%`,
                      height: "100%",
                      borderRadius: "20px",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Emergency Types</h2>
                <p>Most frequently reported emergencies</p>
              </div>
            </div>

            <div style={{ padding: "4px 0" }}>
              {Object.keys(emergencyTypes).length === 0 && (
                <div className="loading">No incident data available.</div>
              )}

              {Object.entries(emergencyTypes)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} style={{ marginBottom: "17px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}>
                      <span>{emergencyIcon(type)} {type}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{
                      height: "8px",
                      background: "#eef1f4",
                      borderRadius: "20px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${(count / maxTypeCount) * 100}%`,
                        height: "100%",
                        background: "#151a21",
                        borderRadius: "20px",
                      }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="panel" style={{ marginTop: "18px" }}>
          <div className="panel-header">
            <div>
              <h2>Responder Network</h2>
              <p>Current responder availability</p>
            </div>
            <span className="live-badge">● LIVE</span>
          </div>

          <div className="stats" style={{ margin: 0 }}>
            <div className="stat-card">
              <span>Total Responders</span>
              <strong>{responders.length}</strong>
            </div>
            <div className="stat-card resolved">
              <span>Online</span>
              <strong>{onlineResponders}</strong>
            </div>
            <div className="stat-card critical">
              <span>Offline</span>
              <strong>{responders.length - onlineResponders}</strong>
            </div>
            <div className="stat-card high">
              <span>Assigned</span>
              <strong>{assignedCount}</strong>
            </div>
          </div>
        </section>
      </>
    );
  }


  // ===================================================
  // SETTINGS
  // ===================================================

  function SettingsPage() {
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState("30");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
      if (!autoRefresh) return;

      const timer = setInterval(() => {
        loadIncidents();
        loadResponders();
      }, Number(refreshInterval) * 1000);

      return () => clearInterval(timer);
    }, [autoRefresh, refreshInterval]);

    function saveSettings() {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }

    return (
      <>
        <header className="header">
          <div>
            <h1>Settings</h1>
            <p>Configure your ResQAI Command Center</p>
          </div>

          <div className="admin">
            <div className="online-dot" />
            System Online
          </div>
        </header>

        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>System Configuration</h2>
                <p>Current deployment information</p>
              </div>
              <Settings size={20} />
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{
                background: "#f7f8fa",
                padding: "14px",
                borderRadius: "10px",
              }}>
                <small style={{ color: "#89929b", fontWeight: 700 }}>
                  APPLICATION
                </small>
                <div style={{ fontWeight: 800, marginTop: "5px" }}>
                  ResQAI Command Center
                </div>
              </div>

              <div style={{
                background: "#f7f8fa",
                padding: "14px",
                borderRadius: "10px",
              }}>
                <small style={{ color: "#89929b", fontWeight: 700 }}>
                  BACKEND API
                </small>
                <div style={{
                  fontWeight: 700,
                  marginTop: "5px",
                  wordBreak: "break-all",
                  fontSize: "12px",
                }}>
                  https://resqai-backend-r1xp.onrender.com
                </div>
              </div>

              <div style={{
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
              }}>
                ✓ Connected to cloud backend
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Data Refresh</h2>
                <p>Control how frequently data is updated</p>
              </div>
              <RefreshCw size={20} />
            </div>

            <label style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px",
              background: "#f7f8fa",
              borderRadius: "10px",
              marginBottom: "14px",
              cursor: "pointer",
            }}>
              <div>
                <strong style={{ fontSize: "13px" }}>Auto Refresh</strong>
                <div style={{ fontSize: "11px", color: "#89929b", marginTop: "3px" }}>
                  Automatically refresh incidents and responders
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
              />
            </label>

            <label style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "14px",
            }}>
              Refresh Interval
              <select
                value={refreshInterval}
                onChange={(event) => setRefreshInterval(event.target.value)}
                style={{
                  width: "100%",
                  marginTop: "7px",
                  padding: "11px",
                  border: "1px solid #dbe1e6",
                  borderRadius: "9px",
                  background: "white",
                }}
              >
                <option value="15">Every 15 seconds</option>
                <option value="30">Every 30 seconds</option>
                <option value="60">Every 1 minute</option>
                <option value="120">Every 2 minutes</option>
              </select>
            </label>

            <button
              className="view-all"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                loadIncidents();
                loadResponders();
                saveSettings();
              }}
            >
              <RefreshCw size={16} />
              Refresh Now & Save
            </button>

            {saved && (
              <div style={{
                marginTop: "12px",
                padding: "10px",
                borderRadius: "8px",
                background: "#dcfce7",
                color: "#15803d",
                fontSize: "11px",
                fontWeight: 700,
                textAlign: "center",
              }}>
                ✓ Settings applied successfully
              </div>
            )}
          </div>
        </section>

        <section className="panel" style={{ marginTop: "18px" }}>
          <div className="panel-header">
            <div>
              <h2>About ResQAI</h2>
              <p>Emergency response command platform</p>
            </div>
            <ShieldAlert size={20} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}>
            <div style={{ padding: "15px", background: "#f7f8fa", borderRadius: "10px" }}>
              <strong>📱 Citizen App</strong>
              <p style={{ fontSize: "11px", color: "#89929b" }}>Emergency reporting with GPS location.</p>
            </div>
            <div style={{ padding: "15px", background: "#f7f8fa", borderRadius: "10px" }}>
              <strong>🤖 AI Analysis</strong>
              <p style={{ fontSize: "11px", color: "#89929b" }}>Emergency type and severity analysis.</p>
            </div>
            <div style={{ padding: "15px", background: "#f7f8fa", borderRadius: "10px" }}>
              <strong>👨‍🚒 Responders</strong>
              <p style={{ fontSize: "11px", color: "#89929b" }}>Assignment and response coordination.</p>
            </div>
            <div style={{ padding: "15px", background: "#f7f8fa", borderRadius: "10px" }}>
              <strong>☁️ Cloud Backend</strong>
              <p style={{ fontSize: "11px", color: "#89929b" }}>Online FastAPI and MongoDB infrastructure.</p>
            </div>
          </div>
        </section>
      </>
    );
  }


  // ===================================================
  // PAGE ROUTER
  // ===================================================

  function renderPage() {
    switch (activePage) {

      case "incidents":
        return <IncidentsPage />;

      case "map":
        return <LiveMapPage />;

      case "responders":
        return <RespondersPage />;

      case "analytics":
        return <AnalyticsPage />;

      case "settings":
        return <SettingsPage />;

      default:
        return <DashboardPage />;
    }
  }


  // ===================================================
  // MAIN UI
  // ===================================================

  function signOut() {
    localStorage.removeItem("resqai_session");
    setSession(null);
  }

  if (!session) {
    return <AccessPortal onAuthenticated={setSession} />;
  }

  if (String(session.role).toUpperCase() !== "ADMIN") {
    return <FieldWorkspace session={session} onSignOut={signOut} />;
  }

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            🚨
          </div>

          <div>

            <h2>
              ResQAI
            </h2>

            <span>
              Command Center
            </span>

          </div>

        </div>


        <nav>

          <button
            className={`nav-item ${
              activePage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("dashboard")
            }
          >
            <Activity size={20} />
            Dashboard
          </button>


          <button
            className={`nav-item ${
              activePage === "incidents"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("incidents")
            }
          >
            <AlertTriangle size={20} />
            Incidents
          </button>


          <button
            className={`nav-item ${
              activePage === "map"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("map")
            }
          >
            <MapIcon size={20} />
            Live Map
          </button>


          <button
            className={`nav-item ${
              activePage === "responders"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("responders")
            }
          >
            <Users size={20} />
            Responders
          </button>


          <button
            className={`nav-item ${
              activePage === "analytics"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("analytics")
            }
          >
            <BarChart3 size={20} />
            Analytics
          </button>


          <button
            className={`nav-item ${
              activePage === "settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("settings")
            }
          >
            <Settings size={20} />
            Settings
          </button>

          <button className="nav-item signout-nav" onClick={signOut}>
            <LogOut size={20} />
            Sign out
          </button>

        </nav>

      </aside>


      {/* MAIN */}

      <main className="main">

        {renderPage()}

      </main>


      {/* INCIDENT MODAL */}

      <IncidentDetailModal />

    </div>
  );
}


export default App;
