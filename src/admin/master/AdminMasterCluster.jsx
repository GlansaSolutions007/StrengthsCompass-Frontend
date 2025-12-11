import React, { useEffect, useState } from "react";
import apiClient from "../../config/api";
import { useNavigate } from "react-router-dom";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiCollection,
  HiEye,
  HiSearch,
} from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

export default function AdminMasterCluster() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    short_code: "",
    description: "",
    high_behaviour: "",
    medium_behaviour: "",
    low_behaviour: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    name: "",
    short_code: "",
    description: "",
    high_behaviour: "",
    medium_behaviour: "",
    low_behaviour: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    cluster: null,
  });
  const [actionLoading, setActionLoading] = useState({
    create: false,
    update: false,
    delete: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isClosingForm, setIsClosingForm] = useState(false);
  const [isClosingView, setIsClosingView] = useState(false);
  const [isClosingEdit, setIsClosingEdit] = useState(false);

  const fetchClusters = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const response = await apiClient.get("/clusters");

      if (response.data?.status && response.data.data) {
        setItems(
          response.data.data.map((c) => ({
            id: c.id,
            name: c.name || "",
            short_code: c.short_code || "",
            description: c.description || "",
            high_behaviour: c.high_behaviour || "",
            medium_behaviour: c.medium_behaviour || "",
            low_behaviour: c.low_behaviour || "",
          }))
        );
        setError(null);
      } else {
        setError("Failed to load clusters");
      }
    } catch (err) {
      console.error("Error fetching clusters:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setError("Session expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load clusters. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [navigate]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleEditChange = (field, value) => {
    setEditingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      short_code: "",
      description: "",
      high_behaviour: "",
      medium_behaviour: "",
      low_behaviour: "",
    });
    setFieldErrors({});
  };

  const closeForm = () => {
    setIsClosingForm(true);
    setTimeout(() => {
      setIsClosingForm(false);
      resetForm();
      setShowForm(false);
    }, 220);
  };

  const closeViewModal = () => {
    setIsClosingView(true);
    setTimeout(() => {
      setIsClosingView(false);
      setViewModal({ isOpen: false, cluster: null });
    }, 220);
  };

  const closeEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setEditingId(null);
      setEditingData({
        name: "",
        short_code: "",
        description: "",
        high_behaviour: "",
        medium_behaviour: "",
        low_behaviour: "",
      });
    }, 220);
  };

  const add = async () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Cluster name is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setActionLoading({ ...actionLoading, create: true });
    try {
      const payload = {
        name: formData.name.trim(),
        short_code: formData.short_code.trim() || undefined,
        description: formData.description.trim() || undefined,
        high_behaviour: formData.high_behaviour.trim() || undefined,
        medium_behaviour: formData.medium_behaviour.trim() || undefined,
        low_behaviour: formData.low_behaviour.trim() || undefined,
      };

      const response = await apiClient.post("/clusters", payload);

      if (response.data?.status && response.data.data) {
        const newCluster = response.data.data;
        setItems([
          ...items,
          {
            id: newCluster.id,
            name: newCluster.name || "",
            short_code: newCluster.short_code || "",
            description: newCluster.description || "",
            high_behaviour: newCluster.high_behaviour || "",
            medium_behaviour: newCluster.medium_behaviour || "",
            low_behaviour: newCluster.low_behaviour || "",
          },
        ]);
        resetForm();
        setShowForm(false);
        setError(null);
        setSuccess("Cluster created successfully!");
        const totalPages = Math.ceil((items.length + 1) / itemsPerPage);
        setCurrentPage(totalPages);
      } else {
        setError(response.data?.message || "Failed to create cluster");
      }
    } catch (err) {
      console.error("Error creating cluster:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to create cluster. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, create: false });
    }
  };

  const save = async (id) => {
    if (!editingData.name.trim()) {
      setValidationError(
        "Cluster name is required. Please enter a cluster name."
      );
      return;
    }

    setValidationError(null);
    setActionLoading({ ...actionLoading, update: true });
    try {
      const payload = {
        name: editingData.name.trim(),
        short_code: editingData.short_code.trim() || undefined,
        description: editingData.description.trim() || undefined,
        high_behaviour: editingData.high_behaviour.trim() || undefined,
        medium_behaviour: editingData.medium_behaviour.trim() || undefined,
        low_behaviour: editingData.low_behaviour.trim() || undefined,
      };

      const response = await apiClient.put(`/clusters/${id}`, payload);

      if (response.data?.status && response.data.data) {
        const updatedCluster = response.data.data;
        setItems(
          items.map((item) =>
            item.id === id
              ? {
                  id: updatedCluster.id,
                  name: updatedCluster.name || "",
                  short_code: updatedCluster.short_code || "",
                  description: updatedCluster.description || "",
                  high_behaviour: updatedCluster.high_behaviour || "",
                  medium_behaviour: updatedCluster.medium_behaviour || "",
                  low_behaviour: updatedCluster.low_behaviour || "",
                }
              : item
          )
        );
        setEditingId(null);
        setEditingData({
          name: "",
          short_code: "",
          description: "",
        });
        setError(null);
        setSuccess("Cluster updated successfully!");
      } else {
        setError(response.data?.message || "Failed to update cluster");
      }
    } catch (err) {
      console.error("Error updating cluster:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to update cluster. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, update: false });
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const del = async () => {
    if (!deleteConfirm.id) return;

    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null, name: "" });
    setActionLoading({ ...actionLoading, delete: id });

    try {
      const response = await apiClient.delete(`/clusters/${id}`);

      if (
        response.data?.status ||
        response.status === 200 ||
        response.status === 204
      ) {
        const newItems = items.filter((item) => item.id !== id);
        setItems(newItems);
        setError(null);
        setSuccess("Cluster deleted successfully!");
        const totalPages = Math.ceil(newItems.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } else {
        setError(response.data?.message || "Failed to delete cluster");
      }
    } catch (err) {
      console.error("Error deleting cluster:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete cluster. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  // Filter by search query
  const filtered = searchQuery.trim()
    ? items.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          item.name?.toLowerCase().includes(searchLower) ||
          item.short_code?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        );
      })
    : items;

  // Check if all items on current page are selected
  const currentPageItems = filtered
    .slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
    .map((item) => item.id);
  const allCurrentPageSelected =
    currentPageItems.length > 0 &&
    currentPageItems.every((id) => selectedItems.includes(id));

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems((prev) => [...new Set([...prev, ...currentPageItems])]);
    } else {
      setSelectedItems((prev) =>
        prev.filter((id) => !currentPageItems.includes(id))
      );
    }
  };

  // Handle individual item selection
  const handleItemSelect = (id, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  // Delete selected items
  const deleteSelected = async () => {
    if (selectedItems.length === 0) return;

    const idsToDelete = [...selectedItems];
    setActionLoading({ ...actionLoading, delete: "bulk" });
    try {
      const deletePromises = idsToDelete.map((id) =>
        apiClient.delete(`/clusters/${id}`)
      );
      await Promise.all(deletePromises);

      const newItems = items.filter((item) => !idsToDelete.includes(item.id));
      setItems(newItems);
      setSelectedItems([]);
      setError(null);
      setSuccess(`${idsToDelete.length} cluster(s) deleted successfully!`);

      const totalPages = Math.ceil(newItems.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error("Error deleting clusters:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete some clusters. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  return (
    <div className="neutral-text bg-white min-h-screen p-4 md:p-8">
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title="Error"
        message={error || ""}
      />
      <AlertModal
        isOpen={!!success}
        onClose={() => setSuccess(null)}
        type="success"
        title="Success"
        message={success || ""}
        autoClose={3000}
      />
      <AlertModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: "" })}
        type="warning"
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
      >
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() =>
              setDeleteConfirm({ isOpen: false, id: null, name: "" })
            }
            className="btn btn-primary text-sm"
          >
            Cancel
          </button>
          <button
            onClick={del}
            disabled={actionLoading.delete}
            className="btn btn-danger"
          >
            {actionLoading.delete ? "Deleting..." : "Delete"}
          </button>
        </div>
      </AlertModal>

      {/* Add New Cluster Modal */}
      {(showForm || isClosingForm) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingForm ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            onClick={closeForm}
          />
          <div 
            className={`relative rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingForm ? "animate-modal-out" : "animate-modal-in"
            }`}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="p-6 primary-bg-light">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  Create New Cluster
                </h3>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >
              {Object.keys(fieldErrors).length > 0 && (
                <div className="mb-4 p-3 bg-danger-bg-light border border-danger-border-light rounded-lg">
                  <p className="danger-text text-sm">
                    Please fix the errors below before submitting.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Name <span className="danger-text">*</span>
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Enter cluster name"
                    disabled={actionLoading.create}
                    className={`input w-full ${fieldErrors.name ? "input-error" : ""}`}
                  />
                  {fieldErrors.name && (
                    <p className="danger-text text-xs mt-1.5">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Short Code
                  </label>
                  <input
                    value={formData.short_code}
                    onChange={(e) =>
                      handleFormChange("short_code", e.target.value.toUpperCase())
                    }
                    placeholder="e.g., CLUSTER1"
                    disabled={actionLoading.create}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    placeholder="Enter description"
                    disabled={actionLoading.create}
                    rows="3"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    High Behaviour
                  </label>
                  <textarea
                    value={formData.high_behaviour}
                    onChange={(e) =>
                      handleFormChange("high_behaviour", e.target.value)
                    }
                    placeholder="Describe high behaviour"
                    disabled={actionLoading.create}
                    rows="3"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Medium Behaviour
                  </label>
                  <textarea
                    value={formData.medium_behaviour}
                    onChange={(e) =>
                      handleFormChange("medium_behaviour", e.target.value)
                    }
                    placeholder="Describe medium behaviour"
                    disabled={actionLoading.create}
                    rows="3"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Low Behaviour
                  </label>
                  <textarea
                    value={formData.low_behaviour}
                    onChange={(e) =>
                      handleFormChange("low_behaviour", e.target.value)
                    }
                    placeholder="Describe low behaviour"
                    disabled={actionLoading.create}
                    rows="3"
                    className="input w-full"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeForm}
                    disabled={actionLoading.create}
                    className="btn btn-primary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={add}
                    disabled={actionLoading.create}
                    className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                  >
                    {actionLoading.create ? (
                      <>
                        <span className="spinner spinner-sm mr-2"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <HiPlus className="w-4 h-4 mr-2" /> Add Cluster
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes modal-out {
              from {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              to {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
              }
            }
            @keyframes backdrop-out {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
            .animate-modal-out {
              animation: modal-out 220ms ease-in forwards;
            }
            .animate-backdrop-out {
              animation: backdrop-out 220ms ease-in forwards;
            }
          `}</style>
        </div>
      )}

      {/* View Modal */}
      {(viewModal.isOpen || isClosingView) && viewModal.cluster && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingView ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            onClick={closeViewModal}
          />
          <div 
            className={`relative rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingView ? "animate-modal-out" : "animate-modal-in"
            }`}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="p-6 primary-bg-light">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  View Cluster Details
                </h3>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Name
                  </label>
                  <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                    {viewModal.cluster.name || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Short Code
                  </label>
                  <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200 font-mono">
                    {viewModal.cluster.short_code || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Description
                  </label>
                  <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                    {viewModal.cluster.description || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    High Behaviour
                  </label>
                  <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                    {viewModal.cluster.high_behaviour ?? "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Medium Behaviour
                  </label>
                  <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                    {viewModal.cluster.medium_behaviour ?? "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Low Behaviour
                  </label>
                  <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                    {viewModal.cluster.low_behaviour ?? "N/A"}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeViewModal}
                    className="btn btn-primary text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeViewModal();
                      setTimeout(() => {
                        setEditingId(viewModal.cluster.id);
                        setEditingData({
                          name: viewModal.cluster.name || "",
                          short_code: viewModal.cluster.short_code || "",
                          description: viewModal.cluster.description || "",
                          high_behaviour: viewModal.cluster.high_behaviour || "",
                          medium_behaviour: viewModal.cluster.medium_behaviour || "",
                          low_behaviour: viewModal.cluster.low_behaviour || "",
                        });
                      }, 220);
                    }}
                    className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                  >
                    <HiPencil className="w-4 h-4 mr-2" /> Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes modal-out {
              from {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              to {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
              }
            }
            @keyframes backdrop-out {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
            .animate-modal-out {
              animation: modal-out 220ms ease-in forwards;
            }
            .animate-backdrop-out {
              animation: backdrop-out 220ms ease-in forwards;
            }
          `}</style>
        </div>
      )}

      {/* Edit Modal */}
      {(editingId || isClosingEdit) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingEdit ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            onClick={closeEditModal}
          />
          <div 
            className={`relative rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingEdit ? "animate-modal-out" : "animate-modal-in"
            }`}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="p-6 primary-bg-light">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">Edit Cluster</h3>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >
              {validationError && (
                <div className="mb-4 p-3 bg-danger-bg-light border border-danger-border-light rounded-lg">
                  <p className="danger-text text-sm">{validationError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Name <span className="danger-text">*</span>
                  </label>
                  <input
                    value={editingData.name}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                    placeholder="Enter cluster name"
                    disabled={actionLoading.update}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Short Code
                  </label>
                  <input
                    value={editingData.short_code}
                    onChange={(e) =>
                      handleEditChange("short_code", e.target.value.toUpperCase())
                    }
                    placeholder="e.g., CLUSTER1"
                    disabled={actionLoading.update}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingData.description}
                    onChange={(e) => handleEditChange("description", e.target.value)}
                    placeholder="Enter description"
                    disabled={actionLoading.update}
                    rows="3"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    High Behaviour
                  </label>
                  <textarea
                    value={editingData.high_behaviour}
                    onChange={(e) =>
                      handleEditChange("high_behaviour", e.target.value)
                    }
                    placeholder="Describe high behaviour"
                    disabled={actionLoading.update}
                    rows="3"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Medium Behaviour
                  </label>
                  <textarea
                    value={editingData.medium_behaviour}
                    onChange={(e) =>
                      handleEditChange("medium_behaviour", e.target.value)
                    }
                    placeholder="Describe medium behaviour"
                    disabled={actionLoading.update}
                    rows="3"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Low Behaviour
                  </label>
                  <textarea
                    value={editingData.low_behaviour}
                    onChange={(e) =>
                      handleEditChange("low_behaviour", e.target.value)
                    }
                    placeholder="Describe low behaviour"
                    disabled={actionLoading.update}
                    rows="3"
                    className="input w-full"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeEditModal}
                    disabled={actionLoading.update}
                    className="btn btn-primary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => save(editingId)}
                    disabled={actionLoading.update}
                    className="btn btn-accent shadow-md"
                  >
                    {actionLoading.update ? (
                      <>
                        <span className="spinner spinner-sm mr-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-4 h-4 mr-2" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes modal-out {
              from {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              to {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
              }
            }
            @keyframes backdrop-out {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
            .animate-modal-out {
              animation: modal-out 220ms ease-in forwards;
            }
            .animate-backdrop-out {
              animation: backdrop-out 220ms ease-in forwards;
            }
          `}</style>
        </div>
      )}

      {/* Header and Add Button in one row */}
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold neutral-text">Manage Clusters</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }} 
            className="btn btn-secondary"
          >
            <HiPlus className="w-4 h-4 mr-2 black-text" /> Add New Cluster
          </button>
        </div>

        {/* Search and Bulk Actions */}
        <div className="mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <div className="group flex w-full rounded-md overflow-hidden border border-neutral-300 transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary">
              {/* Left Icon Box */}
              <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
                <HiSearch className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>

              {/* Input Field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, short code, or description..."
                className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
              />
              
              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex items-center justify-center px-3 hover:bg-secondary-bg-light transition-colors"
                  title="Clear search"
                >
                  <HiX className="w-4 h-4 neutral-text-muted" />
                </button>
              )}
            </div>
          </div>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm neutral-text-muted">
                {selectedItems.length} selected
              </span>
              <button
                onClick={deleteSelected}
                disabled={actionLoading.delete === "bulk"}
                className="btn btn-danger btn-sm"
              >
                {actionLoading.delete === "bulk" ? (
                  <>
                    <span className="spinner spinner-sm mr-2"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <HiTrash className="w-4 h-4 mr-2" /> Delete Selected
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Clusters List Section - Simple */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="spinner spinner-lg mb-3"></span>
            <p className="text-sm neutral-text-muted">Loading clusters...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 primary-bg-light rounded-lg mb-3">
              <HiCollection className="w-6 h-6 primary-text" />
            </div>
            <h3 className="text-base font-semibold neutral-text mb-1">
              No clusters yet
            </h3>
            <p className="text-sm neutral-text-muted text-center">
              {searchQuery
                ? "No clusters match your search."
                : "Create your first cluster above to get started."}
            </p>
          </div>
        ) : (
          <>
            {/* Table - Simple and Clean */}
            <div className="overflow-x-auto rounded-lg border border-neutral-border-light">
              <table className="table">
                <thead>
                  <tr className="bg-medium border-b border-neutral-border-light">
                    <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted"
                      style={{ width: "40px" }}
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={allCurrentPageSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="checkbox-custom"
                          title="Select all on this page"
                        />
                      </div>
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                      S.No
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                      Cluster
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden lg:table-cell">
                      Description
                    </th>
                    <th
                      className="font-semibold text-sm py-3 px-4 neutral-text-muted"
                      style={{ textAlign: "right" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((item, index) => {
                      const isEven = index % 2 === 0;
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-neutral-border-light ${isEven ? "bg-white" : "bg-gray-50"} ${isSelected ? "bg-blue-100" : ""} hover:bg-gray-100 transition-colors`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) =>
                                  handleItemSelect(item.id, e.target.checked)
                                }
                                className="checkbox-custom"
                                title="Select item"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 neutral-text-muted">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="py-3 px-4 neutral-text">
                            <div>
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                            
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell neutral-text">
                            <span className="text-sm line-clamp-1">
                              {item.description || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setViewModal({
                                    isOpen: true,
                                    cluster: item,
                                  });
                                }}
                                className="btn-view"
                                title="View"
                              >
                                <HiEye />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditingData({
                                    name: item.name || "",
                                    short_code: item.short_code || "",
                                    description: item.description || "",
                        high_behaviour: item.high_behaviour || "",
                        medium_behaviour: item.medium_behaviour || "",
                        low_behaviour: item.low_behaviour || "",
                                  });
                                }}
                                className="btn-edit"
                                title="Edit"
                              >
                                <HiPencil />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteClick(item.id, item.name)
                                }
                                disabled={actionLoading.delete === item.id}
                                className="btn-delete"
                                title="Delete"
                              >
                                {actionLoading.delete === item.id ? (
                                  <span className="spinner spinner-sm"></span>
                                ) : (
                                  <HiTrash />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination - Simple */}
            {filtered.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-border-light">
                <div className="text-xs neutral-text-muted">
                  Showing{" "}
                  <span className="font-medium neutral-text">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium neutral-text">
                    {Math.min(currentPage * itemsPerPage, filtered.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium neutral-text">
                    {filtered.length}
                  </span>{" "}
                  clusters
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="btn btn-ghost btn-sm"
                  >
                    <HiChevronLeft />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(filtered.length / itemsPerPage) },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        const totalPages = Math.ceil(
                          filtered.length / itemsPerPage
                        );
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                      })
                      .map((page, index, array) => {
                        const showEllipsisBefore =
                          index > 0 && array[index - 1] < page - 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-2 neutral-text-muted-dark">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`btn btn-sm ${
                                currentPage === page
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          Math.ceil(filtered.length / itemsPerPage),
                          prev + 1
                        )
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(filtered.length / itemsPerPage)
                    }
                    className="btn btn-ghost btn-sm"
                  >
                    Next
                    <HiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}
