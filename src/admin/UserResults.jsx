import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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

export default function UserResults() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromTestResults = Boolean(location.state?.fromTestResults);
  const backTarget = fromTestResults
    ? "/admin/dashboard/users/test-results"
    : `/admin/dashboard/users/${userId}`;
  const backLabel = fromTestResults ? "Back to Test Results" : "Back to User Details";

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
    if (userId) {
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
      fetchUserDetails();
      fetchTestResults();
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
          phone: userData.whatsapp_number || userData.phone || userData.phone_number || userData.contact || "N/A",
          contact: userData.contact || userData.whatsapp_number || userData.phone || userData.phone_number || "N/A",
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
      } else if (response.data?.test_results && Array.isArray(response.data.test_results)) {
        resultsData = response.data.test_results;
      } else if (Array.isArray(response.data)) {
        resultsData = response.data;
      }

      if (resultsData) {
        setTestResults(resultsData);
        
        // Get the latest test result ID to fetch report
        if (resultsData.length > 0) {
          const latestResult = resultsData[0]; // Get first result (usually latest)
          const testResultId = latestResult.id || latestResult.test_result_id;
          if (testResultId) {
            // Fetch report data for this test result
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

      const response = await apiClient.get(`/test-results/${testResultId}/report`);
      console.log("Report API Response:", response.data);

      // Check multiple possible response structures
      let data = response.data?.data;
      
      // If data is not at response.data.data, try response.data directly
      if (!data && response.data) {
        if (response.data.test_result || response.data.report) {
          data = response.data;
        }
      }
      
      if (!data) {
        console.error("No data found in report response");
        return;
      }

      // Extract user details from data.test_result.user
      const userData = data?.test_result?.user;
      if (userData) {
        const mappedUser = {
          id: userData.id,
          name: userData.name || `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "N/A",
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.email || "N/A",
          phone: userData.whatsapp_number || userData.contact_number || userData.contact || "N/A",
          contact: userData.contact || userData.whatsapp_number || userData.contact_number || "N/A",
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
        };
        setUser(mappedUser);
      }

      // Extract test result from data.test_result
      const testResultData = data?.test_result;
      if (testResultData) {
        setTestResult(testResultData);
      }

      // Extract cluster insights for radar chart
      // Try cluster_insights first, then calculate from cluster_scores
      let insights = data?.cluster_insights;
      
      if (!insights && testResultData?.cluster_scores) {
        // Create cluster_insights from cluster_scores
        const clusterScores = testResultData.cluster_scores;
        insights = Object.keys(clusterScores).map(clusterName => ({
          name: clusterName,
          percentage: clusterScores[clusterName]?.percentage || 0,
          average: clusterScores[clusterName]?.average || 0,
          strength_band: clusterScores[clusterName]?.category || 'low'
        }));
      }

      if (insights && Array.isArray(insights)) {
        setClusterInsights(insights);

        // Map to radar chart format with extra fields
        const radarData = insights.map((insight) => ({
          name: insight.name,
          percentage: insight.percentage || 0,
          average: insight.average ?? null,
        }));
        setRadarChartData(radarData);
      } else if (testResultData?.cluster_scores) {
        // Fallback to cluster_scores
        const clusterScores = testResultData.cluster_scores;
        const radarData = [
          { name: "Caring & Connection", value: clusterScores["Caring & Connection"]?.percentage || 0 },
          { name: "Humility & Integrity", value: clusterScores["Humility & Integrity"]?.percentage || 0 },
          { name: "Drive & Achievement", value: clusterScores["Drive & Achievement"]?.percentage || 0 },
          { name: "Resilience & Adaptability", value: clusterScores["Resilience & Adaptability"]?.percentage || 0 },
          { name: "Leadership & Growth Orientation", value: clusterScores["Leadership & Growth Orientation"]?.percentage || 0 },
          { name: "Optimism & Innovation", value: clusterScores["Optimism & Innovation"]?.percentage || 0 },
        ];
        setRadarChartData(radarData);
        
        // Create cluster insights from cluster scores
        const insightsFromScores = Object.keys(clusterScores).map(clusterName => ({
          name: clusterName,
          percentage: clusterScores[clusterName]?.percentage || 0,
          average: clusterScores[clusterName]?.average || 0,
          strength_band: clusterScores[clusterName]?.category || 'low'
        }));
        setClusterInsights(insightsFromScores);
      }

      // Extract cluster details - may need to be fetched separately or constructed
      // For now, we'll try to extract from the response
      const clusterDetailsData = data?.cluster_details;
      if (Array.isArray(clusterDetailsData)) {
        setClusterDetails(clusterDetailsData);
      }

      // Extract construct details
      const constructDetailsData = data?.construct_details;
      if (Array.isArray(constructDetailsData)) {
        setConstructDetails(constructDetailsData);
      }

      // Extract construct synergy-tension matrix
      const synergyMatrix = data?.construct_synergy_matrix || 
                           data?.synergy_tension_matrix || 
                           data?.construct_matrix;
      if (Array.isArray(synergyMatrix) && synergyMatrix.length > 0) {
        setConstructSynergyMatrix(synergyMatrix);
      }

      // Extract construct labels
      let labels = data?.construct_labels || 
                   data?.construct_names ||
                   (constructDetailsData && constructDetailsData.length > 0 
                     ? constructDetailsData.map(c => c.name || c.construct_name || c.label)
                     : []);
      
      // Fallback: Extract from construct_scores if available
      if ((!labels || labels.length === 0) && testResultData?.construct_scores) {
        labels = Object.keys(testResultData.construct_scores);
      }
      
      if (Array.isArray(labels) && labels.length > 0) {
        setConstructLabels(labels);
      }

      // Extract report summary from data.report.report_summary
      const reportSummaryData = data?.report?.report_summary;
      if (reportSummaryData) {
        setReportSummary(reportSummaryData);
      } else {
        setReportSummary("");
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setLoading(false);
      // Don't set error, just log it - report data is optional
      if (err.response?.status === 404) {
        setError("Report not found for this test result.");
      }
    }
  };

  // Helper function to get percentage for a cluster or construct
  const getPercentage = (name, type = 'cluster') => {
    if (type === 'cluster') {
      const insight = clusterInsights.find(ci => ci.name === name);
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
    if (!band) return 'gray';
    const bandLower = band.toLowerCase();
    if (bandLower === 'low') return 'blue';
    if (bandLower === 'medium') return 'yellow';
    if (bandLower === 'high') return 'green';
    return 'gray';
  };

  // Traffic Light Component
  const TrafficLight = ({ band }) => {
    const activeColor = getBandColor(band);
    
    // Get border color and background color based on active light
    const getLightStyles = () => {
      if (activeColor === 'blue') {
        return {
          bg: 'bg-blue-500',
          pulseBg: 'bg-blue-400',
          border: 'border-blue-500',
          shadow: 'shadow-md shadow-blue-500/50',
          ring: 'ring-2 ring-blue-300'
        };
      }
      if (activeColor === 'yellow') {
        return {
          bg: 'bg-yellow-500',
          pulseBg: 'bg-yellow-400',
          border: 'border-yellow-500',
          shadow: 'shadow-md shadow-yellow-500/50',
          ring: 'ring-2 ring-yellow-300'
        };
      }
      if (activeColor === 'green') {
        return {
          bg: 'bg-green-500',
          pulseBg: 'bg-green-400',
          border: 'border-green-500',
          shadow: 'shadow-md shadow-green-500/50',
          ring: 'ring-2 ring-green-300'
        };
      }
      return {
        bg: 'bg-gray-500',
        pulseBg: 'bg-gray-400',
        border: 'border-gray-300',
        shadow: 'shadow-md',
        ring: 'ring-2 ring-gray-300'
      };
    };
    
    const styles = getLightStyles();
    
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border-3 ${styles.border} shadow-sm`}>
        {/* Active Light Only */}
        <div className={`relative w-6 h-6 rounded-full transition-all duration-300 ${styles.bg} ${styles.shadow} ${styles.ring}`}>
          <div className={`absolute inset-0 rounded-full ${styles.pulseBg} animate-pulse opacity-50`}></div>
        </div>
        {/* Band Value */}
        <span className="text-sm font-semibold text-gray-700">
          {band ? band.toUpperCase() : 'N/A'}
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
        `/test-results/${testResult.id}/report`,
        payload
      );

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
        errorMessage = err.response?.data?.message || "Validation error. Please check your input.";
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
      if (!testResult) {
        alert('No test result available to generate PDF');
        return;
      }

      setGeneratingPDF(true);
      console.log('Starting PDF generation...');

      // Dynamically import jsPDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF();
      
      console.log('jsPDF loaded successfully');
    
      // Colors
      const primaryColor = [102, 126, 234]; // #667eea
      const textColor = [51, 51, 51];
      const grayColor = [128, 128, 128];
      
      // Band colors (RGB)
      const getBandColorRGB = (band) => {
        if (!band) return grayColor;
        const bandLower = band.toLowerCase();
        if (bandLower === 'low') return [59, 130, 246]; // blue-500
        if (bandLower === 'medium') return [234, 179, 8]; // yellow-500
        if (bandLower === 'high') return [34, 197, 94]; // green-500
        return grayColor;
      };
      
      const pxToMm = (px) => px * 0.264583;

      const captureElementImage = async (element, maxWidth = 180) => {
        try {
          if (!element) {
            console.warn('captureElementImage: element is null');
            return null;
          }
          
          const html2canvas = await import('html2canvas').catch((err) => {
            console.error('Failed to import html2canvas:', err);
            return null;
          });
          
          if (!html2canvas) {
            console.error('html2canvas module not available');
            return null;
          }

          // Allow DOM to settle before capture
          await new Promise((resolve) => requestAnimationFrame(() => resolve()));

          const canvas = await html2canvas.default(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
          }).catch((err) => {
            console.error('html2canvas capture failed:', err);
            return null;
          });

          if (!canvas) {
            console.error('Canvas creation failed');
            return null;
          }

          const imgData = canvas.toDataURL('image/png');
          const widthPx = canvas.width;
          const heightPx = canvas.height;
          const naturalWidthMm = pxToMm(widthPx);
          const imgWidth = Math.min(maxWidth, naturalWidthMm || maxWidth);
          const imgHeight = (heightPx / widthPx) * imgWidth;

          return { imgData, imgWidth, imgHeight };
        } catch (error) {
          console.error('Error in captureElementImage:', error);
          return null;
        }
      };

      // Helper function to capture and add traffic light component from DOM
      const addTrafficLightFromDOM = async (band, x, y) => {
        try {
          // Find all traffic light components - look for divs with specific structure
          const allDivs = document.querySelectorAll('div');
          let matchingLight = null;
          
          // Find the one matching the band text
          for (const div of allDivs) {
            // Check if it has the traffic light structure: inline-flex, items-center, gap-2, rounded-lg, border-3
            const classes = div.className || '';
            if (classes.includes('inline-flex') && 
                classes.includes('items-center') && 
                classes.includes('gap-2') &&
                classes.includes('rounded-lg') &&
                classes.includes('border-3')) {
              const text = div.textContent?.trim().toUpperCase();
              if (text && text.includes(band.toUpperCase())) {
                matchingLight = div;
                break;
              }
            }
          }
          
          if (matchingLight) {
            const html2canvas = await import('html2canvas').catch(() => null);
            if (html2canvas) {
              const canvas = await html2canvas.default(matchingLight, {
                backgroundColor: '#ffffff',
                scale: 3, // Higher scale for better quality
                logging: false,
                width: matchingLight.offsetWidth,
                height: matchingLight.offsetHeight,
                useCORS: true
              });
              
              const imgData = canvas.toDataURL('image/png');
              
              // Calculate size in mm (convert from pixels at 96 DPI)
              const imgWidth = (canvas.width / 96) * 25.4; // Convert pixels to mm
              const imgHeight = (canvas.height / 96) * 25.4;
              
              // Scale to reasonable size (max 25mm width)
              const maxWidth = 25;
              let finalWidth = imgWidth;
              let finalHeight = imgHeight;
              
              if (imgWidth > maxWidth) {
                const scale = maxWidth / imgWidth;
                finalWidth = maxWidth;
                finalHeight = imgHeight * scale;
              }
              
              // Add image centered vertically
              doc.addImage(imgData, 'PNG', x, y - finalHeight / 2, finalWidth, finalHeight);
              return finalWidth;
            }
          }
        } catch (err) {
          console.error('Error capturing traffic light:', err);
        }
        
        // Fallback: draw simple version if capture fails
        const color = getBandColorRGB(band);
        const bandText = band ? band.toUpperCase() : 'N/A';
        const circleRadius = 1.5; // 3mm radius
        const gap = 2;
        
        // Draw circle
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(x + circleRadius, y, circleRadius, 'F');
        
        // Draw text
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(bandText, x + circleRadius * 2 + gap, y);
        
        return circleRadius * 2 + gap + doc.getTextWidth(bandText);
      };
      
      let yPos = 20;
      
      // Header with gradient effect
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 50, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text(testResult.test?.title || 'Strengths Compass', 105, 25, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Test Report - ${testResult.test?.title || 'Strengths Compass Assessment'}`, 105, 35, { align: 'center' });
      
      yPos = 60;
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      const leftColumn = 20;
      const pageHeight = 297; // A4 page height in mm
      const bottomMargin = 30; // Space for footer
      const maxY = pageHeight - bottomMargin;
      let currentY = yPos;
      
      // Helper function to check and add new page if needed
      const checkPageBreak = (requiredSpace = 10) => {
        if (currentY + requiredSpace > maxY) {
          doc.addPage();
          currentY = 20;
        }
      };
      
      const addSectionTitle = (title, y) => {
        checkPageBreak(20); // Reserve space for title
        currentY = y;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(title, 20, currentY);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(20, currentY + 3, 190, currentY + 3);
        currentY += 15;
        return currentY;
      };
      
      // Helper function to add text with automatic page breaks
      const addTextWithPageBreak = (text, x, maxWidth, fontSize = 10) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        const lineHeight = fontSize * 0.4; // Line height in mm
        
        lines.forEach((line) => {
          checkPageBreak(lineHeight + 2);
          doc.setFontSize(fontSize);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(line, x, currentY);
          currentY += lineHeight + 2;
        });
      };

      // User Information Section - Only Name, Email, and Test Status (matching web page)
      addSectionTitle('User Information', currentY);
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      // Name
      checkPageBreak(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFontSize(10);
      doc.text('Name:', leftColumn, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(user?.name || 'N/A', leftColumn + 25, currentY);
      currentY += 10;
      
      // Email
      checkPageBreak(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('Email:', leftColumn, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(user?.email || 'N/A', leftColumn + 25, currentY);
      currentY += 10;
      
      // Test Status
      checkPageBreak(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('Test Status:', leftColumn, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(testResult.status || 'N/A', leftColumn + 35, currentY);
      currentY += 15;

      // Report Summary (only if exists, matching web page)
      if (reportSummary && reportSummary.trim()) {
        currentY += 10;
        addSectionTitle('Report Summary', currentY);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        addTextWithPageBreak(reportSummary, leftColumn, 170, 11);
        currentY += 5;
      }

      // Cluster Scores (matching web page format)
      if (testResult?.cluster_scores && Object.keys(testResult.cluster_scores).length > 0) {
        currentY += 10;
        addSectionTitle('Cluster Scores', currentY);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        for (const [clusterName, clusterData] of Object.entries(testResult.cluster_scores)) {
          checkPageBreak(15); // Reserve space for cluster name
          
          // Cluster Name
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(clusterName, leftColumn, currentY);
          currentY += 8;
          
          // Band with traffic light
          if (clusterData.category) {
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Band:', leftColumn, currentY);
            
            // Capture traffic light from DOM (matching UI exactly)
            const lightX = leftColumn + 20;
            const lightY = currentY;
            const lightWidth = await addTrafficLightFromDOM(clusterData.category, lightX, lightY);
            currentY += 8;
          }
          
          // Score
          if (clusterData.percentage !== undefined) {
            checkPageBreak(7);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Score:', leftColumn, currentY);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(`${clusterData.percentage}%`, leftColumn + 20, currentY);
            currentY += 7;
          }
          
          // Description
          if (clusterData.description) {
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Description:', leftColumn, currentY);
            currentY += 5;
            addTextWithPageBreak(clusterData.description, leftColumn, 170, 10);
            currentY += 3;
          }
          
          // Tendency
          if (clusterData.behaviour) {
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Tendency:', leftColumn, currentY);
            currentY += 5;
            addTextWithPageBreak(clusterData.behaviour, leftColumn, 170, 10);
            currentY += 5;
          }
          
          currentY += 5;
        }
      }

      // Construct Scores (matching web page format)
      if (testResult?.construct_scores && Object.keys(testResult.construct_scores).length > 0) {
        currentY += 10;
        addSectionTitle('Construct Scores', currentY);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        for (const [constructName, constructData] of Object.entries(testResult.construct_scores)) {
          checkPageBreak(15); // Reserve space for construct name
          
          // Construct Name
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(constructName, leftColumn, currentY);
          currentY += 8;
          
          // Band with traffic light
          if (constructData.category) {
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Band:', leftColumn, currentY);
            
            // Capture traffic light from DOM (matching UI exactly)
            const lightX = leftColumn + 20;
            const lightY = currentY;
            const lightWidth = await addTrafficLightFromDOM(constructData.category, lightX, lightY);
            currentY += 8;
          }
          
          // Score
          if (constructData.percentage !== undefined) {
            checkPageBreak(7);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Score:', leftColumn, currentY);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(`${constructData.percentage}%`, leftColumn + 20, currentY);
            currentY += 7;
          }
          
          // Description
          if (constructData.description) {
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Description:', leftColumn, currentY);
            currentY += 5;
            addTextWithPageBreak(constructData.description, leftColumn, 170, 10);
            currentY += 3;
          }
          
          // Tendency
          if (constructData.behaviour) {
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text('Tendency:', leftColumn, currentY);
            currentY += 5;
            addTextWithPageBreak(constructData.behaviour, leftColumn, 170, 10);
            currentY += 5;
          }
          
          currentY += 5;
        }
      }

      // Convert and add Radar Chart
      if (radarChartData.length > 0) {
        try {
          const radarSection = document.getElementById('pdf-radar-chart-section');
          let radarCapture = await captureElementImage(radarSection, 160);

          if (!radarCapture) {
            const fallbackSvg = document.querySelector('svg.strengths-radar-chart, svg[viewBox*="500"]');
            if (fallbackSvg) {
              const svgData = new XMLSerializer().serializeToString(fallbackSvg);
              const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);

              const img = new Image();
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
              });

              const canvas = document.createElement('canvas');
              canvas.width = 500;
              canvas.height = 500;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);

              const imgData = canvas.toDataURL('image/png');
              const imgWidth = 150;
              const imgHeight = 150;
              radarCapture = { imgData, imgWidth, imgHeight };
              URL.revokeObjectURL(url);
            }
          }

          if (radarCapture) {
            doc.addPage();
            currentY = 25;

            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('Strengths Radar Chart', 105, currentY, { align: 'center' });
            currentY += 15;

            const pageWidth = 210;
            const centerX = (pageWidth - radarCapture.imgWidth) / 2;
            const availableHeight = pageHeight - currentY - bottomMargin;
            const centerY = currentY + Math.max(0, (availableHeight - radarCapture.imgHeight) / 2);
            const imageY = centerY + radarCapture.imgHeight > pageHeight - bottomMargin ? currentY : centerY;

            doc.addImage(
              radarCapture.imgData,
              'PNG',
              centerX,
              imageY,
              radarCapture.imgWidth,
              radarCapture.imgHeight
            );

            currentY = pageHeight - bottomMargin;
          }
        } catch (err) {
          console.error('Error adding radar chart to PDF:', err);
        }
      }

      // Convert and add Heatmap
      if (clusterInsights.length > 0) {
        try {
          const heatmapSection =
            document.getElementById('pdf-heatmap-section') ||
            document.querySelector('table.heat, .tension-heatmap table');
          const heatmapCapture = await captureElementImage(heatmapSection, 180);

          if (heatmapCapture) {
            doc.addPage();
            currentY = 25;

            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('Tension / Synergy Heatmap', 105, currentY, { align: 'center' });
            currentY += 15;

            const pageWidth = 210;
            const centerX = (pageWidth - heatmapCapture.imgWidth) / 2;
            const availableHeight = pageHeight - currentY - bottomMargin;
            const centerY = currentY + Math.max(0, (availableHeight - heatmapCapture.imgHeight) / 2);
            const imageY = centerY + heatmapCapture.imgHeight > pageHeight - bottomMargin ? currentY : centerY;

            doc.addImage(
              heatmapCapture.imgData,
              'PNG',
              centerX,
              imageY,
              heatmapCapture.imgWidth,
              heatmapCapture.imgHeight
            );

            currentY = pageHeight - bottomMargin;
          }
        } catch (err) {
          console.error('Error adding heatmap to PDF:', err);
        }
      }

      // Convert and add Construct Synergy-Tension Matrix
      try {
        console.log('Attempting to capture Construct Synergy-Tension Matrix...');
        // Wait a bit for the matrix to fully render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const constructMatrixSection = document.getElementById('pdf-construct-matrix-section');
        console.log('Matrix section found:', !!constructMatrixSection);
        
        if (constructMatrixSection) {
          const matrixCapture = await captureElementImage(constructMatrixSection, 180);
          console.log('Matrix capture result:', !!matrixCapture);

          if (matrixCapture) {
            doc.addPage();
            currentY = 25;

            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('Strengths Compass: 18x18 Construct Synergy-Tension Matrix', 105, currentY, { align: 'center' });
            currentY += 15;

            const pageWidth = 210;
            const centerX = (pageWidth - matrixCapture.imgWidth) / 2;
            const availableHeight = pageHeight - currentY - bottomMargin;
            const centerY = currentY + Math.max(0, (availableHeight - matrixCapture.imgHeight) / 2);
            const imageY = centerY + matrixCapture.imgHeight > pageHeight - bottomMargin ? currentY : centerY;

            doc.addImage(
              matrixCapture.imgData,
              'PNG',
              centerX,
              imageY,
              matrixCapture.imgWidth,
              matrixCapture.imgHeight
            );

            currentY = pageHeight - bottomMargin;
            console.log('Construct Synergy-Tension Matrix added successfully');
          } else {
            console.warn('Matrix capture returned null');
          }
        } else {
          console.warn('Construct matrix section not found in DOM');
        }
      } catch (err) {
        console.error('Error adding Construct Synergy-Tension Matrix to PDF:', err);
        // Continue with PDF generation even if this section fails
      }

      // Footer (matching web page format)
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`Page ${i} of ${pageCount}`, 105, 295, { align: 'center' });
      }
      
      doc.setPage(pageCount);
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Generated on ${new Date(testResult.created_at || Date.now()).toLocaleString()}`, 105, 280, { align: 'center' });
      doc.text('Strengths Compass - Confidential Report', 105, 288, { align: 'center' });
      
      console.log('PDF generation completed, saving file...');
      const fileName = `Test_Results_${user?.name?.replace(/\s+/g, '_') || 'User'}_${Date.now()}.pdf`;
      doc.save(fileName);
      console.log('PDF saved successfully:', fileName);
      setGeneratingPDF(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error stack:', error.stack);
      setGeneratingPDF(false);
      alert(`Error generating PDF: ${error.message || 'Unknown error'}. Please check the console for details.`);
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
            className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md"
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


      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackNavigation}
            className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" /> {backLabel}
          </button>
          <div>
            <h1 className="text-2xl font-bold neutral-text">Test Results</h1>
            {user && (
              <p className="text-xs neutral-text-muted mt-1">
                Results for: <span className="font-medium primary-text">{user.name}</span> ({user.email})
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

      

      {/* Test Results */}
      <div className="max-w-4xl mx-auto">
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
                  <p>Test Report - {result.test?.title || "Strengths Compass Assessment"}</p>
                </div>

                <div className="test-report-container">
                  {/* User Information */}
                  <div className="test-report-section">
                    <div className="test-report-section-title">User Information</div>
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
                          <div className="test-report-info-value">{user?.email || "N/A"}</div>
                        </div>
                       
                        <div className="test-report-info-item">
                          <div className="test-report-info-label">test Status</div>
                          <div className="test-report-info-value">
                            {result.status || "N/A"}
                          </div>
                        </div>
                       
                      </div>
                    </div>
                  </div>

                  {reportSummary && (
                    <div className="test-report-section mb-6">
                      <h3 className="text-xl font-semibold neutral-text">Report Summary</h3>
                      <div className="w-full min-h-[140px] rounded-lg border border-neutral-border-light bg-light p-3 text-sm neutral-text">
                        {reportSummary}
                      </div>
                    </div>
                  )}

                  {/* Cluster Scores */}
                  {result.cluster_scores && Object.keys(result.cluster_scores).length > 0 && (
                    <div className="test-report-section">
                      <div className="test-report-section-title">Cluster Scores</div>
                      <div className="test-report-scores-section">
                        {Object.entries(result.cluster_scores).map(([clusterName, clusterData]) => (
                          <div key={clusterName} className="test-report-cluster-item">
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-700">{clusterName}</span>
                                
                              </div>
                              {
                                clusterData.category && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-700">Band: </span>
                                    <TrafficLight band={clusterData.category} />
                                  </div>
                                )
                              }
                              {
                                clusterData.percentage && (
                                  <div>
                                    <span className="text-sm font-semibold text-gray-700">Score: </span>
                                    <span className="text-sm font-semibold text-gray-700">{clusterData.percentage}%</span>
                                  </div>
                                )
                              }
                              {clusterData.description && (
                                <div className="mb-3">
                                  <span className="text-sm font-semibold text-gray-700">Description: </span>
                                  <p className="text-sm text-gray-700 mt-1">{clusterData.description}</p>
                                </div>
                              )}
                              {clusterData.behaviour && (
                                <div className="mb-3">
                                  <span className="text-sm font-semibold text-gray-700">Tendency: </span>
                                  <p className="text-sm text-gray-700 mt-1">{clusterData.behaviour}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Construct Scores */}
                  {result.construct_scores && Object.keys(result.construct_scores).length > 0 && (
                    <div className="test-report-section">
                      <div className="test-report-section-title">Construct Scores</div>
                      <div className="test-report-scores-section">
                        {Object.entries(result.construct_scores).map(([constructName, constructData]) => (
                          <div key={constructName} className="test-report-cluster-item">
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-700">{constructName}</span>
                                
                              </div>
                              {
                                constructData.category && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-700">Band: </span>
                                    <TrafficLight band={constructData.category} />
                                  </div>
                                )
                              }
                              {
                                constructData.percentage && (
                                  <div>
                                    <span className="text-sm font-semibold text-gray-700">Score: </span>
                                    <span className="text-sm font-bold text-gray-700">{constructData.percentage}%</span>
                                  </div>
                                )
                              }
                              {constructData.description && (
                                <div className="mb-3">
                                  <span className="text-sm font-semibold text-gray-700">Description: </span>
                                  <p className="text-sm text-gray-700 mt-1">{constructData.description}</p>
                                </div>
                              )}
                              {constructData.behaviour && (
                                <div className="mb-3">
                                  <span className="text-sm font-semibold text-gray-700">Tendency: </span>
                                  <p className="text-sm text-gray-700 mt-1">{constructData.behaviour}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                   {/* Strengths Radar Chart */}
                  {testResult?.cluster_scores && (
                    <div id="pdf-radar-chart-section" className="mb-10 max-w-4xl mx-auto">
                      <StrengthsRadarChart 
                        clusterScores={testResult.cluster_scores}
                        clusters={[
                          "Caring & Self-Understanding",
                          "Character & Moral Foundation",
                          "Drive & Achievement", 
                          "Emotional Strength",
                          "Personal Agency & Growth",
                          "Openness & Future Orientation"
                        ]}
                        size={500}
                      />
                    </div>
                  )}

                  {/* Constructs Radar Chart */}
                  {testResult?.construct_scores && (
                    <div id="pdf-constructs-radar-chart-section" className="mb-10 max-w-4xl mx-auto">
                      <ConstructsRadarChart 
                        constructScores={testResult.construct_scores}
                        constructs={[
                          "Self-Awareness",
                          "Honesty-Humility",
                          "Reliability",
                          "Perseverance",
                          "Self-Discipline",
                          "Initiative",
                          "Psychological Resilience",
                          "Emotional Regulation",
                          "Cognitive Flexibility",
                          "Leadership",
                          "Self-Efficacy",
                          "Growth Mindset",
                          "GRIT",
                          "Creativity & Curiosity",
                          "Altruism",
                          "Empathy",
                          "Cooperation",
                          "Optimism"
                        ]}
                        size={500}
                      />
                    </div>
                  )}

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
                  <div className="test-report-footer">
                    <p>Generated on {new Date(result.created_at || Date.now()).toLocaleString()}</p>
                    <p>Strengths Compass - Confidential Report</p>
                  </div>
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

  