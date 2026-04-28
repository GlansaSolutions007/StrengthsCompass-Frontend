import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiCollection,
  HiEye,
  HiPencil,
  HiPlus,
  HiSearch,
  HiTrash,
  HiX,
} from "react-icons/hi";
import apiClient from "../../config/api";
import AlertModal from "../../components/AlertModal";

const emptyForm = {
  construct_id: "",
  stage_name: "",
  min_years: "",
  max_years: "",
  description: "",
};

const YEAR_OPTIONS = Array.from({ length: 61 }, (_, index) => index);
const YEAR_RANGE_FILTERS = [
  { value: "0-3", label: "0 - 3", min: 0, max: 3 },
  { value: "4-8", label: "4 - 8", min: 4, max: 8 },
  { value: "9-20", label: "9 - 20", min: 9, max: 20 },
  { value: "20+", label: "20+", min: 20, max: Infinity },
];

const normalizeStage = (stage) => ({
  id: stage.id,
  construct_id: stage.construct_id ?? "",
  construct_name: stage.construct?.name || "",
  stage_name: stage.stage_name || "",
  min_years: stage.min_years ?? "",
  max_years: stage.max_years ?? "",
  description: stage.description || "",
});

export default function AdminMasterExperienceStages() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [roleName, setRoleName] = useState(
    localStorage.getItem("adminSelectedRoleName") || ""
  );
  const [constructs, setConstructs] = useState([]);
  const [loadingConstructs, setLoadingConstructs] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(emptyForm);
  const [viewStage, setViewStage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    create: false,
    update: false,
    delete: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [constructFilter, setConstructFilter] = useState("");
  const [yearRangeFilter, setYearRangeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const selectedAgeGroupId = localStorage.getItem("adminSelectedVariantId");
  const isTeacherRole = roleName.toLowerCase() === "teacher";

  const fetchRoleName = async () => {
    const savedRoleName = localStorage.getItem("adminSelectedRoleName");
    const savedRoleId = localStorage.getItem("adminSelectedRoleId");

    if (savedRoleName) {
      setRoleName(savedRoleName);
      return;
    }

    if (!savedRoleId) return;

    try {
      const response = await apiClient.get(`/roles/${savedRoleId}`);
      const name = response.data?.data?.name || "";
      if (name) {
        localStorage.setItem("adminSelectedRoleName", name);
        setRoleName(name);
      }
    } catch (err) {
      console.error("Error fetching selected role:", err);
    }
  };

  const fetchConstructs = async () => {
    try {
      setLoadingConstructs(true);
      const response = await apiClient.get("/constructs", {
        params: selectedAgeGroupId ? { age_group_id: selectedAgeGroupId } : {},
      });

      if (response.data?.status && response.data.data) {
        setConstructs(
          response.data.data.map((construct) => ({
            id: construct.id,
            name: construct.name || "",
            short_code: construct.short_code || "",
          }))
        );
      } else {
        setConstructs([]);
      }
    } catch (err) {
      console.error("Error fetching constructs:", err);
      setConstructs([]);
      setError(
        err.response?.data?.message ||
          "Failed to load constructs. Please try again."
      );
    } finally {
      setLoadingConstructs(false);
    }
  };

  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/experience-stages", {
        params: selectedAgeGroupId ? { age_group_id: selectedAgeGroupId } : {},
      });

      if (response.data?.status && response.data.data) {
        setItems(response.data.data.map(normalizeStage));
        setError(null);
      } else {
        setError("Failed to load experience stages");
      }
    } catch (err) {
      console.error("Error fetching experience stages:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load experience stages. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleName();
    fetchStages();
  }, [navigate]);

  useEffect(() => {
    if (isTeacherRole) {
      fetchConstructs();
    } else {
      setLoadingConstructs(false);
    }
  }, [isTeacherRole]);

  const allowedConstructIds = useMemo(
    () => new Set(constructs.map((construct) => Number(construct.id))),
    [constructs]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let teacherItems = isTeacherRole
      ? items.filter((item) => allowedConstructIds.has(Number(item.construct_id)))
      : [];

    if (constructFilter) {
      teacherItems = teacherItems.filter(
        (item) => Number(item.construct_id) === Number(constructFilter)
      );
    }

    if (yearRangeFilter) {
      const selectedRange = YEAR_RANGE_FILTERS.find(
        (range) => range.value === yearRangeFilter
      );

      if (selectedRange) {
        teacherItems = teacherItems.filter((item) => {
          const minYears = Number(item.min_years);
          const maxYears = Number(item.max_years);
          return minYears <= selectedRange.max && maxYears >= selectedRange.min;
        });
      }
    }

    if (!query) return teacherItems;

    return teacherItems.filter((item) => {
      return (
        item.construct_name.toLowerCase().includes(query) ||
        item.stage_name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        String(item.min_years).includes(query) ||
        String(item.max_years).includes(query)
      );
    });
  }, [
    allowedConstructIds,
    constructFilter,
    isTeacherRole,
    items,
    searchQuery,
    yearRangeFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const validate = (data) => {
    const errors = {};
    const minYears = Number(data.min_years);
    const maxYears = Number(data.max_years);

    if (!data.construct_id) {
      errors.construct_id = "Construct is required";
    }
    if (!data.stage_name.trim()) {
      errors.stage_name = "Stage name is required";
    }
    if (data.min_years === "" || Number.isNaN(minYears) || minYears < 0) {
      errors.min_years = "Minimum years must be 0 or greater";
    }
    if (data.max_years === "" || Number.isNaN(maxYears) || maxYears < 0) {
      errors.max_years = "Maximum years must be 0 or greater";
    }
    if (
      !errors.min_years &&
      !errors.max_years &&
      maxYears < minYears
    ) {
      errors.max_years = "Maximum years must be greater than or equal to minimum years";
    }

    return errors;
  };

  const toPayload = (data) => ({
    construct_id: Number(data.construct_id),
    stage_name: data.stage_name.trim(),
    min_years: Number(data.min_years),
    max_years: Number(data.max_years),
    description: data.description.trim() || undefined,
  });

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleEditChange = (field, value) => {
    setEditingData((prev) => ({ ...prev, [field]: value }));
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setFieldErrors({});
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditingData(emptyForm);
    setFieldErrors({});
  };

  const add = async () => {
    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, create: true }));
      const response = await apiClient.post(
        "/experience-stages",
        toPayload(formData)
      );

      if (response.data?.status && response.data.data) {
        setItems((prev) => [...prev, normalizeStage(response.data.data)]);
        setSuccess("Experience stage created successfully!");
        closeForm();
      } else {
        setError(response.data?.message || "Failed to create experience stage");
      }
    } catch (err) {
      console.error("Error creating experience stage:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create experience stage. Please try again."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const save = async () => {
    const errors = validate(editingData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, update: true }));
      const response = await apiClient.put(
        `/experience-stages/${editingId}`,
        toPayload(editingData)
      );

      if (response.data?.status && response.data.data) {
        const updated = normalizeStage(response.data.data);
        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSuccess("Experience stage updated successfully!");
        closeEdit();
      } else {
        setError(response.data?.message || "Failed to update experience stage");
      }
    } catch (err) {
      console.error("Error updating experience stage:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update experience stage. Please try again."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const remove = async () => {
    if (!deleteConfirm?.id) return;

    try {
      setActionLoading((prev) => ({ ...prev, delete: true }));
      const response = await apiClient.delete(
        `/experience-stages/${deleteConfirm.id}`
      );

      if (response.data?.status || response.status === 200) {
        setItems((prev) =>
          prev.filter((item) => item.id !== deleteConfirm.id)
        );
        setSuccess("Experience stage deleted successfully!");
        setDeleteConfirm(null);
      } else {
        setError(response.data?.message || "Failed to delete experience stage");
      }
    } catch (err) {
      console.error("Error deleting experience stage:", err);
      setError(
        err.response?.data?.message ||
          "Failed to delete experience stage. Please try again."
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditingData({
      construct_id: item.construct_id,
      stage_name: item.stage_name,
      min_years: item.min_years,
      max_years: item.max_years,
      description: item.description,
    });
    setFieldErrors({});
  };

  const renderStageForm = ({
    data,
    onChange,
    onCancel,
    onSubmit,
    isSaving,
    submitLabel,
  }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-white/20 my-8">
        <div className="p-6 primary-bg-light flex items-center justify-between">
          <h3 className="text-xl font-bold primary-text">
            {editingId ? "Edit Experience Stage" : "Create Experience Stage"}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-white/60 transition-colors"
            aria-label="Close"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 bg-gray-50">
          <div>
            <label className="text-sm font-semibold neutral-text block mb-2">
              Construct Name
            </label>
            <select
              value={data.construct_id}
              onChange={(e) => onChange("construct_id", e.target.value)}
              disabled={loadingConstructs || constructs.length === 0}
              className={`input w-full ${
                fieldErrors.construct_id ? "border-red-500" : ""
              }`}
            >
              {loadingConstructs ? (
                <option value="">Loading constructs...</option>
              ) : constructs.length === 0 ? (
                <option value="">No constructs available</option>
              ) : (
                <>
                  <option value="">Select construct</option>
                  {constructs.map((construct) => (
                    <option key={construct.id} value={construct.id}>
                      {construct.name}
                      {construct.short_code ? ` (${construct.short_code})` : ""}
                    </option>
                  ))}
                </>
              )}
            </select>
            {fieldErrors.construct_id && (
              <p className="danger-text text-xs mt-1">
                {fieldErrors.construct_id}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold neutral-text block mb-2">
              Stage Name
            </label>
            <input
              value={data.stage_name}
              onChange={(e) => onChange("stage_name", e.target.value)}
              placeholder="Enter stage name"
              className={`input w-full ${
                fieldErrors.stage_name ? "border-red-500" : ""
              }`}
            />
            {fieldErrors.stage_name && (
              <p className="danger-text text-xs mt-1">
                {fieldErrors.stage_name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold neutral-text block mb-2">
                Minimum Years
              </label>
              <select
                value={data.min_years}
                onChange={(e) => onChange("min_years", e.target.value)}
                className={`input w-full ${
                  fieldErrors.min_years ? "border-red-500" : ""
                }`}
              >
                <option value="">Select minimum years</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year} {year === 1 ? "year" : "years"}
                  </option>
                ))}
              </select>
              {fieldErrors.min_years && (
                <p className="danger-text text-xs mt-1">
                  {fieldErrors.min_years}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold neutral-text block mb-2">
                Maximum Years
              </label>
              <select
                value={data.max_years}
                onChange={(e) => onChange("max_years", e.target.value)}
                className={`input w-full ${
                  fieldErrors.max_years ? "border-red-500" : ""
                }`}
              >
                <option value="">Select maximum years</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year} {year === 1 ? "year" : "years"}
                  </option>
                ))}
              </select>
              {fieldErrors.max_years && (
                <p className="danger-text text-xs mt-1">
                  {fieldErrors.max_years}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold neutral-text block mb-2">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Enter description"
              rows="4"
              className="input w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="btn btn-primary text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSaving}
              className="btn btn-accent shadow-md"
            >
              {isSaving ? (
                <>
                  <span className="spinner spinner-sm mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <HiCheck className="w-4 h-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        type="warning"
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleteConfirm?.stage_name || ""}"? This action cannot be undone.`}
      >
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            disabled={actionLoading.delete}
            className="btn btn-primary text-sm"
          >
            Cancel
          </button>
          <button
            onClick={remove}
            disabled={actionLoading.delete}
            className="btn btn-danger"
          >
            {actionLoading.delete ? "Deleting..." : "Delete"}
          </button>
        </div>
      </AlertModal>

      {showForm &&
        renderStageForm({
          data: formData,
          onChange: handleFormChange,
          onCancel: closeForm,
          onSubmit: add,
          isSaving: actionLoading.create,
          submitLabel: "Create Stage",
        })}

      {editingId &&
        renderStageForm({
          data: editingData,
          onChange: handleEditChange,
          onCancel: closeEdit,
          onSubmit: save,
          isSaving: actionLoading.update,
          submitLabel: "Save Changes",
        })}

      {viewStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setViewStage(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-white/20">
            <div className="p-6 primary-bg-light flex items-center justify-between">
              <h3 className="text-xl font-bold primary-text">
                Experience Stage Details
              </h3>
              <button
                onClick={() => setViewStage(null)}
                className="p-2 rounded-lg hover:bg-white/60 transition-colors"
                aria-label="Close"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-gray-50">
              <div>
                <p className="text-xs neutral-text-muted mb-1">Construct</p>
                <p className="font-semibold neutral-text">
                  {viewStage.construct_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs neutral-text-muted mb-1">Stage Name</p>
                <p className="font-semibold neutral-text">
                  {viewStage.stage_name || "N/A"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs neutral-text-muted mb-1">Minimum Years</p>
                  <p className="font-semibold neutral-text">
                    {viewStage.min_years}
                  </p>
                </div>
                <div>
                  <p className="text-xs neutral-text-muted mb-1">Maximum Years</p>
                  <p className="font-semibold neutral-text">
                    {viewStage.max_years}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs neutral-text-muted mb-1">Description</p>
                <p className="neutral-text whitespace-pre-wrap">
                  {viewStage.description || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isTeacherRole ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 primary-bg-light rounded-lg mb-3">
            <HiCollection className="w-6 h-6 primary-text" />
          </div>
          <h1 className="text-xl font-bold neutral-text mb-2">
            Experience Stages are available for Teacher only
          </h1>
          <p className="text-sm neutral-text-muted max-w-md">
            Select the Teacher role from admin login to manage experience stages.
          </p>
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold neutral-text">
          Manage Experience Stages
        </h1>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setFieldErrors({});
            setShowForm(true);
          }}
          className="btn btn-secondary"
        >
          <HiPlus className="w-4 h-4 mr-2 black-text" />
          Add Experience Stage
        </button>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex-1 w-full md:max-w-md">
          <div className="group flex w-full rounded-md overflow-hidden border border-neutral-300 transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary">
            <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
              <HiSearch className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by stage, years, or description..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:max-w-3xl">
          <div>
            <label className="text-sm font-semibold neutral-text block mb-2">
              Construct Name
            </label>
            <select
              value={constructFilter}
              onChange={(e) => {
                setConstructFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input w-full"
              disabled={loadingConstructs || constructs.length === 0}
            >
              {loadingConstructs ? (
                <option value="">Loading constructs...</option>
              ) : constructs.length === 0 ? (
                <option value="">No constructs available</option>
              ) : (
                <>
                  <option value="">All constructs</option>
                  {constructs.map((construct) => (
                    <option key={construct.id} value={construct.id}>
                      {construct.name}
                      {construct.short_code ? ` (${construct.short_code})` : ""}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold neutral-text block mb-2">
              Years
            </label>
            <select
              value={yearRangeFilter}
              onChange={(e) => {
                setYearRangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input w-full"
            >
              <option value="">All years</option>
              {YEAR_RANGE_FILTERS.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="spinner spinner-lg mb-3" />
          <p className="text-sm neutral-text-muted">
            Loading experience stages...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 primary-bg-light rounded-lg mb-3">
            <HiCollection className="w-6 h-6 primary-text" />
          </div>
          <h3 className="text-base font-semibold neutral-text mb-1">
            No experience stages yet
          </h3>
          <p className="text-sm neutral-text-muted text-center">
            {searchQuery
              ? "No experience stages match your search."
              : "Create your first experience stage to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-border-light">
            <table className="table">
              <thead>
                <tr className="bg-medium border-b border-neutral-border-light">
                  <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                    S.No
                  </th>
                  <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                    Construct
                  </th>
                  <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                    Stage Name
                  </th>
                  <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">
                    Years
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
                {pageItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-neutral-border-light ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <td className="py-3 px-4 neutral-text-muted">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-4 neutral-text">
                      <span className="text-sm font-medium">
                        {item.construct_name || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 neutral-text">
                      <span className="text-sm font-medium">
                        {item.stage_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 neutral-text">
                      <span className="text-sm">
                        {item.min_years} - {item.max_years}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell neutral-text">
                      <span className="text-sm line-clamp-1">
                        {item.description || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewStage(item)}
                          className="btn-view"
                          title="View"
                        >
                          <HiEye />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="btn-edit"
                          title="Edit"
                        >
                          <HiPencil />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="btn-delete"
                          title="Delete"
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                stages
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-ghost btn-sm"
                >
                  <HiChevronLeft />
                  Previous
                </button>
                <span className="text-sm neutral-text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
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
        </>
      )}
    </div>
  );
}
