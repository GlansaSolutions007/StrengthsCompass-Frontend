import React, { useEffect, useState } from "react";
import apiClient from "../../config/api";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
  HiEye,
  HiSearch,
  HiUpload,
  HiDownload,
} from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

export default function AdminMasterOrganizations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [name, setName] = useState("");
  const [shortcode, setShortcode] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [isActive, setIsActive] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [actionLoading, setActionLoading] = useState({
        create: false,
        update: false,
        delete: false,
        toggle: false,
    });
    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        id: null,
        name: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isClosingForm, setIsClosingForm] = useState(false);
  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    organizationId: null,
    organizationName: "",
    loading: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      const organization = items.find(item => item.id === parseInt(editId));
      if (organization) {
        handleEdit(organization);
      }
    }
  }, [location.search, items]);

    const fetchOrganizations = async () => {
        try {
            const response = await apiClient.get("/organizations");
            if (response.data?.status && response.data.data) {
                setItems(
                    response.data.data.map((o) => ({
                        id: o.id,
                        name: o.name || "",
                        email: o.email || "",
                        shortcode: o.shortcode || "",
                        registration_no: o.registration_no || "",
                        contact_number: o.contact_number || "",
                        address: o.address || "",
                        city: o.city || "",
                        state: o.state || "",
                        country: o.country || "",
                        is_active: o.is_active !== undefined ? o.is_active : true,
                    }))
                );
                setError(null);
            } else {
                setError("Failed to load organizations");
            }
        } catch (err) {
            console.error("Error fetching organizations:", err);
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
                    "Failed to load organizations. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!name.trim()) {
            errors.name = "Organization name is required.";
        }
        if (!shortcode.trim()) {
            errors.shortcode = "Shortcode is required.";
        }
        if (!registrationNo.trim()) {
            errors.registration_no = "Registration number is required.";
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;

        setActionLoading({ ...actionLoading, create: true });
        try {
            const payload = {
                name: name.trim(),
                shortcode: shortcode.trim(),
                registration_no: registrationNo.trim(),
                email: email.trim() || null,
                contact_number: contactNumber.trim() || null,
                address: address.trim() || null,
                city: city.trim() || null,
                state: state.trim() || null,
                country: country.trim() || null,
                is_active: isActive,
            };

            const response = await apiClient.post("/organizations", payload);
            if (response.data?.status) {
                setSuccess("Organization created successfully!");
                fetchOrganizations();
                closeForm();
                resetForm();
            } else {
                setError("Failed to create organization");
            }
        } catch (err) {
            console.error("Error creating organization:", err);
            if (err.response?.status === 422 && err.response.data?.errors) {
                setFieldErrors(err.response.data.errors);
            } else {
                setError(
                    err.response?.data?.message || "Failed to create organization. Please try again."
                );
            }
        } finally {
            setActionLoading({ ...actionLoading, create: false });
        }
    };

    const handleEdit = (organization) => {
        setEditingId(organization.id);
        setName(organization.name || "");
        setShortcode(organization.shortcode || "");
        setRegistrationNo(organization.registration_no || "");
        setEmail(organization.email || "");
        setContactNumber(organization.contact_number || "");
        setAddress(organization.address || "");
        setCity(organization.city || "");
        setState(organization.state || "");
        setCountry(organization.country || "");
        setIsActive(organization.is_active !== undefined ? organization.is_active : true);
        setFieldErrors({});
        setShowForm(true);
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;

        setActionLoading({ ...actionLoading, update: true });
        try {
            const payload = {
                name: name.trim(),
                shortcode: shortcode.trim(),
                registration_no: registrationNo.trim(),
                email: email.trim() || null,
                contact_number: contactNumber.trim() || null,
                address: address.trim() || null,
                city: city.trim() || null,
                state: state.trim() || null,
                country: country.trim() || null,
                is_active: isActive,
            };

            const response = await apiClient.put(`/organizations/${editingId}`, payload);
            if (response.data?.status) {
                setSuccess("Organization updated successfully!");
                fetchOrganizations();
                closeForm();
                resetForm();
            } else {
                setError("Failed to update organization");
            }
        } catch (err) {
            console.error("Error updating organization:", err);
            if (err.response?.status === 422 && err.response.data?.errors) {
                setFieldErrors(err.response.data.errors);
            } else {
                setError(
                    err.response?.data?.message || "Failed to update organization. Please try again."
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

        setActionLoading({ ...actionLoading, delete: deleteConfirm.id });
        try {
            const response = await apiClient.delete(`/organizations/${deleteConfirm.id}`);
            if (response.data?.status) {
                setSuccess("Organization deleted successfully!");
                fetchOrganizations();
                setDeleteConfirm({ isOpen: false, id: null, name: "" });
            } else {
                setError("Failed to delete organization");
            }
        } catch (err) {
            console.error("Error deleting organization:", err);
            setError(
                err.response?.data?.message || "Failed to delete organization. Please try again."
            );
        } finally {
            setActionLoading({ ...actionLoading, delete: false });
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        setActionLoading({ ...actionLoading, toggle: id });
        try {
            const response = await apiClient.patch(`/organizations/${id}/toggle-active`);
            if (response.data?.status) {
                setSuccess(`Organization ${!currentStatus ? "activated" : "deactivated"} successfully!`);
                fetchOrganizations();
            } else {
                setError("Failed to toggle organization status");
            }
        } catch (err) {
            console.error("Error toggling organization status:", err);
            setError(
                err.response?.data?.message || "Failed to toggle organization status. Please try again."
            );
        } finally {
            setActionLoading({ ...actionLoading, toggle: false });
        }
    };

    const resetForm = () => {
        setName("");
        setShortcode("");
        setRegistrationNo("");
        setEmail("");
        setContactNumber("");
        setAddress("");
        setCity("");
        setState("");
        setCountry("");
        setIsActive(true);
        setEditingId(null);
        setEditingData({});
        setFieldErrors({});
    };

    const closeForm = () => {
        setIsClosingForm(true);
        setTimeout(() => {
            setShowForm(false);
            setIsClosingForm(false);
            resetForm();
        }, 200);
    };

    const handleViewOrganization = (organization) => {
        navigate(`/admin/dashboard/master/organizations/${organization.id}`);
    };

    const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.state.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleItemSelect = (id, checked) => {
        if (checked) {
            setSelectedItems([...selectedItems, id]);
        } else {
            setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedItems(filtered.map((item) => item.id));
        } else {
            setSelectedItems([]);
        }
    };

    const allCurrentPageSelected =
        filtered.length > 0 && filtered.every((item) => selectedItems.includes(item.id));

  const handleUploadUsers = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    // Validate file type
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please select a valid Excel file (.xlsx, .xls, or .csv).");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setError("File size must be less than 10MB.");
      return;
    }

    setUploadModal(prev => ({ ...prev, loading: true }));

    try {
      const formData = new FormData();
      formData.append('organization_id', uploadModal.organizationId);
      formData.append('file', selectedFile);

      const adminToken = localStorage.getItem("adminToken");
      console.log("Admin Token:", adminToken);

      const response = await apiClient.post("/users/import-organization-users", formData, {
        headers: {
          'Authorization': adminToken ? `Bearer ${adminToken}` : undefined,
          'Content-Type': 'multipart/form-data'
        },
      });

      if (response.data?.status) {
        setSuccess(`Users imported successfully! ${response.data.message || ''}`);
        setUploadModal({ isOpen: false, organizationId: null, organizationName: "", loading: false });
        setSelectedFile(null);
      } else {
        setError("Failed to import users");
      }
    } catch (err) {
      console.error("Error importing users:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat().join(', ');
        setError(errorMessages);
      } else {
        setError(
          err.response?.data?.message || "Failed to import users. Please try again."
        );
      }
    } finally {
      setUploadModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openUploadModal = (organization) => {
    setUploadModal({
      isOpen: true,
      organizationId: organization.id,
      organizationName: organization.name,
      loading: false,
    });
    setSelectedFile(null);
  };

  const closeUploadModal = () => {
    setUploadModal({ isOpen: false, organizationId: null, organizationName: "", loading: false });
    setSelectedFile(null);
  };

  const downloadSampleFile = async () => {
    try {
      // Try to fetch the file from the Files folder
      const response = await fetch("/Files/Organization Upload.xlsx");
      
      if (!response.ok) {
        // If direct path doesn't work, try alternative path
        throw new Error("File not found at expected path");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Organization Upload.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading sample file:", error);
      // Fallback: try direct link approach
      try {
        const link = document.createElement("a");
        link.href = "/Files/Organization Upload.xlsx";
        link.download = "Organization Upload.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
        setError("Failed to download sample file. Please ensure the file exists in the Files folder.");
      }
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

            {/* Form Modal */}
            {(showForm || isClosingForm) && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
                    style={{ zIndex: 1000 }}
                >
                    <div
                        className={`absolute inset-0 overlay ${isClosingForm ? "animate-backdrop-out" : "animate-backdrop-in"
                            }`}
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                        onClick={closeForm}
                    />
                    <div
                        className={`relative rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${isClosingForm ? "animate-modal-out" : "animate-modal-in"
                            }`}
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                    >
                        <div className="p-6 primary-bg-light">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold primary-text">
                                    {editingId ? "Edit Organization" : "Create New Organization"}
                                </h3>
                            </div>
                        </div>

                        <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
                            <div
                                className="flex-1 p-6 overflow-y-auto"
                                style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                            >
                                {Object.keys(fieldErrors).length > 0 && (
                                    <div id="form-errors" className="mb-4 p-3 bg-danger-bg-light border border-danger-border-light rounded-lg">
                                        <p className="danger-text text-sm">
                                            Please fix the errors below before submitting.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                Organization Name <span className="danger-text">*</span>
                                            </label>
                                            <input
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (fieldErrors.name) {
                                                        setFieldErrors({ ...fieldErrors, name: "" });
                                                    }
                                                }}
                                                placeholder="Enter organization name"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className={`input w-full ${fieldErrors.name ? "input-error" : ""}`}
                                            />
                                            {fieldErrors.name && (
                                                <p id="error-name" className="danger-text text-xs mt-1.5">
                                                    {fieldErrors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                Shortcode <span className="danger-text">*</span>
                                            </label>
                                            <input
                                                value={shortcode}
                                                onChange={(e) => {
                                                    setShortcode(e.target.value);
                                                    if (fieldErrors.shortcode) {
                                                        setFieldErrors({ ...fieldErrors, shortcode: "" });
                                                    }
                                                }}
                                                placeholder="Enter shortcode"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className={`input w-full ${fieldErrors.shortcode ? "input-error" : ""}`}
                                            />
                                            {fieldErrors.shortcode && (
                                                <p id="error-shortcode" className="danger-text text-xs mt-1.5">
                                                    {fieldErrors.shortcode}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                Registration No <span className="danger-text">*</span>
                                            </label>
                                            <input
                                                value={registrationNo}
                                                onChange={(e) => {
                                                    setRegistrationNo(e.target.value);
                                                    if (fieldErrors.registration_no) {
                                                        setFieldErrors({ ...fieldErrors, registration_no: "" });
                                                    }
                                                }}
                                                placeholder="Enter registration number"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className={`input w-full ${fieldErrors.registration_no ? "input-error" : ""}`}
                                            />
                                            {fieldErrors.registration_no && (
                                                <p id="error-registration_no" className="danger-text text-xs mt-1.5">
                                                    {fieldErrors.registration_no}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (fieldErrors.email) {
                                                        setFieldErrors({ ...fieldErrors, email: "" });
                                                    }
                                                }}
                                                placeholder="Enter email address"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className={`input w-full ${fieldErrors.email ? "input-error" : ""}`}
                                            />
                                            {fieldErrors.email && (
                                                <p id="error-email" className="danger-text text-xs mt-1.5">
                                                    {fieldErrors.email}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                Contact Number
                                            </label>
                                            <input
                                                value={contactNumber}
                                                onChange={(e) => setContactNumber(e.target.value)}
                                                placeholder="Enter contact number"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className="input w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                City
                                            </label>
                                            <input
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="Enter city"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className="input w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                State
                                            </label>
                                            <input
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                placeholder="Enter state"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className="input w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                Country
                                            </label>
                                            <input
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                placeholder="Enter country"
                                                disabled={actionLoading.create || actionLoading.update}
                                                className="input w-full"
                                            />
                                        </div>

                                        <div className="lg:col-span-2">
                                            <label className="text-sm font-semibold neutral-text block mb-2">
                                                Status
                                            </label>
                                            <div className="h-[42px] flex items-center bg-medium border border-neutral-border-light rounded-lg px-3 md:px-4">
                                                <label className="flex items-center justify-between cursor-pointer w-full">
                                                    <span className="neutral-text font-medium text-sm md:text-base">
                                                        {isActive ? "Active" : "Inactive"}
                                                    </span>
                                                    <div className="relative ml-4 flex-shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={isActive}
                                                            onChange={(e) => setIsActive(e.target.checked)}
                                                            className="sr-only"
                                                            disabled={actionLoading.create || actionLoading.update}
                                                        />
                                                        <div
                                                            className={`w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${isActive ? "accent-bg" : "danger-bg"
                                                                }`}
                                                        >
                                                            <div
                                                                className={`absolute top-0.5 left-0.5 w-6 h-6 white-bg rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isActive ? "translate-x-7" : "translate-x-0"
                                                                    }`}
                                                            />
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold neutral-text block mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Enter organization address"
                                            rows={3}
                                            disabled={actionLoading.create || actionLoading.update}
                                            className="input w-full resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 primary-bg-light border-t border-neutral-border-light">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={closeForm}
                                        disabled={actionLoading.create || actionLoading.update}
                                        className="btn btn-primary text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingId ? handleUpdate : handleCreate}
                                        disabled={actionLoading.create || actionLoading.update}
                                        className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                                    >
                                        {actionLoading.create || actionLoading.update ? (
                                            <>
                                                <span className="spinner spinner-sm mr-2"></span>
                                                {editingId ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            <>
                                                <HiCheck className="w-4 h-4 mr-2" />
                                                {editingId ? "Update Organization" : "Create Organization"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

      {/* Upload Modal */}
      {uploadModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className="absolute inset-0 overlay animate-backdrop-in"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            onClick={closeUploadModal}
          />
          <div 
            className="relative rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-white/20 my-8 animate-modal-in"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="p-6 primary-bg-light">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  Import Users - {uploadModal.organizationName}
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold neutral-text block">
                      Select Excel File <span className="danger-text">*</span>
                    </label>
                    <button
                      onClick={downloadSampleFile}
                      disabled={uploadModal.loading}
                      className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                      title="Download sample file"
                    >
                      <HiDownload className="w-4 h-4 mr-1" />
                      Download Sample
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    disabled={uploadModal.loading}
                    className="input w-full"
                  />
                  <p className="text-xs text-neutral-text-muted mt-1">
                    Supported formats: .xlsx, .xls, .csv (Max: 10MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm neutral-text">
                      <strong>Selected file:</strong> {selectedFile.name}
                    </p>
                    <p className="text-xs text-neutral-text-muted mt-1">
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeUploadModal}
                  disabled={uploadModal.loading}
                  className="btn btn-primary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadUsers}
                  disabled={uploadModal.loading || !selectedFile}
                  className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                >
                  {uploadModal.loading ? (
                    <>
                      <span className="spinner spinner-sm mr-2"></span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <HiUpload className="w-4 h-4 mr-2" />
                      Import Users
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold primary-text mb-2">
                        Organizations Management
                    </h1>
                    <p className="neutral-text-muted">
                        Manage organization information and settings
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                    >
                        <HiPlus className="w-4 h-4 mr-2" />
                        Add Organization
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="flex-1 w-full md:max-w-md">
                    <div className="group flex w-full rounded-md overflow-hidden border border-neutral-300 transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary">
                        <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
                            <HiSearch className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
                            <input
                                type="text"
                                placeholder="Search organizations by name, email, city, or state..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
                            />
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
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm neutral-text">
                            {selectedItems.length} organization{selectedItems.length !== 1 ? "s" : ""} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedItems([])}
                                className="btn btn-primary text-sm"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <span className="spinner spinner-lg mb-3"></span>
                    <p className="text-sm neutral-text-muted">Loading organizations...</p>
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-neutral-border-light">
                        <table className="table w-full">
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
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">S.No</th>
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">Organization Name</th>
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden md:table-cell">Shortcode</th>
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden md:table-cell">Registration No</th>
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden md:table-cell">Email</th>
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden md:table-cell">Contact</th>
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden md:table-cell">City</th>
                                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">Status</th>
                                    <th className="font-semibold text-sm py-3 px-4 neutral-text-muted" style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, index) => {
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
                                                {index + 1}
                                            </td>
                                            <td className="py-3 px-4 neutral-text">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {item.name || "N/A"}
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-1 md:hidden">
                                                        {item.email || ""}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell neutral-text">
                                                <span className="text-sm">
                                                    {item.shortcode || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell neutral-text">
                                                <span className="text-sm">
                                                    {item.registration_no || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell neutral-text">
                                                <span className="text-sm">
                                                    {item.email || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell neutral-text">
                                                <span className="text-sm">
                                                    {item.contact_number || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell neutral-text">
                                                <span className="text-sm">
                                                    {item.city || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`badge ${item.is_active
                                                                ? "badge-accent"
                                                                : "badge-neutral"
                                                            }`}
                                                    >
                                                        {item.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                    <button
                                                        onClick={() => handleToggleActive(item.id, item.is_active)}
                                                        disabled={actionLoading.toggle === item.id}
                                                        className={`p-1 rounded ${item.is_active
                                                                ? "text-red-500 hover:bg-red-50"
                                                                : "text-green-500 hover:bg-green-50"
                                                            }`}
                                                        title={item.is_active ? "Deactivate" : "Activate"}
                                                    >
                                                        {actionLoading.toggle === item.id ? (
                                                            <span className="spinner spinner-sm"></span>
                                                        ) : item.is_active ? (
                                                            <HiX className="w-4 h-4" />
                                                        ) : (
                                                            <HiCheck className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openUploadModal(item)}
                                                        className="btn-view"
                                                        title="Upload Users"
                                                    >
                                                        <HiUpload />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewOrganization(item)}
                                                        className="btn-view"
                                                        title="View"
                                                    >
                                                        <HiEye />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(item)}
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

                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-sm neutral-text-muted">
                                {searchQuery ? "No organizations found matching your search." : "No organizations available."}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}