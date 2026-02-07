import React, { useEffect, useState } from "react";
import apiClient from "../../config/api";
import { useNavigate } from "react-router-dom";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
  HiChevronDown,
  HiCollection,
  HiEye,
  HiSearch,
} from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

export default function AdminMasterTests() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clustersLoading, setClustersLoading] = useState(true);
  const [statusOptionsLoading, setStatusOptionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [selectedClusterIds, setSelectedClusterIds] = useState([]);
  const [selectedClusterDropdown, setSelectedClusterDropdown] = useState("");
  const [constructs, setConstructs] = useState([]);
  const [constructsLoading, setConstructsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  // Common counts for all constructs: { P: count, R: count, SDB: count }
  const [questionCounts, setQuestionCounts] = useState({ P: 0, R: 0, SDB: 0 });
  // Structure: { constructId: { P: [questionIds], R: [questionIds], SDB: [questionIds] } }
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [questionSelectionError, setQuestionSelectionError] = useState("");
  const [errorConstructInfo, setErrorConstructInfo] = useState(null); // { constructId, constructName, category }
  const [skippedConstructs, setSkippedConstructs] = useState([]); // Array of construct IDs to skip
  const [selectAllMode, setSelectAllMode] = useState(false); // Toggle for selecting all questions 

  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [actionLoading, setActionLoading] = useState({
    create: false,
    update: false,
    delete: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    test: null,
    loading: false,
  });
  const [isClosingView, setIsClosingView] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isClosingForm, setIsClosingForm] = useState(false);

  const fetchStatusOptions = async () => {
    try {
      const response = await apiClient.get("/options");
      if (response.data?.status && response.data.data) {
        // Filter options for status (you may need to adjust the filter based on your API structure)
        // Assuming status options have a specific category or label pattern
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
        
        // If no status options found, use default options
        if (statusOpts.length === 0) {
          setStatusOptions([
            { id: 1, label: "Active", value: "active" },
            { id: 2, label: "Inactive", value: "inactive" },
          ]);
        } else {
          setStatusOptions(statusOpts);
        }
        setError(null);
      } else {
        // Default status options if API fails
        setStatusOptions([
          { id: 1, label: "Active", value: "active" },
          { id: 2, label: "Inactive", value: "inactive" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching status options:", err);
      // Default status options on error
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

  const fetchTests = async () => {
    try {
      const response = await apiClient.get("/tests");
      if (response.data?.status && response.data.data) {
        setItems(
          response.data.data.map((t) => ({
            id: t.id,
            title: t.title || "",
            description: t.description || "",
            is_active: t.is_active !== undefined ? t.is_active : true,
            cluster_ids: t.cluster_ids || [],
            clusters: t.clusters || [],
          }))
        );
        setError(null);
      } else {
        setError("Failed to load tests");
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
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
            "Failed to load tests. Please try again."
        );
      }
    } finally {
      setLoading(false);
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
      // Age group ID will be automatically added by API interceptor from localStorage
      const response = await apiClient.get("/questions");

      if (response.data?.status && response.data.data) {
        // Filter questions by selected clusters
        const filteredQuestions = response.data.data.filter((q) => {
          const construct = constructs.find((c) => c.id === q.construct_id);
          if (!construct) return false;
          return selectedClusterIds.includes(construct.clusterId);
        });

        setQuestions(
          filteredQuestions
           .filter(q => q.is_active === 1)
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
    if (selectedClusterIds.length > 0 && constructs.length > 0) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClusterIds.join(",")]);

  // Clean up selected questions when clusters change
  useEffect(() => {
    if (selectedClusterIds.length > 0 && constructs.length > 0) {
      const validConstructIds = constructsForSelectedClusters.map((c) => c.id.toString());
      
      setSelectedQuestions((prev) => {
        const cleaned = {};
        validConstructIds.forEach((constructId) => {
          if (prev[constructId]) {
            cleaned[constructId] = prev[constructId];
          }
        });
        return cleaned;
      });
    } else {
      setSelectedQuestions({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClusterIds.join(",")]);

  // Auto-select questions when counts change or questions are loaded
  useEffect(() => {
    if (questions.length > 0 && constructsForSelectedClusters.length > 0) {
      if (selectAllMode) {
        autoSelectQuestions();
      } else {
        const hasCounts = Object.values(questionCounts).some(count => count > 0);
        if (hasCounts) {
          autoSelectQuestions();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, questionCounts.P, questionCounts.R, questionCounts.SDB, selectedClusterIds.join(","), selectAllMode]);

  const handleAddCluster = (clusterId) => {
    if (!clusterId) return;

    const clusterIdNum = parseInt(clusterId);
    if (selectedClusterIds.includes(clusterIdNum)) {
      return;
    }

    setSelectedClusterIds([...selectedClusterIds, clusterIdNum]);
    setSelectedClusterDropdown("");
  };

  const handleRemoveCluster = (clusterId) => {
    const clusterIdNum = parseInt(clusterId);
    const newClusterIds = selectedClusterIds.filter((id) => id !== clusterIdNum);
    setSelectedClusterIds(newClusterIds);
    
    // Clean up selected questions for constructs that are no longer in selected clusters
    const validConstructIds = constructs
      .filter((c) => newClusterIds.includes(c.clusterId))
      .map((c) => c.id.toString());
    
    setSelectedQuestions((prev) => {
      const cleaned = {};
      validConstructIds.forEach((constructId) => {
        if (prev[constructId]) {
          cleaned[constructId] = prev[constructId];
        }
      });
      return cleaned;
    });
  };

  const add = async () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = "Title is required";
    }
    if (selectedClusterIds.length === 0) {
      errors.cluster_ids = "At least one cluster is required";
    }

    // Validate that question counts are set (only if not in select all mode)
    if (!selectAllMode && selectedClusterIds.length > 0 && constructsForSelectedClusters.length > 0) {
      const activeConstructs = constructsForSelectedClusters.filter(
        (c) => !skippedConstructs.includes(c.id.toString())
      );
      
      if (activeConstructs.length > 0) {
        const hasQuestionCounts = Object.values(questionCounts).some(count => count > 0);
        if (!hasQuestionCounts) {
          setQuestionSelectionError("Please specify at least one question count (P, R, or SDB) per construct, or enable 'Select All Questions'.");
          setFieldErrors(errors);
          setTimeout(() => {
            const errorElement = document.getElementById('question-selection-error');
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          return;
        }
      }
    }

    // Validate question selection (only if not in select all mode)
    if (!selectAllMode) {
      const questionValidationError = validateQuestionSelection();
      if (questionValidationError) {
        setQuestionSelectionError(questionValidationError);
        setFieldErrors(errors);
        // Scroll to error after a short delay to allow state update
        setTimeout(() => {
          const errorElement = document.getElementById('question-selection-error') || 
                              document.getElementById('form-errors') ||
                              document.querySelector('[class*="danger-text"]');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to first error after a short delay
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.getElementById(`error-${firstErrorField}`) ||
                            document.querySelector(`[class*="input-error"]`) ||
                            document.getElementById('form-errors');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setFieldErrors({});
    setQuestionSelectionError("");
    setActionLoading({ ...actionLoading, create: true });

    try {
      // Collect only selected question IDs from constructs in selected clusters
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

      // Build clusters array with P, R, SDB counts for each cluster
      const clustersArray = selectedClusterIds.map((clusterId) => ({
        cluster_id: parseInt(clusterId),
        p_count: selectAllMode ? null : (questionCounts.P || null),
        r_count: selectAllMode ? null : (questionCounts.R || null),
        sdb_count: selectAllMode ? null : (questionCounts.SDB || null),
      }));

      // Build payload with all required fields
      // Age group ID will be automatically added by API interceptor from localStorage
      // Note: Only send 'clusters' array, not 'cluster_ids', to avoid duplicates in backend
      const payload = {
        title: title.trim(),
        description: description.trim() || "",
        is_active: status === "active" || status === "1" || status === 1,
        question_ids: allSelectedQuestionIds,
        clusters: clustersArray,
      };

      const response = await apiClient.post("/tests", payload);

      if (response.data?.status && response.data.data) {
        const newTest = response.data.data;
        setItems([
          ...items,
          {
            id: newTest.id,
            title: newTest.title || "",
            description: newTest.description || "",
            is_active:
              newTest.is_active !== undefined ? newTest.is_active : true,
            cluster_ids: newTest.cluster_ids || [],
            clusters: newTest.clusters || [],
          },
        ]);

        resetForm();
        setShowForm(false);
        setError(null);
        setSuccess("Test created successfully!");
      } else {
        setError(response.data?.message || "Failed to create test");
      }
    } catch (err) {
      console.error("Error creating test:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to create test. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, create: false });
    }
  };

  const handleDeleteClick = (id, title) => {
    setDeleteConfirm({ isOpen: true, id, name: title || "this test" });
  };

  const closeViewModal = () => {
    setIsClosingView(true);
    setTimeout(() => {
      setIsClosingView(false);
      setViewModal({ isOpen: false, test: null, loading: false });
    }, 220);
  };

  const openViewModal = async (testId) => {
    setViewModal({ isOpen: true, test: null, loading: true });
    try {
      const response = await apiClient.get(`/tests/${testId}`);
      if (response.data?.status && response.data.data) {
        setViewModal({
          isOpen: true,
          test: response.data.data,
          loading: false,
        });
      } else {
        setViewModal({ isOpen: false, test: null, loading: false });
        setError(response.data?.message || "Failed to load test details");
      }
    } catch (err) {
      console.error("Error fetching test details:", err);
      setViewModal({ isOpen: false, test: null, loading: false });
      setError(
        err.response?.data?.message ||
          "Failed to load test details. Please try again."
      );
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setStatus(item.is_active !== undefined && item.is_active ? "active" : "inactive");

    const clusterIds =
      item.cluster_ids ||
      (item.clusters || []).map((c) => c.cluster_id || c.clusterId);
    setSelectedClusterIds(clusterIds);
    setShowForm(true);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("active");
    setSelectedClusterIds([]);
    setSelectedClusterDropdown("");
    setQuestionCounts({ P: 0, R: 0, SDB: 0 });
    setSelectedQuestions({});
    setQuestionSelectionError("");
    setErrorConstructInfo(null);
    setSkippedConstructs([]);
    setSelectAllMode(false);
    setFieldErrors({});
    setEditingId(null);
  };

  // Get constructs for selected clusters
  const constructsForSelectedClusters = constructs.filter((c) =>
    selectedClusterIds.includes(c.clusterId)
  );

  // Handle question count change (common for all constructs)
  const handleQuestionCountChange = (category, value) => {
    const count = parseInt(value) || 0;
    setQuestionCounts((prev) => ({
      ...prev,
      [category]: count,
    }));
    
    // Auto-select questions for all constructs
    autoSelectQuestions(category, count);
    setQuestionSelectionError("");
  };

  // Auto-select questions for all constructs based on counts
  const autoSelectQuestions = (changedCategory = null, newCount = null) => {
    if (constructsForSelectedClusters.length === 0 || questions.length === 0) {
      return;
    }

    const newSelectedQuestions = {};
    
    constructsForSelectedClusters.forEach((construct) => {
      const constructId = construct.id.toString();
      // Skip if construct is in skipped list
      if (skippedConstructs.includes(constructId)) {
        // Keep existing selections if any
        newSelectedQuestions[constructId] = selectedQuestions[constructId] || { P: [], R: [], SDB: [] };
        return;
      }
      
      newSelectedQuestions[constructId] = { P: [], R: [], SDB: [] };
      
      ["P", "R", "SDB"].forEach((category) => {
        if (selectAllMode) {
          // Select all questions for this category
          const categoryQuestions = getQuestionsForConstructAndCategory(
            construct.id,
            category
          );
          newSelectedQuestions[constructId][category] = categoryQuestions.map((q) => q.id);
        } else {
          const limit = changedCategory === category 
            ? newCount 
            : questionCounts[category] || 0;
          
          if (limit > 0) {
            const categoryQuestions = getQuestionsForConstructAndCategory(
              construct.id,
              category
            );
            // Auto-select first N questions
            const selected = categoryQuestions.slice(0, limit).map((q) => q.id);
            newSelectedQuestions[constructId][category] = selected;
          }
        }
      });
    });
    
    setSelectedQuestions(newSelectedQuestions);
  };

  // Handle select all mode toggle
  const handleSelectAllModeToggle = (enabled) => {
    setSelectAllMode(enabled);
    if (enabled) {
      // Clear question counts and select all questions
      setQuestionCounts({ P: 0, R: 0, SDB: 0 });
      setQuestionSelectionError(""); // Clear any existing errors
      setErrorConstructInfo(null);
      autoSelectQuestions();
    } else {
      // Reset to count-based selection
      setSelectedQuestions({});
      setQuestionSelectionError(""); // Clear any existing errors
      setErrorConstructInfo(null);
    }
  };

  // Toggle skip for a construct
  const handleToggleSkipConstruct = (constructId) => {
    const constructIdStr = constructId.toString();
    setSkippedConstructs((prev) => {
      if (prev.includes(constructIdStr)) {
        // Remove from skipped list
        return prev.filter((id) => id !== constructIdStr);
      } else {
        // Add to skipped list
        return [...prev, constructIdStr];
      }
    });
    // Clear error if this construct was causing it
    if (errorConstructInfo && errorConstructInfo.constructId === constructId) {
      setQuestionSelectionError("");
      setErrorConstructInfo(null);
    }
  };

  // Handle question selection
  const handleQuestionToggle = (questionId, constructId, category) => {
    const currentSelected = selectedQuestions[constructId]?.[category] || [];
    const limit = questionCounts[category] || 0; // Fixed: use common counts, not per-construct
    const isSelected = currentSelected.includes(questionId);

    if (isSelected) {
      // Deselect
      setSelectedQuestions((prev) => ({
        ...prev,
        [constructId]: {
          ...prev[constructId] || {},
          [category]: currentSelected.filter((id) => id !== questionId),
        },
      }));
      setQuestionSelectionError("");
    } else {
      // Try to select
      if (currentSelected.length >= limit) {
        setQuestionSelectionError(
          `You can only select ${limit} ${category} question(s) for this construct. Please unselect another ${category} question first.`
        );
        return;
      }
      setSelectedQuestions((prev) => ({
        ...prev,
        [constructId]: {
          ...prev[constructId] || {},
          [category]: [...currentSelected, questionId],
        },
      }));
      setQuestionSelectionError("");
    }
  };

  // Get questions for a construct and category
  const getQuestionsForConstructAndCategory = (constructId, category) => {
    return questions.filter(
      (q) => q.construct_id === constructId && q.category?.toUpperCase() === category.toUpperCase()
    );
  };

  // Check if all required questions are selected
  const validateQuestionSelection = () => {
    for (const construct of constructsForSelectedClusters) {
      const constructId = construct.id.toString();
      
      // Skip validation if this construct is in the skipped list
      if (skippedConstructs.includes(constructId)) {
        continue;
      }
      
      const selected = selectedQuestions[constructId] || {};
      
      for (const category of ["P", "R", "SDB"]) {
        const required = questionCounts[category] || 0;
        const selectedCount = selected[category]?.length || 0;
        
        if (required > 0 && selectedCount !== required) {
          // Return error with construct info for "Go to" link
          setErrorConstructInfo({
            constructId: construct.id,
            constructName: construct.name,
            category: category
          });
          return `Please ensure ${required} ${category} question(s) are selected for construct "${construct.name}".`;
        }
      }
    }
    setErrorConstructInfo(null);
    return null;
  };

  // Scroll to a specific construct section
  const scrollToConstruct = (constructId) => {
    const element = document.getElementById(`construct-${constructId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the section briefly
      element.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-400');
      }, 2000);
    }
  };

  const closeForm = () => {
    setIsClosingForm(true);
    setTimeout(() => {
      setIsClosingForm(false);
      resetForm();
      setShowForm(false);
    }, 220);
  };

  const handleCancelEdit = () => {
    closeForm();
  };

  const save = async () => {
    if (!editingId) return;

    const errors = {};
    if (!title.trim()) {
      errors.title = "Title is required";
    }
    // Clusters are not editable, so skip validation

    // Validate that question counts are set (only if not in select all mode)
    if (!selectAllMode && selectedClusterIds.length > 0 && constructsForSelectedClusters.length > 0) {
      const activeConstructs = constructsForSelectedClusters.filter(
        (c) => !skippedConstructs.includes(c.id.toString())
      );
      
      if (activeConstructs.length > 0) {
        const hasQuestionCounts = Object.values(questionCounts).some(count => count > 0);
        if (!hasQuestionCounts) {
          setQuestionSelectionError("Please specify at least one question count (P, R, or SDB) per construct, or enable 'Select All Questions'.");
          setFieldErrors(errors);
          setTimeout(() => {
            const errorElement = document.getElementById('question-selection-error');
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          return;
        }
      }
    }

    // Validate question selection (only if not in select all mode)
    if (!selectAllMode) {
      const questionValidationError = validateQuestionSelection();
      if (questionValidationError) {
        setQuestionSelectionError(questionValidationError);
        setFieldErrors(errors);
        // Scroll to error after a short delay to allow state update
        setTimeout(() => {
          const errorElement = document.getElementById('question-selection-error') || 
                              document.getElementById('form-errors') ||
                              document.querySelector('[class*="danger-text"]');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to first error after a short delay
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.getElementById(`error-${firstErrorField}`) ||
                            document.querySelector(`[class*="input-error"]`) ||
                            document.getElementById('form-errors');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setFieldErrors({});
    setQuestionSelectionError("");
    setActionLoading({ ...actionLoading, update: true });

    try {
      // Collect only selected question IDs from constructs in selected clusters (excluding skipped)
      const validConstructIds = constructsForSelectedClusters
        .filter((c) => !skippedConstructs.includes(c.id.toString()))
        .map((c) => c.id.toString());
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

      // Build clusters array with P, R, SDB counts for each cluster
      const clustersArray = selectedClusterIds.map((clusterId) => ({
        cluster_id: parseInt(clusterId),
        p_count: selectAllMode ? null : (questionCounts.P || null),
        r_count: selectAllMode ? null : (questionCounts.R || null),
        sdb_count: selectAllMode ? null : (questionCounts.SDB || null),
      }));

      // Build payload with all required fields
      // Age group ID will be automatically added by API interceptor from localStorage
      // Note: Only send 'clusters' array, not 'cluster_ids', to avoid duplicates in backend
      const payload = {
        title: title.trim(),
        description: description.trim() || "",
        is_active: status === "active" || status === "1" || status === 1,
        question_ids: allSelectedQuestionIds,
        clusters: clustersArray,
      };

      const response = await apiClient.put(`/tests/${editingId}`, payload);

      if (response.data?.status && response.data.data) {
        const updatedTest = response.data.data;
        setItems(
          items.map((item) =>
            item.id === editingId
              ? {
                  id: updatedTest.id,
                  title: updatedTest.title || "",
                  description: updatedTest.description || "",
                  is_active:
                    updatedTest.is_active !== undefined
                      ? updatedTest.is_active
                      : true,
                  cluster_ids: updatedTest.cluster_ids || [],
                  clusters: updatedTest.clusters || [],
                }
              : item
          )
        );

        resetForm();
        setShowForm(false);
        setError(null);
        setSuccess("Test updated successfully!");
      } else {
        setError(response.data?.message || "Failed to update test");
      }
    } catch (err) {
      console.error("Error updating test:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to update test. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, update: false });
    }
  };

  const del = async () => {
    if (!deleteConfirm.id) return;

    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null, name: "" });
    setActionLoading({ ...actionLoading, delete: id });

    try {
      const response = await apiClient.delete(`/tests/${id}`);

      if (
        response.data?.status ||
        response.status === 200 ||
        response.status === 204
      ) {
        const newItems = items.filter((item) => item.id !== id);
        setItems(newItems);
        setError(null);
        setSuccess("Test deleted successfully!");
      } else {
        setError(response.data?.message || "Failed to delete test");
      }
    } catch (err) {
      console.error("Error deleting test:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete test. Please try again."
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
          item.title?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        );
      })
    : items;

  // Check if all items on current page are selected
  const currentPageItems = filtered.map((item) => item.id);
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
        apiClient.delete(`/tests/${id}`)
      );
      await Promise.all(deletePromises);

      const newItems = items.filter((item) => !idsToDelete.includes(item.id));
      setItems(newItems);
      setSelectedItems([]);
      setError(null);
      setSuccess(`${idsToDelete.length} test(s) deleted successfully!`);
    } catch (err) {
      console.error("Error deleting tests:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete some tests. Please try again."
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

      {/* View Modal */}
      {(viewModal.isOpen || isClosingView) && (
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
                  View Test Details
                </h3>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >
              {viewModal.loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="spinner spinner-lg mb-3"></span>
                  <p className="text-sm neutral-text-muted">Loading test details...</p>
                </div>
              ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Title
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      {viewModal.test?.title || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Status
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      <span
                        className={`badge ${
                          viewModal.test?.is_active
                            ? "badge-accent"
                            : "badge-neutral"
                        }`}
                      >
                        {viewModal.test?.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Description
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.test?.description || "N/A"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Clusters ({viewModal.test?.cluster_ids?.length || viewModal.test?.clusters?.length || 0})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const clusterEntities =
                          (viewModal.test?.clusters && viewModal.test.clusters.length > 0
                            ? viewModal.test.clusters.map((cluster) => ({
                                id: cluster.id || cluster.cluster_id || cluster.clusterId,
                                name: cluster.name || cluster.cluster_name || "Unknown",
                              }))
                            : (viewModal.test?.cluster_ids || []).map((clusterId) => {
                                const fallbackName =
                                  clusters.find((c) => c.id === clusterId)?.name ||
                                  `Cluster #${clusterId}`;
                                return { id: clusterId, name: fallbackName };
                              })) || [];

                        if (clusterEntities.length === 0) {
                          return (
                            <span className="text-sm neutral-text-muted">
                              No clusters linked to this test.
                            </span>
                          );
                        }

                        return clusterEntities.map((cluster) => (
                          <div
                            key={cluster.id}
                            className="inline-flex items-center bg-white border border-neutral-200 rounded-lg px-3 py-2"
                          >
                            <span className="neutral-text font-medium text-sm">
                              {cluster.name}
                            </span>
                          </div>
                        ));
                      })()}
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
                    {!viewModal.loading && viewModal.test && (
                      <button
                        onClick={() => {
                          closeViewModal();
                          setTimeout(() => {
                            handleEdit(viewModal.test);
                          }, 220);
                        }}
                    className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                  >
                    <HiPencil className="w-4 h-4 mr-2" /> Edit
                  </button>
                    )}
                </div>
              </div>
              )}
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

      {/* Add New Test Modal */}
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
                  {editingId ? "Edit Test" : "Create New Test"}
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
                      Title <span className="danger-text">*</span>
                    </label>
                    <input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (fieldErrors.title) {
                          setFieldErrors({ ...fieldErrors, title: "" });
                        }
                      }}
                      placeholder="Enter test title"
                      disabled={actionLoading.create || actionLoading.update}
                      className={`input w-full ${fieldErrors.title ? "input-error" : ""}`}
                    />
                    {fieldErrors.title && (
                      <p id="error-title" className="danger-text text-xs mt-1.5">
                        {fieldErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Status
                    </label>
                    {statusOptionsLoading ? (
                      <div className="flex items-center justify-center h-[42px] bg-medium border border-neutral-border-light rounded-lg">
                        <span className="spinner spinner-sm mr-2"></span>
                        <span className="text-sm neutral-text-muted">Loading...</span>
                      </div>
                    ) : (
                      <div className="h-[42px] flex items-center bg-medium border border-neutral-border-light rounded-lg px-3 md:px-4">
                        <label className="flex items-center justify-between cursor-pointer w-full">
                          <span className="neutral-text font-medium text-sm md:text-base">
                            {statusOptions.length > 0 
                              ? statusOptions.find(opt => opt.value === status)?.label || 
                                (status === "active" ? "Active" : "Inactive")
                              : status === "active" ? "Active" : "Inactive"}
                          </span>
                          <div className="relative ml-4 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={status === "active" || status === "1" || status === 1}
                              onChange={(e) => {
                                const isActive = e.target.checked;
                                const activeOption = statusOptions.find(opt => 
                                  opt.label.toLowerCase().includes("active") || 
                                  opt.value === "active" || 
                                  opt.value === "1"
                                );
                                const inactiveOption = statusOptions.find(opt => 
                                  opt.label.toLowerCase().includes("inactive") || 
                                  opt.value === "inactive" || 
                                  opt.value === "0"
                                );
                                setStatus(isActive 
                                  ? (activeOption?.value || "active")
                                  : (inactiveOption?.value || "inactive")
                                );
                              }}
                              className="sr-only"
                              disabled={actionLoading.create || actionLoading.update}
                            />
                            <div
                              className={`w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${
                                status === "active" || status === "1" || status === 1
                                  ? "accent-bg"
                                  : "danger-bg"
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-6 h-6 white-bg rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                  status === "active" || status === "1" || status === 1
                                    ? "translate-x-7"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter test description"
                    rows={3}
                    disabled={actionLoading.create || actionLoading.update}
                    className="input w-full resize-none"
                  />
                </div>

                {!editingId && (
                <div>
                  <label className="text-sm font-semibold neutral-text block mb-2">
                    Clusters <span className="danger-text">*</span>
                  </label>
                  {clustersLoading ? (
                    <div className="flex items-center justify-center h-[42px] bg-medium border border-neutral-border-light rounded-lg">
                      <span className="spinner spinner-sm mr-2"></span>
                      <span className="text-sm neutral-text-muted">Loading clusters...</span>
                    </div>
                  ) : clusters.length === 0 ? (
                    <div className="bg-medium border border-neutral-border-light rounded-lg p-4 text-center">
                      <p className="text-sm neutral-text-muted">
                        No clusters available. Create clusters first.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={selectedClusterDropdown}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              setSelectedClusterDropdown(value);
                              handleAddCluster(value);
                            }
                          }}
                          disabled={actionLoading.create || actionLoading.update}
                          className="input w-full pr-10"
                        >
                          <option value="">Select a cluster</option>
                          {clusters
                            .filter((c) => !selectedClusterIds.includes(c.id))
                            .map((cluster) => (
                              <option key={cluster.id} value={cluster.id}>
                                {cluster.name}
                              </option>
                            ))}
                        </select>
                        <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                      </div>

                      {selectedClusterIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedClusterIds.map((clusterId) => {
                            const cluster = clusters.find((c) => c.id === clusterId);
                            if (!cluster) return null;

                            return (
                              <div
                                key={clusterId}
                                className="inline-flex items-center gap-2 bg-medium border border-neutral-border-light rounded-lg px-3 py-2"
                              >
                                <span className="neutral-text font-medium text-sm">
                                  {cluster.name}
                                </span>
                                <button
                                  onClick={() => handleRemoveCluster(clusterId)}
                                  disabled={actionLoading.create || actionLoading.update}
                                  className="btn btn-ghost btn-icon-sm flex-shrink-0"
                                  title="Remove"
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
                    <p id="error-cluster_ids" className="danger-text text-xs mt-2">
                      {fieldErrors.cluster_ids}
                    </p>
                  )}
                </div>
                )}

                {/* Question Selection Section */}
                {selectedClusterIds.length > 0 && (
                  <div className="space-y-4 border-t border-neutral-200 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold neutral-text">
                        Question Selection (Common for all constructs)
                      </label>
                      {questionsLoading && (
                        <span className="text-xs neutral-text-muted">
                          <span className="spinner spinner-sm mr-2"></span>
                          Loading questions...
                        </span>
                      )}
                    </div>

                    {questionSelectionError && (
                      <div id="question-selection-error" className="p-3 bg-danger-bg-light border border-danger-border-light rounded-lg">
                        <div className="flex items-center justify-between gap-3">
                          <p className="danger-text text-sm flex-1">{questionSelectionError}</p>
                          {errorConstructInfo && (
                            <button
                              onClick={() => scrollToConstruct(errorConstructInfo.constructId)}
                              className="btn btn-sm btn-outline-danger whitespace-nowrap"
                            >
                              Go to {errorConstructInfo.constructName}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show message if no constructs available */}
                    {constructsForSelectedClusters.length === 0 && !constructsLoading && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          No constructs found for the selected clusters. Please ensure constructs are available for these clusters.
                        </p>
                      </div>
                    )}

                    {/* Select All Questions Toggle */}
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold neutral-text mb-1">
                            Select All Questions
                          </h4>
                          <p className="text-xs neutral-text-muted">
                            Enable to select all available questions without specifying counts
                          </p>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input
                            type="checkbox"
                            checked={selectAllMode}
                            onChange={(e) => handleSelectAllModeToggle(e.target.checked)}
                            disabled={actionLoading.create || actionLoading.update || constructsForSelectedClusters.length === 0}
                            className="sr-only"
                          />
                          <div
                            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${
                              selectAllMode
                                ? "accent-bg"
                                : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-6 h-6 white-bg rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                selectAllMode
                                  ? "translate-x-7"
                                  : "translate-x-0"
                              }`}
                            />
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Common Question Count Inputs */}
                    {!selectAllMode && (
                      <div className="bg-white border border-neutral-200 rounded-lg p-4">
                        <h4 className="font-semibold neutral-text mb-4">
                          Questions per Construct <span className="danger-text">*</span>
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          {["P", "R", "SDB"].map((category) => (
                            <div key={category}>
                              <label className="text-xs font-medium neutral-text-muted block mb-1">
                                {category} Questions
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={questionCounts[category] || ""}
                                onChange={(e) =>
                                  handleQuestionCountChange(
                                    category,
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                disabled={actionLoading.create || actionLoading.update || constructsForSelectedClusters.length === 0}
                                className="input w-full text-sm"
                              />
                              <p className="text-xs neutral-text-muted mt-1">
                                Per construct
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Construct-wise Question Display */}
                    {constructsForSelectedClusters.length > 0 && (selectAllMode || Object.values(questionCounts).some((count) => count > 0)) && (
                      <div className="space-y-4">
                        {constructsForSelectedClusters.map((construct) => {
                          const constructId = construct.id.toString();
                          const selected = selectedQuestions[constructId] || { P: [], R: [], SDB: [] };
                          const isSkipped = skippedConstructs.includes(constructId);

                          return (
                            <div
                              id={`construct-${construct.id}`}
                              key={construct.id}
                              className={`bg-white border rounded-lg p-4 space-y-4 transition-all ${
                                isSkipped 
                                  ? "border-gray-300 opacity-60" 
                                  : "border-neutral-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold neutral-text">
                                  {construct.name}
                                  {isSkipped && (
                                    <span className="ml-2 text-xs neutral-text-muted">(Skipped)</span>
                                  )}
                                </h4>
                                <label className="flex items-center gap-2 cursor-pointer relative">
                                  <span className="text-xs neutral-text-muted">Skip this construct</span>
                                  <input
                                    type="checkbox"
                                    checked={isSkipped}
                                    onChange={() => handleToggleSkipConstruct(construct.id)}
                                    disabled={actionLoading.create || actionLoading.update}
                                    className="sr-only"
                                  />
                                  <div
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                                      isSkipped
                                        ? "bg-gray-400"
                                        : "bg-gray-300"
                                    }`}
                                  >
                                    <div
                                      className={`absolute top-0.5 left-0.5 w-5 h-5 white-bg rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                        isSkipped
                                          ? "translate-x-6"
                                          : "translate-x-0"
                                      }`}
                                    />
                                  </div>
                                </label>
                              </div>

                              {/* Question Selection */}
                              {!isSkipped && (
                                <div className="space-y-3">
                                  {["P", "R", "SDB"].map((category) => {
                                    const limit = selectAllMode ? null : (questionCounts[category] || 0);
                                    // Show category if selectAllMode is enabled OR if limit > 0
                                    if (!selectAllMode && (!limit || limit === 0)) return null;

                                const categoryQuestions = getQuestionsForConstructAndCategory(
                                  construct.id,
                                  category
                                );
                                const selectedForCategory = selected[category] || [];

                                return (
                                  <div key={category} className="border border-neutral-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium neutral-text">
                                        {category} Questions {selectAllMode ? `(${selectedForCategory.length} selected)` : `(${selectedForCategory.length}/${limit} selected)`}
                                      </span>
                                    </div>
                                    {categoryQuestions.length === 0 ? (
                                      <p className="text-xs neutral-text-muted">
                                        No {category} questions available for this construct.
                                      </p>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {categoryQuestions.map((question) => {
                                          const isSelected = selectedForCategory.includes(question.id);
                                          const isDisabled = !selectAllMode && !isSelected && selectedForCategory.length >= limit;

                                          return (
                                            <label
                                              key={question.id}
                                              className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                                                isSelected
                                                  ? "bg-blue-50 border-blue-300"
                                                  : isDisabled
                                                  ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                                                  : "bg-white border-neutral-200 hover:border-blue-200"
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
                                                disabled={isDisabled || actionLoading.create || actionLoading.update}
                                                className="mt-1"
                                              />
                                              <span className="text-xs neutral-text flex-1">
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
              </div>

              {/* Fixed Button Bar at Bottom */}
              <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 flex justify-end gap-3 shadow-lg z-10">
                <button
                  onClick={closeForm}
                  disabled={actionLoading.create || actionLoading.update}
                  className="btn btn-primary text-sm"
                >
                  Cancel
                </button>
                {editingId ? (
                  <button
                    onClick={save}
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
                ) : (
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
                        <HiPlus className="w-4 h-4 mr-2" /> Add Test
                      </>
                    )}
                  </button>
                )}
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold neutral-text">Manage Tests</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }} 
          className="btn btn-secondary"
        >
          <HiPlus className="w-4 h-4 mr-2 black-text" /> Add New Test
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or description..."
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

        {/* Tests List Section */}
        <div className="mt-6 md:mt-8">
        
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <span className="spinner spinner-lg mb-3"></span>
              <p className="text-sm neutral-text-muted">Loading tests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 bg-medium border border-neutral-border-light rounded-lg">
              <div className="p-3 primary-bg-light rounded-lg mb-3">
                <HiCollection className="w-6 h-6 primary-text" />
              </div>
              <h3 className="text-base md:text-lg font-semibold neutral-text mb-1">
                No tests yet
              </h3>
              <p className="text-sm neutral-text-muted text-center max-w-md px-4">
                {searchQuery
                  ? "No tests match your search."
                  : "Create your first test above to get started."}
              </p>
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
                      <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">Title</th>
                      <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted hidden md:table-cell">Description</th>
                      <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">Status</th>
                      <th className="font-semibold text-sm py-3 px-4 text-left neutral-text-muted">Clusters</th>
                      <th className="font-semibold text-sm py-3 px-4 neutral-text-muted" style={{ textAlign: "right" }}>Actions</th>
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
                              {item.title || "N/A"}
                            </span>
                            <span className="text-xs text-slate-500 mt-1 md:hidden">
                              {item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + "..." : item.description) : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell neutral-text">
                          <span className="text-sm max-w-xs truncate block">
                            {item.description || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`badge ${
                              item.is_active
                                ? "badge-accent"
                                : "badge-neutral"
                            }`}
                          >
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 neutral-text">
                          <span className="text-sm whitespace-nowrap">
                            {item.cluster_ids?.length || item.clusters?.length || 0}{" "}
                            cluster{item.cluster_ids?.length !== 1 && item.clusters?.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/dashboard/master/tests/${item.id}`)}
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
                                handleDeleteClick(item.id, item.title)
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
          </>
        )}
        </div>
    </div>
  );
}
