import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiUsers,
  HiClipboardList,
  HiChartBar,
  HiDocumentText,
  HiPlus,
  HiArrowRight,
  HiCheckCircle,
  HiClock,
  HiTrendingUp,
  HiDownload,
} from "react-icons/hi";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClusters: 0,
    totalConstructs: 0,
    totalQuestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const findFirstArray = (value, depth = 0) => {
      if (!value || depth > 5) return null;
      if (Array.isArray(value)) return value;
      if (typeof value === "object") {
        for (const key of Object.keys(value)) {
          const found = findFirstArray(value[key], depth + 1);
          if (found) return found;
        }
      }
      return null;
    };

    const fetchStats = async () => {
      try {
        const [usersRes, clustersRes, constructsRes, questionsRes] =
          await Promise.allSettled([
            apiClient.get("/users"),
            apiClient.get("/clusters"),
            apiClient.get("/constructs"),
            apiClient.get("/questions"),
          ]);

        const toArray = (res) => {
          if (res.status !== "fulfilled") return [];
          const payload = res.value?.data;
          const candidates = [
            payload,
            payload?.data,
            payload?.data?.data,
            payload?.users,
            payload?.data?.users,
            payload?.results,
            payload?.data?.results,
            payload?.items,
            payload?.data?.items,
          ];
          for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
              return candidate;
            }
          }
          const deep = findFirstArray(payload);
          return Array.isArray(deep) ? deep : [];
        };

        const userList = toArray(usersRes);
        const clusterList = toArray(clustersRes);
        const constructList = toArray(constructsRes);
        const questionList = toArray(questionsRes);

        // Filter out admin users - only count regular users
        const filteredUsers = userList.filter((user) => {
          const userRole = user?.role?.toLowerCase();
          return userRole !== "admin" && userRole !== "administrator";
        });

        setStats({
          totalUsers: filteredUsers.length,
          totalClusters: clusterList.length,
          totalConstructs: constructList.length,
          totalQuestions: questionList.length,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }

      setDownloading(true);
      setError(null);

      const response = await apiClient.get(
        "/test-results-comprehensive/export",
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
      setDownloading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: HiUsers,
      accent: {
        gradient: "from-blue-50 via-blue-100 to-blue-200",
        number: "text-blue-700",
        chip: "bg-blue-100 text-blue-700",
        border: "border-blue-200",
      },
      link: "/admin/dashboard/users",
    },

    {
      title: "Total Clusters",
      value: stats.totalClusters,
      icon: HiChartBar,
      accent: {
        gradient: "from-amber-50 via-amber-100 to-amber-200",
        number: "text-amber-700",
        chip: "bg-amber-100 text-amber-700",
        border: "border-amber-200",
      },
      link: "/admin/dashboard/master/cluster",
    },
    {
      title: "Total Constructs",
      value: stats.totalConstructs,
      icon: HiChartBar,
      accent: {
        gradient: "from-blue-50 via-blue-100 to-blue-200",
        number: "text-blue-700",
        chip: "bg-blue-100 text-blue-700",
        border: "border-blue-200",
      },
      link: "/admin/dashboard/master/construct",
    },
    {
      title: "Total Questions",
      value: stats.totalQuestions,
      icon: HiDocumentText,
      accent: {
        gradient: "from-amber-50 via-amber-100 to-amber-200",
        number: "text-amber-700",
        chip: "bg-amber-100 text-amber-700",
        border: "border-amber-200",
      },
      link: "/admin/dashboard/master/questions",
    },
  ];

  const quickActions = [
    {
      title: "Manage Clusters",
      description: "Create and manage clusters",
      icon: HiChartBar,
      link: "/admin/dashboard/master/cluster",
    },
    {
      title: "Manage Constructs",
      description: "Create and manage constructs",
      icon: HiClipboardList,
      link: "/admin/dashboard/master/construct",
    },
    {
      title: "Manage Questions",
      description: "Create and manage questions",
      icon: HiDocumentText,
      link: "/admin/dashboard/master/questions",
    },
    {
      title: "Manage Tests",
      description: "Create and manage tests",
      icon: HiCheckCircle,
      link: "/admin/dashboard/master/tests",
    },
  ];

  return (
    <div className="neutral-text blue-bg-50 min-h-screen p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title="Error"
        message={error || ""}
      />

      {/* Simple Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            Admin Dashboard
          </h1>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={downloading}
          className="btn btn-secondary text-xs sm:text-sm w-full sm:w-auto"
        >
          {downloading ? (
            <>
              <span className="spinner spinner-sm"></span>
              <span className="hidden sm:inline">Downloading...</span>
              <span className="sm:hidden">Downloading...</span>
            </>
          ) : (
            <>
              <HiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Download All Test Results</span>
              <span className="sm:hidden">Download Results</span>
            </>
          )}
        </button>
      </div>

      {/* Stat Cards - Light yellow/blue */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className={`group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border ${stat.accent.border} hover:border-blue-300 transition-all`}
            >
              <div
                className={`bg-gradient-to-br ${stat.accent.gradient} rounded-xl p-4 mb-5`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-lg bg-white/70 backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-slate-600" />
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border border-white/60 ${stat.accent.chip}`}
                  >
                    View
                  </span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-2">{stat.title}</p>
                {loading ? (
                  <div className="h-10 w-24 bg-slate-100 rounded animate-pulse"></div>
                ) : (
                  <p
                    className={`text-4xl md:text-5xl font-semibold tracking-tight ${stat.accent.number}`}
                  >
                    {stat.value.toLocaleString()}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      

      {/* Activity & Status - Simple */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 primary-bg-medium rounded-lg">
              <HiClock className="w-5 h-5 white-text" />
            </div>
            <h3 className="text-lg font-semibold primary-text-medium">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {[
              { action: "New test created", time: "2 hours ago" },
              { action: "User registered", time: "5 hours ago" },
              { action: "Question added", time: "1 day ago" },
            ].map((activity, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border transition ${index % 2 === 0 ? 'primary-bg-light border-primary-border-light' : 'secondary-bg-light border-secondary-border-light'}`}
              >
                <div className={`p-2 rounded-lg ${index % 2 === 0 ? 'primary-bg-medium' : 'secondary-bg-medium'}`}>
                  <HiCheckCircle className={`w-4 h-4 ${index % 2 === 0 ? 'white-text' : 'black-text'}`} />
                </div>
                <div className="flex-1">
                  <p className="neutral-text font-medium text-sm">
                    {activity.action}
                  </p>
                  <p className="neutral-text-muted text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

       
      </div> */}
    </div>
  );
}
