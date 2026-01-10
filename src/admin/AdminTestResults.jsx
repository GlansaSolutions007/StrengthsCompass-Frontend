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
  const itemsPerPage = 10;
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
          userId: item.user?.id || null,
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

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedResults = filteredResults.slice(
    (currentPageSafe - 1) * itemsPerPage,
    currentPageSafe * itemsPerPage
  );

  const formatDate = (value) => {
    if (!value || value === "N/A") return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
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

  const openDetail = (result, tab = "summary") => {
    if (!result?.userId) return;
    const path =
      tab === "answers"
        ? `/admin/dashboard/users/${result.userId}/answers`
        : `/admin/dashboard/users/${result.userId}/results`;
    navigate(path, { state: { fromTestResults: true } });
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

      <div className="mb-4 md:mb-6 flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold neutral-text flex items-center gap-2">
              <HiChartBar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Test Results
            </h1>
            <p className="text-xs sm:text-sm neutral-text-muted mt-1">
              Overview of user assessments and performance categories.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            // className="btn bg-green-600 hover:bg-green-700 text-white shadow-md flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"

            className="btn btn-secondary text-sm"
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
                  Download All Test Results
                </span>
                <span className="sm:hidden">Download</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex-1 w-full lg:max-w-md">
            <div className="group flex w-full rounded-md overflow-hidden border border-neutral-300 transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary">
              <div className="flex items-center justify-center bg-primary-bg-light px-2 sm:px-3 transition-all group-focus-within:bg-secondary-bg-light">
                <HiSearch className="h-4 w-4 sm:h-5 sm:w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, test..."
                className="flex-1 py-2 px-2 sm:px-3 bg-white text-xs sm:text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="flex items-center justify-center px-2 sm:px-3 hover:bg-secondary-bg-light transition-colors"
                  title="Clear search"
                >
                  <HiX className="w-4 h-4 neutral-text-muted" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col flex-1 sm:flex-none">
                <label className="text-xs neutral-text-muted mb-1">
                  Test
                </label>
                <div className="relative">
                  <select
                    value={selectedTestId}
                    onChange={(e) => {
                      setSelectedTestId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input input-sm bg-white text-xs sm:text-sm pr-8 sm:pr-9 pl-2 sm:pl-3 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary appearance-none"
                    disabled={testsLoading}
                  >
                    <option value="">All Tests</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))}
                  </select>
                  <HiChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col flex-1 sm:flex-none">
                <label className="text-xs neutral-text-muted mb-1">
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setFromDate(selectedDate);
                      setDateError("");

                      // Validate: To Date should not be before From Date
                      if (
                        toDate &&
                        selectedDate &&
                        new Date(selectedDate) > new Date(toDate)
                      ) {
                        setDateError("From Date cannot be after To Date");
                      } else if (dateError) {
                        setDateError("");
                      }
                    }}
                    className={`input input-sm bg-white text-xs sm:text-sm pr-8 sm:pr-9 pl-2 sm:pl-3 w-full sm:w-auto ${
                      dateError ? "border-red-300 focus:border-red-500" : ""
                    }`}
                  />
                  <HiCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col flex-1 sm:flex-none">
                <label className="text-xs neutral-text-muted mb-1">
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setToDate(selectedDate);
                      setDateError("");

                      // Validate: To Date should not be before From Date
                      if (
                        fromDate &&
                        selectedDate &&
                        new Date(selectedDate) < new Date(fromDate)
                      ) {
                        setDateError("To Date cannot be before From Date");
                      } else if (dateError) {
                        setDateError("");
                      }
                    }}
                    className={`input input-sm bg-white text-xs sm:text-sm pr-8 sm:pr-9 pl-2 sm:pl-3 w-full sm:w-auto ${
                      dateError ? "border-red-300 focus:border-red-500" : ""
                    }`}
                  />
                  <HiCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
            {dateError && (
              <div className="w-full text-xs text-red-600 mt-1">
                {dateError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Validate dates before applying
                  if (
                    fromDate &&
                    toDate &&
                    new Date(fromDate) > new Date(toDate)
                  ) {
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
                className="btn btn-sm secondary-bg black-text hover:secondary-bg-dark shadow-md flex-1 sm:flex-none"
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
                  className="btn btn-ghost btn-sm flex-1 sm:flex-none"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
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
                    <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-left neutral-text-muted sticky left-0 bg-medium z-[5]">
                      #
                    </th>
                    <th className="font-semibold text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 text-left neutral-text-muted sticky left-[40px] sm:left-[50px] bg-medium z-[5] min-w-[150px] sm:min-w-[200px]">
                      User
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
                      (currentPageSafe - 1) * itemsPerPage + index + 1;
                    const isEven = index % 2 === 0;
                    return (
                      <tr
                        key={result.id}
                        className={`border-b border-neutral-border-light group ${
                          isEven ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td
                          className={`py-2 sm:py-3 px-2 sm:px-4 neutral-text-muted sticky left-0 z-[4] transition-colors text-xs sm:text-sm ${
                            isEven
                              ? "bg-white group-hover:bg-gray-100"
                              : "bg-gray-50 group-hover:bg-gray-100"
                          }`}
                        >
                          {rowNumber}
                        </td>
                        <td
                          className={`py-2 sm:py-3 px-2 sm:px-4 sticky left-[40px] sm:left-[50px] z-[4] transition-colors ${
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
                              disabled={!result.userId}
                              title="View detailed results"
                            >
                              {/* <HiEye className="w-4 h-4 mr-1" /> */}
                              <span className="hidden sm:inline">Results</span>
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

          {filteredResults.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-border-light">
              <div className="text-xs sm:text-sm neutral-text-muted text-center sm:text-left">
                Showing{" "}
                <span className="font-medium neutral-text">
                  {(currentPageSafe - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium neutral-text">
                  {Math.min(
                    currentPageSafe * itemsPerPage,
                    filteredResults.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium neutral-text">
                  {filteredResults.length}
                </span>{" "}
                results
              </div>
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
