import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import apiClient from "../config/api";
import {
  HiArrowLeft,
  HiClock,
  HiChartBar,
  HiUser,
  HiDownload,
} from "react-icons/hi";
import AlertModal from "../components/AlertModal";
import StrengthsRadarChart from "../components/StrengthsRadarChart";
import ConstructsRadarChart from "../components/ConstructsRadarChart";
import TensionHeatmap from "../components/TensionHeatmap";
import ConstructSynergyTensionMatrix from "../components/ConstructSynergyTensionMatrix";
import ReportFooter from "../components/ReportFooter";

export default function UserResults() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const testIdFromUrl = searchParams.get("testId");
  const navigate = useNavigate();
  const location = useLocation();
  const fromTestResults = Boolean(location.state?.fromTestResults);
  const backTarget = fromTestResults
    ? "/admin/dashboard/users/test-results"
    : `/admin/dashboard/users/${userId}`;
  const backLabel = fromTestResults
    ? "Back to Test Results"
    : "Back to User Details";

  const handleBackNavigation = () => {
    navigate(backTarget);
  };
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [clusterDetails, setClusterDetails] = useState([]);
  const [constructDetails, setConstructDetails] = useState([]);
  const [radarChartData, setRadarChartData] = useState([]);
  const [clusterInsights, setClusterInsights] = useState([]);
  const [constructSynergyMatrix, setConstructSynergyMatrix] = useState([]);
  const [constructLabels, setConstructLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportSummary, setReportSummary] = useState("");
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setUser(null);
    setTestResults([]);
    setTestResult(null);
    setClusterDetails([]);
    setConstructDetails([]);
    setRadarChartData([]);
    setClusterInsights([]);
    setConstructSynergyMatrix([]);
    setConstructLabels([]);
    setReportSummary("");
    setSummaryStatus(null);
    setSavingSummary(false);

    const reportDataFromState =
      location.state?.fromTestResults && location.state?.reportData
        ? location.state.reportData
        : null;
    if (reportDataFromState) {
      let data = reportDataFromState?.data;
      if (!data && (reportDataFromState.test_result || reportDataFromState.report)) {
        data = reportDataFromState;
      }
      if (data) {
        applyReportData(data);
        return;
      }
      setError("Invalid report data");
      setLoading(false);
      return;
    }

    fetchUserDetails();
    fetchTestResults();
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
          name:
            userData.name ||
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
            userData.username ||
            "N/A",
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.email || "N/A",
          phone:
            userData.whatsapp_number ||
            userData.phone ||
            userData.phone_number ||
            userData.contact ||
            "N/A",
          contact:
            userData.contact ||
            userData.whatsapp_number ||
            userData.phone ||
            userData.phone_number ||
            "N/A",
          whatsappNumber: userData.whatsapp_number || "N/A",
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
          status:
            userData.is_active !== undefined
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

  const extractReportSummary = (payload, depth = 0) => {
    if (!payload || depth > 5) return "";
    if (typeof payload === "string") {
      return payload;
    }
    if (Array.isArray(payload)) {
      for (const item of payload) {
        const found = extractReportSummary(item, depth + 1);
        if (found) return found;
      }
      return "";
    }
    if (typeof payload === "object") {
      if (
        typeof payload.report_summary === "string" &&
        payload.report_summary.trim() !== ""
      ) {
        return payload.report_summary;
      }
      for (const key of Object.keys(payload)) {
        const found = extractReportSummary(payload[key], depth + 1);
        if (found) return found;
      }
    }
    return "";
  };

  const applyReportData = (data) => {
    if (!data) return;
    const testResultData = data?.test_result;

    const userData = data?.test_result?.user;
    if (userData) {
      setUser({
        id: userData.id,
        name:
          userData.name ||
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          "N/A",
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        email: userData.email || "N/A",
        phone:
          userData.whatsapp_number ||
          userData.contact_number ||
          userData.contact ||
          "N/A",
        contact:
          userData.contact ||
          userData.whatsapp_number ||
          userData.contact_number ||
          "N/A",
        whatsappNumber: userData.whatsapp_number || "N/A",
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
        status: "Active",
        lastLogin: userData.last_login || "Never",
        createdAt: userData.created_at || "N/A",
        updatedAt: userData.updated_at || "N/A",
      });
    }

    if (testResultData) {
      setTestResult(testResultData);
      setTestResults([testResultData]);
    }

    let insights = data?.cluster_insights;
    if (!insights && testResultData?.cluster_scores) {
      const clusterScores = testResultData.cluster_scores;
      insights = Object.keys(clusterScores).map((clusterName) => ({
        name: clusterName,
        percentage: clusterScores[clusterName]?.percentage || 0,
        average: clusterScores[clusterName]?.average || 0,
        strength_band: clusterScores[clusterName]?.category || "low",
      }));
    }
    if (insights && Array.isArray(insights)) {
      setClusterInsights(insights);
      setRadarChartData(
        insights.map((insight) => ({
          name: insight.name,
          percentage: insight.percentage || 0,
          average: insight.average ?? null,
        }))
      );
    } else if (testResultData?.cluster_scores) {
      const clusterScores = testResultData.cluster_scores;
      setRadarChartData(
        Object.keys(clusterScores).map((name) => ({
          name,
          value: clusterScores[name]?.percentage || 0,
        }))
      );
      setClusterInsights(
        Object.keys(clusterScores).map((clusterName) => ({
          name: clusterName,
          percentage: clusterScores[clusterName]?.percentage || 0,
          average: clusterScores[clusterName]?.average || 0,
          strength_band: clusterScores[clusterName]?.category || "low",
        }))
      );
    }

    const clusterDetailsData = data?.cluster_details;
    if (Array.isArray(clusterDetailsData)) setClusterDetails(clusterDetailsData);

    const constructDetailsData = data?.construct_details;
    if (Array.isArray(constructDetailsData))
      setConstructDetails(constructDetailsData);

    const synergyMatrix =
      data?.construct_synergy_matrix ||
      data?.synergy_tension_matrix ||
      data?.construct_matrix;
    if (Array.isArray(synergyMatrix) && synergyMatrix.length > 0)
      setConstructSynergyMatrix(synergyMatrix);

    let labels =
      data?.construct_labels ||
      data?.construct_names ||
      (constructDetailsData &&
      constructDetailsData.length > 0
        ? constructDetailsData.map((c) => c.name || c.construct_name || c.label)
        : []);
    if (
      (!labels || labels.length === 0) &&
      testResultData?.construct_scores
    ) {
      labels = Object.keys(testResultData.construct_scores);
    }
    if (Array.isArray(labels) && labels.length > 0) setConstructLabels(labels);

    const reportSummaryData = data?.report?.report_summary;
    setReportSummary(reportSummaryData || "");
    setError(null);
    setLoading(false);
  };

  const fetchTestResults = async () => {
    if (!userId) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const response = await apiClient.get(`/users/${userId}/test-results`, {
        params: { all: true },
      });

      let resultsData = null;
      if (response.data?.data && Array.isArray(response.data.data)) {
        resultsData = response.data.data;
      } else if (
        response.data?.test_results &&
        Array.isArray(response.data.test_results)
      ) {
        resultsData = response.data.test_results;
      } else if (Array.isArray(response.data)) {
        resultsData = response.data;
      }

      if (resultsData) {
        setTestResults(resultsData);

        // Get the test result to fetch report: prefer one matching testId from URL, else latest
        if (resultsData.length > 0) {
          const resultToLoad =
            testIdFromUrl != null && testIdFromUrl !== ""
              ? resultsData.find(
                  (r) =>
                    String(r.test_id ?? r.test?.id ?? "") === String(testIdFromUrl)
                ) || resultsData[0]
              : resultsData[0];
          const testResultId = resultToLoad.id || resultToLoad.test_result_id;
          if (testResultId) {
            fetchReportData(testResultId);
          }
        }
      } else {
        setTestResults([]);
      }

      const summaryFromResponse = extractReportSummary(response.data);
      setReportSummary(summaryFromResponse || "");

      // If no test results found, set loading to false
      if (!resultsData || resultsData.length === 0) {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching test results:", err);
      // Don't set error for test results, just log it
      setTestResults([]);
      setLoading(false);
    }
  };

  const fetchReportData = async (testResultId) => {
    if (!testResultId) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const response = await apiClient.get(
        `/test-results/${testResultId}/report`
      );
      console.log("Report API Response:", response.data);

      let data = response.data?.data;
      if (!data && response.data) {
        if (response.data.test_result || response.data.report) {
          data = response.data;
        }
      }

      if (!data) {
        console.error("No data found in report response");
        return;
      }

      applyReportData(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setLoading(false);
      if (err.response?.status === 404) {
        setError("Report not found for this test result.");
      }
    }
  };

  // Helper function to get percentage for a cluster or construct
  const getPercentage = (name, type = "cluster") => {
    if (type === "cluster") {
      const insight = clusterInsights.find((ci) => ci.name === name);
      return insight?.percentage || null;
    } else {
      // For constructs, check in construct_scores
      if (testResult?.construct_scores && testResult.construct_scores[name]) {
        return testResult.construct_scores[name].percentage || null;
      }
    }
    return null;
  };

  // Helper function to get traffic light color based on band
  const getBandColor = (band) => {
    if (!band) return "gray";
    const bandLower = band.toLowerCase();
    if (bandLower === "low") return "blue";
    if (bandLower === "medium") return "yellow";
    if (bandLower === "high") return "green";
    return "gray";
  };

  // Traffic Light Component
  const TrafficLight = ({ band }) => {
    const activeColor = getBandColor(band);

    // Get border color and background color based on active light
    const getLightStyles = () => {
      if (activeColor === "blue") {
        return {
          bg: "bg-blue-500",
          pulseBg: "bg-blue-400",
          border: "border-blue-500",
          shadow: "shadow-md shadow-blue-500/50",
          ring: "ring-2 ring-blue-300",
        };
      }
      if (activeColor === "yellow") {
        return {
          bg: "bg-yellow-500",
          pulseBg: "bg-yellow-400",
          border: "border-yellow-500",
          shadow: "shadow-md shadow-yellow-500/50",
          ring: "ring-2 ring-yellow-300",
        };
      }
      if (activeColor === "green") {
        return {
          bg: "bg-green-500",
          pulseBg: "bg-green-400",
          border: "border-green-500",
          shadow: "shadow-md shadow-green-500/50",
          ring: "ring-2 ring-green-300",
        };
      }
      return {
        bg: "bg-gray-500",
        pulseBg: "bg-gray-400",
        border: "border-gray-300",
        shadow: "shadow-md",
        ring: "ring-2 ring-gray-300",
      };
    };

    const styles = getLightStyles();

    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border-3 ${styles.border} shadow-sm`}
      >
        {/* Active Light Only */}
        <div
          className={`relative w-6 h-6 rounded-full transition-all duration-300 ${styles.bg} ${styles.shadow} ${styles.ring}`}
        >
          <div
            className={`absolute inset-0 rounded-full ${styles.pulseBg} animate-pulse opacity-50`}
          ></div>
        </div>
        {/* Band Value */}
        <span className="text-sm font-semibold text-gray-700">
          {band ? band.toUpperCase() : "N/A"}
        </span>
      </div>
    );
  };

  const handleReportSummarySubmit = async () => {
    if (!testResult || !testResult.id) {
      setSummaryStatus("Error: Test result ID is missing");
      return;
    }

    // Validation: Check if summary is not empty
    if (!reportSummary.trim()) {
      setSummaryStatus("Error: Summary cannot be empty");
      return;
    }

    // Validation: Check summary length
    if (reportSummary.trim().length > 600) {
      setSummaryStatus("Error: Summary is too long (max 600 characters)");
      return;
    }

    setSavingSummary(true);
    setSummaryStatus(null);

    try {
      const payload = {
        report_summary: reportSummary.trim(),
      };

      const response = await apiClient.put(
        `/test-results/${testResult.id}/report/pdf/mpdf`,
        payload
      );
      console.log("Response:", response.data);

      if (response.data?.status || response.status === 200) {
        setSummaryStatus("Summary saved successfully");
        setError(null);
        // Clear status message after 3 seconds
        setTimeout(() => {
          setSummaryStatus(null);
        }, 3000);
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating report summary:", err);

      let errorMessage = "Failed to save summary. Please try again.";

      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (err.response?.status === 404) {
        errorMessage = "Test result not found. Please refresh the page.";
      } else if (err.response?.status === 422) {
        errorMessage =
          err.response?.data?.message ||
          "Validation error. Please check your input.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setSummaryStatus(`Error: ${errorMessage}`);
    } finally {
      setSavingSummary(false);
    }
  };

  const generatePDF = async () => {
    try {
      if (!testResult || !testResult.id) {
        alert("No test result available");
        return;
      }

      setGeneratingPDF(true);
      
      const testResultId = testResult.id;
      console.log("Calling API endpoint:", `/test-results/${testResultId}/report/pdf/mpdf`);
      
      // Get the base URL from apiClient
      const baseURL = apiClient.defaults.baseURL || '';
      const fullUrl = `${baseURL}/test-results/${testResultId}/report/pdf/mpdf`;
      
      // Get auth token and age group ID
      const token = localStorage.getItem("adminToken");
      const variantId = localStorage.getItem("adminSelectedVariantId");
      const headers = {
        'Accept': 'application/pdf'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (variantId) {
        headers['X-Age-Group-Id'] = variantId.toString();
      }
      
      // Try fetching directly with fetch API for better blob handling
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: headers,
      });

      console.log("Fetch Response:", response);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Get content type from response headers
      const contentType = response.headers.get('content-type') || 'application/pdf';
      console.log("Content type:", contentType);

      // Get the blob
      const blob = await response.blob();
      console.log("Blob size:", blob.size, "bytes");
      console.log("Blob type:", blob.type);

      if (blob.size === 0) {
        throw new Error("Received empty file from server");
      }

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Strengths-Compass-Test-Report-${
        user?.name?.replace(/\s+/g, "_") || "User"
      }_${Date.now()}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setGeneratingPDF(false);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setGeneratingPDF(false);
      
      const errorMessage = error.message || "Failed to download PDF. Please check the console for details.";
      alert(`Error downloading PDF: ${errorMessage}`);
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

  if (error && !user) {
    return (
      <div className="neutral-text bg min-h-screen p-4 md:p-8">
        <AlertModal
          isOpen={!!error}
          onClose={handleBackNavigation}
          type="error"
          title="Error"
          message={error || ""}
        />
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBackNavigation}
            className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md btn-secondary"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" /> {backLabel}
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

      {/* Sticky header: same as AdminTestResults */}
      <div className="fixed top-23 left-0 right-0 lg:left-64 z-[100] backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-md py-3 px-4 sm:px-6 md:px-8 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackNavigation}
              className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md btn-secondary"
            >
              <HiArrowLeft className="w-5 h-5 mr-2" /> {backLabel}
            </button>
            <div>
              <h1 className="text-2xl font-bold neutral-text">Test Results</h1>
              {user && (
                <p className="text-xs neutral-text-muted mt-1">
                  Results for:{" "}
                  <span className="font-medium primary-text">{user.name}</span> (
                  {user.email})
                </p>
              )}
            </div>
          </div>
          {user && (
            <button
              onClick={generatePDF}
              disabled={generatingPDF}
              className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPDF ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  Generating PDF...
                </>
              ) : (
                <>
                  <HiDownload className="w-5 h-5" />
                  Download User Details PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Spacer so content is not hidden under the sticky header */}
      <div className="h-20 md:h-10" aria-hidden="true" />

      {/* Test Results */}
      <div className="max-w-4xl mt-10 mx-auto">
        {!testResult ? (
          <div className="bg-white rounded-lg border border-neutral-border-light shadow-sm p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 primary-bg-light rounded-lg mb-3">
                <HiChartBar className="w-6 h-6 primary-text" />
              </div>
              <h3 className="text-base font-semibold neutral-text mb-1">
                No test results yet
              </h3>
              <p className="text-sm neutral-text-muted text-center">
                No test data available.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {(() => {
              const result = testResult;
              return (
                <div
                  key={result.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  <style>{`
                  .test-report-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                  }
                  .test-report-header h1 {
                    font-size: 28px;
                    margin-bottom: 10px;
                    font-weight: bold;
                  }
                  .test-report-header p {
                    font-size: 14px;
                    opacity: 0.9;
                  }
                  .test-report-container {
                    padding: 20px;
                  }
                  .test-report-section {
                    margin-bottom: 30px;
                  }
                  .test-report-section-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #667eea;
                  }
                  .test-report-user-info {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                  }
                  .test-report-user-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                  }
                  .test-report-info-item {
                    margin-bottom: 10px;
                  }
                  .test-report-info-label {
                    font-weight: bold;
                    color: #555;
                    margin-bottom: 5px;
                    font-size: 12px;
                  }
                  .test-report-info-value {
                    color: #333;
                    font-size: 14px;
                  }
                  .test-report-scores-section {
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                  }
                  .test-report-score-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #f0f0f0;
                  }
                  .test-report-score-item:last-child {
                    border-bottom: none;
                  }
                  .test-report-score-label {
                    font-weight: 600;
                    color: #555;
                    font-size: 14px;
                  }
                  .test-report-score-value {
                    font-weight: bold;
                    color: #667eea;
                    font-size: 14px;
                  }
                  .test-report-cluster-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #f0f0f0;
                  }
                  .test-report-cluster-item:last-child {
                    border-bottom: none;
                  }
                  .test-report-footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #e0e0e0;
                    text-align: center;
                    color: #777;
                    font-size: 10px;
                  }
                `}</style>

                  {/* Header */}
                  <div className="test-report-header">
                    <h1>{result.test?.title || "Strengths Compass"}</h1>
                    <p>
                      Test Report -{" "}
                      {result.test?.title || "Strengths Compass Assessment"}
                    </p>
                  </div>

                  <div className="test-report-container">
                    {/* User Information */}
                    <div className="test-report-section">
                      <div className="test-report-section-title">
                        User Information
                      </div>
                      <div className="test-report-user-info">
                        <div className="test-report-user-grid">
                          <div className="test-report-info-item">
                            <div className="test-report-info-label">Name</div>
                            <div className="test-report-info-value">
                              {user?.name || "N/A"}
                            </div>
                          </div>
                          <div className="test-report-info-item">
                            <div className="test-report-info-label">Email</div>
                            <div className="test-report-info-value">
                              {user?.email || "N/A"}
                            </div>
                          </div>

                          <div className="test-report-info-item">
                            <div className="test-report-info-label">
                              Test Status
                            </div>
                            <div className="test-report-info-value">
                              {result.status || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {reportSummary && (
                      <div className="test-report-section mb-6">
                        <h3 className="text-xl font-semibold neutral-text">
                          Report Summary
                        </h3>
                        <div className="w-full min-h-[140px] rounded-lg border border-neutral-border-light bg-light p-3 text-sm neutral-text">
                          {reportSummary}
                        </div>
                      </div>
                    )}

                    {/* STRENGTHS TO LEVERAGE and EMERGING CAPABILITIES sections */}
                    {result.cluster_scores &&
                      Object.keys(result.cluster_scores).length > 0 && (() => {
                        // Separate clusters by band
                        const highBandClusters = [];
                        const lowMediumBandClusters = [];

                        Object.entries(result.cluster_scores).forEach(
                          ([clusterName, clusterData]) => {
                            const band = clusterData.category?.toLowerCase() || "";
                            if (band === "high") {
                              highBandClusters.push({ name: clusterName, data: clusterData });
                            } else if (band === "low" || band === "medium") {
                              lowMediumBandClusters.push({ name: clusterName, data: clusterData });
                            }
                          }
                        );

                        return (
                          <>
                            {/* STRENGTHS TO LEVERAGE Section */}
                            {highBandClusters.length > 0 && (
                              <div className="test-report-section mb-6">
                                <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                  STRENGTHS TO LEVERAGE
                                </h3>
                                <div className="space-y-6">
                                  {highBandClusters.map(({ name, data }) => (
                                    <div
                                      key={name}
                                      className="border-l-4 border-blue-500 pl-4 py-2"
                                    >
                                      <h4 className="text-lg font-bold text-blue-600 mb-2">
                                        {name}
                                      </h4>
                                      {data.behaviour && (
                                        <div className="mt-2">
                                          {/* <span className="text-sm font-semibold text-gray-700">
                                            Tendency:{" "}
                                          </span> */}
                                          <p className="text-sm text-gray-700 mt-1">
                                            {data.behaviour}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* EMERGING CAPABILITIES & DEVELOPMENT PRIORITIES Section */}
                            {lowMediumBandClusters.length > 0 && (
                              <div className="test-report-section mb-6">
                                <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
                                  EMERGING CAPABILITIES & DEVELOPMENT PRIORITIES
                                </h3>
                                <div className="space-y-6">
                                  {lowMediumBandClusters.map(({ name, data }) => (
                                    <div
                                      key={name}
                                      className="border-l-4 border-blue-500 pl-4 py-2"
                                    >
                                      <h4 className="text-lg font-bold text-blue-600 mb-2">
                                        {name}
                                      </h4>
                                      {data.behaviour && (
                                        <div className="mt-2">
                                          {/* <span className="text-sm font-semibold text-gray-700">
                                            Tendency:{" "}
                                          </span> */}
                                          <p className="text-sm text-gray-700 mt-1">
                                            {data.behaviour}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(() => {
                              const sdbPercentage = result?.sdb_percentage || testResult?.sdb_percentage;
                              console.log("Checking Guidance - SDB Percentage:", sdbPercentage, "Result:", result, "TestResult:", testResult);
                              return sdbPercentage && Number(sdbPercentage) >= 90;
                            })() && (
                              <div className="test-report-section mb-6">
                                <div 
                                  className="rounded-lg p-4 border-l-4"
                                  style={{
                                    backgroundColor: '#fee2e2', 
                                    borderLeftColor: '#dc2626',
                                    borderLeftWidth: '4px'
                                  }}
                                >
                                  <p className="font-bold mb-2" style={{ color: '#dc2626' }}>
                                    Guidance:
                                  </p>
                                  <p className="font-bold text-sm text-gray-700">
                                    "This profile may benefit from further exploration to distinguish between current strengths and aspirational qualities. A follow-up conversation with a coach can help personalize these insights."
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}

                    {result.cluster_scores &&
                      Object.keys(result.cluster_scores).length > 0 && (
                        <div className="test-report-section">
                          <div className="test-report-section-title">
                            Cluster Scores
                          </div>
                          <div className="test-report-scores-section">
                            {Object.entries(result.cluster_scores).map(
                              ([clusterName, clusterData]) => (
                                <div
                                  key={clusterName}
                                  className="test-report-cluster-item"
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-lg font-semibold text-gray-700">
                                        {clusterName}
                                      </span>
                                    </div>
                                    {clusterData.category && (
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                          Band:{" "}
                                        </span>
                                        <TrafficLight
                                          band={clusterData.category}
                                        />
                                      </div>
                                    )}
                                    {clusterData.description && (
                                      <div className="mb-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                          Description:{" "}
                                        </span>
                                        <p className="text-sm text-gray-700 mt-1">
                                          {clusterData.description}
                                        </p>
                                      </div>
                                    )}
                                    {clusterData.behaviour && (
                                      <div className="mb-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                          Tendency:{" "}
                                        </span>
                                        <p className="text-sm text-gray-700 mt-1">
                                          {clusterData.behaviour}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Construct Scores */}
                    {result.construct_scores &&
                      Object.keys(result.construct_scores).length > 0 && (
                        <div className="test-report-section">
                          <div className="test-report-section-title">
                            Construct Scores
                          </div>
                          <div className="test-report-scores-section">
                            {Object.entries(result.construct_scores).map(
                              ([constructName, constructData]) => (
                                <div
                                  key={constructName}
                                  className="test-report-cluster-item"
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-lg font-semibold text-gray-700">
                                        {constructName}
                                      </span>
                                    </div>
                                    {constructData.category && (
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                          Band:{" "}
                                        </span>
                                        <TrafficLight
                                          band={constructData.category}
                                        />
                                      </div>
                                    )}
                                    {constructData.description && (
                                      <div className="mb-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                          Description:{" "}
                                        </span>
                                        <p className="text-sm text-gray-700 mt-1">
                                          {constructData.description}
                                        </p>
                                      </div>
                                    )}
                                    {constructData.behaviour && (
                                      <div className="mb-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                          Tendency:{" "}
                                        </span>
                                        <p className="text-sm text-gray-700 mt-1">
                                          {constructData.behaviour}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {/* Radar charts: show only when 2+ clusters/constructs (single-axis radar is not shown) */}
                    {testResult?.cluster_scores &&
                      (() => {
                        const clusterNames = Object.keys(testResult.cluster_scores);
                        return clusterNames.length > 1 ? (
                          <div
                            id="pdf-radar-chart-section"
                            className="mb-10 max-w-4xl mx-auto"
                          >
                            <StrengthsRadarChart
                              clusterScores={testResult.cluster_scores}
                              clusters={clusterNames}
                              size={500}
                            />
                          </div>
                        ) : null;
                      })()}

                    {testResult?.construct_scores &&
                      (() => {
                        const constructNames = Object.keys(testResult.construct_scores);
                        return constructNames.length > 1 ? (
                          <div
                            id="pdf-constructs-radar-chart-section"
                            className="mb-10 max-w-4xl mx-auto"
                          >
                            <ConstructsRadarChart
                              constructScores={testResult.construct_scores}
                              constructs={constructNames}
                              size={500}
                            />
                          </div>
                        ) : null;
                      })()}

                    {/* Tension Heatmap */}
                    {/* {clusterInsights.length > 0 && (
                    <div id="pdf-heatmap-section" className="mb-10 max-w-6xl mx-auto">
                      <TensionHeatmap data={clusterInsights} />
                    </div>
                  )} */}

                    {/* Construct Synergy-Tension Matrix */}
                    {/* <div id="pdf-construct-matrix-section" className="mb-10 max-w-7xl mx-auto">
                    <ConstructSynergyTensionMatrix 
                      matrix={constructSynergyMatrix.length > 0 ? constructSynergyMatrix : []}
                      labels={constructLabels.length > 0 ? constructLabels : []}
                      constructScores={testResult?.construct_scores || {}}
                    />
                  </div> */}

                    {/* Footer */}
                    <ReportFooter createdAt={result.created_at} />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
