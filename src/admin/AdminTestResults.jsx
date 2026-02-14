import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../config/api";
import {
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown,
  HiChartBar,
  HiEye,
  HiUser,
  HiX,
  HiDownload,
  HiCalendar,
} from "react-icons/hi";
import AlertModal from "../components/AlertModal";

export default function AdminTestResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [testsLoading, setTestsLoading] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryTestResultId, setSummaryTestResultId] = useState(null);
  const [reportSummary, setReportSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingSummary, setExportingSummary] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [generatingSummaryReport, setGeneratingSummaryReport] = useState(false);
  const [generatingFullReport, setGeneratingFullReport] = useState(false);
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: "", title: "" });
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [openingResultId, setOpeningResultId] = useState(null);

  const fetchTests = async () => {
    try {
      setTestsLoading(true);
      const response = await apiClient.get("/tests");
      if (response.data?.status && response.data.data) {
        const testsData = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        setTests(
          testsData.map((t) => ({
            id: t.id,
            title: t.title || "N/A",
          }))
        );
      } else if (Array.isArray(response.data)) {
        setTests(
          response.data.map((t) => ({
            id: t.id,
            title: t.title || "N/A",
          }))
        );
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setTests(
          response.data.data.map((t) => ({
            id: t.id,
            title: t.title || "N/A",
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
    } finally {
      setTestsLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (selectedTestId) params.test_id = selectedTestId;

      const response = await apiClient.get("/test-results-comprehensive/all", {
        params,
      });
      const resultsData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const mapped = resultsData.map((item, index) => {
        // Debug: Log the item structure to see where clusters and constructs are
        if (index === 0) {
          console.log("First item structure:", item);
          console.log("item.clusters:", item.clusters);
          console.log("item.scores?.clusters:", item.scores?.clusters);
          console.log("item.constructs:", item.constructs);
          console.log("item.scores?.constructs:", item.scores?.constructs);
          console.log("percentage",item.sdb?.percentage);

        }

        // Extract clusters from API response - check multiple possible locations
        let clustersData = {};
        if (
          item.clusters &&
          typeof item.clusters === "object" &&
          !Array.isArray(item.clusters)
        ) {
          clustersData = item.clusters;
        } else if (
          item.scores?.clusters &&
          typeof item.scores.clusters === "object" &&
          !Array.isArray(item.scores.clusters)
        ) {
          clustersData = item.scores.clusters;
        } else if (
          item.cluster_scores &&
          typeof item.cluster_scores === "object" &&
          !Array.isArray(item.cluster_scores)
        ) {
          clustersData = item.cluster_scores;
        }

        const clusters =
          Object.keys(clustersData).length > 0
            ? Object.keys(clustersData).map((key) => {
                const clusterData = clustersData[key];
                // Handle both object format and direct value format
                const data =
                  typeof clusterData === "object" && clusterData !== null
                    ? clusterData
                    : { name: key };
                return {
                  name: data?.name || key,
                  total: data?.total ?? null,
                  average: data?.average ?? null,
                  percentage: data?.percentage ?? null,
                  count: data?.count ?? null,
                  category: data?.category || "N/A",
                };
              })
            : [];

        // Extract constructs from API response - check multiple possible locations
        let constructsData = {};
        if (
          item.constructs &&
          typeof item.constructs === "object" &&
          !Array.isArray(item.constructs)
        ) {
          constructsData = item.constructs;
        } else if (
          item.scores?.constructs &&
          typeof item.scores.constructs === "object" &&
          !Array.isArray(item.scores.constructs)
        ) {
          constructsData = item.scores.constructs;
        } else if (
          item.construct_scores &&
          typeof item.construct_scores === "object" &&
          !Array.isArray(item.construct_scores)
        ) {
          constructsData = item.construct_scores;
        }

        const constructs =
          Object.keys(constructsData).length > 0
            ? Object.keys(constructsData).map((key) => {
                const constructData = constructsData[key];
                // Handle both object format and direct value format
                const data =
                  typeof constructData === "object" && constructData !== null
                    ? constructData
                    : { name: key };
                return {
                  name: data?.name || key,
                  total: data?.total ?? null,
                  average: data?.average ?? null,
                  percentage: data?.percentage ?? null,
                  count: data?.count ?? null,
                  category: data?.category || "N/A",
                };
              })
            : [];

        if (index === 0) {
          console.log("Extracted clusters:", clusters);
          console.log("Extracted constructs:", constructs);
        }

        const questions = Array.isArray(item.questions) ? item.questions : [];

        return {
          id: item.test_result_id || item.id || index + 1,
          userId: item.user_id ?? item.user?.id ?? null,
          userName:
            item.user?.name ||
            `${item.user?.first_name || ""} ${
              item.user?.last_name || ""
            }`.trim() ||
            "N/A",
          email: item.user?.email || "N/A",
          userRole: item.user?.role || "N/A",
          userContact:
            item.user?.contact_number || item.user?.whatsapp_number || "N/A",
          userGender: item.user?.gender || "N/A",
          userAge: item.user?.age || "N/A",
          userCity: item.user?.city || "N/A",
          userState: item.user?.state || "N/A",
          userProfession: item.user?.profession || "N/A",
          testTitle: item.test?.title || "N/A",
          testDescription: item.test?.description || "N/A",
          totalScore: item.scores?.total_score ?? "N/A",
          averageScore: item.scores?.average_score ?? "N/A",
          averagePercentage:
            item.scores?.average_percentage !== undefined
              ? `${item.scores.average_percentage}%`
              : "N/A",
          overallCategory: item.scores?.overall_category || "N/A",
          submittedAt: item.submitted_at || item.updated_at || "N/A",
          clusters,
          constructs,
          questions,
          sdb: item.sdb,
          rawData: item,
        };
      });

      // Filter out admin users - only show regular users
      const filteredMapped = mapped.filter((result) => {
        const userRole = result.userRole?.toLowerCase();
        return userRole !== "admin" && userRole !== "administrator";
      });

      setResults(filteredMapped);
      setError(null);
    } catch (err) {
      console.error("Error fetching test results:", err);
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
            err.message ||
            "Failed to load test results. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Refetch results when test filter changes (only if component is already loaded)
    if (!loading && tests.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchResults();
      }, 300); // Debounce to avoid too many API calls
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestId]);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return results;
    const term = searchTerm.toLowerCase();
    return results.filter((result) => {
      const matchesUser =
        result.userName.toLowerCase().includes(term) ||
        result.email.toLowerCase().includes(term) ||
        result.userContact.toLowerCase().includes(term);
      const matchesTest =
        result.testTitle.toLowerCase().includes(term) ||
        result.overallCategory.toLowerCase().includes(term);
      const matchesClusters = result.clusters?.some((c) =>
        c.name.toLowerCase().includes(term)
      );
      const matchesConstructs = result.constructs?.some((c) =>
        c.name.toLowerCase().includes(term)
      );
      return matchesUser || matchesTest || matchesClusters || matchesConstructs;
    });
  }, [results, searchTerm]);

  const itemsPerPageValue = itemsPerPage === "all" ? filteredResults.length : itemsPerPage;
  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(filteredResults.length / itemsPerPageValue) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedResults = itemsPerPage === "all" 
    ? filteredResults 
    : filteredResults.slice(
        (currentPageSafe - 1) * itemsPerPageValue,
        currentPageSafe * itemsPerPageValue
      );

  const formatDate = (value) => {
    if (!value || value === "N/A") return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
  };

  // Checkbox selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = paginatedResults.map((result) => result.id);
      setSelectedUsers((prev) => [...new Set([...prev, ...allIds])]);
    } else {
      const paginatedIds = paginatedResults.map((result) => result.id);
      setSelectedUsers((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const isAllSelected = paginatedResults.length > 0 && paginatedResults.every((result) => selectedUsers.includes(result.id));
  const isIndeterminate = paginatedResults.some((result) => selectedUsers.includes(result.id)) && !isAllSelected;

  const handleSummaryReport = async () => {
    try {
      if (selectedUsers.length === 0) {
        setError("Please select at least one user to generate the summary report.");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }

      setGeneratingSummaryReport(true);
      setError(null);

      const payload = {
        pdf_type: "short",
        test_result_ids: selectedUsers,
      };

      const response = await apiClient.post(
        "/reports/pdf/bulk-email",
        payload
      );

      // Check if response is a blob (PDF) or JSON (email confirmation)
      if (response.data instanceof Blob) {
        // Handle PDF download
        const blob = new Blob([response.data], {
          type: "application/pdf",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        link.download = `Summary-Reports-${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON response (likely email confirmation)
        const message = response.data?.message || "Summary reports have been sent successfully.";
        setError(null);
        setSuccessModal({
          isOpen: true,
          message: message,
          title: "Summary Report Generated"
        });
      }
    } catch (err) {
      console.error("Error generating summary report:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate summary report. Please try again."
      );
    } finally {
      setGeneratingSummaryReport(false);
    }
  };

  const handleFullReport = async () => {
    try {
      if (selectedUsers.length === 0) {
        setError("Please select at least one user to generate the full report.");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }

      setGeneratingFullReport(true);
      setError(null);

      const payload = {
        pdf_type: "full",
        test_result_ids: selectedUsers,
      };

      const response = await apiClient.post(
        "/reports/pdf/bulk-email",
        payload
      );

      // Check if response is a blob (PDF) or JSON (email confirmation)
      if (response.data instanceof Blob) {
        // Handle PDF download
        const blob = new Blob([response.data], {
          type: "application/pdf",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        link.download = `Full-Reports-${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON response (likely email confirmation)
        const message = response.data?.message || "Full reports have been sent successfully.";
        setError(null);
        setSuccessModal({
          isOpen: true,
          message: message,
          title: "Full Report Generated"
        });
      }
    } catch (err) {
      console.error("Error generating full report:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate full report. Please try again."
      );
    } finally {
      setGeneratingFullReport(false);
    }
  };

  // Build export query params: date filter when set; selected rows → pass their user IDs (else download all). Match by id with loose equality.
  const buildExportParams = (extra = {}) => {
    const ageGroupId = localStorage.getItem("adminSelectedVariantId");
    const params = { ...extra };
    if (ageGroupId) params.age_group_id = ageGroupId;
    if (selectedTestId) params.test_id = selectedTestId;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (selectedUsers.length > 0) {
      const selectedIdSet = new Set(selectedUsers.map((s) => (typeof s === "number" ? s : Number(s) || s)));
      const selectedRows = filteredResults.filter((r) =>
        selectedIdSet.has(Number(r.id)) || selectedIdSet.has(r.id) || selectedUsers.includes(r.id)
      );
      const userIds = selectedRows
        .map((r) => r.userId)
        .filter((id) => id != null && id !== "");
      const uniqueUserIds = [...new Set(userIds.map(String))];
      if (uniqueUserIds.length > 0) params.user_ids = uniqueUserIds.join(",");
    }
    return params;
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }

      setExporting(true);
      setError(null);

      const response = await apiClient.get(
        "/test-results-comprehensive/export",
        {
          params: buildExportParams(),
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `Strengths-Compass-Test-Reports-${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting test results:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to download Excel. Please try again."
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportSummary = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }

      setExportingSummary(true);
      setError(null);

      const ageGroupId = localStorage.getItem("adminSelectedVariantId") || "1";
      const now = new Date();
      const year = now.getFullYear();
      const fromDateValue = fromDate || `${year}-01-01`;
      const toDateValue = toDate || `${year}-12-31`;
      const testIdValue = selectedTestId || (tests.length > 0 ? String(tests[0].id) : "");

      let userIdsParam = "";
      if (selectedUsers.length > 0) {
        const selectedIdSet = new Set(selectedUsers.map((s) => (typeof s === "number" ? s : Number(s) || s)));
        const selectedRows = filteredResults.filter((r) =>
          selectedIdSet.has(Number(r.id)) || selectedIdSet.has(r.id) || selectedUsers.includes(r.id)
        );
        const userIds = selectedRows
          .map((r) => r.userId)
          .filter((id) => id != null && id !== "");
        userIdsParam = [...new Set(userIds.map(String))].join(",");
      } else {
        const allUserIds = filteredResults
          .map((r) => r.userId)
          .filter((id) => id != null && id !== "");
        userIdsParam = [...new Set(allUserIds.map(String))].join(",");
      }

      const summaryExportParams = {
        age_group_id: ageGroupId,
        test_id: testIdValue,
        from_date: fromDateValue,
        to_date: toDateValue,
        user_ids: userIdsParam,
      };
      console.log("Export summary =======>>>", summaryExportParams);

      const response = await apiClient.get(
        "/test-results-comprehensive/export-summary",
        {
          params: summaryExportParams,
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `Strengths-Compass-Summary-${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting summary:", err);
      const is404 = err.response?.status === 404;
      setError(
        is404
          ? "Export summary is not available (404). The server may not have this endpoint yet."
          : err.response?.data?.message ||
            err.message ||
            "Failed to download summary. Please try again."
      );
    } finally {
      setExportingSummary(false);
    }
  };

  const handleBulkDownloadPdf = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }
      setPdfDownloading(true);
      setError(null);

      const params = { type: "full" };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (selectedUsers.length > 0) {
        const userIds = filteredResults
          .filter((r) => selectedUsers.includes(r.id))
          .map((r) => r.userId)
          .filter((id) => id != null);
        if (userIds.length > 0) params.user_ids = userIds.join(",");
      }

      const response = await apiClient.get("/reports/pdf/bulk-download", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.data.type || "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const ext = response.data.type?.includes("zip") ? "zip" : "pdf";
      link.download = `Strengths-Compass-Results-${timestamp}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error bulk PDF download:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to download results. Please try again."
      );
    } finally {
      setPdfDownloading(false);
    }
  };

  const openDetail = async (result, tab = "summary") => {
    const testResultId = result?.rawData?.test_result_id || result?.id;
    if (!testResultId) return;
    if (tab === "answers") {
      if (!result?.userId) return;
      navigate(`/admin/dashboard/users/${result.userId}/answers`, {
        state: { fromTestResults: true },
      });
      return;
    }
    // Summary: fetch results via API then navigate with data
    setOpeningResultId(testResultId);
    try {
      const response = await apiClient.get(
        `/test-results/${testResultId}/report`
      );
      if (!result?.userId) return;
      navigate(`/admin/dashboard/users/${result.userId}/results`, {
        state: {
          fromTestResults: true,
          reportData: response.data,
        },
      });
    } catch (err) {
      console.error("Error fetching test result:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load results. Please try again."
      );
    } finally {
      setOpeningResultId(null);
    }
  };

  const openSummaryModal = (result) => {
    const testResultId = result?.rawData?.test_result_id || result?.id;
    if (!testResultId) return;
    setSummaryTestResultId(testResultId);
    setReportSummary("");
    setRecommendations("");
    setSummaryStatus(null);
    setSummaryModalOpen(true);
  };

  const closeSummaryModal = () => {
    if (savingSummary) return;
    setSummaryModalOpen(false);
  };

  const handleSubmitSummary = async () => {
    if (!summaryTestResultId) {
      setSummaryStatus("Error: Test result ID is missing.");
      return;
    }
    if (!reportSummary.trim()) {
      setSummaryStatus("Error: Summary cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setSummaryStatus("Error: Authentication required. Please login.");
        return;
      }

      setSavingSummary(true);
      setSummaryStatus(null);

      const payload = {
        report_summary: reportSummary.trim(),
      };
      if (recommendations.trim()) {
        payload.recommendations = recommendations.trim();
      }

      await apiClient.put(
        `/test-results/${summaryTestResultId}/report`,
        payload
      );

      setSummaryStatus("Summary submitted successfully.");
      setTimeout(() => {
        setSummaryModalOpen(false);
      }, 800);
    } catch (err) {
      console.error("Error submitting summary:", err);
      setSummaryStatus(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit summary. Please try again."
      );
    } finally {
      setSavingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="neutral-text bg min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="spinner spinner-lg mb-3"></span>
          <p className="text-sm neutral-text-muted">Loading test results...</p>
        </div>
      </div>
    );
  }

  const hasResults = results.length > 0;
  const hasFiltered = filteredResults.length > 0;

  return (
    <div className="neutral-text bg min-h-screen p-4 md:p-8">
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title="Error"
        message={error || ""}
      />

      <AlertModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "", title: "" })}
        type="success"
        title={successModal.title}
        message={successModal.message}
      />

      {/* Fixed bar: transparent like layout header, shadow below, below layout bar */}
      <div className="fixed top-23 left-0 right-0 lg:left-64 z-[100] backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-md py-3 px-4 sm:px-6 md:px-8 md:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-around sm:gap-3">
         

        

          {/* Report buttons - wrap on small screens */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleSummaryReport}
              disabled={generatingSummaryReport || selectedUsers.length === 0}
              className="btn btn-secondary text-sm w-full sm:min-w-[240px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {generatingSummaryReport ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">
                  Summary Report {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                </span>
                <span className="sm:hidden">Download</span>
              </>
            )}
          </button>

          <button
            onClick={handleFullReport}
            disabled={generatingFullReport || selectedUsers.length === 0}
            className="btn btn-secondary text-sm w-full sm:min-w-[220px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingFullReport ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">
                  Full Report {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                </span>
                <span className="sm:hidden">Download</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="btn btn-primary text-sm w-full sm:min-w-[210px]"
          >
            {exporting ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span className="hidden sm:inline">Downloading...</span>
                <span className="sm:hidden">Downloading...</span>
              </>
            ) : (
              <>
                <HiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  Excel Results
                </span>
                <span className="sm:hidden">Download</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportSummary}
            disabled={exportingSummary}
            className="btn btn-primary text-sm w-full sm:min-w-[210px]"
          >
            {exportingSummary ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span className="hidden sm:inline">Downloading...</span>
                <span className="sm:hidden">Downloading...</span>
              </>
            ) : (
              <>
                <HiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  Export Summary
                </span>
                <span className="sm:hidden">Summary</span>
              </>
            )}
          </button>

          <button
            onClick={handleBulkDownloadPdf}
            disabled={pdfDownloading}
            className="btn btn-secondary text-sm w-full sm:min-w-[220px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfDownloading ? (
              <>
                <span className="spinner spinner-sm"></span>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <HiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Results ZIP</span>
              </>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Spacer so content is not hidden under the fixed bar */}
      <div className="h-20 md:h-10" aria-hidden="true" />

        {/* Filters Card - responsive and aligned */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 sm:p-5 mb-4">
          <div className="flex flex-col gap-4">
            {/* Row 1: Total Users + Filter row (stack on mobile, inline on lg) */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6 justify-between">
              {/* Total Users Count */}
              <div className="flex items-center gap-2 px-4 py-2.5  border border-blue-300 rounded-lg shadow-sm h-10 w-fit shrink-0">
                <div className="p-1 bg-blue-500 rounded-full">
                  <HiUser className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-blue-700 font-medium">Total Users:</span>
                  <span className="text-base font-bold text-blue-900">{filteredResults.length}</span>
                </div>
              </div>

                {/* Search Bar - full width on mobile */}
          <div className="w-full sm:flex-1 sm:min-w-0 sm:max-w-md">
            <div className="group flex w-full rounded-md overflow-hidden border border-neutral-300 transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary h-9">
                <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
                  <HiSearch className="h-4 w-4 primary-text group-focus-within:secondary-text transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name, email, test..."
                  className="flex-1 py-2 px-3 bg-white text-xs sm:text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors h-full"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="flex items-center justify-center px-3 hover:bg-secondary-bg-light transition-colors h-full"
                    title="Clear search"
                  >
                    <HiX className="w-4 h-4 neutral-text-muted" />
                  </button>
                )}
              </div>
            </div>

              {/* Filter Controls - wrap on small screens, single row on lg */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 min-w-0 lg:flex-nowrap lg:items-end">
                {/* Test Dropdown */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:flex-initial sm:min-w-[140px] md:min-w-[160px]">
                  <label className="text-xs font-medium neutral-text-muted whitespace-nowrap">
                    Test
                  </label>
                  <div className="relative h-9">
                    <select
                      value={selectedTestId}
                      onChange={(e) => {
                        setSelectedTestId(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="input input-sm bg-white text-xs sm:text-sm pr-8 pl-3 w-full h-full min-h-9 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary appearance-none border-neutral-300 rounded"
                      disabled={testsLoading}
                    >
                      <option value="">All Tests</option>
                      {tests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.title}
                        </option>
                      ))}
                    </select>
                    <HiChevronDown className="w-4 h-4 text-blue-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* From Date */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:flex-initial sm:min-w-[140px] md:min-w-[150px]">
                  <label className="text-xs font-medium neutral-text-muted whitespace-nowrap">
                    From Date
                  </label>
                  <div className="relative h-9">
                    <input
                      type="date"
                      value={fromDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setFromDate(selectedDate);
                        setDateError("");
                        if (toDate && selectedDate && new Date(selectedDate) > new Date(toDate)) {
                          setDateError("From Date cannot be after To Date");
                        } else if (dateError) setDateError("");
                      }}
                      className={`input input-sm bg-white text-xs sm:text-sm pr-8 pl-3 w-full h-full min-h-9 border-neutral-300 rounded ${
                        dateError ? "border-red-300 focus:border-red-500" : ""
                      }`}
                    />
                    <HiCalendar className="w-4 h-4 text-blue-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* To Date */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:flex-initial sm:min-w-[140px] md:min-w-[150px]">
                  <label className="text-xs font-medium neutral-text-muted whitespace-nowrap">
                    To Date
                  </label>
                  <div className="relative h-9">
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setToDate(selectedDate);
                        setDateError("");
                        if (fromDate && selectedDate && new Date(selectedDate) < new Date(fromDate)) {
                          setDateError("To Date cannot be before From Date");
                        } else if (dateError) setDateError("");
                      }}
                      className={`input input-sm bg-white text-xs sm:text-sm pr-8 pl-3 w-full h-full min-h-9 border-neutral-300 rounded ${
                        dateError ? "border-red-300 focus:border-red-500" : ""
                      }`}
                    />
                    <HiCalendar className="w-4 h-4 text-blue-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Action Buttons - aligned with inputs */}
                <div className="flex flex-wrap items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
                        setDateError("From Date cannot be after To Date");
                        return;
                      }
                      if (fromDate && new Date(fromDate) > new Date()) {
                        setDateError("From Date cannot be in the future");
                        return;
                      }
                      if (toDate && new Date(toDate) > new Date()) {
                        setDateError("To Date cannot be in the future");
                        return;
                      }
                      setDateError("");
                      setLoading(true);
                      setCurrentPage(1);
                      fetchResults();
                    }}
                    className="btn btn-sm secondary-bg black-text hover:secondary-bg-dark shadow-md whitespace-nowrap h-9 px-4 font-medium"
                    disabled={!!dateError}
                  >
                    Apply
                  </button>
                  {(fromDate || toDate || selectedTestId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                        setSelectedTestId("");
                        setDateError("");
                        setLoading(true);
                        setCurrentPage(1);
                        fetchResults();
                      }}
                      className="btn btn-ghost btn-sm whitespace-nowrap h-9 px-4"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Date Error Message */}
          {dateError && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {dateError}
            </div>
          )}
        </div>

      {!hasResults ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 primary-bg-light rounded-lg mb-3">
            <HiUser className="w-6 h-6 primary-text" />
          </div>
          <h3 className="text-base font-semibold neutral-text mb-1">
            No test results yet
          </h3>
          <p className="text-sm neutral-text-muted text-center">
            {error ? error : "There are no test results available yet."}
          </p>
        </div>
      ) : !hasFiltered ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 primary-bg-light rounded-lg mb-3">
            <HiUser className="w-6 h-6 primary-text" />
          </div>
          <h3 className="text-base font-semibold neutral-text mb-1">
            No results match your search
          </h3>
          <p className="text-sm neutral-text-muted text-center">
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-border-light -mx-4 sm:mx-0 mt-4">
            <div className="inline-block min-w-full align-middle">
              <table className="table min-w-full">
                <thead>
                  <tr className="bg-medium border-b border-neutral-border-light">
                    <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-center neutral-text-muted sticky left-0 bg-medium z-[5] w-14 sm:w-auto">
                      <div className="flex items-center justify-center gap-1.5 px-2 py-1">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = isIndeterminate;
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-400 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer hover:border-blue-500 transition-colors"
                          title={isAllSelected ? "Deselect all" : "Select all"}
                        />
                        {/* <span className="text-xs font-medium hidden sm:inline">Select All</span> */}
                      </div>
                    </th>
                    <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-left neutral-text-muted sticky left-[56px] sm:left-[64px] bg-medium z-[5]">
                      #
                    </th>
                    <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-left neutral-text-muted sticky left-[96px] sm:left-[114px] bg-medium z-[5] min-w-[150px] sm:min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* <span className="text-xs neutral-text-muted whitespace-nowrap hidden sm:inline">
                            Show:
                          </span> */}
                          <div className="relative">
                            <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                const value = e.target.value === "all" ? "all" : parseInt(e.target.value);
                                setItemsPerPage(value);
                                setCurrentPage(1);
                              }}
                              className="input input-sm bg-white text-xs pr-5 pl-2 h-7 sm:h-8 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary appearance-none border-neutral-300"
                            >
                              <option value={10}>10</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                              <option value="all">All</option>
                            </select>
                            <HiChevronDown className="w-3 h-3 text-blue-500 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                        <span>User</span>
                      </div>
                    </th>

                    {/* <th className="font-semibold text-sm py-3 px-4 text-center neutral-text-muted min-w-[100px]">
                      Total Score
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-center neutral-text-muted min-w-[100px]">
                      Avg Score
                    </th>
                    <th className="font-semibold text-sm py-3 px-4 text-center neutral-text-muted min-w-[100px]">
                      Avg %
                    </th> */}

                    <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-left neutral-text-muted min-w-[200px] sm:min-w-[300px]">
                      Clusters
                    </th>
                    <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-left neutral-text-muted min-w-[200px] sm:min-w-[300px]">
                      Constructs
                    </th>
                    {/* <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-left neutral-text-muted min-w-[120px] sm:min-w-[150px]">
                      Submitted
                    </th> */}
                    <th
                      className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 neutral-text-muted sticky right-0 bg-medium z-[5] min-w-[100px] sm:min-w-[120px]"
                      style={{ textAlign: "right" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((result, index) => {
                    const rowNumber =
                      itemsPerPage === "all"
                        ? index + 1
                        : (currentPageSafe - 1) * itemsPerPageValue + index + 1;
                    const isEven = index % 2 === 0;
                    return (
                      <tr
                        key={result.id}
                        className={`border-b border-neutral-border-light group ${
                          isEven ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td
                          className={`py-2 sm:py-3 px-2 sm:px-4 text-center sticky left-0 z-[4] transition-colors ${
                            isEven
                              ? "bg-white group-hover:bg-gray-100"
                              : "bg-gray-50 group-hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(result.id)}
                            onChange={() => handleSelectUser(result.id)}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-400 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer hover:border-blue-500 transition-colors"
                          />
                        </td>
                        <td
                          className={`py-2 sm:py-3 px-2 sm:px-4 neutral-text-muted sticky left-[56px] sm:left-[64px] z-[4] transition-colors text-xs sm:text-sm ${
                            isEven
                              ? "bg-white group-hover:bg-gray-100"
                              : "bg-gray-50 group-hover:bg-gray-100"
                          }`}
                        >
                          {rowNumber}
                        </td>
                        <td
                          className={`py-2 sm:py-3 px-2 sm:px-4 sticky left-[96px] sm:left-[114px] z-[4] transition-colors ${
                            isEven
                              ? "bg-white group-hover:bg-gray-100"
                              : "bg-gray-50 group-hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 sm:gap-1">
                           
                            
                            <span className="font-semibold text-xs sm:text-sm neutral-text break-words">
                              {result.userName}
                            </span>
                            <span className="text-xs neutral-text-muted break-words hidden sm:inline">
                              {result.email}
                            </span>
                            <span className="text-xs neutral-text-muted break-words hidden md:inline">
                              {result.userContact}
                            </span>
                            <span className="text-xs neutral-text-muted break-words hidden lg:inline">
                              {result.userCity}, {result.userState}
                            </span>
                            <span className="font-semibold text-xs sm:text-sm neutral-text break-words">
                              {result.testTitle}
                            </span>
                          </div>
                        </td>

                        {/* <td className="py-2 sm:py-3 px-2 sm:px-4 text-center neutral-text font-medium text-xs sm:text-sm">
                          {result.totalScore}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center neutral-text text-xs sm:text-sm">
                          {typeof result.averageScore === "number" 
                            ? result.averageScore.toFixed(2) 
                            : result.averageScore}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center neutral-text font-medium text-xs sm:text-sm">
                          {result.averagePercentage}
                        </td> */}

                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex flex-col gap-1 sm:gap-1.5 max-h-40 sm:max-h-48 overflow-y-auto">
                            {result.clusters &&
                            Array.isArray(result.clusters) &&
                            result.clusters.length > 0 ? (
                              result.clusters.map((cluster, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs border-l-2 border-blue-400 pl-1 sm:pl-2 py-0.5"
                                >
                                  <div className="font-semibold neutral-text break-words mb-0.5">
                                    {cluster.name || "N/A"}
                                  </div>
                                  <div className="flex flex-col gap-0.5 text-xs neutral-text-muted">
                                    {cluster.percentage !== null &&
                                      cluster.percentage !== undefined && (
                                        <span className="font-medium neutral-text">
                                          Score: {cluster.percentage}
                                        </span>
                                      )}

                                    {cluster.category &&
                                      cluster.category !== "N/A" && (
                                        <span
                                          className={`inline-block w-fit px-1.5 py-0.5 rounded text-xs font-semibold mt-0.5 ${
                                            cluster.category?.toLowerCase() ===
                                            "high"
                                              ? "bg-green-100 text-green-700"
                                              : cluster.category?.toLowerCase() ===
                                                "medium"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-gray-100 text-gray-700"
                                          }`}
                                        >
                                          {cluster.category.toUpperCase()}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs neutral-text-muted">
                                No cluster data
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex flex-col gap-1 sm:gap-1.5 max-h-40 sm:max-h-48 overflow-y-auto">
                            {result.constructs &&
                            Array.isArray(result.constructs) &&
                            result.constructs.length > 0 ? (
                              result.constructs.map((construct, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs border-l-2 border-purple-400 pl-1 sm:pl-2 py-0.5"
                                >
                                  <div className="font-semibold neutral-text break-words mb-0.5">
                                    {construct.name || "N/A"}
                                  </div>
                                  <div className="flex flex-col gap-0.5 text-xs neutral-text-muted">
                                    {construct.percentage !== null &&
                                      construct.percentage !== undefined && (
                                        <span className="font-medium neutral-text">
                                          Score: {construct.percentage}
                                        </span>
                                      )}

                                    {construct.category &&
                                      construct.category !== "N/A" && (
                                        <span
                                          className={`inline-block w-fit px-1.5 py-0.5 rounded text-xs font-semibold mt-0.5 ${
                                            construct.category?.toLowerCase() ===
                                            "high"
                                              ? "bg-green-100 text-green-700"
                                              : construct.category?.toLowerCase() ===
                                                "medium"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-gray-100 text-gray-700"
                                          }`}
                                        >
                                          {construct.category.toUpperCase()}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs neutral-text-muted">
                                No construct data
                              </span>
                            )}
                          </div>
                        </td>
                        {/* <td className="py-2 sm:py-3 px-2 sm:px-4 neutral-text text-xs sm:text-sm">
                          <span className="hidden sm:inline">{formatDate(result.submittedAt)}</span>
                          <span className="sm:hidden">{new Date(result.submittedAt).toLocaleDateString()}</span>
                        </td> */}
                        <td
                          className={`py-2 sm:py-3 px-2 sm:px-3 sticky right-0 z-[4] transition-colors ${
                            isEven
                              ? "bg-white group-hover:bg-gray-100"
                              : "bg-gray-50 group-hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex flex-col items-stretch justify-center gap-1">
                           

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(result, "summary");
                              }}
                              className="btn primary-bg-medium black-text hover:secondary-bg-dark shadow-md"
                              disabled={!result.userId || openingResultId !== null}
                              title="View detailed results"
                            >
                              {/* <HiEye className="w-4 h-4 mr-1" /> */}
                              <span className="hidden sm:inline">
                                {openingResultId === (result?.rawData?.test_result_id || result?.id)
                                  ? "Loading..."
                                  : "Results"}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(result, "answers");
                              }}
                              className="btn gray-bg black-text hover:secondary-bg-dark shadow-md"
                              disabled={!result.userId}
                              title="View submitted answers"
                            >
                              {/* <HiChartBar className="w-4 h-4 mr-1" /> */}
                              <span className="hidden sm:inline">Answers</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openSummaryModal(result);
                              }}
                              className="btn secondary-bg black-text hover:secondary-bg-dark shadow-md"
                              disabled={
                                !result?.rawData?.test_result_id && !result?.id
                              }
                              title="Submit summary"
                            >
                              Summary
                            </button>
                             <div className="flex black-text items-center justify-center px-3 py-2 rounded-md primary-bg-medium black-text hover:secondary-bg-dark">
                                <span className="hidden sm:inline font-medium">
                                SDB:{" "}
                                  {result.sdb?.percentage}

                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredResults.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-border-light">
              <div className="text-xs sm:text-sm neutral-text-muted text-center sm:text-left">
                Showing{" "}
                <span className="font-medium neutral-text">
                  {itemsPerPage === "all" 
                    ? 1 
                    : (currentPageSafe - 1) * itemsPerPageValue + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium neutral-text">
                  {itemsPerPage === "all"
                    ? filteredResults.length
                    : Math.min(
                        currentPageSafe * itemsPerPageValue,
                        filteredResults.length
                      )}
                </span>{" "}
                of{" "}
                <span className="font-medium neutral-text">
                  {filteredResults.length}
                </span>{" "}
                results
              </div>
              {itemsPerPage !== "all" && filteredResults.length > itemsPerPageValue && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPageSafe === 1}
                    className="btn btn-ghost btn-sm flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <HiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <div className="text-xs sm:text-sm font-medium">
                    Page {currentPageSafe} of {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPageSafe === totalPages}
                    className="btn btn-ghost btn-sm flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <HiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {summaryModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={savingSummary ? undefined : closeSummaryModal}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 z-[61]">
                <h3 className="text-lg font-semibold neutral-text mb-2">
                  Submit Summary
                </h3>

                <div className="space-y-3">
                  <div>
                    <textarea
                      rows={4}
                      value={reportSummary}
                      onChange={(e) => setReportSummary(e.target.value)}
                      className="w-full border border-neutral-border-light rounded-md text-sm p-2 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary resize-none"
                      placeholder="Write the key summary for this report..."
                      disabled={savingSummary}
                    />
                  </div>

                  {summaryStatus && (
                    <p
                      className={`text-xs ${
                        summaryStatus.toLowerCase().startsWith("error")
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {summaryStatus}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeSummaryModal}
                    disabled={savingSummary}
                    className="btn btn-primary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitSummary}
                    disabled={savingSummary}
                    className="btn btn-sm secondary-bg black-text hover:secondary-bg-dark shadow-md"
                  >
                    {savingSummary ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

