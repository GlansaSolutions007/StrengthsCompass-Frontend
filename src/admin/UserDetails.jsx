import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../config/api";
import {
  HiX,
  HiPencil,
  HiCheckCircle,
  HiXCircle,
  HiArrowLeft,
  HiClock,
  HiChartBar,
  HiUser,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiBriefcase,
  HiAcademicCap,
  HiIdentification,
  HiCalendar,
  HiEye,
} from "react-icons/hi";
import AlertModal from "../components/AlertModal";

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const createEmptyEditForm = () => ({
    first_name: "",
    last_name: "",
    whatsapp_number: "",
    contact_number: "",
    city: "",
    state: "",
    country: "",
    profession: "",
    gender: "",
    age: "",
    educational_qualification: "",
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    formData: createEmptyEditForm(),
    errors: {},
    loading: false,
  });
  const [isClosingEdit, setIsClosingEdit] = useState(false);

  useEffect(() => {
    if (userId) {
      console.log("Fetching user details for userId:", userId);
      setLoading(true);
      setError(null);
      setUser(null);
      fetchUserDetails();
    } else {
      setError("User ID is missing");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);


  const fetchUserDetails = async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const response = await apiClient.get(`/users/${userId}`);
      console.log("User API Response:", response.data);

      let userData = null;
      if (response.data?.data) {
        userData = response.data.data;
      } else if (response.data?.user) {
        userData = response.data.user;
      } else if (response.data) {
        userData = response.data;
      }

      console.log("Extracted User Data:", userData);

      if (userData) {
        const mappedUser = {
          id: userData.id,
          name: userData.name || `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.username || "N/A",
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.email || "N/A",
          phone: userData.contact_number || userData.phone || userData.phone_number || userData.contact || "N/A",
          contactNumber: userData.contact_number || userData.phone || userData.phone_number || userData.contact || "",
          whatsappNumber: userData.whatsapp_number || "",
          role: userData.role || "N/A",
          gender: userData.gender || "N/A",
          age: userData.age || "N/A",
          city: userData.city || "N/A",
          state: userData.state || "N/A",
          country: userData.country || "N/A",
          profession: userData.profession || "N/A",
          educationalQualification: userData.educational_qualification || "N/A",
          address: userData.address || "N/A",
          zipCode: userData.zip_code || userData.zipCode || "N/A",
          status: userData.is_active !== undefined
            ? userData.is_active
              ? "Active"
              : "Inactive"
            : userData.status || "Unknown",
          lastLogin: userData.last_login || userData.lastLogin || "Never",
          createdAt: userData.created_at || userData.createdAt || "N/A",
          updatedAt: userData.updated_at || userData.updatedAt || "N/A",
        };
        console.log("Mapped User:", mappedUser);
        setUser(mappedUser);
        setError(null);
      } else {
        console.error("No user data found in response");
        setError("User not found");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setError("Session expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else if (err.response?.status === 404) {
        setError("User not found");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load user details. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };



  const closeEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsClosingEdit(false);
      setEditModal({
        isOpen: false,
        formData: createEmptyEditForm(),
        errors: {},
        loading: false,
      });
    }, 220);
  };

  const handleEditClick = () => {
    const sanitize = (value) =>
      value === null || value === undefined || value === "N/A" ? "" : `${value}`;
    const derivedName = (sanitize(user?.name) || "").trim().split(" ");
    const firstFromName = derivedName.length ? derivedName[0] : "";
    const lastFromName = derivedName.length > 1 ? derivedName.slice(1).join(" ") : "";
    setEditModal({
      isOpen: true,
      formData: {
        first_name: sanitize(user?.firstName) || firstFromName,
        last_name: sanitize(user?.lastName) || lastFromName,
        whatsapp_number: sanitize(user?.whatsappNumber),
        contact_number: sanitize(user?.contactNumber) || sanitize(user?.phone),
        city: sanitize(user?.city),
        state: sanitize(user?.state),
        country: sanitize(user?.country),
        profession: sanitize(user?.profession),
        gender: sanitize(user?.gender),
        age: sanitize(user?.age),
        educational_qualification: sanitize(user?.educationalQualification),
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

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }
    if (!formData.contact_number.trim()) {
      errors.contact_number = "Contact number is required";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }
    if (!formData.state.trim()) {
      errors.state = "State is required";
    }
    if (!formData.country.trim()) {
      errors.country = "Country is required";
    }
    if (!formData.profession.trim()) {
      errors.profession = "Profession is required";
    }
    if (!formData.gender.trim()) {
      errors.gender = "Gender is required";
    }
    if (!formData.age || Number(formData.age) <= 0) {
      errors.age = "Valid age is required";
    }
    if (!formData.educational_qualification.trim()) {
      errors.educational_qualification = "Educational qualification is required";
    }

    if (Object.keys(errors).length > 0) {
      setEditModal((prev) => ({ ...prev, errors }));
      return;
    }

    setEditModal((prev) => ({ ...prev, loading: true, errors: {} }));

    try {
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        contact_number: formData.contact_number.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        profession: formData.profession.trim(),
        gender: formData.gender.trim(),
        age: Number(formData.age),
        educational_qualification: formData.educational_qualification.trim(),
      };

      // Include whatsapp_number only if provided (optional field)
      if (formData.whatsapp_number.trim()) {
        updateData.whatsapp_number = formData.whatsapp_number.trim();
      }

      const response = await apiClient.put(`/users/${userId}`, updateData);

      if (response.data?.status || response.status === 200) {
        await fetchUserDetails();
        closeEditModal();
        setError(null);
      } else {
        setError(response.data?.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setError("Session expired. Please login again.");
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else {
        setError(
          err.response?.data?.message || "Failed to update user. Please try again."
        );
      }
    } finally {
      setEditModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleViewAnswersClick = () => {
    navigate(`/admin/dashboard/users/${userId}/answers`);
  };

  if (loading) {
    return (
      <div className="neutral-text bg min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="spinner spinner-lg mb-3"></span>
          <p className="text-sm neutral-text-muted">Loading user details...</p>
          {userId && (
            <p className="text-xs neutral-text-muted mt-2">
              Fetching data for User ID: <span className="font-medium primary-text">#{userId}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="neutral-text bg min-h-screen p-4 md:p-8">
        <AlertModal
          isOpen={!!error}
          onClose={() => navigate("/admin/dashboard/users")}
          type="error"
          title="Error"
          message={error || ""}
        />
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/admin/dashboard/users")}
            className="btn btn-ghost"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" /> Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="neutral-text bg min-h-screen p-4 md:p-8">
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title="Error"
        message={error || ""}
      />

      {/* Edit Modal */}
      {(editModal.isOpen || isClosingEdit) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
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
                <h3 className="text-xl font-bold primary-text">Edit User</h3>
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
                        First Name <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.first_name}
                        onChange={(e) => handleEditChange("first_name", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.first_name ? "input-error" : ""}`}
                        placeholder="Enter first name"
                      />
                      {editModal.errors.first_name && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.first_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Last Name <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.last_name}
                        onChange={(e) => handleEditChange("last_name", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.last_name ? "input-error" : ""}`}
                        placeholder="Enter last name"
                      />
                      {editModal.errors.last_name && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.last_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Contact Number <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.contact_number}
                        onChange={(e) => handleEditChange("contact_number", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.contact_number ? "input-error" : ""}`}
                        placeholder="Enter contact number"
                      />
                      {editModal.errors.contact_number && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.contact_number}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Whatsapp Number
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.whatsapp_number}
                        onChange={(e) => handleEditChange("whatsapp_number", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.whatsapp_number ? "input-error" : ""}`}
                        placeholder="Enter WhatsApp number"
                      />
                      {editModal.errors.whatsapp_number && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.whatsapp_number}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        City <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.city}
                        onChange={(e) => handleEditChange("city", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.city ? "input-error" : ""}`}
                        placeholder="Enter city"
                      />
                      {editModal.errors.city && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        State <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.state}
                        onChange={(e) => handleEditChange("state", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.state ? "input-error" : ""}`}
                        placeholder="Enter state"
                      />
                      {editModal.errors.state && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Country <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.country}
                        onChange={(e) => handleEditChange("country", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.country ? "input-error" : ""}`}
                        placeholder="Enter country"
                      />
                      {editModal.errors.country && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.country}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Profession <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.profession}
                        onChange={(e) => handleEditChange("profession", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.profession ? "input-error" : ""}`}
                        placeholder="Enter profession"
                      />
                      {editModal.errors.profession && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.profession}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Gender <span className="danger-text">*</span>
                      </label>
                      <select
                        value={editModal.formData.gender}
                        onChange={(e) => handleEditChange("gender", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.gender ? "input-error" : ""}`}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {editModal.errors.gender && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.gender}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Age <span className="danger-text">*</span>
                      </label>
                      <input
                        type="number"
                        value={editModal.formData.age}
                        onChange={(e) => handleEditChange("age", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.age ? "input-error" : ""}`}
                        placeholder="Enter age"
                        min="1"
                      />
                      {editModal.errors.age && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.age}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold neutral-text mb-2">
                        Educational Qualification <span className="danger-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={editModal.formData.educational_qualification}
                        onChange={(e) => handleEditChange("educational_qualification", e.target.value)}
                        disabled={editModal.loading}
                        className={`input ${editModal.errors.educational_qualification ? "input-error" : ""}`}
                        placeholder="Enter educational qualification"
                      />
                      {editModal.errors.educational_qualification && (
                        <p className="danger-text text-xs mt-1.5">
                          {editModal.errors.educational_qualification}
                        </p>
                      )}
                    </div>
                  </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeEditModal}
                    disabled={editModal.loading}
                    className="btn btn-primary text-sm"
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


      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/dashboard/users")}
            className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" /> Back to Users
          </button>
          {/* <div>
            <h1 className="text-2xl font-bold neutral-text">User Details</h1>
          </div> */}
        </div>
      </div>

      {user && (
        <>
          <div className="max-w-6xl mx-auto">
            {/* Single Card with All Information */}
            <div className="card p-6 bg-light rounded-lg shadow-md">
              {/* Profile Header Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b border-neutral-border-light">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold white-text shadow-lg">
                    {user.name && user.name !== "N/A"
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"
                      : "U"}
                  </div>
                  {/* <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      user.status === "Active"
                        ? "bg-green-500"
                        : user.status === "Inactive"
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                  ></span> */}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold neutral-text mb-1">
                    {user.name && user.name !== "N/A" ? user.name : "User"}
                  </h2>
                  <p className="neutral-text-muted text-sm mb-2">{user.email && user.email !== "N/A" ? user.email : "No email"}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="inline-block px-3 py-1 rounded-full primary-bg-light primary-text-medium text-xs font-medium">
                      {user.role && user.role !== "N/A" ? user.role : "N/A"}
                    </span>
                    {/* <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : user.status === "Inactive"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.status || "N/A"}
                    </span> */}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleEditClick}
                    className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md flex items-center gap-2"
                  >
                    <HiPencil className="w-4 h-4" />
                    Edit User
                  </button>
                </div>
              </div>

              {/* All Information Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                  <div className="p-1.5 primary-bg-light rounded-lg">
                    <HiMail className="w-4 h-4 primary-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs neutral-text-muted mb-0.5">Email</p>
                    <p className="neutral-text font-medium break-words text-sm">
                      {user.email && user.email !== "N/A" ? user.email : "N/A"}
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
                      {user.phone && user.phone !== "N/A" ? user.phone : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                  <div className="p-1.5 info-bg-light rounded-lg">
                    <HiPhone className="w-4 h-4 info-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs neutral-text-muted mb-0.5">WhatsApp Number</p>
                    <p className="neutral-text font-medium text-sm">
                      {user.whatsappNumber && user.whatsappNumber !== "N/A" ? user.whatsappNumber : "N/A"}
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
                      {user.gender && user.gender !== "N/A" ? user.gender : "N/A"}
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
                      {user.age && user.age !== "N/A" ? `${user.age} years` : "N/A"}
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
                      {user.role && user.role !== "N/A" ? user.role : "N/A"}
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
                      {user.profession && user.profession !== "N/A" ? user.profession : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-medium rounded-lg border border-neutral-border-light">
                  <div className="p-1.5 primary-bg-light rounded-lg">
                    <HiAcademicCap className="w-4 h-4 primary-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs neutral-text-muted mb-0.5">Educational Qualification</p>
                    <p className="neutral-text font-medium text-sm">
                      {user.educationalQualification && user.educationalQualification !== "N/A"
                        ? user.educationalQualification
                        : "N/A"}
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
                      {user.city && user.city !== "N/A" ? user.city : "N/A"}
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
                      {user.state && user.state !== "N/A" ? user.state : "N/A"}
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
                      {user.country && user.country !== "N/A" ? user.country : "N/A"}
                    </p>
                  </div>
                </div>
                         
              
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

