import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineClipboardList,
  HiOutlineChartPie,
  HiOutlineUserCircle,
  HiChevronDown,
} from "react-icons/hi";
import React, { useEffect, useState } from "react";
import logo from "../../Images/Logo.png";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";
// validations-only mode: no auth

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ageGroups, setAgeGroups] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loadingVariant, setLoadingVariant] = useState(false);
  const [variantError, setVariantError] = useState(null);
  const [variantSuccess, setVariantSuccess] = useState(null);
  const [testName, setTestName] = useState(null);

  // Check authentication and separate admin/user routes
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("token") || 
                     localStorage.getItem("userToken") || 
                     localStorage.getItem("authToken");
    
    // If user is logged in (but not admin), redirect to user profile
    if (userToken && !adminToken) {
      navigate("/profile", { replace: true });
      return;
    }
    
    if (!adminToken) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  // Fetch age groups and load saved variant
  useEffect(() => {
    const fetchAgeGroups = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const response = await apiClient.get("/age-groups");
        if (response.data?.status && response.data.data) {
          const groups = response.data.data.map((ag) => ({
            id: ag.id,
            name: ag.name || "",
            from: ag.from || "",
            to: ag.to || "",
          }));
          setAgeGroups(groups);

          // Load saved variant from localStorage
          const savedVariantId = localStorage.getItem("adminSelectedVariantId");
          if (savedVariantId) {
            const savedVariant = groups.find((g) => g.id === parseInt(savedVariantId));
            if (savedVariant) {
              setSelectedVariant(savedVariant);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching age groups:", err);
      }
    };

    fetchAgeGroups();
  }, []);

  // Fetch test name if on test details page
  useEffect(() => {
    const fetchTestName = async () => {
      // Check if we're on the test details page
      const testDetailsMatch = location.pathname.match(/\/master\/tests\/(\d+)/);
      if (testDetailsMatch) {
        const testId = testDetailsMatch[1];
        try {
          const token = localStorage.getItem("adminToken");
          if (!token) return;

          const response = await apiClient.get(`/tests/${testId}`);
          if (response.data?.status && response.data.data) {
            setTestName(response.data.data.title || null);
          }
        } catch (err) {
          console.error("Error fetching test name:", err);
          setTestName(null);
        }
      } else {
        setTestName(null);
      }
    };

    fetchTestName();
  }, [location.pathname]);

  // Handle variant change
  const handleVariantChange = async (ageGroupId) => {
    const selectedGroup = ageGroups.find((g) => g.id === parseInt(ageGroupId));
    if (!selectedGroup) return;

    setLoadingVariant(true);
    setVariantError(null);
    setVariantSuccess(null);

    try {
      // Call backend API to set age group
      const response = await apiClient.post("/set-age-group", {
        age_group_id: selectedGroup.id,
      });

      if (response.data?.status || response.status === 200) {
        setSelectedVariant(selectedGroup);
        localStorage.setItem("adminSelectedVariantId", selectedGroup.id.toString());
        setVariantSuccess("Variant changed successfully!");
        setTimeout(() => setVariantSuccess(null), 3000);
        
        // Reload the page or refresh data based on the new age group
        // This ensures all data is filtered by the new age group
        window.location.reload();
      } else {
        setVariantError(response.data?.message || "Failed to change variant");
      }
    } catch (err) {
      console.error("Error setting age group:", err);
      setVariantError(
        err.response?.data?.message ||
          "Failed to change variant. Please try again."
      );
    } finally {
      setLoadingVariant(false);
    }
  };

  const items = [
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: <HiOutlineViewGrid className="w-5 h-5" />,
      exact: true,
    },
    {
      to: "/admin/dashboard/users",
      label: "Users",
      icon: <HiOutlineUserGroup className="w-5 h-5" />,
      excludePrefixes: ["/admin/dashboard/users/test-results"],
    },
    {
      to: "/admin/dashboard/users/test-results",
      label: "Test Results",
      icon: <HiOutlineChartPie className="w-5 h-5" />,
    },
  ];

  // Helper function to format age range display
  // Display "40+" for any age range that starts at 40 or above
  const formatAgeRange = (from, to) => {
    if (typeof from === "number" && from >= 40) {
      return `${from}+`;
    }
    return `${from} - ${to}`;
  };

  const isRouteActive = (path, options = {}) => {
    const currentPath = location.pathname;
    const fromTestResults = Boolean(location.state?.fromTestResults);

    // When viewing UserResults/UserAnswers coming from TestResults,
    // highlight Test Results in the sidebar instead of Users
    if (fromTestResults) {
      if (path === "/admin/dashboard/users/test-results") {
        return true;
      }
      if (path === "/admin/dashboard/users") {
        return false;
      }
    }
    if (options.excludePrefixes) {
      const shouldExclude = options.excludePrefixes.some((prefix) =>
        currentPath.startsWith(prefix)
      );
      if (shouldExclude) {
        return false;
      }
    }
    if (options.exact) {
      return (
        currentPath === path ||
        (path !== "/" && currentPath === `${path}/`)
      );
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen w-screen bg neutral-text flex">
      <AlertModal
        isOpen={!!variantError}
        onClose={() => setVariantError(null)}
        type="error"
        title="Error"
        message={variantError || ""}
      />
      <AlertModal
        isOpen={!!variantSuccess}
        onClose={() => setVariantSuccess(null)}
        type="success"
        title="Success"
        message={variantSuccess || ""}
        autoClose={3000}
      />
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 flex flex-col sticky top-0 h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-0 m-0 bg-gray-800">
          <div className="flex items-center justify-center">
            <div className="w-40 h-25 items-center justify-center overflow-hidden">
              <img 
                src={logo} 
                alt="Strengths Compass Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {items.map((item) => {
            const active = isRouteActive(item.to, {
              exact: item.exact,
              excludePrefixes: item.excludePrefixes,
            });
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? "bg-[#eab308] text-black shadow-md"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
                end={item.to === "/admin/dashboard"}
              >
                <span
                  className={`${
                    active ? "text-white" : "text-gray-400 group-hover:text-white"
                  } transition-colors`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-sm font-medium ${
                    active ? "text-black" : "text-white"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* Master Section */}
          <div className="pt-2">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Master
              </h3>
            </div>
            <NavLink
              to="/admin/dashboard/master/cluster"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/cluster") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/cluster") ? "text-black" : "text-white"}`}>Cluster</span>
            </NavLink>
            <NavLink
              to="/admin/dashboard/master/construct"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/construct") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/construct") ? "text-black" : "text-white"}`}>Construct</span>
            </NavLink>
            <NavLink
              to="/admin/dashboard/master/questions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/questions") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/questions") ? "text-black" : "text-white"}`}>Questions</span>
            </NavLink>
            <NavLink
              to="/admin/dashboard/master/options"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/options") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/options") ? "text-black" : "text-white"}`}>Options</span>
            </NavLink>
            <NavLink
              to="/admin/dashboard/master/tests"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/tests") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/tests") ? "text-black" : "text-white"}`}>Tests</span>
            </NavLink>
            <NavLink
              to="/admin/dashboard/master/age"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/age") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/age") ? "text-black" : "text-white"}`}>Age</span>
            </NavLink>
            <NavLink
              to="/admin/dashboard/master/schools"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/schools") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/schools") ? "text-black" : "text-white"}`}>Schools</span>
            </NavLink>
            <NavLink
              to="/admin/dashboard/master/organizations"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-[#eab308] text-black shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className={isRouteActive("/admin/dashboard/master/organizations") ? "text-black" : "text-gray-400 group-hover:text-white"}>
                <HiOutlineClipboardList className="w-5 h-5" />
              </span>
              <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/master/organizations") ? "text-black" : "text-white"}`}>Organizations</span>
            </NavLink>
          </div>

          <NavLink
            to="/admin/dashboard/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-[#eab308] text-black shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className={isRouteActive("/admin/dashboard/profile") ? "text-black" : "text-gray-400 group-hover:text-white"}>
              <HiOutlineUserCircle className="w-5 h-5" />
            </span>
            <span className={`text-sm font-medium ${isRouteActive("/admin/dashboard/profile") ? "text-black" : "text-white"}`}>Profile</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 bg-gray-800">
          <div className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Strengths Compass
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 shadow-sm border-b border-white/20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold neutral-text">
                  {testName || titleFromPath(location.pathname)}
                </h1>
                <p className="text-sm neutral-text-muted mt-1">
                  {testName 
                    ? "View complete test information"
                    : `Manage your ${titleFromPath(location.pathname).toLowerCase()} settings`}
                </p>
              </div>
              {/* Variant (Age Group) Selector - Hidden on TestDetails page */}
              {!location.pathname.includes("/master/tests/") && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold neutral-text whitespace-nowrap">
                    Variant (Age Group):
                  </label>
                  <div className="relative">
                    <select
                      value={selectedVariant?.id || ""}
                      onChange={(e) => handleVariantChange(e.target.value)}
                      disabled={loadingVariant || ageGroups.length === 0}
                      className="input pr-10 min-w-[200px] bg-white border border-neutral-300 focus:ring-2 focus:ring-secondary focus:border-secondary"
                    >
                      {ageGroups.length === 0 ? (
                        <option value="">Loading...</option>
                      ) : (
                        <>
                          {!selectedVariant && (
                            <option value="" disabled>
                              Select Age Group
                            </option>
                          )}
                          {ageGroups.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.name} ({formatAgeRange(ag.from, ag.to)})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
                  </div>
                  {loadingVariant && (
                    <span className="spinner spinner-sm"></span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 bg-medium">
          <div className="w-full ">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function titleFromPath(pathname) {
  if (pathname === "/admin/dashboard" || pathname === "/admin/dashboard/")
    return "Dashboard";
  const seg = pathname.split("/").pop();
  if (!seg) return "Dashboard";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}