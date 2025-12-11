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
  HiChevronDown,
  HiCollection,
  HiEye,
  HiSearch,
} from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

export default function AdminMasterConstruct() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [items, setItems] = useState([]);
  const [clusterId, setClusterId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    short_code: "",
    description: "",
    definition: "",
    high_behavior: "",
    medium_behavior: "",
    low_behavior: "",
    benefits: "",
    risks: "",
    coaching_applications: "",
    case_example: "",
    display_order: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    clusterId: "",
    name: "",
    short_code: "",
    description: "",
    definition: "",
    high_behavior: "",
    medium_behavior: "",
    low_behavior: "",
    benefits: "",
    risks: "",
    coaching_applications: "",
    case_example: "",
    display_order: "",
  });
  const [loading, setLoading] = useState(true);
  const [clustersLoading, setClustersLoading] = useState(true);
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
    construct: null,
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

  // Fetch clusters for dropdown
  const fetchClusters = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Authentication required. Please login.");
        setClustersLoading(false);
        return;
      }

      const response = await apiClient.get("/clusters");

      if (response.data?.status && response.data.data) {
        setClusters(
          response.data.data.map((c) => ({ id: c.id, name: c.name }))
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
      setClustersLoading(false);
    }
  };

  // Fetch constructs
  const fetchConstructs = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const response = await apiClient.get("/constructs");

      if (response.data?.status && response.data.data) {
        setItems(
          response.data.data.map((c) => ({
            id: c.id,
            name: c.name || "",
            short_code: c.short_code || "",
            description: c.description || "",
            definition: c.definition || "",
            high_behavior: c.high_behavior || "",
            medium_behavior: c.medium_behavior || "",
            low_behavior: c.low_behavior || "",
            benefits: c.benefits || "",
            risks: c.risks || "",
            coaching_applications: c.coaching_applications || "",
            case_example: c.case_example || "",
            display_order: c.display_order || "",
            clusterId: c.cluster_id || c.clusterId,
          }))
        );
        setError(null);
      } else {
        setError("Failed to load constructs");
      }
    } catch (err) {
      console.error("Error fetching constructs:", err);

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
            "Failed to load constructs. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [navigate]);

  useEffect(() => {
    fetchConstructs();
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
      definition: "",
      high_behavior: "",
      medium_behavior: "",
      low_behavior: "",
      benefits: "",
      risks: "",
      coaching_applications: "",
      case_example: "",
      display_order: "",
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
      setViewModal({ isOpen: false, construct: null });
    }, 220);
  };

  const closeEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setEditingId(null);
      setEditingData({
        clusterId: "",
        name: "",
        short_code: "",
        description: "",
        definition: "",
        high_behavior: "",
        medium_behavior: "",
        low_behavior: "",
        benefits: "",
        risks: "",
        coaching_applications: "",
        case_example: "",
        display_order: "",
      });
    }, 220);
  };

  const add = async () => {
    const errors = {};
    if (!clusterId) {
      errors.clusterId = "Cluster selection is required";
    }
    if (!formData.name.trim()) {
      errors.name = "Construct name is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setActionLoading({ ...actionLoading, create: true });
    try {
      const payload = {
        cluster_id: clusterId,
        name: formData.name.trim(),
        short_code: formData.short_code.trim() || undefined,
        description: formData.description.trim() || undefined,
        definition: formData.definition.trim() || undefined,
        high_behavior: formData.high_behavior.trim() || undefined,
        medium_behavior: formData.medium_behavior.trim() || undefined,
        low_behavior: formData.low_behavior.trim() || undefined,
        benefits: formData.benefits.trim() || undefined,
        risks: formData.risks.trim() || undefined,
        coaching_applications: formData.coaching_applications.trim() || undefined,
        case_example: formData.case_example.trim() || undefined,
        display_order: formData.display_order ? parseInt(formData.display_order) : undefined,
      };

      const response = await apiClient.post("/constructs", payload);

      if (response.data?.status && response.data.data) {
        const newConstruct = response.data.data;
        setItems([
          ...items,
          {
            id: newConstruct.id,
            name: newConstruct.name || "",
            short_code: newConstruct.short_code || "",
            description: newConstruct.description || "",
            definition: newConstruct.definition || "",
            high_behavior: newConstruct.high_behavior || "",
            medium_behavior: newConstruct.medium_behavior || "",
            low_behavior: newConstruct.low_behavior || "",
            benefits: newConstruct.benefits || "",
            risks: newConstruct.risks || "",
            coaching_applications: newConstruct.coaching_applications || "",
            case_example: newConstruct.case_example || "",
            display_order: newConstruct.display_order || "",
            clusterId: newConstruct.cluster_id || newConstruct.clusterId,
          },
        ]);
        resetForm();
        setShowForm(false);
        setError(null);
        setSuccess("Construct created successfully!");
        // Reset to last page if needed
        const totalPages = Math.ceil((items.length + 1) / itemsPerPage);
        setCurrentPage(totalPages);
      } else {
        setError(response.data?.message || "Failed to create construct");
      }
    } catch (err) {
      console.error("Error creating construct:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to create construct. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, create: false });
    }
  };

  const save = async (id) => {
    if (!editingData.name.trim()) {
      setValidationError("Construct name is required. Please enter a construct name.");
      return;
    }

    setValidationError(null);
    setActionLoading({ ...actionLoading, update: true });
    try {
      const payload = {
        cluster_id: editingData.clusterId ? parseInt(editingData.clusterId) : undefined,
        name: editingData.name.trim(),
        short_code: editingData.short_code.trim() || undefined,
        description: editingData.description.trim() || undefined,
        definition: editingData.definition.trim() || undefined,
        high_behavior: editingData.high_behavior.trim() || undefined,
        medium_behavior: editingData.medium_behavior.trim() || undefined,
        low_behavior: editingData.low_behavior.trim() || undefined,
        benefits: editingData.benefits.trim() || undefined,
        risks: editingData.risks.trim() || undefined,
        coaching_applications: editingData.coaching_applications.trim() || undefined,
        case_example: editingData.case_example.trim() || undefined,
        display_order: editingData.display_order ? parseInt(editingData.display_order) : undefined,
      };

      const response = await apiClient.put(`/constructs/${id}`, payload);

      if (response.data?.status && response.data.data) {
        const updatedConstruct = response.data.data;
        setItems(
          items.map((item) =>
            item.id === id
              ? {
                  id: updatedConstruct.id,
                  name: updatedConstruct.name || "",
                  short_code: updatedConstruct.short_code || "",
                  description: updatedConstruct.description || "",
                  definition: updatedConstruct.definition || "",
                  high_behavior: updatedConstruct.high_behavior || "",
                  medium_behavior: updatedConstruct.medium_behavior || "",
                  low_behavior: updatedConstruct.low_behavior || "",
                  benefits: updatedConstruct.benefits || "",
                  risks: updatedConstruct.risks || "",
                  coaching_applications: updatedConstruct.coaching_applications || "",
                  case_example: updatedConstruct.case_example || "",
                  display_order: updatedConstruct.display_order || "",
                  clusterId: updatedConstruct.cluster_id || updatedConstruct.clusterId,
                }
              : item
          )
        );
        setEditingId(null);
        setEditingData({
          clusterId: "",
          name: "",
          short_code: "",
          description: "",
          definition: "",
          high_behavior: "",
          medium_behavior: "",
          low_behavior: "",
          benefits: "",
          risks: "",
          coaching_applications: "",
          case_example: "",
          display_order: "",
        });
        setError(null);
        setSuccess("Construct updated successfully!");
      } else {
        setError(response.data?.message || "Failed to update construct");
      }
    } catch (err) {
      console.error("Error updating construct:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to update construct. Please try again."
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
      const response = await apiClient.delete(`/constructs/${id}`);

      if (
        response.data?.status ||
        response.status === 200 ||
        response.status === 204
      ) {
        const newItems = items.filter((item) => item.id !== id);
        setItems(newItems);
        setError(null);
        setSuccess("Construct deleted successfully!");
        // Adjust page if current page becomes empty
        const totalPages = Math.ceil(newItems.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } else {
        setError(response.data?.message || "Failed to delete construct");
      }
    } catch (err) {
      console.error("Error deleting construct:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete construct. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  // Filter constructs by selected cluster, or show all if no cluster selected
  const clusterFiltered = clusterId
    ? items.filter((i) => {
        const itemClusterId = i.clusterId || i.cluster_id;
        return (
          itemClusterId === clusterId ||
          itemClusterId === parseInt(clusterId) ||
          itemClusterId === clusterId.toString()
        );
      })
    : items;

  // Filter by search query
  const filtered = searchQuery.trim()
    ? clusterFiltered.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          item.name?.toLowerCase().includes(searchLower) ||
          item.short_code?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          clusters.find(
            (c) =>
              c.id === item.clusterId ||
              c.id === parseInt(item.clusterId)
          )?.name?.toLowerCase().includes(searchLower)
        );
      })
    : clusterFiltered;

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
        apiClient.delete(`/constructs/${id}`)
      );
      await Promise.all(deletePromises);

      const newItems = items.filter((item) => !idsToDelete.includes(item.id));
      setItems(newItems);
      setSelectedItems([]);
      setError(null);
      setSuccess(`${idsToDelete.length} construct(s) deleted successfully!`);

      // Adjust page if current page becomes empty
      const totalPages = Math.ceil(newItems.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error("Error deleting constructs:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete some constructs. Please try again."
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
        <div className="mt-6 flex justify-end gap-3">
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

      {/* Add New Construct Modal */}
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
            <div 
              className="p-6 primary-bg-light"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">Create New Construct</h3>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >
              {Object.keys(fieldErrors).length > 0 && (
                <div className="mb-4 p-3 bg-danger-bg-light border border-danger-border-light rounded-lg">
                  <p className="danger-text text-sm">Please fix the errors below before submitting.</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Cluster <span className="danger-text">*</span>
            </label>
                    <div className="relative">
                      <select
                        value={clusterId}
                        onChange={(e) => {
                          setClusterId(e.target.value);
                          if (fieldErrors.clusterId) {
                            setFieldErrors({ ...fieldErrors, clusterId: "" });
                          }
                        }}
                        disabled={clustersLoading || actionLoading.create}
                        className={`input ${fieldErrors.clusterId ? "input-error" : ""}`}
                      >
                        {clustersLoading ? (
                          <option value="" disabled>
                            Loading clusters...
                          </option>
                        ) : clusters.length === 0 ? (
                          <option value="" disabled>
                            No clusters available
                          </option>
                        ) : (
                          <>
                            {!clusterId && (
                              <option value="" disabled hidden>
                                Select a cluster
                              </option>
                            )}
                            {clusters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                    </div>
                  {fieldErrors.clusterId && (
                      <p className="danger-text text-xs mt-1.5">{fieldErrors.clusterId}</p>
                  )}
                </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Name <span className="danger-text">*</span>
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      placeholder="Enter construct name"
                      disabled={actionLoading.create}
                      className={`input ${fieldErrors.name ? "input-error" : ""}`}
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
                      onChange={(e) => handleFormChange("short_code", e.target.value.toUpperCase())}
                      placeholder="e.g., COOP"
                      disabled={actionLoading.create}
                      className="input"
                    />
                  </div>

                  

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange("description", e.target.value)}
                      placeholder="Enter description"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Definition
                    </label>
                    <textarea
                      value={formData.definition}
                      onChange={(e) => handleFormChange("definition", e.target.value)}
                      placeholder="Enter definition"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      High Behavior
                    </label>
                    <textarea
                      value={formData.high_behavior}
                      onChange={(e) => handleFormChange("high_behavior", e.target.value)}
                      placeholder="Enter high behavior description"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Medium Behavior
                    </label>
                    <textarea
                      value={formData.medium_behavior}
                      onChange={(e) => handleFormChange("medium_behavior", e.target.value)}
                      placeholder="Enter medium behavior description"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Low Behavior
                    </label>
                    <textarea
                      value={formData.low_behavior}
                      onChange={(e) => handleFormChange("low_behavior", e.target.value)}
                      placeholder="Enter low behavior description"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Benefits
                    </label>
                    <textarea
                      value={formData.benefits}
                      onChange={(e) => handleFormChange("benefits", e.target.value)}
                      placeholder="Enter benefits"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Risks
                    </label>
                    <textarea
                      value={formData.risks}
                      onChange={(e) => handleFormChange("risks", e.target.value)}
                      placeholder="Enter risks"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Coaching Applications
                    </label>
                    <textarea
                      value={formData.coaching_applications}
                      onChange={(e) => handleFormChange("coaching_applications", e.target.value)}
                      placeholder="Enter coaching applications"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Case Example
                    </label>
                    <textarea
                      value={formData.case_example}
                      onChange={(e) => handleFormChange("case_example", e.target.value)}
                      placeholder="Enter case example"
                      disabled={actionLoading.create}
                      rows="2"
                      className="input"
                    />
                  </div>
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
                        <HiPlus className="w-4 h-4 mr-2" /> Add Construct
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
      {(viewModal.isOpen || isClosingView) && viewModal.construct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
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
            <div 
              className="p-6 primary-bg-light"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">View Construct Details</h3>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Name
            </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      {viewModal.construct.name || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Short Code
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200 font-mono">
                      {viewModal.construct.short_code || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Description
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.description || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Definition
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.definition || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      High Behavior
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.high_behavior || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Medium Behavior
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.medium_behavior || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Low Behavior
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.low_behavior || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Benefits
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.benefits || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Risks
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.risks || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Coaching Applications
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.coaching_applications || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Case Example
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.construct.case_example || "N/A"}
                    </div>
                  </div>

                  

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Cluster
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      {clusters.find(
                        (c) =>
                          c.id === viewModal.construct.clusterId ||
                          c.id === parseInt(viewModal.construct.clusterId)
                      )?.name || "N/A"}
                    </div>
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
                        setEditingId(viewModal.construct.id);
                        setEditingData({
                          clusterId: viewModal.construct.clusterId || viewModal.construct.cluster_id || "",
                          name: viewModal.construct.name || "",
                          short_code: viewModal.construct.short_code || "",
                          description: viewModal.construct.description || "",
                          definition: viewModal.construct.definition || "",
                          high_behavior: viewModal.construct.high_behavior || "",
                          medium_behavior: viewModal.construct.medium_behavior || "",
                          low_behavior: viewModal.construct.low_behavior || "",
                          benefits: viewModal.construct.benefits || "",
                          risks: viewModal.construct.risks || "",
                          coaching_applications: viewModal.construct.coaching_applications || "",
                          case_example: viewModal.construct.case_example || "",
                          display_order: viewModal.construct.display_order || "",
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
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
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
            <div 
              className="p-6 primary-bg-light"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">Edit Construct</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Cluster <span className="danger-text">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={editingData.clusterId}
                        onChange={(e) => handleEditChange("clusterId", e.target.value)}
                        disabled={clustersLoading}
                        className="input appearance-none pr-10"
                      >
                        {clustersLoading ? (
                          <option value="" disabled>
                            Loading clusters...
                          </option>
                        ) : clusters.length === 0 ? (
                          <option value="" disabled>
                            No clusters available
                          </option>
                        ) : (
                          <>
                            {!editingData.clusterId && (
                              <option value="" disabled hidden>
                                Select a cluster
                              </option>
                            )}
                            {clusters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Name <span className="danger-text">*</span>
                    </label>
                    <input
                      value={editingData.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Enter construct name"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Short Code
                    </label>
                    <input
                      value={editingData.short_code}
                      onChange={(e) => handleEditChange("short_code", e.target.value.toUpperCase())}
                      placeholder="e.g., COOP"
                      className="input"
                    />
                  </div>

                 

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingData.description}
                      onChange={(e) => handleEditChange("description", e.target.value)}
                      placeholder="Enter description"
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Definition
                    </label>
                    <textarea
                      value={editingData.definition}
                      onChange={(e) => handleEditChange("definition", e.target.value)}
                      placeholder="Enter definition"
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      High Behavior
                    </label>
                    <textarea
                      value={editingData.high_behavior}
                      onChange={(e) => handleEditChange("high_behavior", e.target.value)}
                      placeholder="Enter high behavior description"
                      rows="2"
                      className="input"
                    />
                  </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Medium Behavior
                  </label>
                  <textarea
                    value={editingData.medium_behavior}
                    onChange={(e) => handleEditChange("medium_behavior", e.target.value)}
                    placeholder="Enter medium behavior description"
                    rows="2"
                    className="input"
                  />
                </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Low Behavior
                    </label>
                    <textarea
                      value={editingData.low_behavior}
                      onChange={(e) => handleEditChange("low_behavior", e.target.value)}
                      placeholder="Enter low behavior description"
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Benefits
                    </label>
                    <textarea
                      value={editingData.benefits}
                      onChange={(e) => handleEditChange("benefits", e.target.value)}
                      placeholder="Enter benefits"
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Risks
                    </label>
                    <textarea
                      value={editingData.risks}
                      onChange={(e) => handleEditChange("risks", e.target.value)}
                      placeholder="Enter risks"
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Coaching Applications
                    </label>
                    <textarea
                      value={editingData.coaching_applications}
                      onChange={(e) => handleEditChange("coaching_applications", e.target.value)}
                      placeholder="Enter coaching applications"
                      rows="2"
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Case Example
                    </label>
                    <textarea
                      value={editingData.case_example}
                      onChange={(e) => handleEditChange("case_example", e.target.value)}
                      placeholder="Enter case example"
                      rows="2"
                      className="input"
                    />
                  </div>

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
          <h1 className="text-2xl font-bold neutral-text">Manage Constructs</h1>
          <button
            onClick={() => {
              console.log("Add New button clicked");
              resetForm();
              setShowForm(true);
              console.log("showForm set to:", true);
            }}
            className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
          >
            <HiPlus className="w-4 h-4 black-text mr-2" /> Add New Construct
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
                  setCurrentPage(1); // Reset to first page on search
                }}
                placeholder="Search by name, short code, description, or cluster..."
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

        {/* Constructs List Section - Simple */}
        {clustersLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="spinner spinner-lg mb-3"></span>
            <p className="text-sm neutral-text-muted">Loading clusters...</p>
          </div>
        ) : clusters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 primary-bg-light rounded-lg mb-3">
              <HiCollection className="w-6 h-6 primary-text" />
            </div>
            <h3 className="text-base font-semibold neutral-text mb-1">
              No clusters yet
            </h3>
            <p className="text-sm neutral-text-muted text-center">
              Create a Cluster first in Master → Cluster.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="spinner spinner-lg mb-3"></span>
            <p className="text-sm neutral-text-muted">Loading constructs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 primary-bg-light rounded-lg mb-3">
              <HiCollection className="w-6 h-6 primary-text" />
            </div>
            <h3 className="text-base font-semibold neutral-text mb-1">
              No constructs yet
            </h3>
            <p className="text-sm neutral-text-muted text-center">
              Create your first construct above to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Table - Simple and Clean */}
            <div className="overflow-x-auto rounded-lg border border-neutral-border-light">
              <table className="table">
                <thead>
                  <tr className="bg-medium border-b border-neutral-border-light">
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted" style={{ width: '40px' }}>
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
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">S.No</th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">Construct</th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden lg:table-cell">Description</th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">Cluster</th>
                    <th className="font-semibold text-sm py-3 px-4 neutral-text-muted" style={{ textAlign: 'right' }}>Actions</th>
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
                      <tr key={item.id} className={`border-b border-neutral-border-light ${isEven ? 'bg-white' : 'bg-gray-50'} ${isSelected ? 'bg-blue-100' : ''} hover:bg-gray-100 transition-colors`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleItemSelect(item.id, e.target.checked)}
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
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell neutral-text">
                          <span className="text-sm line-clamp-1">{item.description || "N/A"}</span>
                        </td>
                        <td className="py-3 px-4 neutral-text">
                          <span className="text-sm">
                            {clusters.find(
                              (c) =>
                                c.id === item.clusterId ||
                                c.id === parseInt(item.clusterId)
                            )?.name || "N/A"}
                          </span>
                        </td>
                       
                       
                       
                     
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                setViewModal({
                                  isOpen: true,
                                  construct: item,
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
                                  clusterId: item.clusterId || item.cluster_id || "",
                                  name: item.name || "",
                                  short_code: item.short_code || "",
                                  description: item.description || "",
                                  definition: item.definition || "",
                                  high_behavior: item.high_behavior || "",
                                  medium_behavior: item.medium_behavior || "",
                                  low_behavior: item.low_behavior || "",
                                  benefits: item.benefits || "",
                                  risks: item.risks || "",
                                  coaching_applications: item.coaching_applications || "",
                                  case_example: item.case_example || "",
                                  display_order: item.display_order || "",
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
                  Showing <span className="font-medium neutral-text">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium neutral-text">
                    {Math.min(currentPage * itemsPerPage, filtered.length)}
                  </span> of{" "}
                  <span className="font-medium neutral-text">{filtered.length}</span> constructs
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
                        // Show first page, last page, current page, and pages around current
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
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore =
                          index > 0 && array[index - 1] < page - 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-2 neutral-text-muted-dark">...</span>
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
