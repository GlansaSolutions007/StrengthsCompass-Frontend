import React, { useEffect, useState, useMemo } from "react";
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
  HiCloudUpload,
  HiEye,
  HiSearch,
} from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

export default function AdminMasterQuestions() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [constructs, setConstructs] = useState([]);
  const [items, setItems] = useState([]);
  const [clusterId, setClusterId] = useState("");
  const [constructId, setConstructId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [category, setCategory] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    question_text: "",
    category: "",
    order_no: "",
  });
  const [loading, setLoading] = useState(true);
  const [clustersLoading, setClustersLoading] = useState(true);
  const [constructsLoading, setConstructsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    questionText: "",
  });
  const [actionLoading, setActionLoading] = useState({
    create: false,
    update: false,
    delete: false,
    bulkUpload: false,
    bulkAssign: false,
  });
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [generalBulkUploadFile, setGeneralBulkUploadFile] = useState(null);
  const [clusterConstructBulkUploadFile, setClusterConstructBulkUploadFile] = useState(null);
  const [activeTab, setActiveTab] = useState("single"); // "single", "bulk-general", "bulk-cluster-construct"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    question: null,
  });
  const [isClosingView, setIsClosingView] = useState(false);
  const [isClosingEdit, setIsClosingEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isClosingForm, setIsClosingForm] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [isClosingBulkAssign, setIsClosingBulkAssign] = useState(false);
  const [bulkAssignClusterId, setBulkAssignClusterId] = useState("");
  const [bulkAssignConstructId, setBulkAssignConstructId] = useState("");

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

  const fetchConstructs = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setConstructsLoading(false);
        return;
      }

      const response = await apiClient.get("/constructs");

      if (response.data?.status && response.data.data) {
        setConstructs(
          response.data.data.map((c) => ({
            id: c.id,
            name: c.name,
            clusterId: c.cluster_id || c.clusterId,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching constructs:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      }
    } finally {
      setConstructsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const response = await apiClient.get("/questions");

      if (response.data?.status && response.data.data) {
        setItems(
          response.data.data.map((q) => ({
            id: q.id,
            question_text: q.question_text || q.questionText || "",
            category: q.category || "",
            order_no: q.order_no || q.orderNo || 0,
            construct_id: q.construct_id || q.constructId,
          }))
        );
        setError(null);
      } else {
        setError("Failed to load questions");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);

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
            "Failed to load questions. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
    fetchConstructs();
    fetchQuestions();
  }, [navigate]);

  const constructsForCluster = useMemo(() => {
    if (!clusterId) return constructs;
    return constructs.filter((c) => {
      const cClusterId = c.clusterId || c.cluster_id;
      return (
        cClusterId === clusterId ||
        cClusterId === parseInt(clusterId) ||
        cClusterId === clusterId.toString()
      );
    });
  }, [constructs, clusterId]);

  const constructsForBulkAssign = useMemo(() => {
    if (!bulkAssignClusterId) return constructs;
    return constructs.filter((c) => {
      const cClusterId = c.clusterId || c.cluster_id;
      return (
        cClusterId === bulkAssignClusterId ||
        cClusterId === parseInt(bulkAssignClusterId) ||
        cClusterId === bulkAssignClusterId.toString()
      );
    });
  }, [constructs, bulkAssignClusterId]);

  const constructFiltered = useMemo(() => {
    if (!constructId) return items;
    return items.filter((q) => {
      const qConstructId = q.construct_id || q.constructId;
      return (
        qConstructId === constructId ||
        qConstructId === parseInt(constructId) ||
        qConstructId === constructId.toString()
      );
    });
  }, [items, constructId]);

  const filtered = useMemo(() => {
    let result = constructFiltered;
    
    // Filter for unassigned questions if the filter is active
    if (showUnassignedOnly) {
      result = result.filter((item) => {
        const qConstructId = item.construct_id || item.constructId;
        return !qConstructId || qConstructId === null || qConstructId === undefined;
      });
    }
    
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const constructName = constructs.find(
          (c) =>
            c.id === (item.construct_id || item.constructId) ||
            c.id === parseInt(item.construct_id || item.constructId)
        )?.name || "";
        return (
          item.question_text?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower) ||
          constructName.toLowerCase().includes(searchLower)
        );
      });
    }
    return result;
  }, [constructFiltered, searchQuery, constructs, showUnassignedOnly]);

  useEffect(() => {
    if (
      clusterId &&
      !constructsForCluster.find(
        (c) => c.id === constructId || c.id === parseInt(constructId)
      )
    ) {
      setConstructId("");
    }
  }, [clusterId, constructsForCluster, constructId]);

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
        apiClient.delete(`/questions/${id}`)
      );
      await Promise.all(deletePromises);

      const newItems = items.filter((item) => !idsToDelete.includes(item.id));
      setItems(newItems);
      setSelectedItems([]);
      setError(null);
      setSuccess(`${idsToDelete.length} question(s) deleted successfully!`);

      const totalPages = Math.ceil(newItems.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error("Error deleting questions:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete some questions. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  // Bulk assign questions to cluster and construct
  const handleBulkAssign = async () => {
    if (selectedItems.length === 0) return;

    const errors = {};
    if (!bulkAssignClusterId) {
      errors.bulkAssignClusterId = "Please select a cluster";
    }
    if (!bulkAssignConstructId) {
      errors.bulkAssignConstructId = "Please select a construct";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setActionLoading({ ...actionLoading, bulkAssign: true });
    
    try {
      const updatePromises = selectedItems.map((id) =>
        apiClient.put(`/questions/${id}`, {
          construct_id: bulkAssignConstructId,
          cluster_id: bulkAssignClusterId,
        })
      );
      
      await Promise.all(updatePromises);

      // Refresh questions list
      await fetchQuestions();
      
      setSelectedItems([]);
      setBulkAssignClusterId("");
      setBulkAssignConstructId("");
      setShowBulkAssignModal(false);
      setError(null);
      setSuccess(`${selectedItems.length} question(s) assigned successfully!`);
    } catch (err) {
      console.error("Error assigning questions:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to assign some questions. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, bulkAssign: false });
    }
  };

  const closeBulkAssignModal = () => {
    setIsClosingBulkAssign(true);
    setTimeout(() => {
      setIsClosingBulkAssign(false);
      setShowBulkAssignModal(false);
      setBulkAssignClusterId("");
      setBulkAssignConstructId("");
      setFieldErrors({});
    }, 220);
  };

  const add = async () => {
    const errors = {};
    if (!constructId) {
      errors.constructId = "Construct selection is required";
    }
    if (!questionText.trim()) {
      errors.questionText = "Question text is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setActionLoading({ ...actionLoading, create: true });
    try {
      const response = await apiClient.post("/questions", {
        construct_id: constructId,
        question_text: questionText.trim(),
        category: category.trim() || null,
        order_no: orderNo ? parseInt(orderNo) : null,
      });

      if (response.data?.status && response.data.data) {
        const newQuestion = response.data.data;
        setItems([
          ...items,
          {
            id: newQuestion.id,
            question_text:
              newQuestion.question_text || newQuestion.questionText || "",
            category: newQuestion.category || "",
            order_no: newQuestion.order_no || newQuestion.orderNo || 0,
            construct_id: newQuestion.construct_id || newQuestion.constructId,
          },
        ]);
        resetForm();
        setShowForm(false);
        setError(null);
        setSuccess("Question created successfully!");
        const totalPages = Math.ceil((items.length + 1) / itemsPerPage);
        setCurrentPage(totalPages);
      } else {
        setError(response.data?.message || "Failed to create question");
      }
    } catch (err) {
      console.error("Error creating question:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to create question. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, create: false });
    }
  };

  const save = async (id) => {
    if (!editingData.question_text.trim()) {
      setFieldErrors({ questionText: "Question text is required" });
      return;
    }

    setFieldErrors({});
    setActionLoading({ ...actionLoading, update: true });
    try {
      const response = await apiClient.put(`/questions/${id}`, {
        question_text: editingData.question_text.trim(),
        category: editingData.category.trim() || null,
        order_no: editingData.order_no ? parseInt(editingData.order_no) : null,
      });

      if (response.data?.status && response.data.data) {
        const updatedQuestion = response.data.data;
        setItems(
          items.map((item) =>
            item.id === id
              ? {
                  id: updatedQuestion.id,
                  question_text:
                    updatedQuestion.question_text ||
                    updatedQuestion.questionText ||
                    "",
                  category: updatedQuestion.category || "",
                  order_no:
                    updatedQuestion.order_no || updatedQuestion.orderNo || 0,
                  construct_id:
                    updatedQuestion.construct_id || updatedQuestion.constructId,
                }
              : item
          )
        );
        resetForm();
        setShowForm(false);
        setError(null);
        setSuccess("Question updated successfully!");
      }
    } catch (err) {
      console.error("Error updating question:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to update question. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, update: false });
    }
  };

  const resetForm = () => {
    setQuestionText("");
    setCategory("");
    setOrderNo("");
    setClusterId("");
    setConstructId("");
    setBulkUploadFile(null);
    setGeneralBulkUploadFile(null);
    setClusterConstructBulkUploadFile(null);
    setActiveTab("single");
    setFieldErrors({});
    setEditingId(null);
    setEditingData({ question_text: "", category: "", order_no: "" });
    // Reset file inputs
    const fileInputs = [
      document.getElementById("bulk-upload-file"),
      document.getElementById("general-bulk-upload-file"),
      document.getElementById("cluster-construct-bulk-upload-file")
    ];
    fileInputs.forEach(input => {
      if (input) {
        input.value = "";
      }
    });
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
      setViewModal({ isOpen: false, question: null });
    }, 220);
  };

  const handleEdit = (item) => {
    const construct = constructs.find(
      (c) =>
        c.id === (item.construct_id || item.constructId) ||
        c.id === parseInt(item.construct_id || item.constructId)
    );
    if (construct) {
      setClusterId(construct.clusterId || construct.cluster_id || "");
    }
    setConstructId(item.construct_id || item.constructId || "");
    setEditingId(item.id);
    setEditingData({
      question_text: item.question_text || "",
      category: item.category || "",
      order_no: item.order_no || "",
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id, questionText) => {
    setDeleteConfirm({
      isOpen: true,
      id,
      questionText: questionText || "this question",
    });
  };

  const del = async () => {
    if (!deleteConfirm.id) return;

    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null, questionText: "" });
    setActionLoading({ ...actionLoading, delete: id });
    try {
      const response = await apiClient.delete(`/questions/${id}`);

      if (
        response.data?.status ||
        response.status === 200 ||
        response.status === 204
      ) {
        const newItems = items.filter((item) => item.id !== id);
        setItems(newItems);
        setError(null);
        setSuccess("Question deleted successfully!");
        const totalPages = Math.ceil(newItems.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } else {
        setError(response.data?.message || "Failed to delete question");
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete question. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  // General bulk upload (no cluster/construct required)
  const handleGeneralBulkUpload = async () => {
    const errors = {};
    
    if (!generalBulkUploadFile) {
      errors.generalFile = "Please select a file to upload";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setError(null);
    setFieldErrors({});
    setActionLoading({ ...actionLoading, bulkUpload: true });

    try {
      const formData = new FormData();
      formData.append("file", generalBulkUploadFile);

      const response = await apiClient.post("/questions/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.status) {
        setSuccess(
          response.data?.message || "Questions uploaded successfully!"
        );
        setGeneralBulkUploadFile(null);
        // Reset file input
        const fileInput = document.getElementById("general-bulk-upload-file");
        if (fileInput) {
          fileInput.value = "";
        }
        // Refresh questions list
        fetchQuestions();
        setShowForm(false);
      } else {
        setError(response.data?.message || "Failed to upload questions");
      }
    } catch (err) {
      console.error("Error uploading questions:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to upload questions. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, bulkUpload: false });
    }
  };

  // Cluster and Construct specific bulk upload
  const handleClusterConstructBulkUpload = async () => {
    const errors = {};
    
    if (!clusterId) {
      errors.clusterId = "Please select a cluster before uploading";
    }
    if (!constructId) {
      errors.constructId = "Please select a construct before uploading";
    }
    if (!clusterConstructBulkUploadFile) {
      errors.clusterConstructFile = "Please select a file to upload";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setError(null);
    setFieldErrors({});
    setActionLoading({ ...actionLoading, bulkUpload: true });

    try {
      const formData = new FormData();
      formData.append("file", clusterConstructBulkUploadFile);
      formData.append("construct_id", constructId);
      if (clusterId) {
        formData.append("cluster_id", clusterId);
      }

      const response = await apiClient.post("/questions/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.status) {
        setSuccess(
          response.data?.message || "Questions uploaded successfully!"
        );
        setClusterConstructBulkUploadFile(null);
        // Reset file input
        const fileInput = document.getElementById("cluster-construct-bulk-upload-file");
        if (fileInput) {
          fileInput.value = "";
        }
        // Refresh questions list
        fetchQuestions();
        setShowForm(false);
      } else {
        setError(response.data?.message || "Failed to upload questions");
      }
    } catch (err) {
      console.error("Error uploading questions:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to upload questions. Please try again."
        );
      }
    } finally {
      setActionLoading({ ...actionLoading, bulkUpload: false });
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
        onClose={() =>
          setDeleteConfirm({ isOpen: false, id: null, questionText: "" })
        }
        type="warning"
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleteConfirm.questionText}"? This action cannot be undone.`}
      >
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() =>
              setDeleteConfirm({ isOpen: false, id: null, questionText: "" })
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
      {(viewModal.isOpen || isClosingView) && viewModal.question && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingView ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            onClick={closeViewModal}
          />
          <div 
            className={`relative rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingView ? "animate-modal-out" : "animate-modal-in"
            }`}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
          >
            <div 
              className="p-6 primary-bg-light"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  View Question Details
                </h3>
              </div>
            </div>

            <div 
              className="p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Question Text
                    </label>
                    <div className="text-base neutral-text p-3 bg-white rounded-lg border border-neutral-200 min-h-[60px]">
                      {viewModal.question.question_text || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Category
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      {viewModal.question.category || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Construct
                    </label>
                    <div className="text-base neutral-text font-medium p-3 bg-white rounded-lg border border-neutral-200">
                      {constructs.find(
                        (c) =>
                          c.id === viewModal.question.construct_id ||
                          c.id === parseInt(viewModal.question.construct_id)
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
                        handleEdit(viewModal.question);
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

      {/* Add New Question Modal */}
      {(showForm || isClosingForm) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingForm ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            onClick={closeForm}
          />
          <div 
            className={`relative rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingForm ? "animate-modal-out" : "animate-modal-in"
            }`}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
          >
            <div 
              className="p-6 primary-bg-light"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  {editingId ? "Edit Question" : "Add Questions"}
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

              {!editingId && (
                <>
                  {/* Tab Navigation */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setActiveTab("single")}
                      className={`flex-1 px-6 py-3 font-semibold text-sm transition-all text-center rounded-lg ${
                        activeTab === "single"
                          ? "secondary-bg text-black shadow-md"
                          : "primary-bg text-white hover:primary-bg-dark border border-primary-border"
                      }`}
                    >
                      <HiPlus className="w-4 h-4 inline mr-2" />
                      Single Question
                    </button>
                    <button
                      onClick={() => setActiveTab("bulk-general")}
                      className={`flex-1 px-6 py-3 font-semibold text-sm transition-all text-center rounded-lg ${
                        activeTab === "bulk-general"
                          ? "secondary-bg text-black shadow-md"
                          : "primary-bg text-white hover:primary-bg-dark border border-primary-border"
                      }`}
                    >
                      <HiCloudUpload className="w-4 h-4 inline mr-2" />
                      Bulk Upload
                    </button>
                    <button
                      onClick={() => setActiveTab("bulk-cluster-construct")}
                      className={`flex-1 px-6 py-3 font-semibold text-sm transition-all text-center rounded-lg ${
                        activeTab === "bulk-cluster-construct"
                          ? "secondary-bg text-black shadow-md"
                          : "primary-bg text-white hover:primary-bg-dark border border-primary-border"
                      }`}
                    >
                      <HiCollection className="w-4 h-4 inline mr-2" />
                      Cluster/Construct Upload
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === "single" && (
                    <div className="space-y-6">
                      {/* Cluster and Construct Selection */}
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
                              disabled={
                                clustersLoading ||
                                actionLoading.create ||
                                actionLoading.update ||
                                actionLoading.bulkUpload
                              }
                              className={`input w-full pr-10 ${fieldErrors.clusterId ? "input-error" : ""}`}
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
                                      Select cluster
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
                            <p className="danger-text text-xs mt-1.5">
                              {fieldErrors.clusterId}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-semibold neutral-text block mb-2">
                            Construct <span className="danger-text">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={constructId}
                              onChange={(e) => {
                                setConstructId(e.target.value);
                                if (fieldErrors.constructId) {
                                  setFieldErrors({ ...fieldErrors, constructId: "" });
                                }
                              }}
                              disabled={
                                !clusterId ||
                                constructsLoading ||
                                actionLoading.create ||
                                actionLoading.update ||
                                actionLoading.bulkUpload
                              }
                              className={`input w-full pr-10 ${fieldErrors.constructId ? "input-error" : ""}`}
                            >
                              {!clusterId && !constructsLoading ? (
                                <option value="" disabled>
                                  Select cluster first
                                </option>
                              ) : clusterId && constructsForCluster.length === 0 ? (
                                <option value="" disabled>
                                  No constructs for this cluster
                                </option>
                              ) : (
                                <>
                                  {!constructId && (
                                    <option value="" disabled hidden>
                                      Select construct
                                    </option>
                                  )}
                                  {constructsForCluster.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                            <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                          </div>
                          {fieldErrors.constructId && (
                            <p className="danger-text text-xs mt-1.5">
                              {fieldErrors.constructId}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Question Form */}
                      <div className="bg-white p-4 rounded-lg border border-neutral-border-light">
                        <h4 className="text-sm font-semibold neutral-text mb-4">Question Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-3">
                            <label className="text-sm font-semibold neutral-text block mb-2">
                              Question Text <span className="danger-text">*</span>
                            </label>
                            <input
                              value={questionText}
                              onChange={(e) => {
                                setQuestionText(e.target.value);
                                if (fieldErrors.questionText) {
                                  setFieldErrors({ ...fieldErrors, questionText: "" });
                                }
                              }}
                              placeholder="Enter question text"
                              disabled={!constructId || actionLoading.create || actionLoading.update}
                              className={`input w-full ${fieldErrors.questionText ? "input-error" : ""}`}
                            />
                            {fieldErrors.questionText && (
                              <p className="danger-text text-xs mt-1.5">
                                {fieldErrors.questionText}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-semibold neutral-text block mb-2">
                              Category
                            </label>
                            <input
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              placeholder="e.g., Multiple Choice"
                              disabled={!constructId || actionLoading.create || actionLoading.update}
                              className="input w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold neutral-text block mb-2">
                              Order No
                            </label>
                            <input
                              type="number"
                              value={orderNo}
                              onChange={(e) => setOrderNo(e.target.value)}
                              placeholder="e.g., 1"
                              disabled={!constructId || actionLoading.create || actionLoading.update}
                              className="input w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-border-light">
                        <button
                          onClick={closeForm}
                          disabled={actionLoading.create || actionLoading.update || actionLoading.bulkUpload}
                          className="btn btn-primary text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={add}
                          disabled={actionLoading.create || !constructId}
                          className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                        >
                          {actionLoading.create ? (
                            <>
                              <span className="spinner spinner-sm mr-2"></span>
                              Adding...
                            </>
                          ) : (
                            <>
                              <HiPlus className="w-4 h-4 mr-2" /> Add Question
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "bulk-general" && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-lg border border-neutral-border-light">
                        <h4 className="text-sm font-semibold neutral-text mb-2">General Bulk Upload</h4>
                        <p className="text-xs neutral-text-muted mb-4">
                          Upload questions for all clusters and constructs. The file should contain cluster and construct information.
                        </p>
                    
                    <div className="mb-4">
                      <label className="text-sm font-semibold neutral-text block mb-2">
                        Upload File <span className="danger-text">*</span>
                      </label>
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                                id="general-bulk-upload-file"
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                                  setGeneralBulkUploadFile(file || null);
                              if (file) {
                                    if (fieldErrors.generalFile) {
                                      setFieldErrors({ ...fieldErrors, generalFile: "" });
                                }
                              }
                            }}
                            accept=".xlsx,.xls,.csv"
                                disabled={actionLoading.bulkUpload}
                                className={`input ${fieldErrors.generalFile ? "input-error" : ""}`}
                          />
                              {fieldErrors.generalFile && (
                            <p className="danger-text text-xs mt-1.5">
                                  {fieldErrors.generalFile}
                            </p>
                          )}
                          <p className="text-xs neutral-text-muted mt-1.5">
                            Supported formats: Excel (.xlsx, .xls) or CSV (.csv)
                          </p>
                        </div>
                        <button
                              onClick={handleGeneralBulkUpload}
                              disabled={actionLoading.bulkUpload || !generalBulkUploadFile}
                          className="btn btn-secondary flex-shrink-0"
                          style={{ height: '42px', minWidth: '120px' }}
                        >
                          {actionLoading.bulkUpload ? (
                            <>
                              <span className="spinner spinner-sm"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <HiCloudUpload className="w-4 h-4" /> Upload
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-border-light">
                        <button
                          onClick={closeForm}
                          disabled={actionLoading.bulkUpload}
                          className="btn btn-primary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "bulk-cluster-construct" && (
              <div className="space-y-6">
                {/* Cluster and Construct Selection */}
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
                        disabled={
                          clustersLoading ||
                          actionLoading.bulkUpload
                        }
                        className={`input w-full pr-10 ${fieldErrors.clusterId ? "input-error" : ""}`}
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
                                Select cluster
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
                      <p className="danger-text text-xs mt-1.5">
                        {fieldErrors.clusterId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Construct <span className="danger-text">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={constructId}
                        onChange={(e) => {
                          setConstructId(e.target.value);
                          if (fieldErrors.constructId) {
                            setFieldErrors({ ...fieldErrors, constructId: "" });
                          }
                        }}
                        disabled={
                          !clusterId ||
                          constructsLoading ||
                          actionLoading.bulkUpload
                        }
                        className={`input w-full pr-10 ${fieldErrors.constructId ? "input-error" : ""}`}
                      >
                        {!clusterId && !constructsLoading ? (
                          <option value="" disabled>
                            Select cluster first
                          </option>
                        ) : clusterId && constructsForCluster.length === 0 ? (
                          <option value="" disabled>
                            No constructs for this cluster
                          </option>
                        ) : (
                          <>
                            {!constructId && (
                              <option value="" disabled hidden>
                                Select construct
                              </option>
                            )}
                            {constructsForCluster.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                    </div>
                    {fieldErrors.constructId && (
                      <p className="danger-text text-xs mt-1.5">
                        {fieldErrors.constructId}
                      </p>
                    )}
                  </div>
                </div>

                      {/* Bulk Upload Section */}
                      <div className="bg-white p-6 rounded-lg border border-neutral-border-light">
                        <h4 className="text-sm font-semibold neutral-text mb-2">Cluster & Construct Bulk Upload</h4>
                        <p className="text-xs neutral-text-muted mb-4">
                          Upload questions specifically for the selected cluster and construct.
                        </p>
                    
                    <div className="mb-4">
                      <label className="text-sm font-semibold neutral-text block mb-2">
                        Upload File <span className="danger-text">*</span>
                      </label>
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                                id="cluster-construct-bulk-upload-file"
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                                  setClusterConstructBulkUploadFile(file || null);
                              if (file) {
                                    if (fieldErrors.clusterConstructFile) {
                                      setFieldErrors({ ...fieldErrors, clusterConstructFile: "" });
                                }
                              }
                            }}
                            accept=".xlsx,.xls,.csv"
                            disabled={actionLoading.bulkUpload || !clusterId || !constructId}
                                className={`input ${fieldErrors.clusterConstructFile ? "input-error" : ""}`}
                          />
                              {fieldErrors.clusterConstructFile && (
                            <p className="danger-text text-xs mt-1.5">
                                  {fieldErrors.clusterConstructFile}
                            </p>
                          )}
                          <p className="text-xs neutral-text-muted mt-1.5">
                            Supported formats: Excel (.xlsx, .xls) or CSV (.csv)
                          </p>
                        </div>
                        <button
                              onClick={handleClusterConstructBulkUpload}
                              disabled={actionLoading.bulkUpload || !clusterConstructBulkUploadFile || !clusterId || !constructId}
                          className="btn btn-secondary flex-shrink-0"
                          style={{ height: '42px', minWidth: '120px' }}
                        >
                          {actionLoading.bulkUpload ? (
                            <>
                              <span className="spinner spinner-sm"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <HiCloudUpload className="w-4 h-4" /> Upload
                            </>
                          )}
                        </button>
                      </div>
                      {(!clusterId || !constructId) && !fieldErrors.clusterId && !fieldErrors.constructId && (
                        <p className="text-xs danger-text mt-2">
                          Please select both cluster and construct before uploading.
                        </p>
                      )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-border-light">
                        <button
                          onClick={closeForm}
                          disabled={actionLoading.bulkUpload}
                          className="btn btn-primary text-sm"
                        >
                          Cancel
                        </button>
                    </div>
                  </div>
                  )}
                </>
              )}

              {/* Edit Mode (when editingId exists) */}
              {editingId && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="text-sm font-semibold neutral-text block mb-2">
                        Question Text <span className="danger-text">*</span>
                      </label>
                      <input
                        value={editingData.question_text}
                        onChange={(e) => {
                            setEditingData({
                              ...editingData,
                              question_text: e.target.value,
                            });
                          if (fieldErrors.questionText) {
                            setFieldErrors({ ...fieldErrors, questionText: "" });
                          }
                        }}
                        placeholder="Enter question text"
                        disabled={actionLoading.update}
                        className={`input w-full ${fieldErrors.questionText ? "input-error" : ""}`}
                      />
                      {fieldErrors.questionText && (
                        <p className="danger-text text-xs mt-1.5">
                          {fieldErrors.questionText}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold neutral-text block mb-2">
                        Category
                      </label>
                      <input
                        value={editingData.category}
                        onChange={(e) => {
                            setEditingData({
                              ...editingData,
                              category: e.target.value,
                            });
                        }}
                        placeholder="e.g., Multiple Choice"
                        disabled={actionLoading.update}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold neutral-text block mb-2">
                        Order No
                      </label>
                      <input
                        type="number"
                        value={editingData.order_no}
                        onChange={(e) => {
                            setEditingData({
                              ...editingData,
                              order_no: e.target.value,
                            });
                        }}
                        placeholder="e.g., 1"
                        disabled={actionLoading.update}
                        className="input w-full"
                      />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-border-light">
                  <button
                    onClick={closeForm}
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

      {/* Bulk Assign Modal */}
      {(showBulkAssignModal || isClosingBulkAssign) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 1000 }}
        >
          <div
            className={`absolute inset-0 overlay ${
              isClosingBulkAssign ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            onClick={closeBulkAssignModal}
          />
          <div 
            className={`relative rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-white/20 my-8 ${
              isClosingBulkAssign ? "animate-modal-out" : "animate-modal-in"
            }`}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
          >
            <div 
              className="p-6 primary-bg-light"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold primary-text">
                  Assign Questions to Cluster/Construct
                </h3>
                <button
                  onClick={closeBulkAssignModal}
                  className="text-neutral-text-muted hover:neutral-text"
                >
                  <HiX className="w-5 h-5" />
                </button>
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

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm neutral-text">
                  <strong>{selectedItems.length}</strong> question(s) will be assigned to the selected cluster and construct.
                </p>
              </div>

              <div className="space-y-6">
                {/* Cluster and Construct Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Cluster <span className="danger-text">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={bulkAssignClusterId}
                        onChange={(e) => {
                          setBulkAssignClusterId(e.target.value);
                          setBulkAssignConstructId(""); // Reset construct when cluster changes
                          if (fieldErrors.bulkAssignClusterId) {
                            setFieldErrors({ ...fieldErrors, bulkAssignClusterId: "" });
                          }
                        }}
                        disabled={clustersLoading || actionLoading.bulkAssign}
                        className={`input w-full pr-10 ${fieldErrors.bulkAssignClusterId ? "input-error" : ""}`}
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
                            {!bulkAssignClusterId && (
                              <option value="" disabled hidden>
                                Select cluster
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
                    {fieldErrors.bulkAssignClusterId && (
                      <p className="danger-text text-xs mt-1.5">
                        {fieldErrors.bulkAssignClusterId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold neutral-text block mb-2">
                      Construct <span className="danger-text">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={bulkAssignConstructId}
                        onChange={(e) => {
                          setBulkAssignConstructId(e.target.value);
                          if (fieldErrors.bulkAssignConstructId) {
                            setFieldErrors({ ...fieldErrors, bulkAssignConstructId: "" });
                          }
                        }}
                        disabled={
                          !bulkAssignClusterId ||
                          constructsLoading ||
                          actionLoading.bulkAssign
                        }
                        className={`input w-full pr-10 ${fieldErrors.bulkAssignConstructId ? "input-error" : ""}`}
                      >
                        {!bulkAssignClusterId && !constructsLoading ? (
                          <option value="" disabled>
                            Select cluster first
                          </option>
                        ) : bulkAssignClusterId && constructsForBulkAssign.length === 0 ? (
                          <option value="" disabled>
                            No constructs for this cluster
                          </option>
                        ) : (
                          <>
                            {!bulkAssignConstructId && (
                              <option value="" disabled hidden>
                                Select construct
                              </option>
                            )}
                            {constructsForBulkAssign.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                    </div>
                    {fieldErrors.bulkAssignConstructId && (
                      <p className="danger-text text-xs mt-1.5">
                        {fieldErrors.bulkAssignConstructId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-border-light">
                  <button
                    onClick={closeBulkAssignModal}
                    disabled={actionLoading.bulkAssign}
                    className="btn btn-primary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    disabled={actionLoading.bulkAssign || !bulkAssignClusterId || !bulkAssignConstructId}
                    className="btn btn-secondary shadow-md"
                  >
                    {actionLoading.bulkAssign ? (
                      <>
                        <span className="spinner spinner-sm mr-2"></span>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-4 h-4 mr-2" /> Assign {selectedItems.length} Question(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold neutral-text">Manage Questions</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }} 
          className="btn btn-secondary"
        >
          <HiPlus className="w-4 h-4 mr-2 black-text" /> Add Questions
        </button>
      </div>

      {/* Filter Section */}
      {/* <div className="mb-4 pb-4 border-b border-neutral-border-light">
          <div className="mb-4">
            <label className="text-sm font-semibold neutral-text block mb-3">
              Filter by Cluster
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={clusterId}
                  onChange={(e) => {
                    setClusterId(e.target.value);
                    if (fieldErrors.clusterId) {
                      setFieldErrors({ ...fieldErrors, clusterId: "" });
                    }
                  }}
                  disabled={clustersLoading}
                  className={`input ${fieldErrors.clusterId ? "input-error" : ""}`}
                >
                  {clustersLoading && (
                    <option value="">Loading clusters...</option>
                  )}
                  {!clustersLoading && (
                    <option value="">Show all Clusters</option>
                  )}
                  {!clustersLoading && clusters.length === 0 && (
                    <option value="">No clusters available</option>
                  )}
                  {!clustersLoading &&
                    clusters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                <div className="min-h-[20px] mt-1.5">
                  {fieldErrors.clusterId && (
                    <p className="danger-text text-xs flex items-center gap-1.5">
                      <span>⚠</span> {fieldErrors.clusterId}
                    </p>
                  )}
                </div>
              </div>
              {clusterId && (
                <button
                  onClick={() => {
                    setClusterId("");
                    setConstructId("");
                  }}
                  className="btn btn-ghost"
                  title="Clear filter"
                >
                  <HiX className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold neutral-text block mb-3">
              Filter by Construct
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={constructId}
                  onChange={(e) => {
                    setConstructId(e.target.value);
                    if (fieldErrors.constructId) {
                      setFieldErrors({ ...fieldErrors, constructId: "" });
                    }
                  }}
                  disabled={!clusterId && constructsLoading}
                  className={`input ${fieldErrors.constructId ? "input-error" : ""}`}
                >
                  {!clusterId && !constructsLoading && (
                    <option value="">Show all constructs</option>
                  )}
                  {clusterId && constructsForCluster.length === 0 && (
                    <option value="">No constructs for this cluster</option>
                  )}
                  {clusterId && constructsForCluster.length > 0 && (
                    <option value="">Select Construct</option>
                  )}
                  {constructsForCluster.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                <div className="min-h-[20px] mt-1.5">
                  {fieldErrors.constructId && (
                    <p className="danger-text text-xs flex items-center gap-1.5">
                      <span>⚠</span> {fieldErrors.constructId}
                    </p>
                  )}
                </div>
              </div>
              {constructId && (
                <button
                  onClick={() => setConstructId("")}
                  className="btn btn-ghost"
                  title="Clear filter"
                >
                  <HiX className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

        </div> */}

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
                placeholder="Search by question text, category, or construct..."
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
          <div className="flex items-center gap-3">
            {/* Unassigned Filter - Right Side */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-300 rounded-md">
              <input
                type="checkbox"
                id="show-unassigned"
                checked={showUnassignedOnly}
                onChange={(e) => {
                  setShowUnassignedOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="checkbox-custom"
              />
              <label
                htmlFor="show-unassigned"
                className="text-sm neutral-text cursor-pointer select-none"
              >
                Show Unassigned
              </label>
            </div>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm neutral-text-muted">
                  {selectedItems.length} selected
                </span>
                <button
                  onClick={() => setShowBulkAssignModal(true)}
                  disabled={actionLoading.bulkAssign}
                  className="btn btn-secondary btn-sm"
                >
                  <HiCollection className="w-4 h-4 mr-2" /> Assign to Cluster/Construct
                </button>
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
        </div>

        {/* Questions List Section - Simple */}
        {clustersLoading || constructsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="spinner spinner-lg mb-3"></span>
            <p className="text-sm neutral-text-muted">Loading...</p>
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
            <p className="text-sm neutral-text-muted">Loading questions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 primary-bg-light rounded-lg mb-3">
              <HiCollection className="w-6 h-6 primary-text" />
            </div>
            <h3 className="text-base font-semibold neutral-text mb-1">
              No questions yet
            </h3>
            <p className="text-sm neutral-text-muted text-center">
              {searchQuery
                ? "No questions match your search."
                : constructId
                ? "No questions for this construct yet."
                : "Create your first question above to get started."}
            </p>
          </div>
        ) : (
          <>
            {/* Table - Simple and Clean */}
            <div className="overflow-x-auto rounded-lg border border-neutral-border-light">
              <table className="table w-full min-w-[700px]">
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
                    <th className="font-semibold text-xs sm:text-sm py-3 px-2 md:px-4 text-left neutral-text-muted">S.No</th>
                    <th className="font-semibold text-xs sm:text-sm py-3 px-2 md:px-4 text-left neutral-text-muted">Question Text</th>
                    <th className="font-semibold text-xs sm:text-sm py-3 px-2 md:px-4 text-left neutral-text-muted">Category</th>
                    {/* <th className="font-semibold text-xs sm:text-sm py-3 px-2 md:px-4 text-left neutral-text-muted">Order No</th> */}
                    <th className="font-semibold text-xs sm:text-sm py-3 px-2 md:px-4 text-left neutral-text-muted">Construct</th>
                    <th className="font-semibold text-xs sm:text-sm py-3 px-2 md:px-4 neutral-text-muted" style={{ textAlign: 'right' }}>Actions</th>
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
                        <td className="py-3 px-2 md:px-4 neutral-text-muted text-xs sm:text-sm">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="py-3 px-2 md:px-4 neutral-text">
                          <span className="text-xs sm:text-sm break-words">
                            {item.question_text || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-2 md:px-4 neutral-text">
                          <span className="text-xs sm:text-sm">
                            {item.category || "N/A"}
                          </span>
                        </td>
                        {/* <td className="py-3 px-4">
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={editingData.order_no}
                              onChange={(e) =>
                                setEditingData({
                                  ...editingData,
                                  order_no: e.target.value,
                                })
                              }
                              className="input input-sm"
                            />
                          ) : (
                            <span className="neutral-text text-sm">
                              {item.order_no || "N/A"}
                            </span>
                          )}
                        </td> */}
                        <td className="py-3 px-4 neutral-text">
                          <span className="text-sm">
                            {constructs.find((c) => {
                              const cId = c.id;
                              const qConstructId =
                                item.construct_id || item.constructId;
                              return (
                                cId === qConstructId ||
                                cId === parseInt(qConstructId) ||
                                cId === qConstructId?.toString()
                              );
                            })?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setViewModal({
                                  isOpen: true,
                                  question: item,
                                });
                              }}
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
                                handleDeleteClick(
                                  item.id,
                                  item.question_text
                                )
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
                  <span className="font-medium neutral-text">{filtered.length}</span> questions
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
