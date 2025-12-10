import axios from "axios";

/**
 * API Configuration
 * 
 * Base URL for API endpoints.
 */
// export const API_BASE_URL = "https://api.glansadesigns.com/strengthscompass/api";
export const API_BASE_URL = "https://api.glansa.in/strengthscompass/api/";

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Request interceptor to add auth token and age group ID
apiClient.interceptors.request.use(
  (config) => {
    // Check for admin token first, then user token
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("token") || 
                     localStorage.getItem("userToken") || 
                     localStorage.getItem("authToken");
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }

    // Add age group ID from localStorage (for admin) or from config (for users)
    // Admin uses adminSelectedVariantId, users pass it in config
    let variantId = localStorage.getItem("adminSelectedVariantId");
    
    // If not admin variant ID, check if it's passed in config (for user requests)
    if (!variantId && config.params?.age_group_id) {
      variantId = config.params.age_group_id;
    }
    if (!variantId && config.headers?.["X-Age-Group-Id"]) {
      variantId = config.headers["X-Age-Group-Id"];
    }

    if (variantId) {
      // Add as header (works for all request types)
      config.headers["X-Age-Group-Id"] = variantId.toString();

      // Also add as query parameter for GET/DELETE requests
      if (config.method === "get" || config.method === "delete") {
        config.params = config.params || {};
        config.params.age_group_id = variantId.toString();
      }

      // For POST/PUT/PATCH, also add to body if it's an object
      // if ((config.method === "post" || config.method === "put" || config.method === "patch") && config.data) {
      //   if (typeof config.data === "object" && !Array.isArray(config.data) && config.data !== null) {
      //     config.data.age_group_id = variantId;
      //   }
      // }

      if ((config.method === "post" || config.method === "put" || config.method === "patch") && config.data) {
        // Handle FormData
        if (config.data instanceof FormData) {
          config.data.append("age_group_id", variantId.toString());
        }
        // Handle plain objects
        else if (typeof config.data === "object" && !Array.isArray(config.data) && config.data !== null) {
          config.data.age_group_id = variantId.toString();
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || "";
      
      // Don't redirect if:
      // 1. We're on a login page (user or admin) - let the component handle the error
      // 2. The request is for a login endpoint - let the component handle the error
      const isOnLoginPage = currentPath.includes("/login") || currentPath.includes("/register");
      const isLoginRequest = requestUrl.includes("/login") || requestUrl.includes("/forgot-password");
      
      if (isOnLoginPage || isLoginRequest) {
        // Just clear admin tokens but don't redirect - let the login component handle the error
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        return Promise.reject(error);
      }
      
      // Unauthorized - clear tokens and redirect to admin login only if we're in an admin route
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      // Only redirect to admin login if we're already in an admin route
      if (currentPath.includes("/admin") && !currentPath.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    } else if (error.response?.status === 403) {
      // Forbidden - log for debugging
      console.warn("403 Forbidden - Access denied:", {
        url: error.config?.url,
        method: error.config?.method,
        message: error.response?.data?.message,
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;


