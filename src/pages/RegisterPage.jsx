import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  HiUserAdd, HiUser, HiMail, HiLockClosed, HiCheckCircle, 
  HiExclamationCircle, HiPhone, HiCalendar, HiLocationMarker,
  HiBriefcase, HiAcademicCap, HiEye, HiEyeOff
} from "react-icons/hi";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";
import logoImage from "../../Images/Logo.png";

// InputField component moved outside to prevent recreation on each render
const InputField = ({
  name,
  label,
  type = "text",
  icon: Icon,
  placeholder,
  options = [],
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  showPassword,
  onTogglePassword,
  inputProps = {},
}) => {
  const selectValue = formData[name] ?? "";
  const hasExplicitEmptyOption = options.some((opt) => opt.value === "");
  const placeholderText =
    placeholder || (label ? `Select ${label.toLowerCase()}` : "Select an option");

  return (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium neutral-text-muted">
        {label}
      </label>
    )}
    <div
      className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
        errors[name] && touched[name]
          ? "border-red-500"
          : "border-neutral-300"
      }`}
    >
      <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
        <Icon className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
      </div>
      {type === "select" ? (
        <div className="flex-1 relative">
          <select
            name={name}
            required
            value={selectValue}
            onChange={handleChange}
            onBlur={() => handleBlur(name)}
            className="w-full py-2 px-3 pr-8 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors appearance-none cursor-pointer"
          >
            {!hasExplicitEmptyOption && (!selectValue || selectValue === "") && (
              <option value="" disabled hidden>
                {placeholderText}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      ) : (
        <>
          <input
            type={type === "password" ? (showPassword ? "text" : "password") : type}
            name={name}
            required
            value={formData[name]}
            onChange={handleChange}
            onBlur={() => handleBlur(name)}
            placeholder={placeholder}
            className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
            {...inputProps}
          />
          {type === "password" && onTogglePassword && (
            <div
              onClick={onTogglePassword}
              className="flex items-center justify-center px-3 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
              ) : (
                <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
              )}
            </div>
          )}
        </>
      )}
    </div>
    {errors[name] && touched[name] && (
      <p className="danger-text text-xs mt-1 flex items-center gap-1.5">
        <HiExclamationCircle className="w-3.5 h-3.5" />
        {errors[name]}
      </p>
    )}
  </div>
  );
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    contact_number: "",
    whatsapp_number: "",
    city: "",
    state: "",
    country: "",
    profession: "",
    gender: "",
    age: "",
    educational_qualification: "",
    role: "user",
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [sameAsContact, setSameAsContact] = useState(false);

  // Check authentication and separate admin/user routes
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    const token = localStorage.getItem("token") || 
                  localStorage.getItem("userToken") || 
                  localStorage.getItem("authToken");
    
    // If user has a token, redirect to profile or pending destination
    if (token) {
      const redirectTarget =
        location.state?.redirectTo || sessionStorage.getItem("redirectAfterAuth");
      if (redirectTarget) {
        sessionStorage.removeItem("redirectAfterAuth");
        navigate(redirectTarget, { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    }
  }, [navigate, location]);

  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await apiClient.get("/countries");
        
        // Handle different response structures
        let countriesData = [];
        if (response.data?.data && Array.isArray(response.data.data)) {
          countriesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          countriesData = response.data;
        } else if (response.data?.countries && Array.isArray(response.data.countries)) {
          countriesData = response.data.countries;
        }
        
        // Transform countries to options format if needed
        const formattedCountries = countriesData.map((country) => {
          // If country is a string, use it directly
          if (typeof country === "string") {
            return { value: country, label: country, id: country };
          }
          // If country is an object, extract name/id
          const countryId = country.id || country.country_id || country.name || country.country;
          return {
            value: country.name || country.country || country.id || country,
            label: country.name || country.country || country.id || country,
            id: countryId,
          };
        });
        
        setCountries(formattedCountries);
      } catch (err) {
        console.error("Error fetching countries:", err);
        // Set empty array on error, user can still type manually if needed
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch states when country is selected
  useEffect(() => {
    const fetchStates = async () => {
      if (!formData.country) {
        setStates([]);
        setFormData(prev => ({ ...prev, state: "" })); // Clear state when country is cleared
        return;
      }

      // Find the selected country to get its ID
      const selectedCountry = countries.find(
        country => country.value === formData.country || country.label === formData.country
      );

      if (!selectedCountry || !selectedCountry.id) {
        setStates([]);
        return;
      }

      try {
        setLoadingStates(true);
        const response = await apiClient.get(`/countries/${selectedCountry.id}/states`);
        
        // Handle different response structures
        let statesData = [];
        if (response.data?.data && Array.isArray(response.data.data)) {
          statesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          statesData = response.data;
        } else if (response.data?.states && Array.isArray(response.data.states)) {
          statesData = response.data.states;
        }
        
        // Transform states to options format if needed
        const formattedStates = statesData.map((state) => {
          // If state is a string, use it directly
          if (typeof state === "string") {
            return { value: state, label: state };
          }
          // If state is an object, extract name/id
          return {
            value: state.name || state.state || state.id || state,
            label: state.name || state.state || state.id || state,
          };
        });
        
        setStates(formattedStates);
        // Clear state field when country changes
        setFormData(prev => ({ ...prev, state: "" }));
      } catch (err) {
        console.error("Error fetching states:", err);
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [formData.country, countries]);

  const validateField = (name, value) => {
    switch (name) {
      case "first_name":
      case "last_name":
        if (!value) return `${name === "first_name" ? "First" : "Last"} name is required`;
        if (value.length < 2) return `${name === "first_name" ? "First" : "Last"} name must be at least 2 characters`;
        return "";
      case "email":
        if (!value) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      case "password_confirmation":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return "";
      case "contact_number": {
        if (!value) return "Contact number is required";
        const digitsOnly = value.replace(/\D/g, "");
        if (digitsOnly.length !== 10) return "Contact number must be exactly 10 digits";
        if (!/^\d{10}$/.test(digitsOnly)) return "Please enter only digits";
        return "";
      }
      case "whatsapp_number": {
        if (!value) return "";
        const digitsOnly = value.replace(/\D/g, "");
        if (digitsOnly.length !== 10) return "WhatsApp number must be exactly 10 digits";
        if (!/^\d{10}$/.test(digitsOnly)) return "Please enter only digits";
        return "";
      }
      case "city":
      case "state":
      case "country":
      case "profession":
      case "educational_qualification":
        if (!value) return `${name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ")} is required`;
        return "";
      case "gender":
        if (!value) return "Gender is required";
        return "";
      case "age":
        if (!value) return "Age is required";
        const ageNum = parseInt(value);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) return "Please enter a valid age";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  const handleChange = (e) => {
    const { name } = e.target;
    let value = e.target.value;

    if (name === "contact_number" || name === "whatsapp_number") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    const updatedFormData = { ...formData, [name]: value };

    if (name === "contact_number" && sameAsContact) {
      updatedFormData.whatsapp_number = value;
    }

    setFormData(updatedFormData);
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
    
    // Re-validate password_confirmation if password changes
    if (name === "password" && touched.password_confirmation) {
      const confirmError = validateField("password_confirmation", formData.password_confirmation);
      setErrors({ ...errors, password_confirmation: confirmError });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      if (key !== "role") allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validate all fields
    const newErrors = {};
    let hasErrors = false;
    
    Object.keys(formData).forEach(key => {
      if (key !== "role") {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
          hasErrors = true;
        }
      }
    });
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        contact_number: formData.contact_number,
        whatsapp_number: formData.whatsapp_number,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        profession: formData.profession,
        gender: formData.gender,
        age: parseInt(formData.age),
        educational_qualification: formData.educational_qualification,
        role: "user",
      };
      
      const response = await apiClient.post("/register", payload);
      
      if (response.data?.status) {
        // Store user data in localStorage
        let userId = response.data.data?.user?.id || 
                    response.data.data?.user?.user_id ||
                    response.data.data?.id ||
                    response.data.data?.user_id;
        
        if (response.data.data?.user) {
          localStorage.setItem("user", JSON.stringify(response.data.data.user));
          if (userId) {
            localStorage.setItem("userId", userId);
            localStorage.setItem("adminSelectedVariantId", response.data.data.user.age_group_id ? response.data.data.user.age_group_id : response.data.data.age_group_id);

          }
        } else if (response.data.data) {
          // If user data is directly in data
          localStorage.setItem("user", JSON.stringify(response.data.data));
          if (userId) {
            localStorage.setItem("userId", userId);
            localStorage.setItem("adminSelectedVariantId", response.data.data.user.age_group_id ? response.data.data.user.age_group_id : response.data.data.age_group_id);


          }
        }
        
        if (response.data.data?.token) {
          localStorage.setItem("token", response.data.data.token);
        } else if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        
        const redirectTarget =
          location.state?.redirectTo || sessionStorage.getItem("redirectAfterAuth");
        if (redirectTarget) {
          sessionStorage.removeItem("redirectAfterAuth");
          navigate(redirectTarget, { replace: true });
        } else {
          setShowSuccessModal(true);
        }
      } else {
        setRegisterError(response.data?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle 422 validation errors - show detailed field errors
      if (err.response?.status === 422) {
        const validationErrors = err.response.data?.errors || err.response.data?.error || {};
        let errorMessage = "";
        
        // If errors is an object with field names
        if (typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]) => {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const messageArray = Array.isArray(messages) ? messages : [messages];
              return `${fieldName}: ${messageArray.join(', ')}`;
            })
            .join('\n');
          errorMessage = errorMessages || err.response.data?.message || "Validation failed. Please check your input.";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = "Validation failed. Please check all fields and try again.";
        }
        
        setRegisterError(errorMessage);
      } else {
        setRegisterError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          `Registration failed: ${err.response?.statusText || "Please try again."}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate("/profile");
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center blue-bg-100 p-4 relative overflow-hidden">
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        type="success"
        title="Account Created Successfully!"
        message={"Your account is ready. You can now view your profile or start your assessments."}
        primaryText="Go to Profile"
        onPrimary={handleSuccessClose}
      />
      
      <AlertModal
        isOpen={!!registerError}
        onClose={() => setRegisterError("")}
        type="error"
        title="Registration Error"
        message={registerError}
      />

      <div className="w-full max-w-4xl card p-8 md:p-10 relative z-10 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoImage}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
        </div>

        <form onSubmit={handleRegister} noValidate className="space-y-4">
          {registerError && (
            <div className="warning-bg-light border warning-border-light warning-text px-3 py-2 rounded-md text-xs flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4" />
              {registerError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="first_name"
              label="First Name"
              icon={HiUser}
              placeholder="Enter your first name"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="last_name"
              label="Last Name"
              icon={HiUser}
              placeholder="Enter your last name"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="email"
              label="Email Address"
              type="email"
              icon={HiMail}
              placeholder="Enter your email address"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="age"
              label="Age"
              type="number"
              icon={HiCalendar}
              placeholder="Enter your age"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="contact_number"
              label="Contact Number"
              type="tel"
              icon={HiPhone}
              placeholder="+1234567890"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
              inputProps={{ maxLength: 10, inputMode: "numeric", pattern: "\\d{10}" }}
            />
            <InputField
              name="gender"
              label="Gender"
              type="select"
              icon={HiUser}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" }
              ]}
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium neutral-text-muted">
                  WhatsApp Number
                </label>
                <label
                  htmlFor="same-as-contact"
                  className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none"
                >
                  <span
                    className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                      sameAsContact
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-neutral-400 bg-white text-transparent"
                    }`}
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <input
                    id="same-as-contact"
                    type="checkbox"
                    checked={sameAsContact}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAsContact(checked);
                      setFormData((prev) => ({
                        ...prev,
                        whatsapp_number: checked ? prev.contact_number : "",
                      }));
                      setTouched((prev) => ({ ...prev, whatsapp_number: true }));
                    }}
                    className="sr-only"
                  />
                  <span>Same as contact</span>
                </label>
              </div>
              <div
                className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                  errors.whatsapp_number && touched.whatsapp_number
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
                  <HiPhone className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
                </div>
                <input
                  type="tel"
                  name="whatsapp_number"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  onBlur={() => handleBlur("whatsapp_number")}
                  placeholder="+1234567890"
                  className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
                />
              </div>
              {errors.whatsapp_number && touched.whatsapp_number && (
                <p className="danger-text text-xs mt-1 flex items-center gap-1.5">
                  <HiExclamationCircle className="w-3.5 h-3.5" />
                  {errors.whatsapp_number}
                </p>
              )}
            </div>
            <InputField
              name="country"
              label="Country"
              type="select"
              icon={HiLocationMarker}
              options={loadingCountries ? [{ value: "", label: "Loading countries..." }] : countries.length > 0 ? countries : [{ value: "", label: "Select Country" }]}
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="state"
              label="State"
              type="select"
              icon={HiLocationMarker}
              options={
                !formData.country
                  ? [{ value: "", label: "Select a country first" }]
                  : loadingStates
                  ? [{ value: "", label: "Loading states..." }]
                  : states.length > 0
                  ? states
                  : [{ value: "", label: "No states available" }]
              }
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="city"
              label="City"
              icon={HiLocationMarker}
              placeholder="Enter your city"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="profession"
              label="Profession"
              icon={HiBriefcase}
              placeholder="Enter your profession"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="educational_qualification"
              label="Educational Qualification"
              type="select"
              icon={HiAcademicCap}
              options={[
                { value: "High School", label: "High School" },
                { value: "Diploma", label: "Diploma" },
                { value: "Bachelor's", label: "Bachelor's" },
                { value: "Bachelor of Engineering (B.E.)", label: "Bachelor of Engineering (B.E.)" },
                { value: "Bachelor of Technology (B.Tech)", label: "Bachelor of Technology (B.Tech)" },
                { value: "Bachelor of Commerce (B.Com)", label: "Bachelor of Commerce (B.Com)" },
                { value: "Bachelor of Arts (B.A.)", label: "Bachelor of Arts (B.A.)" },
                { value: "Bachelor of Science (B.Sc.)", label: "Bachelor of Science (B.Sc.)" },
                { value: "MBBS", label: "MBBS" },
                { value: "Bachelor of Law (LLB)", label: "Bachelor of Law (LLB)" },
                { value: "Master's", label: "Master's" },
                { value: "Master of Engineering (M.E.)", label: "Master of Engineering (M.E.)" },
                { value: "Master of Technology (M.Tech)", label: "Master of Technology (M.Tech)" },
                { value: "Master of Commerce (M.Com)", label: "Master of Commerce (M.Com)" },
                { value: "Master of Arts (M.A.)", label: "Master of Arts (M.A.)" },
                { value: "Master of Science (M.Sc.)", label: "Master of Science (M.Sc.)" },
                { value: "Master of Law (LLM)", label: "Master of Law (LLM)" },
                { value: "MD", label: "MD" },
                { value: "MS", label: "MS" },
                { value: "PhD", label: "PhD" },
                { value: "Other", label: "Other" }
              ]}
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
            />
            <InputField
              name="password"
              label="Password"
              type="password"
              icon={HiLockClosed}
              placeholder="Create a password"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
            <InputField
              name="password_confirmation"
              label="Confirm Password"
              type="password"
              icon={HiCheckCircle}
              placeholder="Confirm your password"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
              showPassword={showPasswordConfirmation}
              onTogglePassword={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
            />
          </div>

          {/* <div className="flex items-start pt-1">
            <div className="flex items-center h-4">
              <input
                type="checkbox"
                required
                className="w-3.5 h-3.5 primary-text border-primary-border-light neutral-bg-light rounded focus:ring-primary cursor-pointer"
              />
            </div>
            <div className="ml-2 text-xs">
              <label className="neutral-text-muted">
                I agree to the{" "}
                <a href="#" className="primary-text hover:primary-text-dark font-medium transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="primary-text hover:primary-text-dark font-medium transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div> */}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-4 rounded-lg yellow-bg-400 yellow-text-950 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ width: "40%" }}
            >
              {isLoading ? (
                <>
                  <span className="spinner spinner-sm mr-2"></span>
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t neutral-border-light pt-4">
          <p className="text-center text-xs neutral-text-muted">Already have an account?</p>
          <Link
            to="/login"
            className="mt-3 inline-flex items-center justify-center w-full btn btn-ghost"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
