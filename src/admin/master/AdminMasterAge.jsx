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
  HiDuplicate,
  HiChevronDown,
} from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

export default function AdminMasterAge() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    from: "",
    to: "",
    description: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    name: "",
    from: "",
    to: "",
    description: "",
    is_active: true,
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
    ageGroup: null,
  });
  const [actionLoading, setActionLoading] = useState({
    create: false,
    update: false,
    delete: false,
    clone: false,
  });
  const [cloneModal, setCloneModal] = useState({
    isOpen: false,
    sourceAgeGroupId: null,
    targetAgeGroupIds: [],
    replaceExisting: false,
  });
  const [isClosingClone, setIsClosingClone] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isClosingForm, setIsClosingForm] = useState(false);
  const [isClosingView, setIsClosingView] = useState(false);
  const [isClosingEdit, setIsClosingEdit] = useState(false);

  const fetchAgeGroups = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const response = await apiClient.get("/age-groups");

      if (response.data?.status && response.data.data) {
        setItems(
          response.data.data.map((ag) => ({
            id: ag.id,
            name: ag.name || "",
            from: ag.from || "",
            to: ag.to || "",
            description: ag.description || "",
            is_active: ag.is_active !== undefined ? ag.is_active : true,
          }))
        );
        setError(null);
      } else {
        setError("Failed to load age groups");
      }
    } catch (err) {
      console.error("Error fetching age groups:", err);

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
            "Failed to load age groups. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgeGroups();
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
      from: "",
      to: "",
      description: "",
      is_active: true,
    });
    setFieldErrors({});
  };

  const closeForm = () => {
    setIsClosingForm(true);
    setTimeout(() => {
      setIsClosingForm(false);
      resetForm();
      setShowForm(false);
      setEditingId(null);
    }, 220);
  };

  const closeViewModal = () => {
    setIsClosingView(true);
    setTimeout(() => {
      setIsClosingView(false);
      setViewModal({ isOpen: false, ageGroup: null });
    }, 220);
  };

  const closeEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setEditingId(null);
      setEditingData({
        name: "",
        from: "",
        to: "",
        description: "",
        is_active: true,
      });
    }, 220);
  };

  const add = async () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    if (!formData.from || formData.from === "") {
      errors.from = "Age from is required";
    }
    if (!formData.to || formData.to === "") {
      errors.to = "Age to is required";
    }
    if (formData.from && formData.to && parseInt(formData.from) > parseInt(formData.to)) {
      errors.to = "Age to must be greater than or equal to age from";
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
        from: parseInt(formData.from),
        to: parseInt(formData.to),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active,
      };

      const response = await apiClient.post("/age-groups", payload);

      if (response.data?.status && response.data.data) {
        const newAgeGroup = response.data.data;
        setItems([
          ...items,
          {
            id: newAgeGroup.id,
            name: newAgeGroup.name || "",
            from: newAgeGroup.from || "",
            to: newAgeGroup.to || "",
            description: newAgeGroup.description || "",
            is_active: newAgeGroup.is_active !== undefined ? newAgeGroup.is_active : true,
          },
        ]);
        resetForm();
        setShowForm(false);
        setError(null);
        setSuccess("Age group created successfully!");
        const totalPages = Math.ceil((items.length + 1) / itemsPerPage);
        setCurrentPage(totalPages);
      } else {
        setError(response.data?.message || "Failed to create age group");
      }
    } catch (err) {
      console.error("Error creating age group:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to create age group. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, create: false });
    }
  };

  const save = async (id) => {
    if (!editingData.name.trim()) {
      setValidationError("Name is required. Please enter a name.");
      return;
    }
    if (!editingData.from || editingData.from === "") {
      setValidationError("Age from is required.");
      return;
    }
    if (!editingData.to || editingData.to === "") {
      setValidationError("Age to is required.");
      return;
    }
    if (parseInt(editingData.from) > parseInt(editingData.to)) {
      setValidationError("Age to must be greater than or equal to age from.");
      return;
    }

    setValidationError(null);
    setActionLoading({ ...actionLoading, update: true });
    try {
      const payload = {
        name: editingData.name.trim(),
        from: parseInt(editingData.from),
        to: parseInt(editingData.to),
        description: editingData.description.trim() || undefined,
        is_active: editingData.is_active,
      };

      const response = await apiClient.put(`/age-groups/${id}`, payload);

      if (response.data?.status && response.data.data) {
        const updatedAgeGroup = response.data.data;
        setItems(
          items.map((item) =>
            item.id === id
              ? {
                  id: updatedAgeGroup.id,
                  name: updatedAgeGroup.name || "",
                  from: updatedAgeGroup.from || "",
                  to: updatedAgeGroup.to || "",
                  description: updatedAgeGroup.description || "",
                  is_active: updatedAgeGroup.is_active !== undefined ? updatedAgeGroup.is_active : true,
                }
              : item
          )
        );
        setEditingId(null);
        setEditingData({
          name: "",
          from: "",
          to: "",
          description: "",
          is_active: true,
        });
        setError(null);
        setSuccess("Age group updated successfully!");
      } else {
        setError(response.data?.message || "Failed to update age group");
      }
    } catch (err) {
      console.error("Error updating age group:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to update age group. Please try again."
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
      const response = await apiClient.delete(`/age-groups/${id}`);

      if (
        response.data?.status ||
        response.status === 200 ||
        response.status === 204
      ) {
        const newItems = items.filter((item) => item.id !== id);
        setItems(newItems);
        setError(null);
        setSuccess("Age group deleted successfully!");
        const totalPages = Math.ceil(newItems.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } else {
        setError(response.data?.message || "Failed to delete age group");
      }
    } catch (err) {
      console.error("Error deleting age group:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete age group. Please try again."
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
          item.description?.toLowerCase().includes(searchLower) ||
          item.from?.toString().includes(searchLower) ||
          item.to?.toString().includes(searchLower)
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
        apiClient.delete(`/age-groups/${id}`)
      );
      await Promise.all(deletePromises);

      const newItems = items.filter((item) => !idsToDelete.includes(item.id));
      setItems(newItems);
      setSelectedItems([]);
      setError(null);
      setSuccess(`${idsToDelete.length} age group(s) deleted successfully!`);

      const totalPages = Math.ceil(newItems.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error("Error deleting age groups:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete some age groups. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  const closeCloneModal = () => {
    setIsClosingClone(true);
    setTimeout(() => {
      setIsClosingClone(false);
      setCloneModal({
        isOpen: false,
        sourceAgeGroupId: null,
        targetAgeGroupIds: [],
        replaceExisting: false,
      });
    }, 220);
  };

  const handleCloneClick = (ageGroupId) => {
    setCloneModal({
      isOpen: true,
      sourceAgeGroupId: ageGroupId,
      targetAgeGroupIds: [],
      replaceExisting: false,
    });
  };

  const handleTargetAgeGroupToggle = (ageGroupId) => {
    setCloneModal((prev) => {
      const currentIds = prev.targetAgeGroupIds || [];
      if (currentIds.includes(ageGroupId)) {
        return {
          ...prev,
          targetAgeGroupIds: currentIds.filter((id) => id !== ageGroupId),
        };
      } else {
        return {
          ...prev,
          targetAgeGroupIds: [...currentIds, ageGroupId],
        };
      }
    });
  };

  const cloneClustersConstructs = async () => {
    if (!cloneModal.sourceAgeGroupId) {
      setError("Source age group is required");
      return;
    }
    if (!cloneModal.targetAgeGroupIds || cloneModal.targetAgeGroupIds.length === 0) {
      setError("Please select at least one target age group");
      return;
    }

    setError(null);
    setActionLoading({ ...actionLoading, clone: true });
    try {
      const payload = {
        source_age_group_id: cloneModal.sourceAgeGroupId,
        target_age_group_ids: cloneModal.targetAgeGroupIds,
        replace_existing: cloneModal.replaceExisting,
      };

      const response = await apiClient.post(
        "/age-groups/clone-clusters-constructs",
        payload
      );

      if (response.data?.status) {
        setError(null);
        setSuccess(
          `Clusters and constructs cloned successfully to ${cloneModal.targetAgeGroupIds.length} age group(s)!`
        );
        closeCloneModal();
      } else {
        setError(response.data?.message || "Failed to clone clusters and constructs");
      }
    } catch (err) {
      console.error("Error cloning clusters and constructs:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to clone clusters and constructs. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, clone: false });
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

      {/* Add New Age Group Modal */}
      {(showForm || isClosingForm) && !editingId && (
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
                  Create New Age Group
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
                    placeholder="Enter age group name"
                    disabled={actionLoading.create}
                    className={`input w-full ${fieldErrors.name ? "input-error" : ""}`}
                  />
                  {fieldErrors.name && (
                    <p className="danger-text text-xs mt-1.5">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Age From <span className="danger-text">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.from}
                      onChange={(e) => handleFormChange("from", e.target.value)}
                      placeholder="e.g., 18"
                      disabled={actionLoading.create}
                      min="0"
                      className={`input w-full ${fieldErrors.from ? "input-error" : ""}`}
                    />
                    {fieldErrors.from && (
                      <p className="danger-text text-xs mt-1.5">{fieldErrors.from}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Age To <span className="danger-text">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.to}
                      onChange={(e) => handleFormChange("to", e.target.value)}
                      placeholder="e.g., 25"
                      disabled={actionLoading.create}
                      min="0"
                      className={`input w-full ${fieldErrors.to ? "input-error" : ""}`}
                    />
                    {fieldErrors.to && (
                      <p className="danger-text text-xs mt-1.5">{fieldErrors.to}</p>
                    )}
                  </div>
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
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active"
                        checked={formData.is_active === true}
                        onChange={() => handleFormChange("is_active", true)}
                        disabled={actionLoading.create}
                        className="radio"
                      />
                      <span className="text-sm neutral-text">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active"
                        checked={formData.is_active === false}
                        onChange={() => handleFormChange("is_active", false)}
                        disabled={actionLoading.create}
                        className="radio"
                      />
                      <span className="text-sm neutral-text">Inactive</span>
                    </label>
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
                        <HiPlus className="w-4 h-4 mr-2" /> Add Age Group
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
      {(viewModal.isOpen || isClosingView) && viewModal.ageGroup && (
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
                  View Age Group Details
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
                    {viewModal.ageGroup.name || "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Age From
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      {viewModal.ageGroup.from !== undefined ? viewModal.ageGroup.from : "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Age To
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      {viewModal.ageGroup.to !== undefined ? viewModal.ageGroup.to : "N/A"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Description
                  </label>
                  <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                    {viewModal.ageGroup.description || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Status
                  </label>
                  <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      viewModal.ageGroup.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {viewModal.ageGroup.is_active ? "Active" : "Inactive"}
                    </span>
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
                        setEditingId(viewModal.ageGroup.id);
                        setEditingData({
                          name: viewModal.ageGroup.name || "",
                          from: viewModal.ageGroup.from || "",
                          to: viewModal.ageGroup.to || "",
                          description: viewModal.ageGroup.description || "",
                          is_active: viewModal.ageGroup.is_active !== undefined ? viewModal.ageGroup.is_active : true,
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

      {/* Clone Modal */}
      {(cloneModal.isOpen || isClosingClone) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingClone ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            onClick={closeCloneModal}
          />
          <div 
            className={`relative rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingClone ? "animate-modal-out" : "animate-modal-in"
            }`}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="p-6 primary-bg-light">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  Clone Clusters & Constructs
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
                    Source Age Group <span className="danger-text">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={cloneModal.sourceAgeGroupId || ""}
                      onChange={(e) =>
                        setCloneModal({
                          ...cloneModal,
                          sourceAgeGroupId: parseInt(e.target.value),
                        })
                      }
                      disabled={actionLoading.clone}
                      className="input w-full pr-10"
                    >
                      <option value="" disabled>
                        Select source age group
                      </option>
                      {items.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.from} - {ag.to})
                        </option>
                      ))}
                    </select>
                    <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Target Age Groups <span className="danger-text">*</span>
                  </label>
                  <p className="text-xs neutral-text-muted mb-3">
                    Select one or more age groups to clone clusters and constructs to
                  </p>
                  <div className="border border-neutral-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
                    {items.length === 0 ? (
                      <p className="text-sm neutral-text-muted text-center py-4">
                        No age groups available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {items
                          .filter((ag) => ag.id !== cloneModal.sourceAgeGroupId)
                          .map((ag) => (
                            <label
                              key={ag.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={cloneModal.targetAgeGroupIds?.includes(ag.id) || false}
                                onChange={() => handleTargetAgeGroupToggle(ag.id)}
                                disabled={actionLoading.clone}
                                className="checkbox-custom"
                              />
                              <span className="text-sm neutral-text">
                                {ag.name} ({ag.from} - {ag.to})
                              </span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                  {cloneModal.targetAgeGroupIds?.length > 0 && (
                    <p className="text-xs neutral-text-muted mt-2">
                      {cloneModal.targetAgeGroupIds.length} age group(s) selected
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cloneModal.replaceExisting}
                      onChange={(e) =>
                        setCloneModal({
                          ...cloneModal,
                          replaceExisting: e.target.checked,
                        })
                      }
                      disabled={actionLoading.clone}
                      className="checkbox-custom"
                    />
                    <span className="text-sm neutral-text">
                      Replace existing clusters and constructs
                    </span>
                  </label>
                  <p className="text-xs neutral-text-muted mt-1 ml-6">
                    If checked, existing clusters and constructs in target age groups will be replaced
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-border-light">
                  <button
                    onClick={closeCloneModal}
                    disabled={actionLoading.clone}
                    className="btn btn-primary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={cloneClustersConstructs}
                    disabled={
                      actionLoading.clone ||
                      !cloneModal.sourceAgeGroupId ||
                      !cloneModal.targetAgeGroupIds ||
                      cloneModal.targetAgeGroupIds.length === 0
                    }
                    className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                  >
                    {actionLoading.clone ? (
                      <>
                        <span className="spinner spinner-sm mr-2"></span>
                        Cloning...
                      </>
                    ) : (
                      <>
                        <HiDuplicate className="w-4 h-4 mr-2" /> Clone
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
                <h3 className="text-xl font-bold primary-text">Edit Age Group</h3>
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
                    placeholder="Enter age group name"
                    disabled={actionLoading.update}
                    className="input w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Age From <span className="danger-text">*</span>
                    </label>
                    <input
                      type="number"
                      value={editingData.from}
                      onChange={(e) => handleEditChange("from", e.target.value)}
                      placeholder="e.g., 18"
                      disabled={actionLoading.update}
                      min="0"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Age To <span className="danger-text">*</span>
                    </label>
                    <input
                      type="number"
                      value={editingData.to}
                      onChange={(e) => handleEditChange("to", e.target.value)}
                      placeholder="e.g., 25"
                      disabled={actionLoading.update}
                      min="0"
                      className="input w-full"
                    />
                  </div>
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
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit_is_active"
                        checked={editingData.is_active === true}
                        onChange={() => handleEditChange("is_active", true)}
                        disabled={actionLoading.update}
                        className="radio"
                      />
                      <span className="text-sm neutral-text">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit_is_active"
                        checked={editingData.is_active === false}
                        onChange={() => handleEditChange("is_active", false)}
                        disabled={actionLoading.update}
                        className="radio"
                      />
                      <span className="text-sm neutral-text">Inactive</span>
                    </label>
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
          <h1 className="text-2xl font-bold neutral-text">Manage Age Groups</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }} 
            className="btn btn-secondary"
          >
            <HiPlus className="w-4 h-4 mr-2 black-text" /> Add New Age Group
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
                placeholder="Search by name, description, or age range..."
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

        {/* Age Groups List Section - Simple */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="spinner spinner-lg mb-3"></span>
            <p className="text-sm neutral-text-muted">Loading age groups...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 primary-bg-light rounded-lg mb-3">
              <HiCollection className="w-6 h-6 primary-text" />
            </div>
            <h3 className="text-base font-semibold neutral-text mb-1">
              No age groups yet
            </h3>
            <p className="text-sm neutral-text-muted text-center">
              {searchQuery
                ? "No age groups match your search."
                : "Create your first age group above to get started."}
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
                      Name
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                      Age Range
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden lg:table-cell">
                      Description
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                      Status
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
                          <td className="py-3 px-4 neutral-text">
                            <span className="text-sm">
                              {item.from !== undefined && item.to !== undefined 
                                ? `${item.from} - ${item.to}` 
                                : "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell neutral-text">
                            <span className="text-sm line-clamp-1">
                              {item.description || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4 neutral-text">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.is_active 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setViewModal({
                                    isOpen: true,
                                    ageGroup: item,
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
                                    from: item.from || "",
                                    to: item.to || "",
                                    description: item.description || "",
                                    is_active: item.is_active !== undefined ? item.is_active : true,
                                  });
                                }}
                                className="btn-edit"
                                title="Edit"
                              >
                                <HiPencil />
                              </button>
                              <button
                                onClick={() => handleCloneClick(item.id)}
                                className="btn-view"
                                title="Clone Clusters & Constructs"
                              >
                                <HiDuplicate />
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
                  age groups
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

