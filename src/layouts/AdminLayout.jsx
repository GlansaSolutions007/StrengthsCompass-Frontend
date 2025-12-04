import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineClipboardList,
  HiOutlineChartPie,
  HiOutlineUserCircle,
} from "react-icons/hi";
import React, { useEffect } from "react";
import logo from "../../Images/Logo.png";
// validations-only mode: no auth

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

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
            © 2024 Strengths Compass
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
                  {titleFromPath(location.pathname)}
                </h1>
                <p className="text-sm neutral-text-muted mt-1">
                  Manage your {titleFromPath(location.pathname).toLowerCase()} settings
                </p>
              </div>
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
