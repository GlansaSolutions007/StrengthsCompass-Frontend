import React, { useEffect, useState } from "react";
import apiClient from "../../config/api";
import { useNavigate } from "react-router-dom";
import {
  HiPlus,
  HiX,
  HiChevronDown,
  HiCheck,
  HiDownload,
  HiArrowLeft,
} from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

export default function AdminMasterTestAdd() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [items, setItems] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [clustersLoading, setClustersLoading] = useState(true);
  const [statusOptionsLoading, setStatusOptionsLoading] = useState(true);
  const [constructs, setConstructs] = useState([]);
  const [constructsLoading, setConstructsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [title, setTitle] = useState("");
  const [testType, setTestType] = useState("");
  const [previousTestId, setPreviousTestId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [selectedClusterIds, setSelectedClusterIds] = useState([]);
  const [selectedClusterDropdown, setSelectedClusterDropdown] = useState("");
  const [questionCounts, setQuestionCounts] = useState({ P: 0, R: 0, SDB: 0 });
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [questionSelectionError, setQuestionSelectionError] = useState("");
  const [errorConstructInfo, setErrorConstructInfo] = useState(null);
  const [skippedConstructs, setSkippedConstructs] = useState([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [addSource, setAddSource] = useState("cluster");
  const [excelTestFile, setExcelTestFile] = useState(null);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedConstructIds, setSelectedConstructIds] = useState([]);

  const fetchStatusOptions = async () => {
    try {
      const response = await apiClient.get("/options");
      if (response.data?.status && response.data.data) {
        const statusOpts = response.data.data
          .filter((opt) => {
            const label = (opt.label || opt.option_text || opt.name || "").toLowerCase();
            return label.includes("status") || label.includes("active") || label.includes("inactive");
          })
          .map((opt) => ({
            id: opt.id,
            label: opt.label || opt.option_text || opt.name || "",
            value: opt.value !== undefined ? String(opt.value) : opt.label?.toLowerCase() || "",
          }));
        setStatusOptions(
          statusOpts.length === 0
            ? [
                { id: 1, label: "Active", value: "active" },
                { id: 2, label: "Inactive", value: "inactive" },
              ]
            : statusOpts
        );
      } else {
        setStatusOptions([
          { id: 1, label: "Active", value: "active" },
          { id: 2, label: "Inactive", value: "inactive" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching status options:", err);
      setStatusOptions([
        { id: 1, label: "Active", value: "active" },
        { id: 2, label: "Inactive", value: "inactive" },
      ]);
    } finally {
      setStatusOptionsLoading(false);
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await apiClient.get("/clusters");
      if (response.data?.status && response.data.data) {
        setClusters(response.data.data.map((c) => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      console.error("Error fetching clusters:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(err.response?.data?.message || "Failed to load clusters.");
      }
    } finally {
      setClustersLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await apiClient.get("/tests");
      if (response.data?.status && response.data.data) {
        setItems(
          response.data.data.map((t) => ({
            id: t.id,
            title: t.title || "",
            test_type: t.test_type ?? t.type ?? null,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
    }
  };

  const fetchConstructs = async () => {
    try {
      setConstructsLoading(true);
      const response = await apiClient.get("/constructs");
      if (response.data?.status && response.data.data) {
        setConstructs(
          response.data.data.map((c) => ({
            id: c.id,
            name: c.name || "",
            clusterId: c.cluster_id || c.clusterId,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching constructs:", err);
    } finally {
      setConstructsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (selectedClusterIds.length === 0 || constructs.length === 0) {
      setQuestions([]);
      return;
    }
    try {
      setQuestionsLoading(true);
      const response = await apiClient.get("/questions");
      if (response.data?.status && response.data.data) {
        const filteredQuestions = response.data.data.filter((q) => {
          const construct = constructs.find((c) => c.id === q.construct_id);
          if (!construct) return false;
          return selectedClusterIds.includes(construct.clusterId);
        });
        setQuestions(
          filteredQuestions
            .filter((q) => q.is_active === 1)
            .map((q) => ({
              id: q.id,
              question_text: q.question_text || q.questionText || "",
              category: q.category || "",
              construct_id: q.construct_id || q.constructId,
              order_no: q.order_no || q.orderNo || 0,
            }))
        );
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusOptions();
    fetchClusters();
    fetchTests();
    fetchConstructs();
  }, [navigate]);

  useEffect(() => {
    if (testType !== "cerc" || !previousTestId) {
      setSelectedConstructIds([]);
    }
  }, [testType, previousTestId]);

  useEffect(() => {
    if (selectedClusterIds.length > 0 && constructs.length > 0) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedClusterIds.join(","), constructs.length]);

  const isCercWithPreviousTest = testType === "cerc" && previousTestId;
  const constructsForSelectedClusters =
    isCercWithPreviousTest && selectedConstructIds.length > 0
      ? constructs.filter(
          (c) =>
            selectedClusterIds.includes(c.clusterId) &&
            selectedConstructIds.includes(c.id)
        )
      : constructs.filter((c) => selectedClusterIds.includes(c.clusterId));

  useEffect(() => {
    if (selectedClusterIds.length > 0 && constructs.length > 0) {
      const validConstructIds = constructsForSelectedClusters.map((c) => c.id.toString());
      setSelectedQuestions((prev) => {
        const cleaned = {};
        validConstructIds.forEach((constructId) => {
          if (prev[constructId]) cleaned[constructId] = prev[constructId];
        });
        return cleaned;
      });
    } else {
      setSelectedQuestions({});
    }
  }, [selectedClusterIds.join(",")]);

  const getQuestionsForConstructAndCategory = (constructId, category) => {
    return questions.filter(
      (q) =>
        q.construct_id === constructId &&
        (q.category || "").toUpperCase() === (category || "").toUpperCase()
    );
  };

  const autoSelectQuestions = (changedCategory = null, newCount = null) => {
    if (constructsForSelectedClusters.length === 0 || questions.length === 0) return;
    const newSelectedQuestions = {};
    constructsForSelectedClusters.forEach((construct) => {
      const constructId = construct.id.toString();
      if (skippedConstructs.includes(constructId)) {
        newSelectedQuestions[constructId] = selectedQuestions[constructId] || { P: [], R: [], SDB: [] };
        return;
      }
      newSelectedQuestions[constructId] = { P: [], R: [], SDB: [] };
      ["P", "R", "SDB"].forEach((category) => {
        if (selectAllMode) {
          const categoryQuestions = getQuestionsForConstructAndCategory(construct.id, category);
          newSelectedQuestions[constructId][category] = categoryQuestions.map((q) => q.id);
        } else {
          const limit =
            changedCategory === category ? newCount : questionCounts[category] || 0;
          if (limit > 0) {
            const categoryQuestions = getQuestionsForConstructAndCategory(construct.id, category);
            newSelectedQuestions[constructId][category] = categoryQuestions
              .slice(0, limit)
              .map((q) => q.id);
          }
        }
      });
    });
    setSelectedQuestions(newSelectedQuestions);
  };

  useEffect(() => {
    if (
      questions.length > 0 &&
      constructsForSelectedClusters.length > 0
    ) {
      if (selectAllMode) {
        autoSelectQuestions();
      } else {
        const hasCounts = Object.values(questionCounts).some((c) => c > 0);
        if (hasCounts) autoSelectQuestions();
      }
    }
  }, [
    questions.length,
    questionCounts.P,
    questionCounts.R,
    questionCounts.SDB,
    selectedClusterIds.join(","),
    selectAllMode,
  ]);

  const handleClusterCheckboxChange = (clusterId, checked) => {
    const id = parseInt(clusterId);
    if (checked) {
      setSelectedClusterIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelectedClusterIds((prev) => prev.filter((cid) => cid !== id));
      const constructIdsInCluster = constructs
        .filter((c) => c.clusterId === id)
        .map((c) => c.id);
      setSelectedConstructIds((prev) =>
        prev.filter((cid) => !constructIdsInCluster.includes(cid))
      );
    }
  };

  const handleConstructCheckboxChange = (constructId, checked) => {
    const id = parseInt(constructId);
    if (checked) {
      setSelectedConstructIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelectedConstructIds((prev) => prev.filter((cid) => cid !== id));
    }
  };

  const handleAddCluster = (clusterId) => {
    if (!clusterId) return;
    const clusterIdNum = parseInt(clusterId);
    if (selectedClusterIds.includes(clusterIdNum)) return;
    setSelectedClusterIds([...selectedClusterIds, clusterIdNum]);
    setSelectedClusterDropdown("");
  };

  const handleRemoveCluster = (clusterId) => {
    const clusterIdNum = parseInt(clusterId);
    const newClusterIds = selectedClusterIds.filter((id) => id !== clusterIdNum);
    setSelectedClusterIds(newClusterIds);
    const validConstructIds = constructs
      .filter((c) => newClusterIds.includes(c.clusterId))
      .map((c) => c.id.toString());
    setSelectedQuestions((prev) => {
      const cleaned = {};
      validConstructIds.forEach((constructId) => {
        if (prev[constructId]) cleaned[constructId] = prev[constructId];
      });
      return cleaned;
    });
  };

  const handleQuestionCountChange = (category, value) => {
    const count = parseInt(value) || 0;
    setQuestionCounts((prev) => ({ ...prev, [category]: count }));
    autoSelectQuestions(category, count);
    setQuestionSelectionError("");
  };

  const handleSelectAllModeToggle = (enabled) => {
    setSelectAllMode(enabled);
    if (enabled) {
      setQuestionCounts({ P: 0, R: 0, SDB: 0 });
      setQuestionSelectionError("");
      setErrorConstructInfo(null);
      autoSelectQuestions();
    } else {
      setSelectedQuestions({});
      setQuestionSelectionError("");
      setErrorConstructInfo(null);
    }
  };

  const handleToggleSkipConstruct = (constructId) => {
    const constructIdStr = constructId.toString();
    setSkippedConstructs((prev) =>
      prev.includes(constructIdStr)
        ? prev.filter((id) => id !== constructIdStr)
        : [...prev, constructIdStr]
    );
    if (errorConstructInfo && errorConstructInfo.constructId === constructId) {
      setQuestionSelectionError("");
      setErrorConstructInfo(null);
    }
  };

  const handleQuestionToggle = (questionId, constructId, category) => {
    const currentSelected = selectedQuestions[constructId]?.[category] || [];
    const limit = questionCounts[category] || 0;
    const isSelected = currentSelected.includes(questionId);
    if (isSelected) {
      setSelectedQuestions((prev) => ({
        ...prev,
        [constructId]: {
          ...(prev[constructId] || {}),
          [category]: currentSelected.filter((id) => id !== questionId),
        },
      }));
      setQuestionSelectionError("");
    } else {
      if (!selectAllMode && currentSelected.length >= limit) {
        setQuestionSelectionError(
          `You can only select ${limit} ${category} question(s) for this construct.`
        );
        return;
      }
      setSelectedQuestions((prev) => ({
        ...prev,
        [constructId]: {
          ...(prev[constructId] || {}),
          [category]: [...currentSelected, questionId],
        },
      }));
      setQuestionSelectionError("");
    }
  };

  const validateQuestionSelection = () => {
    for (const construct of constructsForSelectedClusters) {
      const constructId = construct.id.toString();
      if (skippedConstructs.includes(constructId)) continue;
      const selected = selectedQuestions[constructId] || {};
      for (const category of ["P", "R", "SDB"]) {
        const required = questionCounts[category] || 0;
        const selectedCount = selected[category]?.length || 0;
        if (required > 0 && selectedCount !== required) {
          setErrorConstructInfo({
            constructId: construct.id,
            constructName: construct.name,
            category,
          });
          return `Please ensure ${required} ${category} question(s) are selected for construct "${construct.name}".`;
        }
      }
    }
    setErrorConstructInfo(null);
    return null;
  };

  const scrollToConstruct = (constructId) => {
    const el = document.getElementById(`construct-${constructId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-blue-400");
      setTimeout(() => el.classList.remove("ring-2", "ring-blue-400"), 2000);
    }
  };

  const handleDownloadTemplate = async () => {
    setTemplateDownloading(true);
    setError(null);
    try {
      const ageGroupId = localStorage.getItem("adminSelectedVariantId") || "1";
      const response = await apiClient.get("/tests/questions/template", {
        params: { age_group_id: ageGroupId },
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `test-questions-template-${ageGroupId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading template:", err);
      setError(err.response?.data?.message || err.message || "Failed to download template.");
    } finally {
      setTemplateDownloading(false);
    }
  };

  const add = async () => {
    const useExcelImport = addSource === "excel";
    const errors = {};
    if (!title.trim()) errors.title = "Title is required";
    if (!testType || (testType !== "src pro" && testType !== "cerc")) {
      errors.test_type = "Please select a type";
    }
    if (testType === "cerc" && !previousTestId) {
      errors.previous_test_id = "Please select a previous test";
    }
    if (addSource === "cluster") {
      if (selectedClusterIds.length === 0) errors.cluster_ids = "At least one cluster is required";
      if (isCercWithPreviousTest && selectedConstructIds.length === 0) {
        errors.cluster_ids = errors.cluster_ids || "Select at least one construct under the selected cluster(s).";
      }
    } else {
      if (!excelTestFile) errors.excel_file = "Please upload an Excel file";
    }

    if (
      !useExcelImport &&
      !selectAllMode &&
      selectedClusterIds.length > 0 &&
      constructsForSelectedClusters.length > 0
    ) {
      const activeConstructs = constructsForSelectedClusters.filter(
        (c) => !skippedConstructs.includes(c.id.toString())
      );
      if (activeConstructs.length > 0) {
        const hasQuestionCounts = Object.values(questionCounts).some((c) => c > 0);
        if (!hasQuestionCounts) {
          setQuestionSelectionError(
            "Please specify at least one question count (P, R, or SDB) per construct, or enable 'Select All Questions'."
          );
          setFieldErrors(errors);
          return;
        }
      }
    }

    if (!useExcelImport && !selectAllMode) {
      const questionValidationError = validateQuestionSelection();
      if (questionValidationError) {
        setQuestionSelectionError(questionValidationError);
        setFieldErrors(errors);
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setQuestionSelectionError("");
    setActionLoading(true);

    try {
      if (useExcelImport) {
        const formData = new FormData();
        formData.append("questions_file", excelTestFile);
        formData.append("title", title.trim());
        formData.append("description", description.trim() || "");
        formData.append(
          "is_active",
          status === "active" || status === "1" || status === 1 ? "1" : "0"
        );
        selectedClusterIds.forEach((id) => formData.append("cluster_ids[]", id));
        if (selectedConstructIds.length > 0) {
          selectedConstructIds.forEach((id) => formData.append("construct_ids[]", id));
        }
        formData.append("source", testType === "cerc" ? "CERC" : "SC Pro");
        if (testType === "cerc" && previousTestId) {
          formData.append("sc_pro_test_id", String(previousTestId));
        }
        const response = await apiClient.post("/tests", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.data?.status && response.data.data) {
          setSuccess("Test created successfully from Excel!");
          setTimeout(() => navigate("/admin/dashboard/master/tests"), 1500);
        } else {
          setError(response.data?.message || "Failed to create test from Excel");
        }
      } else {
        const validConstructIds = constructsForSelectedClusters.map((c) => c.id.toString());
        const allSelectedQuestionIds = [];
        for (const constructId of validConstructIds) {
          const selected = selectedQuestions[constructId];
          if (selected) {
            for (const category of ["P", "R", "SDB"]) {
              if (selected[category] && Array.isArray(selected[category])) {
                allSelectedQuestionIds.push(...selected[category]);
              }
            }
          }
        }
        const clustersArray = selectedClusterIds.map((clusterId) => ({
          cluster_id: parseInt(clusterId),
          p_count: selectAllMode ? null : questionCounts.P || null,
          r_count: selectAllMode ? null : questionCounts.R || null,
          sdb_count: selectAllMode ? null : questionCounts.SDB || null,
        }));
        const payload = {
          title: title.trim(),
          description: description.trim() || "",
          is_active: status === "active" || status === "1" || status === 1,
          question_ids: allSelectedQuestionIds,
          clusters: clustersArray,
          cluster_ids: selectedClusterIds,
          construct_ids: isCercWithPreviousTest
            ? selectedConstructIds
            : constructsForSelectedClusters.map((c) => c.id),
          source: testType === "cerc" ? "CERC" : "SC Pro",
        };
        if (testType === "cerc" && previousTestId) {
          payload.sc_pro_test_id = parseInt(previousTestId, 10) || previousTestId;
        }
        const response = await apiClient.post("/tests", payload);
        if (response.data?.status && response.data.data) {
          setSuccess("Test created successfully!");
          setTimeout(() => navigate("/admin/dashboard/master/tests"), 1500);
        } else {
          setError(response.data?.message || "Failed to create test");
        }
      }
    } catch (err) {
      console.error("Error creating test:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message || "Failed to create test. Please try again."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard/master/tests");
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

      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-ghost flex items-center gap-2"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back to Tests
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="p-6 primary-bg-light">
            <h1 className="text-xl font-bold primary-text">Create New Test</h1>
          </div>

          <div className="p-6 bg-gray-50/80">
            {Object.keys(fieldErrors).length > 0 && (
              <div
                id="form-errors"
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-700 text-sm">
                  Please fix the errors below before submitting.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: "" }));
                    }}
                    placeholder="Enter test title"
                    disabled={actionLoading}
                    className={`input w-full ${fieldErrors.title ? "input-error" : ""}`}
                  />
                  {fieldErrors.title && (
                    <p className="text-red-600 text-xs mt-1.5">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">Status</label>
                  {statusOptionsLoading ? (
                    <div className="h-[42px] flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg">
                      <span className="spinner spinner-sm mr-2" />
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <div className="h-[42px] flex items-center bg-gray-100 border border-gray-200 rounded-lg px-4">
                      <label className="flex items-center justify-between cursor-pointer w-full">
                        <span className="font-medium text-sm">
                          {statusOptions.find((o) => o.value === status)?.label ||
                            (status === "active" ? "Active" : "Inactive")}
                        </span>
                        <input
                          type="checkbox"
                          checked={status === "active" || status === "1" || status === 1}
                          onChange={(e) => {
                            const isActive = e.target.checked;
                            const activeOpt = statusOptions.find(
                              (o) =>
                                o.label?.toLowerCase().includes("active") || o.value === "active"
                            );
                            const inactiveOpt = statusOptions.find(
                              (o) =>
                                o.label?.toLowerCase().includes("inactive") ||
                                o.value === "inactive"
                            );
                            setStatus(
                              isActive
                                ? activeOpt?.value || "active"
                                : inactiveOpt?.value || "inactive"
                            );
                          }}
                          className="sr-only"
                          disabled={actionLoading}
                        />
                        <div
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            status === "active" || status === "1" || status === 1
                              ? "bg-green-500"
                              : "bg-red-400"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                              status === "active" || status === "1" || status === 1
                                ? "translate-x-7"
                                : "translate-x-0"
                            }`}
                          />
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold neutral-text block mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={testType}
                    onChange={(e) => {
                      setTestType(e.target.value);
                      if (e.target.value !== "cerc") setPreviousTestId("");
                      if (fieldErrors.test_type) setFieldErrors((p) => ({ ...p, test_type: "" }));
                      if (fieldErrors.previous_test_id)
                        setFieldErrors((p) => ({ ...p, previous_test_id: "" }));
                    }}
                    disabled={actionLoading}
                    className={`input w-full pr-10 ${fieldErrors.test_type ? "input-error" : ""}`}
                  >
                    <option value="">Select type</option>
                    <option value="src pro">src pro</option>
                    <option value="cerc">cerc</option>
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
                {fieldErrors.test_type && (
                  <p className="text-red-600 text-xs mt-1.5">{fieldErrors.test_type}</p>
                )}
              </div>

              {testType === "cerc" && (
                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Previous tests <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={previousTestId}
                      onChange={(e) => {
                        setPreviousTestId(e.target.value);
                        if (fieldErrors.previous_test_id)
                          setFieldErrors((p) => ({ ...p, previous_test_id: "" }));
                      }}
                      disabled={actionLoading}
                      className={`input w-full pr-10 ${fieldErrors.previous_test_id ? "input-error" : ""}`}
                    >
                      <option value="">Select a test</option>
                      {items
                        .filter(
                          (t) =>
                            (t.test_type ?? t.type) === "src pro" ||
                            (t.test_type ?? t.type) == null
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title || `Test #${t.id}`}
                          </option>
                        ))}
                    </select>
                    <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                  {fieldErrors.previous_test_id && (
                    <p className="text-red-600 text-xs mt-1.5">
                      {fieldErrors.previous_test_id}
                    </p>
                  )}
                </div>
              )}

              {testType === "cerc" && previousTestId && (
                <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <label className="text-sm font-semibold neutral-text block">
                    Clusters <span className="text-red-500">*</span>
                  </label>
                  {clustersLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="spinner spinner-sm" />
                      Loading clusters...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clusters.map((cluster) => {
                        const isClusterChecked = selectedClusterIds.includes(cluster.id);
                        const constructsInCluster = constructs.filter(
                          (c) => c.clusterId === cluster.id
                        );
                        return (
                          <div
                            key={cluster.id}
                            className="border border-gray-200 rounded-lg p-3 space-y-3"
                          >
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isClusterChecked}
                                onChange={(e) =>
                                  handleClusterCheckboxChange(cluster.id, e.target.checked)
                                }
                                disabled={actionLoading}
                                className="rounded border-gray-300"
                              />
                              <span className="font-medium text-sm">{cluster.name}</span>
                            </label>
                            {isClusterChecked && constructsInCluster.length > 0 && (
                              <div className="pl-6 border-l-2 border-gray-200 space-y-2">
                                <span className="text-xs font-medium text-gray-500 block">
                                  Constructs
                                </span>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                  {constructsInCluster.map((construct) => (
                                    <label
                                      key={construct.id}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedConstructIds.includes(construct.id)}
                                        onChange={(e) =>
                                          handleConstructCheckboxChange(
                                            construct.id,
                                            e.target.checked
                                          )}
                                        disabled={actionLoading}
                                        className="rounded border-gray-300"
                                      />
                                      <span className="text-sm">{construct.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {fieldErrors.cluster_ids && (
                    <p className="text-red-600 text-xs mt-2">{fieldErrors.cluster_ids}</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-semibold neutral-text block mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter test description"
                  rows={3}
                  disabled={actionLoading}
                  className="input w-full resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold neutral-text block">
                  How do you want to add this test?
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="addSource"
                      value="cluster"
                      checked={addSource === "cluster"}
                      onChange={() => {
                        setAddSource("cluster");
                        if (fieldErrors.excel_file) setFieldErrors((p) => ({ ...p, excel_file: "" }));
                      }}
                      disabled={actionLoading}
                      className="radio"
                    />
                    <span className="text-sm">Add by selecting clusters</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="addSource"
                      value="excel"
                      checked={addSource === "excel"}
                      onChange={() => {
                        setAddSource("excel");
                        if (fieldErrors.cluster_ids)
                          setFieldErrors((p) => ({ ...p, cluster_ids: "" }));
                      }}
                      disabled={actionLoading}
                      className="radio"
                    />
                    <span className="text-sm">Add by uploading Excel</span>
                  </label>
                </div>
              </div>

              {addSource === "cluster" && !isCercWithPreviousTest && (
                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Clusters <span className="text-red-500">*</span>
                  </label>
                  {clustersLoading ? (
                    <div className="h-[42px] flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg">
                      <span className="spinner spinner-sm mr-2" />
                      <span className="text-sm text-gray-500">Loading clusters...</span>
                    </div>
                  ) : clusters.length === 0 ? (
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">No clusters available.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={selectedClusterDropdown}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v) handleAddCluster(v);
                          }}
                          disabled={actionLoading}
                          className="input w-full pr-10"
                        >
                          <option value="">Select a cluster</option>
                          {clusters
                            .filter((c) => !selectedClusterIds.includes(c.id))
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                        <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      </div>
                      {selectedClusterIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedClusterIds.map((clusterId) => {
                            const cluster = clusters.find((c) => c.id === clusterId);
                            if (!cluster) return null;
                            return (
                              <div
                                key={clusterId}
                                className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2"
                              >
                                <span className="font-medium text-sm">{cluster.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCluster(clusterId)}
                                  disabled={actionLoading}
                                  className="btn btn-ghost btn-icon-sm"
                                >
                                  <HiX className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {fieldErrors.cluster_ids && (
                    <p className="text-red-600 text-xs mt-2">{fieldErrors.cluster_ids}</p>
                  )}
                </div>
              )}

              {addSource === "cluster" && isCercWithPreviousTest && (
                <p className="text-sm text-gray-600">
                  Clusters and constructs are selected above (under Previous tests).
                </p>
              )}

              {addSource === "excel" && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="text-sm font-semibold neutral-text">
                      Upload from Excel <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      disabled={templateDownloading}
                      className="btn btn-secondary"
                    >
                      {templateDownloading ? (
                        <span className="spinner spinner-sm" />
                      ) : (
                        <HiDownload className="w-4 h-4 mr-2" />
                      )}
                      Download template
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      setExcelTestFile(e.target.files?.[0] || null);
                      if (fieldErrors.excel_file)
                        setFieldErrors((p) => ({ ...p, excel_file: "" }));
                    }}
                    className={`input w-full ${fieldErrors.excel_file ? "input-error" : ""}`}
                  />
                  {excelTestFile && !fieldErrors.excel_file && (
                    <p className="text-xs text-gray-500 mt-1.5">{excelTestFile.name}</p>
                  )}
                  {fieldErrors.excel_file && (
                    <p className="text-red-600 text-xs mt-1.5">{fieldErrors.excel_file}</p>
                  )}
                </div>
              )}

              {addSource === "cluster" &&
                selectedClusterIds.length > 0 && (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold neutral-text">
                        Question Selection (Common for all constructs)
                      </label>
                      {questionsLoading && (
                        <span className="text-xs text-gray-500">
                          <span className="spinner spinner-sm mr-2" />
                          Loading questions...
                        </span>
                      )}
                    </div>

                    {questionSelectionError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-red-700 text-sm flex-1">{questionSelectionError}</p>
                          {errorConstructInfo && (
                            <button
                              type="button"
                              onClick={() => scrollToConstruct(errorConstructInfo.constructId)}
                              className="btn btn-sm btn-outline-danger whitespace-nowrap"
                            >
                              Go to {errorConstructInfo.constructName}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {constructsForSelectedClusters.length === 0 && !constructsLoading && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          No constructs found for the selected clusters.
                        </p>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold neutral-text mb-1">Select All Questions</h4>
                          <p className="text-xs text-gray-500">
                            Enable to select all available questions without specifying counts
                          </p>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input
                            type="checkbox"
                            checked={selectAllMode}
                            onChange={(e) => handleSelectAllModeToggle(e.target.checked)}
                            disabled={
                              actionLoading || constructsForSelectedClusters.length === 0
                            }
                            className="sr-only"
                          />
                          <div
                            className={`relative w-14 h-7 rounded-full transition-colors ${
                              selectAllMode ? "bg-blue-500" : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                                selectAllMode ? "translate-x-7" : "translate-x-0"
                              }`}
                            />
                          </div>
                        </label>
                      </div>
                    </div>

                    {!selectAllMode && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold neutral-text mb-4">
                          Questions per Construct <span className="text-red-500">*</span>
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          {["P", "R", "SDB"].map((category) => (
                            <div key={category}>
                              <label className="text-xs font-medium text-gray-500 block mb-1">
                                {category} Questions
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={questionCounts[category] || ""}
                                onChange={(e) =>
                                  handleQuestionCountChange(category, e.target.value)
                                }
                                placeholder="0"
                                disabled={
                                  actionLoading || constructsForSelectedClusters.length === 0
                                }
                                className="input w-full text-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">Per construct</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {constructsForSelectedClusters.length > 0 &&
                      (selectAllMode ||
                        Object.values(questionCounts).some((c) => c > 0)) && (
                      <div className="space-y-4">
                        {constructsForSelectedClusters.map((construct) => {
                          const constructId = construct.id.toString();
                          const selected = selectedQuestions[constructId] || {
                            P: [],
                            R: [],
                            SDB: [],
                          };
                          const isSkipped = skippedConstructs.includes(constructId);

                          return (
                            <div
                              id={`construct-${construct.id}`}
                              key={construct.id}
                              className={`bg-white border rounded-lg p-4 space-y-4 ${
                                isSkipped ? "border-gray-300 opacity-60" : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold neutral-text">
                                  {construct.name}
                                  {isSkipped && (
                                    <span className="ml-2 text-xs text-gray-500">(Skipped)</span>
                                  )}
                                </h4>
                                <label className="flex items-center gap-2 cursor-pointer relative">
                                  <span className="text-xs text-gray-500">Skip this construct</span>
                                  <input
                                    type="checkbox"
                                    checked={isSkipped}
                                    onChange={() => handleToggleSkipConstruct(construct.id)}
                                    disabled={actionLoading}
                                    className="sr-only"
                                  />
                                  <div
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                      isSkipped ? "bg-gray-400" : "bg-gray-300"
                                    }`}
                                  >
                                    <div
                                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                        isSkipped ? "translate-x-6" : "translate-x-0"
                                      }`}
                                    />
                                  </div>
                                </label>
                              </div>

                              {!isSkipped && (
                                <div className="space-y-3">
                                  {["P", "R", "SDB"].map((category) => {
                                    const limit = selectAllMode
                                      ? null
                                      : questionCounts[category] || 0;
                                    if (!selectAllMode && (!limit || limit === 0)) return null;
                                    const categoryQuestions = getQuestionsForConstructAndCategory(
                                      construct.id,
                                      category
                                    );
                                    const selectedForCategory = selected[category] || [];

                                    return (
                                      <div
                                        key={category}
                                        className="border border-gray-200 rounded-lg p-3"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium">
                                            {category} Questions{" "}
                                            {selectAllMode
                                              ? `(${selectedForCategory.length} selected)`
                                              : `(${selectedForCategory.length}/${limit} selected)`}
                                          </span>
                                        </div>
                                        {categoryQuestions.length === 0 ? (
                                          <p className="text-xs text-gray-500">
                                            No {category} questions for this construct.
                                          </p>
                                        ) : (
                                          <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {categoryQuestions.map((question) => {
                                              const isSelected =
                                                selectedForCategory.includes(question.id);
                                              const isDisabled =
                                                !selectAllMode &&
                                                !isSelected &&
                                                selectedForCategory.length >= limit;

                                              return (
                                                <label
                                                  key={question.id}
                                                  className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${
                                                    isSelected
                                                      ? "bg-blue-50 border-blue-300"
                                                      : isDisabled
                                                        ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                                                        : "bg-white border-gray-200 hover:border-blue-200"
                                                  }`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                      handleQuestionToggle(
                                                        question.id,
                                                        constructId,
                                                        category
                                                      )
                                                    }
                                                    disabled={
                                                      isDisabled || actionLoading
                                                    }
                                                    className="mt-1"
                                                  />
                                                  <span className="text-xs flex-1">
                                                    {question.question_text}
                                                  </span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn btn-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={add}
                disabled={actionLoading}
                className="btn btn-warning shadow-md"
              >
                {actionLoading ? (
                  <>
                    <span className="spinner spinner-sm mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <HiPlus className="w-4 h-4 mr-2" /> Add Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
