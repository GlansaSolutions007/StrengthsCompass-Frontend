import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../config/api";
import { useNavigate } from "react-router-dom";
import {
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiX,
  HiSearch,
  HiEye,
  HiTrash,
  HiUser,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiBriefcase,
  HiAcademicCap,
  HiCalendar,
  HiPencil,
} from "react-icons/hi";
import AlertModal from "../components/AlertModal";

export default function AdminUserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [editModal, setEditModal] = useState({
    isOpen: false,
    user: null,
    formData: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
      gender: "",
      age: "",
      contactNumber: "",
      whatsappNumber: "",
      city: "",
      state: "",
      country: "",
      profession: "",
      educationalQualification: "",
    },
    errors: {},
    loading: false,
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    userId: null,
    userName: "",
    loading: false,
  });

  const [isClosingEdit, setIsClosingEdit] = useState(false);
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    user: null,
  });
  const [isClosingView, setIsClosingView] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const response = await apiClient.get("/users");

      // Handle the API response structure: { users: { current_page: 1, data: [...] } }
      let usersData = null;
      
      // Check for nested users.data structure (paginated response)
      if (response.data?.users?.data && Array.isArray(response.data.users.data)) {
        usersData = response.data.users.data;
      }
      // Check if data is in response.data.data (with status)
      else if (response.data?.status && response.data.data) {
        usersData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      // Check if data is directly in response.data (array)
      else if (Array.isArray(response.data)) {
        usersData = response.data;
      }
      // Check if data is in response.data.data (without status check)
      else if (response.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      }
      // Check if data is in response.data.users (array)
      else if (response.data?.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      }

      if (usersData && usersData.length > 0) {
        const mappedUsers = usersData.map((u) => ({
          id: u.id,
          name: u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "N/A",
          firstName: u.first_name || "",
          lastName: u.last_name || "",
          email: u.email || "N/A",
          phone: u.whatsapp_number || u.phone || u.phone_number || u.contact_number || u.contact || "N/A",
          contact: u.contact_number || u.contact || u.whatsapp_number || u.phone || u.phone_number || "N/A",
          whatsappNumber: u.whatsapp_number || "N/A",
          role: u.role || "N/A",
          gender: u.gender || "N/A",
          age: u.age || "N/A",
          city: u.city || "N/A",
          state: u.state || "N/A",
          country: u.country || "N/A",
          profession: u.profession || "N/A",
          educationalQualification: u.educational_qualification || "N/A",
          status: u.is_active !== undefined
            ? u.is_active
              ? "Active"
              : "Inactive"
            : u.status || "Unknown",
          lastLogin: u.last_login || u.lastLogin || "Never",
          createdAt: u.created_at || u.createdAt || "N/A",
          updatedAt: u.updated_at || u.updatedAt || "N/A",
        }));
        
        // Filter out admin users - only show regular users
        const filteredUsers = mappedUsers.filter((user) => {
          const userRole = user.role?.toLowerCase();
          // Only filter out if role is explicitly "admin" or "administrator", not if it's "N/A" or empty
          if (!userRole || userRole === "n/a") {
            return true; // Include users with no role or "N/A"
          }
          return userRole !== "admin" && userRole !== "administrator";
        });
        
        console.log(`Fetched ${usersData.length} users, after filtering: ${filteredUsers.length}`);
        setUsers(filteredUsers);
        setError(null);
      } else {
        setUsers([]);
        // Only show error if there's an actual error message, otherwise show empty state
        if (response.data?.message) {
          setError(response.data.message);
        } else {
          setError(null);
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
      });

      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setError("Session expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else if (err.response?.status === 403) {
        setUsers([]);
        setError(
          err.response?.data?.message ||
            "Access forbidden. You don't have permission to view users. Please contact your administrator."
        );
      } else {
        setUsers([]);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            `Failed to load users: ${err.response?.statusText || err.message || "Unknown error"}. Please try again.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const filteredAndSorted = useMemo(() => {
    let filtered = [...users];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "id" || sortBy === "createdAt") {
        aVal =
          aVal === "N/A"
            ? 0
            : typeof aVal === "number"
            ? aVal
            : new Date(aVal).getTime() || 0;
        bVal =
          bVal === "N/A"
            ? 0
            : typeof bVal === "number"
            ? bVal
            : new Date(bVal).getTime() || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [users, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSortBy("id");
    setSortOrder("asc");
  };

  const closeEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setEditModal({
        isOpen: false,
        user: null,
        formData: {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "",
          gender: "",
          age: "",
          contactNumber: "",
          whatsappNumber: "",
          city: "",
          state: "",
          country: "",
          profession: "",
          educationalQualification: "",
        },
        errors: {},
        loading: false,
      });
    }, 220);
  };

  const closeViewModal = () => {
    setIsClosingView(true);
    setTimeout(() => {
      setIsClosingView(false);
      setViewModal({
        isOpen: false,
        user: null,
      });
    }, 220);
  };


  const handleEditClick = (user) => {
    // Helper function to clean values (remove "N/A" and convert to empty string)
    const cleanValue = (value) => {
      if (!value || value === "N/A" || value === "null" || value === "undefined") {
        return "";
      }
      return String(value);
    };

    setEditModal({
      isOpen: true,
      user: user,
      formData: {
        firstName: cleanValue(user.firstName || ""),
        lastName: cleanValue(user.lastName || ""),
        email: cleanValue(user.email),
        password: "",
        role: cleanValue(user.role),
        gender: cleanValue(user.gender),
        age: cleanValue(user.age),
        contactNumber: cleanValue(user.contact || user.phone),
        whatsappNumber: cleanValue(user.whatsappNumber),
        city: cleanValue(user.city),
        state: cleanValue(user.state),
        country: cleanValue(user.country),
        profession: cleanValue(user.profession),
        educationalQualification: cleanValue(user.educationalQualification),
      },
      errors: {},
      loading: false,
    });
  };

  const handleEditChange = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value,
      },
      errors: {
        ...prev.errors,
        [field]: "",
      },
    }));
  };

  const handleEditSubmit = async () => {
    const { formData } = editModal;
    const errors = {};

    // Validate age if provided
    if (formData.age && formData.age.trim()) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        errors.age = "Age must be a valid number between 1 and 150";
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditModal((prev) => ({ ...prev, errors }));
      return;
    }

    setEditModal((prev) => ({ ...prev, loading: true, errors: {} }));

    try {
      // Build update data object with ALL required fields as specified
      const updateData = {
        first_name: formData.firstName.trim() || "",
        last_name: formData.lastName.trim() || "",
        whatsapp_number: formData.whatsappNumber.trim() || "",
        contact_number: formData.contactNumber.trim() || "",
        city: formData.city.trim() || "",
        state: formData.state.trim() || "",
        country: formData.country.trim() || "",
        profession: formData.profession.trim() || "",
        gender: formData.gender.trim() || "",
        age: formData.age && formData.age.trim() ? (() => {
          const ageNum = parseInt(formData.age);
          return (!isNaN(ageNum) && ageNum >= 1 && ageNum <= 150) ? ageNum : null;
        })() : null,
        educational_qualification: formData.educationalQualification.trim() || "",
      };

      console.log("Sending update data:", updateData);

      const response = await apiClient.put(`/users/${editModal.user.id}`, updateData);

      console.log("Update response:", response.data);

      if (response.data?.status || response.status === 200 || response.status === 204) {
        // Close modal first
        setEditModal({
          isOpen: false,
          user: null,
          formData: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "",
            gender: "",
            age: "",
            contactNumber: "",
            whatsappNumber: "",
            city: "",
            state: "",
            country: "",
            profession: "",
            educationalQualification: "",
          },
          errors: {},
          loading: false,
        });
        setError(null);
        
        // Then refresh the user list
        await fetchUsers();
      } else {
        setError(response.data?.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      console.error("Error response:", err.response?.data);
      console.error("Update data that was sent:", updateData);
      
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setError("Session expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else if (err.response?.status === 422) {
        // Handle validation errors from server
        const validationErrors = err.response?.data?.errors || {};
        const serverMessage = err.response?.data?.message || "Validation failed";
        
        // Map server validation errors to form fields
        const mappedErrors = {};
        Object.keys(validationErrors).forEach((key) => {
          // Map backend field names to frontend field names
          const fieldMap = {
            'first_name': 'firstName',
            'last_name': 'lastName',
            'whatsapp_number': 'whatsappNumber',
            'contact_number': 'contactNumber',
            'educational_qualification': 'educationalQualification',
          };
          const frontendKey = fieldMap[key] || key;
          mappedErrors[frontendKey] = Array.isArray(validationErrors[key]) 
            ? validationErrors[key][0] 
            : validationErrors[key];
        });
        
        if (Object.keys(mappedErrors).length > 0) {
          setEditModal((prev) => ({ ...prev, errors: mappedErrors, loading: false }));
        } else {
          setEditModal((prev) => ({ ...prev, loading: false }));
          setError(serverMessage);
        }
      } else {
        setEditModal((prev) => ({ ...prev, loading: false }));
        setError(
          err.response?.data?.message || err.message || "Failed to update user. Please try again."
        );
      }
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirm({
      isOpen: true,
      userId: user.id,
      userName: user.name || user.email || "this user",
      loading: false,
    });
  };

  const handleViewDetails = (user) => {
    setViewModal({
      isOpen: true,
      user,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.userId) return;

    setDeleteConfirm((prev) => ({ ...prev, loading: true }));

    try {
      const response = await apiClient.delete(`/users/${deleteConfirm.userId}`);

      if (response.data?.status || response.status === 200 || response.status === 204) {
        await fetchUsers();
        setDeleteConfirm({
          isOpen: false,
          userId: null,
          userName: "",
          loading: false,
        });
        setError(null);
      } else {
        setError(response.data?.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setError("Session expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else {
        setError(
          err.response?.data?.message || "Failed to delete user. Please try again."
        );
      }
    } finally {
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="neutral-text bg min-h-screen p-4 md:p-8">
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title="Error"
        message={error || ""}
      />

      {(editModal.isOpen || isClosingEdit) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingEdit ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            onClick={closeEditModal}
          />
          <div 
            className={`relative rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingEdit ? "animate-modal-out" : "animate-modal-in"
            }`}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
          >
            <div
              className="p-6 primary-bg-light"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  Edit User
                </h3>
                <button
                  onClick={closeEditModal}
                  disabled={editModal.loading}
                  className="btn btn-ghost btn-icon-sm primary-text hover:bg-white/40"
                  aria-label="Close"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.firstName}
                      onChange={(e) => handleEditChange("firstName", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.lastName}
                      onChange={(e) => handleEditChange("lastName", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editModal.formData.email}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter email (read-only)"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.role}
                      onChange={(e) => handleEditChange("role", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter role"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Gender
                    </label>
                    <select
                      value={editModal.formData.gender}
                      onChange={(e) => handleEditChange("gender", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={editModal.formData.age}
                      onChange={(e) => handleEditChange("age", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter age"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.contactNumber}
                      onChange={(e) => handleEditChange("contactNumber", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.whatsappNumber}
                      onChange={(e) => handleEditChange("whatsappNumber", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter WhatsApp number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.city}
                      onChange={(e) => handleEditChange("city", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.state}
                      onChange={(e) => handleEditChange("state", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.country}
                      onChange={(e) => handleEditChange("country", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Profession
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.profession}
                      onChange={(e) => handleEditChange("profession", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter profession"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold neutral-text mb-2">
                      Educational Qualification
                    </label>
                    <input
                      type="text"
                      value={editModal.formData.educationalQualification}
                      onChange={(e) => handleEditChange("educationalQualification", e.target.value)}
                      disabled={editModal.loading}
                      className="input"
                      placeholder="Enter educational qualification"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeEditModal}
                    disabled={editModal.loading}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={editModal.loading}
                    className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                  >
                    {editModal.loading ? (
                      <>
                        <span className="spinner spinner-sm mr-2"></span>
                        Updating...
                      </>
                    ) : (
                      "Update User"
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

      <AlertModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          !deleteConfirm.loading &&
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
        }
        type="warning"
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm.userName}? This action cannot be undone.`}
        primaryText={deleteConfirm.loading ? "Deleting..." : "Delete"}
        onPrimary={handleDeleteConfirm}
        secondaryText="Cancel"
        onSecondary={() =>
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
        }
        hideCloseButton={deleteConfirm.loading}
      >
        {deleteConfirm.loading && (
          <div className="flex justify-center mt-4">
            <span className="spinner spinner-md"></span>
          </div>
        )}
      </AlertModal>

      {/* View User Modal */}
      {(viewModal.isOpen || isClosingView) && viewModal.user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
          <div
            className={`absolute inset-0 overlay ${
              isClosingView ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            onClick={closeViewModal}
          />
          <div
            className={`relative rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingView ? "animate-modal-out" : "animate-modal-in"
            }`}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div className="p-6 primary-bg-light">
              <h3 className="text-xl font-bold primary-text">View User Details</h3>
            </div>
            <div
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
            >
              <div className="space-y-6">
                {/* Profile Header Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-4 pb-4 border-b border-neutral-border-light">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold white-text shadow-lg">
                      {(viewModal.user.firstName?.[0] || viewModal.user.name?.[0] || "U")
                        .toString()
                        .toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold neutral-text mb-1">
                      {viewModal.user.name || "User"}
                    </h2>
                    <p className="neutral-text-muted text-sm mb-2">
                      {viewModal.user.email || "No email"}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="inline-block px-3 py-1 rounded-full primary-bg-light primary-text-medium text-xs font-medium">
                        {viewModal.user.role || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        closeViewModal();
                        handleEditClick(viewModal.user);
                      }}
                      className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md flex items-center gap-2"
                    >
                      <HiUser className="w-4 h-4" />
                      Edit User
                    </button>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 primary-bg-light rounded-lg">
                      <HiMail className="w-4 h-4 primary-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Email</p>
                      <p className="neutral-text font-medium break-words text-sm">
                        {viewModal.user.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 accent-bg-light rounded-lg">
                      <HiPhone className="w-4 h-4 accent-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Phone</p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 info-bg-light rounded-lg">
                      <HiPhone className="w-4 h-4 info-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">
                        WhatsApp Number
                      </p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.whatsappNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 secondary-bg-light rounded-lg">
                      <HiUser className="w-4 h-4 secondary-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Gender</p>
                      <p className="neutral-text font-medium capitalize text-sm">
                        {viewModal.user.gender || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 warning-bg-light rounded-lg">
                      <HiCalendar className="w-4 h-4 warning-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Age</p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.age ? `${viewModal.user.age} years` : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 accent-bg-light rounded-lg">
                      <HiPhone className="w-4 h-4 accent-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Contact</p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.contact || viewModal.user.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 primary-bg-light rounded-lg">
                      <HiUser className="w-4 h-4 primary-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Role</p>
                      <p className="neutral-text font-medium capitalize text-sm">
                        {viewModal.user.role || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 accent-bg-light rounded-lg">
                      <HiBriefcase className="w-4 h-4 accent-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Profession</p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.profession || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 primary-bg-light rounded-lg">
                      <HiAcademicCap className="w-4 h-4 primary-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">
                        Educational Qualification
                      </p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.educationalQualification || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 info-bg-light rounded-lg">
                      <HiLocationMarker className="w-4 h-4 info-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">City</p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.city || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 info-bg-light rounded-lg">
                      <HiLocationMarker className="w-4 h-4 info-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">State</p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.state || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                    <div className="p-1.5 info-bg-light rounded-lg">
                      <HiLocationMarker className="w-4 h-4 info-text" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs neutral-text-muted mb-0.5">Country</p>
                      <p className="neutral-text font-medium text-sm">
                        {viewModal.user.country || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeViewModal}
                    className="btn btn-ghost"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeViewModal();
                      handleEditClick(viewModal.user);
                    }}
                    className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                  >
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold neutral-text">Manage Users</h1>
      </div>

      {/* Search and Filters */}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
            />
            
            {/* Clear Button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="flex items-center justify-center px-3 hover:bg-secondary-bg-light transition-colors"
                title="Clear search"
              >
                <HiX className="w-4 h-4 neutral-text-muted" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          
          {(searchTerm || statusFilter) && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-sm flex items-center justify-center gap-2"
            >
              <HiX className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Users List Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="spinner spinner-lg mb-3"></span>
          <p className="text-sm neutral-text-muted">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 primary-bg-light rounded-lg mb-3">
            <HiUser className="w-6 h-6 primary-text" />
          </div>
          <h3 className="text-base font-semibold neutral-text mb-1">
            No users yet
          </h3>
          <p className="text-sm neutral-text-muted text-center">
            {error 
              ? error 
              : "There are no users in the system yet."}
          </p>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 primary-bg-light rounded-lg mb-3">
            <HiUser className="w-6 h-6 primary-text" />
          </div>
          <h3 className="text-base font-semibold neutral-text mb-1">
            No users match your search
          </h3>
          <p className="text-sm neutral-text-muted text-center">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-neutral-border-light">
              <table className="table">
                <thead>
                  <tr className="bg-medium border-b border-neutral-border-light">
                    {/* <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted cursor-pointer hover:primary-text transition"
                      onClick={() => handleSort("id")}
                    >
                      ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th> */}
                    <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted cursor-pointer hover:primary-text transition"
                      onClick={() => handleSort("name")}
                    >
                      Name{" "}
                      {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted cursor-pointer hover:primary-text transition"
                      onClick={() => handleSort("email")}
                    >
                      Email{" "}
                      {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                      Phone
                    </th>
                    <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted cursor-pointer hover:primary-text transition"
                      onClick={() => handleSort("age")}
                    >
                      Age{" "}
                      {sortBy === "age" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted cursor-pointer hover:primary-text transition"
                      onClick={() => handleSort("gender")}
                    >
                      Gender{" "}
                      {sortBy === "gender" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted cursor-pointer hover:primary-text transition"
                      onClick={() => handleSort("profession")}
                    >
                      Profession{" "}
                      {sortBy === "profession" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    {/* <th
                      className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted cursor-pointer hover:primary-text transition"
                      onClick={() => handleSort("status")}
                    >
                      Status{" "}
                      {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th> */}
                    <th
                      className="font-semibold text-sm py-3 px-4 neutral-text-muted"
                      style={{ textAlign: "right" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((user, index) => {
                      const isEven = index % 2 === 0;
                      return (
                      <tr
                        key={user.id}
                        className={`border-b border-neutral-border-light ${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                      >
                        {/* <td className="py-3 px-4 neutral-text-muted">{user.id}</td> */}
                        <td className="py-3 px-4 neutral-text">{user.name}</td>
                        <td className="py-3 px-4 neutral-text">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 neutral-text-muted">
                          {user.phone}
                        </td>
                        <td className="py-3 px-4 neutral-text">
                          {user.age && user.age !== "N/A" ? `${user.age}` : "N/A"}
                        </td>
                        <td className="py-3 px-4 neutral-text capitalize">
                          {user.gender && user.gender !== "N/A" ? user.gender : "N/A"}
                        </td>
                        <td className="py-3 px-4 neutral-text">
                          {user.profession && user.profession !== "N/A" ? user.profession : "N/A"}
                        </td>
                        {/* <td className="py-3 px-4">
                          <span
                            className={`badge ${
                              user.status === "Active"
                                ? "badge-accent"
                                : user.status === "Inactive"
                                ? "badge-danger"
                                : "badge-neutral"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td> */}
                      
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="btn-view"
                              title="View"
                            >
                              <HiEye />
                            </button>
                            <button
                              onClick={() => handleEditClick(user)}
                              className="btn-edit"
                              title="Edit"
                            >
                              <HiPencil />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="btn-delete"
                              title="Delete"
                            >
                              <HiTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {filteredAndSorted.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-border-light">
                <div className="text-xs neutral-text-muted">
                  Showing <span className="font-medium neutral-text">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium neutral-text">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredAndSorted.length
                    )}
                  </span>{" "}
                  of <span className="font-medium neutral-text">{filteredAndSorted.length}</span> users
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
                      {
                        length: Math.ceil(
                          filteredAndSorted.length / itemsPerPage
                        ),
                      },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        const totalPages = Math.ceil(
                          filteredAndSorted.length / itemsPerPage
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
                          Math.ceil(filteredAndSorted.length / itemsPerPage),
                          prev + 1
                        )
                      )
                    }
                    disabled={
                      currentPage >=
                      Math.ceil(filteredAndSorted.length / itemsPerPage)
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
