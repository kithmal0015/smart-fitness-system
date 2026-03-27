import React, { useCallback, useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "ff_admin_token";

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(dataUrl, maxSize = 1080, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      let { width, height } = image;
      const largerSide = Math.max(width, height);

      if (largerSide > maxSize) {
        const ratio = maxSize / largerSide;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Image compression is not supported"));
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    image.onerror = () => reject(new Error("Failed to process image"));
    image.src = dataUrl;
  });
}

function normalizeItem(item) {
  return {
    _id: String((item && item._id) || ""),
    title: String((item && item.title) || "").trim(),
    subtitle: String((item && item.subtitle) || "").trim(),
    image: String((item && item.image) || "").trim(),
    displayOrder: Number((item && item.displayOrder) || 0),
    isActive: Boolean(item && item.isActive),
    updatedAt: item && item.updatedAt ? item.updatedAt : null,
  };
}

const initialForm = {
  title: "",
  subtitle: "",
  image: "",
  displayOrder: 0,
  isActive: true,
};

export default function Advertisements({ accent }) {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [formData, setFormData] = useState(initialForm);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Please sign in again");
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/advertisements`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to load advertisements");
      }

      const normalized = Array.isArray(data.items) ? data.items.map(normalizeItem) : [];
      setItems(normalized);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load advertisements");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const subtitle = String(item.subtitle || "").toLowerCase();
      return title.includes(query) || subtitle.includes(query);
    });
  }, [items, searchQuery]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId("");
    setIsEditMode(false);
  };

  const openAddModal = () => {
    setErrorMessage("");
    setNoticeMessage("");
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setErrorMessage("");
    setNoticeMessage("");
    setIsEditMode(true);
    setEditingId(String(item._id || ""));
    setFormData({
      title: item.title || "",
      subtitle: item.subtitle || "",
      image: item.image || "",
      displayOrder: Number(item.displayOrder || 0),
      isActive: Boolean(item.isActive),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openViewModal = (item) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (item) => {
    const itemTitle = item.title || "this advertisement";
    const confirmed = window.confirm(`Delete ${itemTitle}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setNoticeMessage("");

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/advertisements/${encodeURIComponent(String(item._id || ""))}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete advertisement");
      }

      setItems((prev) => prev.filter((row) => row._id !== item._id));
      setNoticeMessage(data.message || "Advertisement deleted successfully");
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete advertisement");
    }
  };

  const handleToggleActive = async (item) => {
    const itemId = String(item && item._id ? item._id : "");
    if (!itemId) {
      return;
    }

    setErrorMessage("");
    setNoticeMessage("");
    setTogglingId(itemId);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Please sign in again");
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/advertisements/${encodeURIComponent(itemId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: String(item.title || "").trim(),
          subtitle: String(item.subtitle || "").trim(),
          image: String(item.image || "").trim(),
          displayOrder: Number(item.displayOrder || 0),
          isActive: !Boolean(item.isActive),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to update advertisement visibility");
      }

      const normalized = normalizeItem(data.item || {});
      setItems((prev) => prev.map((row) => (row._id === normalized._id ? normalized : row)));
      setSelectedItem((prev) => (prev && prev._id === normalized._id ? normalized : prev));
      setNoticeMessage(normalized.isActive ? "Advertisement enabled successfully" : "Advertisement disabled successfully");
    } catch (error) {
      setErrorMessage(error.message || "Failed to update advertisement visibility");
    } finally {
      setTogglingId("");
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    setErrorMessage("");

    try {
      const rawData = await readFileAsDataUrl(file);
      const compressed = await compressImageDataUrl(rawData);
      setFormData((prev) => ({
        ...prev,
        image: compressed,
      }));
    } catch (error) {
      setErrorMessage(error.message || "Failed to process image");
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setNoticeMessage("");
    setIsSubmitting(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Please sign in again");
      }

      const title = String(formData.title || "").trim();
      const subtitle = String(formData.subtitle || "").trim();
      const image = String(formData.image || "").trim();
      const displayOrder = Number(formData.displayOrder || 0);

      if (!title || !image) {
        throw new Error("Title and image are required");
      }

      const endpoint = isEditMode
        ? `${API_BASE_URL}/api/admin/advertisements/${encodeURIComponent(editingId)}`
        : `${API_BASE_URL}/api/admin/advertisements`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          subtitle,
          image,
          displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
          isActive: Boolean(formData.isActive),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to save advertisement");
      }

      const normalized = normalizeItem(data.item || {});
      if (isEditMode) {
        setItems((prev) => prev.map((row) => (row._id === normalized._id ? normalized : row)));
      } else {
        setItems((prev) => [normalized, ...prev]);
      }

      setNoticeMessage(data.message || (isEditMode ? "Advertisement updated" : "Advertisement created"));
      closeModal();
    } catch (error) {
      setErrorMessage(error.message || "Failed to save advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #eef2f7",
        padding: 18,
        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Advertisements</h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 13 }}>Create, update, view, and delete mobile home advertisements.</p>
          </div>
          <button
            onClick={openAddModal}
            style={{
              background: accent,
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
              color: "#2d3a00",
            }}
          >
            + Add Advertisement
          </button>
        </div>

        <div style={{ marginTop: 14, position: "relative", maxWidth: 320 }}>
          <SearchIcon style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8", fontSize: 18 }} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title or subtitle"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "9px 10px 9px 34px",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {errorMessage ? (
        <div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>
          {errorMessage}
        </div>
      ) : null}
      {noticeMessage ? (
        <div style={{ background: "#ecfdf3", color: "#047857", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>
          {noticeMessage}
        </div>
      ) : null}

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eef2f7", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 20, color: "#64748b", fontWeight: 600 }}>Loading advertisements...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 20, color: "#64748b", fontWeight: 600 }}>No advertisements found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: "#334155" }}>Preview</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: "#334155" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: "#334155" }}>Subtitle</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: "#334155" }}>Order</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: "#334155" }}>Enable / Disable</th>
                  <th style={{ textAlign: "center", padding: "12px 14px", fontSize: 12, color: "#334155" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <img
                        src={item.image}
                        alt={item.title || "Advertisement"}
                        style={{ width: 72, height: 46, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }}
                      />
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{item.title || "-"}</td>
                    <td style={{ padding: "10px 14px", color: "#475569", fontSize: 13, maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.subtitle || "-"}</td>
                    <td style={{ padding: "10px 14px", color: "#334155", fontSize: 13 }}>{item.displayOrder}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        disabled={togglingId === item._id}
                        style={{
                          border: "none",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: togglingId === item._id ? "not-allowed" : "pointer",
                          background: item.isActive ? "#fee2e2" : "#dcfce7",
                          color: item.isActive ? "#b91c1c" : "#166534",
                          opacity: togglingId === item._id ? 0.7 : 1,
                        }}
                      >
                        {togglingId === item._id ? "Updating..." : (item.isActive ? "Disable" : "Enable")}
                      </button>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button onClick={() => openViewModal(item)} title="View" style={{ border: "1px solid #dbeafe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 8, width: 32, height: 32, cursor: "pointer" }}>
                          <RemoveRedEyeIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button onClick={() => openEditModal(item)} title="Edit" style={{ border: "1px solid #fde68a", background: "#fef9c3", color: "#a16207", borderRadius: 8, width: 32, height: 32, cursor: "pointer" }}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button onClick={() => handleDelete(item)} title="Delete" style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: 8, width: 32, height: 32, cursor: "pointer" }}>
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "min(680px, 100%)", background: "#fff", borderRadius: 16, padding: 18, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{isEditMode ? "Update Advertisement" : "Add Advertisement"}</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155" }}>Title</label>
                <input
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155" }}>Subtitle</label>
                <textarea
                  value={formData.subtitle}
                  onChange={(event) => setFormData((prev) => ({ ...prev, subtitle: event.target.value }))}
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 13, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155" }}>Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(event) => setFormData((prev) => ({ ...prev, displayOrder: Number(event.target.value || 0) }))}
                    style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
                  <input
                    id="ad-is-active"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  <label htmlFor="ad-is-active" style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Active in mobile app</label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155" }}>Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {formData.image ? (
                  <div style={{ marginTop: 10 }}>
                    <img src={formData.image} alt="Advertisement preview" style={{ width: 180, height: 110, objectFit: "cover", borderRadius: 10, border: "1px solid #dbeafe" }} />
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeModal} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ border: "none", background: accent, borderRadius: 10, padding: "9px 14px", fontWeight: 800, color: "#2d3a00", cursor: "pointer" }}>
                  {isSubmitting ? "Saving..." : (isEditMode ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isViewModalOpen && selectedItem ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "min(560px, 100%)", background: "#fff", borderRadius: 16, padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Advertisement Details</h3>
            <img src={selectedItem.image} alt={selectedItem.title || "Advertisement"} style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <div><strong>Title:</strong> {selectedItem.title || "-"}</div>
              <div><strong>Subtitle:</strong> {selectedItem.subtitle || "-"}</div>
              <div><strong>Display Order:</strong> {selectedItem.displayOrder}</div>
              <div><strong>Status:</strong> {selectedItem.isActive ? "Active" : "Inactive"}</div>
            </div>
            <div style={{ marginTop: 14, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedItem(null);
                }}
                style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
