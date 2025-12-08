import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../api";
const formatSampleDate = (value) => {
  if (!value) return "18 October 2025";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [certs, setCerts] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadType, setUploadType] = useState("csv");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateForm, setTemplateForm] = useState({ templateId: "", name: "", layoutJson: "" });
  const [templateFile, setTemplateFile] = useState(null);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [layoutDraft, setLayoutDraft] = useState(null);
  const [savingLayout, setSavingLayout] = useState(false);
  const [activeTab, setActiveTab] = useState("participants");
  const [sendingEmails, setSendingEmails] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [manualParticipantForm, setManualParticipantForm] = useState({ name: "", email: "", roll_no: "", department: "" });
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [closingEvent, setClosingEvent] = useState(false);
  const [editingTemplateImage, setEditingTemplateImage] = useState(false);
  const [templateImageFile, setTemplateImageFile] = useState(null);
  const [savingTemplateImage, setSavingTemplateImage] = useState(false);
  const [eventStats, setEventStats] = useState(null);
  const [testingTemplate, setTestingTemplate] = useState(false);
  const templateFileInputRef = useRef(null);
  const templateImageInputRef = useRef(null);

  const adminSecret = import.meta.env.VITE_ADMIN_SECRET;
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const primaryParticipant = participants[0] || null;
  const previewSampleData = {
    name: primaryParticipant?.name || "Alex Johnson",
    event: event?.name || "Signature Event",
    date: event?.date ? formatSampleDate(event.date) : "18 October 2025",
    code: "TEST-12345",
  };
  if (primaryParticipant) {
    Object.entries(primaryParticipant).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim() && !previewSampleData[key]) {
        previewSampleData[key] = value;
      }
    });
  }

  const selectedTemplate = templates.find((tpl) => tpl.id === selectedTemplateId) || null;

  const cloneLayout = (layout) => JSON.parse(JSON.stringify(layout || {}));

  const loadEvent = async () => {
    try {
      const res = await api.get("/events/");
      const ev = res.data.find((e) => e.id === Number(id));
      setEvent(ev);
    } catch (err) {
      console.error("Failed to load event:", err);
    }
  };

  const loadEventStats = async () => {
    try {
      const res = await api.get(`/events/${id}/stats`);
      setEventStats(res.data);
    } catch (err) {
      console.error("Failed to load event stats:", err);
    }
  };

  const loadParticipants = async () => {
    try {
      const res = await api.get(`/participants/by_event/${id}?admin_secret=${adminSecret}`);
      setParticipants(res.data);
    } catch (err) {
      console.error("Failed to load participants:", err);
    }
  };

  const loadCertificates = async () => {
    try {
      const res = await api.get(`/certificates/by_event/${id}?admin_secret=${adminSecret}`);
      setCerts(res.data);
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await api.get("/certificates/templates");
      const list = Array.isArray(res.data) ? res.data : [];
      setTemplates(list);
      setSelectedTemplateId((prev) => {
        if (prev && list.some((tpl) => tpl.id === prev)) {
          return prev;
        }
        return list[0]?.id || "";
      });
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplates([]);
      setSelectedTemplateId("");
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    loadEventStats();
    loadParticipants();
    loadCertificates();
  }, [id]);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    const template = templates.find((tpl) => tpl.id === selectedTemplateId);
    if (!template) {
      setLayoutDraft(null);
      setIsEditingLayout(false);
      return;
    }
    setLayoutDraft(cloneLayout(template.layout));
    setIsEditingLayout(false);
  }, [selectedTemplateId, templates]);

  const uploadCsv = async (e) => {
    e.preventDefault();
    
    if (uploadType === "sheets") {
      if (!sheetsUrl.trim()) {
        alert("Please enter a Google Sheets URL");
        return;
      }

      setUploading(true);
      const url = `/participants/upload_google_sheets?event_id=${id}&admin_secret=${adminSecret}&sheets_url=${encodeURIComponent(sheetsUrl)}`;
      
      try {
        const response = await api.post(url);
        alert(response.data.message);
        setSheetsUrl("");
        loadParticipants();
      } catch (err) {
        alert("Failed to import from Google Sheets: " + (err.response?.data?.detail || err.message));
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!csvFile) {
      alert(`Please select a ${uploadType === "excel" ? "Excel" : "CSV"} file`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", csvFile);
    
    const endpoint = uploadType === "excel" ? "upload_excel" : "upload_csv";
    const url = `/participants/${endpoint}?event_id=${id}&admin_secret=${adminSecret}`;
    
    try {
      const response = await api.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(response.data.message);
      setCsvFile(null);
      const fileInput = document.getElementById("fileInput");
      if (fileInput) fileInput.value = "";
      loadParticipants();
    } catch (err) {
      alert(`Failed to upload ${uploadType === "excel" ? "Excel" : "CSV"}: ` + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateUpload = async (e) => {
    e.preventDefault();
    if (!templateForm.templateId.trim() || !templateForm.name.trim() || !templateFile) {
      alert("Template ID, name, and image are required.");
      return;
    }

    setTemplateUploading(true);
    const formData = new FormData();
    formData.append("admin_secret", adminSecret);
    formData.append("template_id", templateForm.templateId.trim());
    formData.append("name", templateForm.name.trim());
    formData.append("image", templateFile);
    if (templateForm.layoutJson.trim()) {
      formData.append("layout", templateForm.layoutJson.trim());
    }

    try {
      await api.post("/certificates/templates/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Template uploaded successfully!");
      setTemplateForm({ templateId: "", name: "", layoutJson: "" });
      setTemplateFile(null);
      if (templateFileInputRef.current) {
        templateFileInputRef.current.value = "";
      }
      loadTemplates();
    } catch (err) {
      alert("Failed to upload template: " + (err.response?.data?.detail || err.message));
    } finally {
      setTemplateUploading(false);
    }
  };

  const handleLayoutChange = (field, updates) => {
    if (!layoutDraft) return;
    setLayoutDraft((prev) => {
      if (!prev) return prev;
      const nextField = { ...(prev[field] || {}), ...updates };
      return { ...prev, [field]: nextField };
    });
  };

  const handleAddField = (fieldKey) => {
    if (!layoutDraft) return;
    setLayoutDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [fieldKey]: {
          x: 50,
          y: 50,
          font_size: 24,
          align: "center",
          color: "#000000"
        }
      };
    });
  };

  const handleRemoveField = (fieldKey) => {
    if (!layoutDraft) return;
    setLayoutDraft((prev) => {
      if (!prev) return prev;
      const newLayout = { ...prev };
      delete newLayout[fieldKey];
      return newLayout;
    });
  };

  const startEditingLayout = () => {
    if (!selectedTemplate) return;
    setLayoutDraft(cloneLayout(selectedTemplate.layout));
    setIsEditingLayout(true);
  };

  const cancelEditingLayout = () => {
    if (selectedTemplate) {
      setLayoutDraft(cloneLayout(selectedTemplate.layout));
    }
    setIsEditingLayout(false);
  };

  const saveLayout = async () => {
    if (!layoutDraft || !selectedTemplateId) return;
    setSavingLayout(true);
    try {
      await api.put(`/certificates/templates/${selectedTemplateId}?admin_secret=${adminSecret}`, {
        layout: layoutDraft,
      });
      alert("Layout updated successfully");
      setIsEditingLayout(false);
      await loadTemplates();
    } catch (err) {
      alert("Failed to save layout: " + (err.response?.data?.detail || err.message));
    } finally {
      setSavingLayout(false);
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplateId) return;
    if (!confirm(`Delete template "${selectedTemplate.name}"? This cannot be undone.`)) {
      return;
    }
    setDeletingTemplate(true);
    try {
      await api.delete(`/certificates/templates/${selectedTemplateId}?admin_secret=${adminSecret}`);
      alert("Template deleted successfully");
      setSelectedTemplateId("");
      await loadTemplates();
    } catch (err) {
      alert("Failed to delete template: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingTemplate(false);
    }
  };

  const saveTemplateImage = async () => {
    if (!templateImageFile || !selectedTemplateId) return;
    setSavingTemplateImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("admin_secret", adminSecret);
      uploadFormData.append("image", templateImageFile);

      await api.post(`/certificates/templates/${selectedTemplateId}/image`, uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      alert("Template image updated successfully");
      setEditingTemplateImage(false);
      setTemplateImageFile(null);
      if (templateImageInputRef.current) {
        templateImageInputRef.current.value = "";
      }
      await loadTemplates();
    } catch (err) {
      alert("Failed to update template image: " + (err.response?.data?.detail || err.message));
    } finally {
      setSavingTemplateImage(false);
    }
  };

  const testTemplatePdf = async () => {
    if (!selectedTemplateId) {
      alert("Select a template to test.");
      return;
    }
    setTestingTemplate(true);
    try {
      const payload = {
        event_id: Number(id),
      };
      if (participants.length > 0) {
        payload.participant_id = participants[0].id;
      }
      const draftLayout = isEditingLayout && layoutDraft ? layoutDraft : selectedTemplate?.layout;
      if (draftLayout) {
        payload.layout = draftLayout;
      }
      const response = await api.post(
        `/certificates/templates/${selectedTemplateId}/test?admin_secret=${adminSecret}`,
        payload,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTemplateId}-preview.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download test PDF: " + (err.response?.data?.detail || err.message));
    } finally {
      setTestingTemplate(false);
    }
  };

  const addParticipant = async (e) => {
    e.preventDefault();
    if (!manualParticipantForm.name.trim()) {
      alert("Participant name is required");
      return;
    }
    setAddingParticipant(true);
    try {
      await api.post(`/participants/?admin_secret=${adminSecret}`, {
        event_id: Number(id),
        name: manualParticipantForm.name.trim(),
        email: manualParticipantForm.email.trim() || null,
        roll_no: manualParticipantForm.roll_no.trim() || null,
        department: manualParticipantForm.department.trim() || null,
      });
      alert("Participant added successfully!");
      setManualParticipantForm({ name: "", email: "", roll_no: "", department: "" });
      await loadParticipants();
    } catch (err) {
      alert("Failed to add participant: " + (err.response?.data?.detail || err.message));
    } finally {
      setAddingParticipant(false);
    }
  };

  const closeEvent = async () => {
    if (!event || !event.is_active) {
      alert("This event is not active or not found");
      return;
    }
    if (!confirm(`Close event "${event.name}"? Once closed, no new certificates can be issued for this event.`)) {
      return;
    }
    setClosingEvent(true);
    try {
      await api.patch(`/events/${id}/close?admin_secret=${adminSecret}`);
      alert("Event closed successfully");
      await loadEvent();
    } catch (err) {
      alert("Failed to close event: " + (err.response?.data?.detail || err.message));
    } finally {
      setClosingEvent(false);
    }
  };

  const generateCertificates = async () => {
    if (!selectedTemplateId) {
      alert("Select a certificate template before generating.");
      return;
    }

    if (!confirm("Generate certificates for all participants? This may take a while.")) {
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post(
        `/certificates/generate_for_event/${id}?admin_secret=${adminSecret}`,
        { template_id: selectedTemplateId }
      );
      alert(response.data.message);
      loadCertificates();
    } catch (err) {
      alert("Failed to generate certificates: " + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const sendCertificateLinks = async () => {
    if (!selectedTemplateId) {
      alert("Please select a certificate template first.");
      return;
    }

    if (participants.length === 0) {
      alert("No participants to send emails to.");
      return;
    }

    const participantsWithEmail = participants.filter(p => p.email);
    if (participantsWithEmail.length === 0) {
      alert("No participants have email addresses.");
      return;
    }

    if (!confirm(`Send certificate generation links to ${participantsWithEmail.length} participants via email?`)) {
      return;
    }

    setSendingEmails(true);
    try {
      const response = await api.post(
        `/participants/send_certificate_links/${id}?admin_secret=${adminSecret}&template_id=${selectedTemplateId}`
      );
      alert(`✅ ${response.data.message}\n\nSent: ${response.data.sent}\nFailed: ${response.data.failed}`);
    } catch (err) {
      alert("Failed to send emails: " + (err.response?.data?.detail || err.message));
    } finally {
      setSendingEmails(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="loading-spinner" style={{ width: "48px", height: "48px", borderWidth: "4px" }}></div>
        <span style={{ marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "1rem" }}>Loading event details...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="app-container">
        <div className="alert alert-error">Event not found</div>
        <Link to="/admin/events" className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="flex justify-between items-center mb-4">
        <Link to="/admin/events" className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Events
        </Link>
        <div className="flex gap-2">
          <span className={`badge ${event.is_active ? "badge-success" : "badge-error"}`}>
            {event.is_active ? "Active" : "Inactive"}
          </span>
          {event.is_active && (
            <button 
              onClick={closeEvent} 
              className="btn btn-error" 
              disabled={closingEvent}
              style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
            >
              {closingEvent ? (
                <>
                  <div className="loading-spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", margin: 0 }}></div>
                  Closing...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Close Event
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.25rem", marginBottom: "0.75rem", fontWeight: "800" }}>{event.name}</h1>
        {event.description && <p style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "1.0625rem" }}>{event.description}</p>}
        <div className="flex gap-4 items-center" style={{ fontSize: "0.9375rem", color: "var(--text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {event.date}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            {participants.length} Participants
          </span>
          {eventStats && (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {eventStats.total_certificates_issued} Certificates Issued
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: "2rem", borderBottom: "2px solid var(--border-color)" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("participants")}
            style={{
              padding: "1rem 2rem",
              border: "none",
              borderBottom: activeTab === "participants" ? "3px solid var(--primary)" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "participants" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: activeTab === "participants" ? "700" : "600",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: "-2px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Participants ({participants.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("template")}
            style={{
              padding: "1rem 2rem",
              border: "none",
              borderBottom: activeTab === "template" ? "3px solid var(--primary)" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "template" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: activeTab === "template" ? "700" : "600",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: "-2px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Certificate Template
            </div>
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            style={{
              padding: "1rem 2rem",
              border: "none",
              borderBottom: activeTab === "certificates" ? "3px solid var(--primary)" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "certificates" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: activeTab === "certificates" ? "700" : "600",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: "-2px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Certificates ({certs.length})
            </div>
          </button>
        </div>
      </div>

      {/* Participants Tab */}
      {activeTab === "participants" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="card">
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: "700", paddingBottom: "1rem", borderBottom: "1px solid var(--border-light)" }}>Manage Participants</h2>
            
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "600", fontSize: "0.9375rem" }}>Upload Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                <button
                  className={`btn ${uploadType === "csv" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setUploadType("csv")}
                  style={{ padding: "0.875rem 1rem", justifyContent: "center", width: "100%" }}
                >
                  CSV File
                </button>
                <button
                  className={`btn ${uploadType === "excel" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setUploadType("excel")}
                  style={{ padding: "0.875rem 1rem", justifyContent: "center", width: "100%" }}
                >
                  Excel File
                </button>
                <button
                  className={`btn ${uploadType === "sheets" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setUploadType("sheets")}
                  style={{ padding: "0.875rem 1rem", justifyContent: "center", width: "100%" }}
                >
                  Google Sheets
                </button>
                <button
                  className={`btn ${uploadType === "manual" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setUploadType("manual")}
                  style={{ padding: "0.875rem 1rem", justifyContent: "center", width: "100%" }}
                >
                  Add Manually
                </button>
              </div>
            </div>
            
            <form onSubmit={uploadType === "manual" ? addParticipant : uploadCsv} className="mb-4">
              {uploadType === "manual" ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label htmlFor="participant-name">Name *</label>
                      <input
                        id="participant-name"
                        type="text"
                        placeholder="Enter participant name"
                        value={manualParticipantForm.name}
                        onChange={(e) => setManualParticipantForm({...manualParticipantForm, name: e.target.value})}
                        disabled={addingParticipant}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="participant-email">Email</label>
                      <input
                        id="participant-email"
                        type="email"
                        placeholder="participant@example.com"
                        value={manualParticipantForm.email}
                        onChange={(e) => setManualParticipantForm({...manualParticipantForm, email: e.target.value})}
                        disabled={addingParticipant}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label htmlFor="participant-roll">Roll No</label>
                      <input
                        id="participant-roll"
                        type="text"
                        placeholder="e.g. A001"
                        value={manualParticipantForm.roll_no}
                        onChange={(e) => setManualParticipantForm({...manualParticipantForm, roll_no: e.target.value})}
                        disabled={addingParticipant}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="participant-dept">Department</label>
                      <input
                        id="participant-dept"
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={manualParticipantForm.department}
                        onChange={(e) => setManualParticipantForm({...manualParticipantForm, department: e.target.value})}
                        disabled={addingParticipant}
                      />
                    </div>
                  </div>
                </div>
              ) : uploadType === "sheets" ? (
                <div className="form-group">
                  <label htmlFor="sheetsUrl">Google Sheets URL</label>
                  <input
                    id="sheetsUrl"
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    disabled={uploading}
                    style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                  />
                  <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                    Make sure the sheet is publicly accessible or shared with "Anyone with the link"

                  </small>
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="fileInput">{uploadType === "excel" ? "Excel File (.xlsx)" : "CSV File"}</label>
                  <input
                    id="fileInput"
                    type="file"
                    accept={uploadType === "excel" ? ".xlsx,.xls" : ".csv"}
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    disabled={uploading}
                  />
                </div>
              )}
              
              <button type="submit" className="btn btn-primary w-full" disabled={uploading || addingParticipant}>
                {uploading || addingParticipant ? (
                  <>
                    <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></div>
                    {uploadType === "sheets" ? "Importing..." : uploadType === "manual" ? "Adding..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {uploadType === "sheets" ? "Import from Sheets" : uploadType === "manual" ? "Add Participant" : `Upload ${uploadType === "excel" ? "Excel" : "CSV"}`}
                  </>
                )}
              </button>
            </form>

            <div className="alert alert-info" style={{ fontSize: "0.8125rem", padding: "0.875rem 1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-lg)" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ flexShrink: 0, marginTop: "0.125rem" }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div style={{ color: "#1e40af" }}>
                  <strong style={{ fontWeight: "600" }}>Dynamic Column Support:</strong> The system automatically detects and stores ALL columns from your file. Common columns: name, email, roll_no, department, grade, etc.
                </div>
              </div>
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "700", margin: 0 }}>Participant List</h3>
                  {participants.length > 0 && (
                    <div style={{ padding: "0.5rem 1rem", background: "var(--primary-light)", color: "var(--primary)", borderRadius: "var(--radius-lg)", fontSize: "0.875rem", fontWeight: "700" }}>
                      {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {participants.length > 0 && (
                  <button
                    onClick={sendCertificateLinks}
                    className="btn btn-success"
                    disabled={sendingEmails || !selectedTemplateId}
                    style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem" }}
                    title={!selectedTemplateId ? "Please select a template in the Template tab first" : ""}
                    data-action="send-email"
                  >
                    {sendingEmails ? (
                      <>
                        <div className="loading-spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", margin: 0 }}></div>
                        Sending Emails...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Send Certificate Links via Email
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="data-table" style={{ maxHeight: "500px", overflowY: "auto", marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roll No</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "3rem" }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 1rem", opacity: 0.3, color: "var(--text-muted)" }}>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "0.5rem" }}>No participants yet</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Upload a file or import from Google Sheets to get started</p>
                      </td>
                    </tr>
                  ) : (
                    participants.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: "600" }}>{p.name}</td>
                        <td style={{ fontSize: "0.875rem" }}>{p.email || <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                        <td>{p.roll_no || <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                        <td>{p.department || <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Template Tab */}
      {activeTab === "template" && (
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "700" }}>Certificate Template</h2>
                <p className="text-sm text-muted">Configure the template layout and design for your certificates</p>
              </div>
              <div className="flex gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                {isEditingLayout ? (
                  <>
                    <button onClick={cancelEditingLayout} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button onClick={saveLayout} className="btn btn-success" disabled={savingLayout}>
                      {savingLayout ? (
                        <>
                          <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></div>
                          Saving...
                        </>
                      ) : (
                        "Save Layout"
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startEditingLayout} className="btn btn-primary" disabled={!selectedTemplate}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                      Edit Layout
                    </button>
                    <button
                      onClick={() => setEditingTemplateImage(!editingTemplateImage)}
                      className="btn btn-secondary"
                      disabled={!selectedTemplate}
                      title="Change template image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      Change Image
                    </button>
                  </>
                )}
                <button
                  onClick={testTemplatePdf}
                  className="btn btn-secondary"
                  disabled={!selectedTemplate || testingTemplate}
                >
                  {testingTemplate ? (
                    <>
                      <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></div>
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                      </svg>
                      Download Test PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {templatesLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div className="loading-spinner" style={{ width: "32px", height: "32px" }}></div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label htmlFor="template-select">Select Template</label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                    <select
                      id="template-select"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                      ))}
                      <option value="">+ Upload New Template</option>
                    </select>
                    {selectedTemplateId && (
                      <button 
                        type="button" 
                        onClick={deleteTemplate} 
                        className="btn btn-error" 
                        disabled={deletingTemplate}
                        style={{ padding: "0.5rem 1rem" }}
                        title="Delete this template"
                      >
                        {deletingTemplate ? (
                          <>
                            <div className="loading-spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", margin: 0 }}></div>
                          </>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!selectedTemplateId && !templatesLoading && (
               <div style={{ background: "var(--bg-subtle)", padding: "2rem", borderRadius: "var(--radius-lg)", border: "2px dashed var(--border-color)", marginTop: "1.5rem" }}>
                 <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: "700" }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.5rem" }}>
                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                     <polyline points="17 8 12 3 7 8"></polyline>
                     <line x1="12" y1="3" x2="12" y2="15"></line>
                   </svg>
                   Upload New Template
                 </h3>
                 <form onSubmit={handleTemplateUpload}>
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                     <div className="form-group">
                       <label>Template ID</label>
                       <input 
                         type="text" 
                         placeholder="e.g. classic-2025" 
                         value={templateForm.templateId} 
                         onChange={e => setTemplateForm({...templateForm, templateId: e.target.value})} 
                         required 
                       />
                       <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                         Unique identifier for this template
                       </small>
                     </div>
                     <div className="form-group">
                       <label>Template Name</label>
                       <input 
                         type="text" 
                         placeholder="e.g. Classic Certificate" 
                         value={templateForm.name} 
                         onChange={e => setTemplateForm({...templateForm, name: e.target.value})} 
                         required 
                       />
                       <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                         Display name for the template
                       </small>
                     </div>
                   </div>
                   <div className="form-group">
                     <label>Certificate Template Image</label>
                     <input 
                       type="file" 
                       accept="image/*" 
                       ref={templateFileInputRef}
                       onChange={e => setTemplateFile(e.target.files?.[0])} 
                       required 
                     />
                     <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                       Upload a PNG, JPG, or WebP image (recommended size: 1200x800px)
                     </small>
                   </div>
                   <button type="submit" className="btn btn-primary" disabled={templateUploading} style={{ marginTop: "1rem" }}>
                     {templateUploading ? (
                       <>
                         <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></div>
                         Uploading Template...
                       </>
                     ) : (
                       <>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                           <polyline points="17 8 12 3 7 8"></polyline>
                           <line x1="12" y1="3" x2="12" y2="15"></line>
                         </svg>
                         Upload Template
                       </>
                     )}
                   </button>
                 </form>
               </div>
            )}

            {editingTemplateImage && selectedTemplate && (
              <div className="card" style={{ marginTop: "1.5rem", background: "var(--bg-subtle)", border: "1px dashed var(--border-color)" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem" }}>Update Template Image</h3>
                <div className="form-group">
                  <label>New Template Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={templateImageInputRef}
                    onChange={(e) => setTemplateImageFile(e.target.files?.[0] || null)}
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}>
                    Upload a PNG, JPG, or WebP image. This will replace the current template background.
                  </small>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingTemplateImage(false);
                      setTemplateImageFile(null);
                      if (templateImageInputRef.current) templateImageInputRef.current.value = "";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={saveTemplateImage}
                    disabled={!templateImageFile || savingTemplateImage}
                  >
                    {savingTemplateImage ? (
                      <>
                        <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></div>
                        Updating...
                      </>
                    ) : (
                      "Update Image"
                    )}
                  </button>
                </div>
              </div>
            )}

            {selectedTemplate && (
              <div className="flex gap-4 mt-4" style={{ flexDirection: isEditingLayout ? "row" : "column" }}>
                <div style={{ flex: 1 }}>
                  <TemplatePreview
                    template={selectedTemplate}
                    apiBaseUrl={apiBaseUrl}
                    editable={isEditingLayout}
                    layoutDraft={layoutDraft}
                    onLayoutChange={handleLayoutChange}
                                      sampleData={previewSampleData}
                  />
                </div>
                {isEditingLayout && layoutDraft && (
                  <div style={{ width: "300px" }}>
                    <div style={{ position: "sticky", top: "1rem" }}>
                      <LayoutControls 
                        layout={layoutDraft} 
                        onChange={handleLayoutChange}
                        onAddField={handleAddField}
                        onRemoveField={handleRemoveField}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === "certificates" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="card">
            <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "2px solid var(--border-light)" }}>
              <h2 style={{ marginBottom: "0.75rem", fontSize: "1.5rem", fontWeight: "700" }}>Certificate Distribution</h2>
              <p className="text-sm text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>Choose how you want to distribute certificates to participants</p>
              
              {/* Distribution Options */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                {/* Option 1: Send Email Links */}
                <div style={{ 
                  padding: "1.75rem", 
                  border: "2px solid var(--primary)", 
                  borderRadius: "var(--radius-lg)", 
                  background: "var(--primary-light)",
                  position: "relative"
                }}>
                  <div style={{ position: "absolute", top: "1rem", right: "1rem", background: "var(--primary)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.6875rem", fontWeight: "700", letterSpacing: "0.05em" }}>
                    RECOMMENDED
                  </div>
                  <div style={{ width: "48px", height: "48px", background: "white", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--primary)" }}>
                    Send Email Links
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
                    Students receive personalized email links to generate their own certificates. One-click generation, secure, and trackable.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("participants");
                      setTimeout(() => {
                        const button = document.querySelector('[data-action="send-email"]');
                        if (button) {
                          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          button.style.animation = 'pulse 1s ease-in-out 3';
                        }
                      }, 100);
                    }}
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Go to Send Email Links
                  </button>
                  <div style={{ marginTop: "0.875rem", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <span>• Student self-service generation</span>
                    <span>• Email delivery tracking</span>
                    <span>• Unique secure links</span>
                  </div>
                </div>

                {/* Option 2: Generate All */}
                <div style={{ 
                  padding: "1.75rem", 
                  border: "2px solid var(--border-color)", 
                  borderRadius: "var(--radius-lg)", 
                  background: "white"
                }}>
                  <div style={{ width: "48px", height: "48px", background: "var(--bg-subtle)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                    Generate All Now
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
                    Instantly generate certificates for all participants. Download and distribute manually as needed.
                  </p>
                  <button 
                    onClick={generateCertificates} 
                    className="btn btn-success"
                    disabled={generating || participants.length === 0 || !selectedTemplateId}
                    title={!selectedTemplateId ? "Please select a template first" : ""}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {generating ? (
                      <>
                        <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Generate All Certificates
                      </>
                    )}
                  </button>
                  <div style={{ marginTop: "0.875rem", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <span>• Instant bulk generation</span>
                    <span>• Download all at once</span>
                    <span>• Manual distribution</span>
                  </div>
                </div>
              </div>

              <div className="alert alert-info" style={{ fontSize: "0.875rem", padding: "0.875rem 1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ flexShrink: 0, marginTop: "0.125rem" }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <div>
                    <strong style={{ fontWeight: "600", color: "#1e40af" }}>Recommendation:</strong>
                    <span style={{ color: "#1e40af" }}> Email links are ideal for large events. Students generate their own certificates, reducing admin workload and providing instant access.</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Generated Certificates List */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "700", margin: 0 }}>Generated Certificates</h3>
                {certs.length > 0 && (
                  <div style={{ padding: "0.5rem 1rem", background: "var(--success-light)", color: "var(--success)", borderRadius: "var(--radius-lg)", fontSize: "0.875rem", fontWeight: "700" }}>
                    {certs.length} certificate{certs.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            
            {certs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", opacity: 0.5 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>No certificates generated yet</p>
                <p style={{ fontSize: "0.9375rem" }}>Choose a distribution method above to get started</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certs.map((c) => {
                      const participant = participants.find(p => p.id === c.participant_id);
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: "500" }}>{participant?.name || 'Unknown'}</td>
                          <td>
                            <code style={{ background: "var(--bg-subtle)", padding: "0.375rem 0.625rem", borderRadius: "var(--radius-sm)", fontSize: "0.8125rem", fontWeight: "600" }}>
                              {c.certificate_code}
                            </code>
                          </td>
                          <td>
                            <span className={c.status === "valid" ? "badge badge-success" : "badge badge-error"}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <a
                                href={`${import.meta.env.VITE_API_BASE_URL}/${c.certificate_path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Download
                              </a>
                              <Link
                                to={`/verify/${c.certificate_code}`}
                                className="btn btn-secondary"
                                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Verify
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// TemplatePreview Component
function TemplatePreview({ template, apiBaseUrl, editable = false, layoutDraft, onLayoutChange, sampleData = {} }) {
  const containerRef = useRef(null);
  const [dragField, setDragField] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [imageMeta, setImageMeta] = useState({ width: 1200, height: 800 });

  if (!template) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)", background: "var(--bg-subtle)" }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", opacity: 0.4, color: "var(--text-muted)" }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Select a template to preview</p>
      </div>
    );
  }

  const layout = (editable && layoutDraft) ? layoutDraft : (template.layout || {});
  const baseWidth = imageMeta.width || 1200;
  const baseHeight = imageMeta.height || 800;
  const sizeRatio = {
    width: canvasSize.width / baseWidth,
    height: canvasSize.height / baseHeight,
  };
  const combinedSamples = {
    name: "Sample Name",
    event: "Flagship Event",
    date: "18 October 2025",
    code: "TEST-12345",
    ...sampleData,
  };
  
  // Use image_url from Supabase if available, otherwise construct URL from file
  const imageUrl = template.image_url 
    ? template.image_url 
    : (template.file
        ? (template.file.startsWith("http") ? template.file : `${apiBaseUrl}/template-images/${template.file}`)
        : "");

  if (!imageUrl) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)", background: "var(--bg-subtle)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Template image not found</p>
      </div>
    );
  }

  useEffect(() => {
    const imgEl = containerRef.current?.querySelector("img");
    if (imgEl && imgEl.complete && imgEl.naturalWidth && imgEl.naturalHeight) {
      setImageMeta({ width: imgEl.naturalWidth, height: imgEl.naturalHeight });
    }
  }, [imageUrl]);

  const resolvePercent = (value, axis) => {
    if (typeof value !== "number") return 50;
    if (value >= 0 && value <= 1) return value * 100;
    const base = axis === "x" ? baseWidth : baseHeight;
    const percent = (value / base) * 100;
    return Math.max(0, Math.min(100, percent));
  };

  const resolveQrSize = (value) => {
    if (typeof value !== "number") return 12;
    if (value > 0 && value <= 1) return value * 100;
    const base = Math.min(baseWidth, baseHeight);
    return (value / base) * 100;
  };

  const handleImageLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.target;
    if (!naturalWidth || !naturalHeight) {
      return;
    }
    setImageMeta({ width: naturalWidth, height: naturalHeight });
  };
  useEffect(() => {
    const target = containerRef.current;
    if (!target || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect?.width && entry?.contentRect?.height) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width && rect.height) {
      setCanvasSize({ width: rect.width, height: rect.height });
    }
  }, [template?.id, editable]);

  const resolveSampleText = (fieldKey, placementCfg = {}) => {
    if (fieldKey === "name") {
      return combinedSamples.name;
    }
    if (fieldKey === "event") {
      return combinedSamples.event;
    }
    if (fieldKey === "date") {
      const format = placementCfg.format || "Issued on: {date}";
      const dateValue = combinedSamples.date;
      return format.includes("{date}") ? format.replace("{date}", dateValue) : `${format} ${dateValue}`;
    }
    if (fieldKey === "code") {
      const format = placementCfg.format || "Code: {code}";
      const codeValue = combinedSamples.code;
      return format.includes("{code}") ? format.replace("{code}", codeValue) : `${format} ${codeValue}`;
    }
    if (combinedSamples[fieldKey]) {
      return combinedSamples[fieldKey];
    }
    return fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, " ");
  };

  const translateForAlign = (align = "center") => {
    if (align === "left") return 0;
    if (align === "right") return -100;
    return -50;
  };

  useEffect(() => {
    if (!dragField) return undefined;
    const handleMove = (event) => {
      if (!editable || !onLayoutChange || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const scaleX = baseWidth / rect.width;
      const scaleY = baseHeight / rect.height;
      
      const pixelX = (event.clientX - rect.left) * scaleX;
      const pixelY = (event.clientY - rect.top) * scaleY;
      
      const clampedX = Math.max(0, Math.min(baseWidth, pixelX));
      const clampedY = Math.max(0, Math.min(baseHeight, pixelY));
      
      onLayoutChange(dragField, { x: clampedX, y: clampedY });
    };
    const handleUp = () => setDragField(null);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragField, editable, onLayoutChange, baseWidth, baseHeight]);

  const startDrag = (field) => (event) => {
    if (!editable || !onLayoutChange) return;
    event.preventDefault();
    setDragField(field);
  };

  const markers = Object.keys(layout || {})
    .filter(key => key !== "qr" && layout[key])
    .map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
    }));

  return (
    <div className={`template-preview${editable ? " template-preview--editable" : ""}`} ref={containerRef}>
      <img src={imageUrl} alt="Template" onLoad={handleImageLoad} />
      {markers.map(({ key, label }) => {
        const placement = layout[key];
        if (!placement) return null;
        const alignment = placement.align || "center";
        const translateX = translateForAlign(alignment);
        const fontSizePx = Math.max(12, (placement.font_size || 40) * sizeRatio.width);
        const letterSpacingPx = placement.letter_spacing
          ? placement.letter_spacing * sizeRatio.width
          : undefined;
        const sampleText = resolveSampleText(key, placement) || label;
        const classList = ["template-marker", "template-marker--text"];
        if (editable) classList.push("template-marker--draggable");
        if (dragField === key) classList.push("template-marker--active");
        return (
          <div
            key={key}
            className={classList.join(" ")}
            style={{
              left: `${resolvePercent(placement.x, "x")}%`,
              top: `${resolvePercent(placement.y, "y")}%`,
              transform: `translate(${translateX}%, -50%)`,
              fontFamily: placement.font_family || "Georgia",
              fontSize: `${fontSizePx}px`,
              color: placement.color || "#0f172a",
              letterSpacing: letterSpacingPx !== undefined ? `${letterSpacingPx}px` : undefined,
              lineHeight: placement.line_height || 1.2,
              fontWeight: placement.font_weight || 600,
              textTransform: placement.uppercase ? "uppercase" : "none",
              textAlign: alignment,
              pointerEvents: editable ? "auto" : "none",
              textShadow: placement.text_shadow || "0 1px 2px rgba(15, 23, 42, 0.3)",
            }}
            onPointerDown={startDrag(key)}
          >
            <span className="template-marker__text">{sampleText}</span>
          </div>
        );
      })}
      {layout.qr && (
        <div
          className={`template-marker-qr${editable ? " template-marker-qr--draggable" : ""}`}
          style={{
            left: `${resolvePercent(layout.qr.x, "x")}%`,
            top: `${resolvePercent(layout.qr.y, "y")}%`,
            width: `${resolveQrSize(layout.qr.size)}%`,
            height: `${resolveQrSize(layout.qr.size)}%`,
            pointerEvents: editable ? "auto" : "none",
          }}
          onPointerDown={startDrag("qr")}
        >
          QR
        </div>
      )}
    </div>
  );
}

// LayoutControls Component
function LayoutControls({ layout, onChange, onAddField, onRemoveField }) {
  const [newFieldName, setNewFieldName] = useState("");
  const [showAddField, setShowAddField] = useState(false);

  const predefinedFields = ["name", "event", "date", "code", "qr"];
  const allFields = Object.keys(layout || {});
  const textFields = allFields.filter(key => !["qr"].includes(key));

  const fontOptions = [
    "Arial",
    "Times New Roman",
    "Georgia",
    "Palatino",
    "Garamond",
    "Bookman",
    "Courier New",
    "Verdana",
    "Helvetica",
    "Tahoma"
  ];

  const dispatchChange = (field, updates) => {
    if (!onChange) return;
    onChange(field, updates);
  };

  const handleAddNewField = () => {
    if (!newFieldName.trim()) {
      alert("Please enter a field name");
      return;
    }
    
    const fieldKey = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    
    if (allFields.includes(fieldKey)) {
      alert("This field already exists");
      return;
    }
    
    if (onAddField) {
      onAddField(fieldKey);
    }
    
    setNewFieldName("");
    setShowAddField(false);
  };

  const handleRemoveField = (fieldKey) => {
    if (predefinedFields.includes(fieldKey)) {
      if (!confirm(`Remove the "${fieldKey}" field from the certificate?`)) {
        return;
      }
    }
    
    if (onRemoveField) {
      onRemoveField(fieldKey);
    }
  };

  return (
    <div className="layout-controls-sidebar" style={{ maxHeight: "600px", overflowY: "auto" }}>
      <h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }}>
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        Layout Designer
      </h3>
      
      <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--primary-light)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--primary)" }}>
        {!showAddField ? (
          <button
            onClick={() => setShowAddField(true)}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.625rem", fontSize: "0.875rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Add Custom Field
          </button>
        ) : (
          <div>
            <label style={{ fontSize: "0.75rem", marginBottom: "0.5rem", display: "block", fontWeight: "600", color: "var(--text-main)" }}>
              New Field Name
            </label>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="e.g., Department, Grade"
              className="input"
              style={{ padding: "0.625rem", fontSize: "0.875rem", marginBottom: "0.5rem", width: "100%" }}
              onKeyDown={(e) => e.key === "Enter" && handleAddNewField()}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleAddNewField}
                className="btn btn-success"
                style={{ flex: 1, padding: "0.5rem", fontSize: "0.75rem" }}
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddField(false); setNewFieldName(""); }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: "0.5rem", fontSize: "0.75rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {textFields.map((key) => {
        const placement = layout[key] || {};
        const isCustomField = !predefinedFields.includes(key);
        
        return (
          <div className="field-control-item" key={key}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <h4 style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, fontWeight: "700", color: "var(--text-main)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)" }}></div>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                {isCustomField && <span style={{ fontSize: "0.625rem", background: "var(--secondary-light)", color: "var(--secondary)", padding: "0.125rem 0.375rem", borderRadius: "4px", fontWeight: "700" }}>CUSTOM</span>}
              </h4>
              <button
                onClick={() => handleRemoveField(key)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--danger)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: "600"
                }}
                title="Remove field"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", marginBottom: "0.375rem", display: "block" }}>Font Size</label>
                <input
                  type="number"
                  style={{ padding: "0.5rem", fontSize: "0.8125rem" }}
                  value={placement.font_size ?? ""}
                  placeholder="24"
                  onChange={(e) => dispatchChange(key, { font_size: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", marginBottom: "0.375rem", display: "block" }}>Align</label>
                <select
                  style={{ padding: "0.5rem", fontSize: "0.8125rem" }}
                  value={placement.align || "center"}
                  onChange={(e) => dispatchChange(key, { align: e.target.value })}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.75rem", marginBottom: "0.375rem", display: "block" }}>Font Family</label>
              <select
                style={{ padding: "0.5rem", fontSize: "0.8125rem", width: "100%" }}
                value={placement.font_family || "Arial"}
                onChange={(e) => dispatchChange(key, { font_family: e.target.value })}
              >
                {fontOptions.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", marginBottom: "0.375rem", display: "block" }}>Text Color</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="color"
                  value={placement.color || "#000000"}
                  onChange={(e) => dispatchChange(key, { color: e.target.value })}
                  style={{ width: "50px", height: "36px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                />
                <input
                  type="text"
                  value={placement.color || "#000000"}
                  onChange={(e) => dispatchChange(key, { color: e.target.value })}
                  placeholder="#000000"
                  style={{ flex: 1, padding: "0.5rem", fontSize: "0.8125rem", fontFamily: "monospace" }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {layout.qr && (
        <div className="template-control-card" style={{ padding: "1rem" }}>
          <h4 style={{ fontSize: "0.8125rem", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--text-main)" }}></div>
            QR Code
          </h4>
          <label style={{ fontSize: "0.75rem", marginBottom: "0.5rem", display: "block" }}>
            Size: {layout.qr?.size ? Math.round(layout.qr.size * 100) : 15}%
          </label>
          <input
            type="range"
            min={5}
            max={35}
            value={layout.qr?.size ? layout.qr.size * 100 : 15}
            onChange={(e) => dispatchChange("qr", { size: Number(e.target.value) / 100 })}
            style={{ width: "100%", accentColor: "var(--primary)" }}
          />
        </div>
      )}
    </div>
  );
}
