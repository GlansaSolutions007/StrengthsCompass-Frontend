import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HiCheck, HiChevronLeft, HiChevronRight, HiTranslate, HiChevronDown, HiMail, HiLockClosed, HiExclamationCircle, HiEye, HiEyeOff } from "react-icons/hi";
import Navbar from "../components/Navbar";
import AlertModal from "../components/AlertModal";
import apiClient, { API_BASE_URL } from "../config/api";
import axios from "axios";
import logoImage from "../../Images/Logo.png";

export default function Test() {
  const navigate = useNavigate();
  const location = useLocation();
  // Get testId from location state or localStorage (fallback for page refresh)
  const [testId, setTestId] = useState(
    location.state?.testId || localStorage.getItem("currentTestId") || null
  );
  
  // Save testId to localStorage when it changes
  useEffect(() => {
    if (testId) {
      localStorage.setItem("currentTestId", testId);
    } else {
      localStorage.removeItem("currentTestId");
    }
  }, [testId]);
  
  // Update testId from location state if available
  useEffect(() => {
    if (location.state?.testId) {
      setTestId(location.state.testId);
    }
  }, [location.state]);
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [testName, setTestName] = useState("Assessment Test");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isConsent, setIsConsent] = useState(false);
  const [userAge, setUserAge] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true); // true for login, false for register
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState({});
  const [loginTouched, setLoginTouched] = useState({});
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const itemsPerPage = 10;

  // Available languages for all age groups
  const languages = [
    { id: 1, name: "Telugu", code: "te" },
    { id: 2, name: "Hindi", code: "hi" },
    { id: 3, name: "Tamil", code: "ta" },
    { id: 4, name: "Kannada", code: "kn" },
    { id: 5, name: "Malayalam", code: "ml" },
  ];

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);
  
  // Get user ID from API or localStorage
  const fetchUserId = useCallback(async () => {
    try {
      // First check localStorage for user ID
      const storedUser = localStorage.getItem("user");
      const storedUserId = localStorage.getItem("userId");
      
      if (storedUserId) {
        const userId = parseInt(storedUserId);
        setUserId(userId);
        return userId;
      }
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const id = user.id || user.user_id;
          if (id) {
            const userId = parseInt(id);
            setUserId(userId);
            localStorage.setItem("userId", userId);
            return userId;
          }
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
      
      // If not in localStorage, try API endpoints (only if token exists)
      const token = localStorage.getItem("token") || 
                   localStorage.getItem("userToken") || 
                   localStorage.getItem("authToken");
      
      if (token) {
        // Try user profile endpoint if available
        try {
          const response = await apiClient.get("/users/me");
          if (response.data?.status && response.data.data) {
            const user = response.data.data.user || response.data.data;
            const id = user.id || user.user_id;
            if (id) {
              const userId = parseInt(id);
              setUserId(userId);
              localStorage.setItem("userId", userId);
              return userId;
            }
          }
        } catch (err) {
          // Endpoint doesn't exist or failed, continue
          console.log("User profile endpoint not available");
        }
      }
      
      return null;
    } catch (err) {
      console.error("Error fetching user ID:", err);
      return null;
    }
  }, []);

  const fetchOptions = async () => {
    try {
      const response = await apiClient.get("/options");
      if (response.data?.status && response.data.data) {
        // Sort options by value to maintain order
        const sortedOptions = response.data.data
          .map((o) => ({
            id: o.id,
            label: o.label || o.option_text || o.optionText || o.name || "",
            value: o.value !== undefined ? o.value : null,
          }))
          .sort((a, b) => {
            // Sort by value (numeric) if both are numbers
            if (a.value !== null && b.value !== null) {
              return a.value - b.value;
            }
            return 0;
          });
        setOptions(sortedOptions);
      }
    } catch (err) {
      console.error("Error fetching options:", err);
      // Don't set error here, just log it - options are not critical
    }
  };

  // Fetch the first available test if no testId is provided
  const fetchFirstTest = async () => {
    try {
      const response = await apiClient.get("/tests");
      let allTests = [];
      
      if (response.data?.status && response.data.data) {
        allTests = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        allTests = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        allTests = response.data.data;
      }

      // Filter active tests
      const activeTests = allTests.filter((test) => test.is_active !== false);
      
      if (activeTests.length > 0) {
        // Get the first test
        const firstTest = activeTests[0];
        const firstTestId = firstTest.id;
        
        // Set the testId and fetch test data
        setTestId(firstTestId);
        localStorage.setItem("currentTestId", firstTestId);
        
        // Fetch the test data
        await fetchTestData(firstTestId);
      } else {
        setError("No tests available. Please contact support.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching first test:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load test. Please try again."
      );
      setLoading(false);
    }
  };

  const fetchTestData = async (testIdToFetch = null) => {
    const idToUse = testIdToFetch || testId;
    if (!idToUse) {
      setError("Test ID is required. Please select a test from the test list.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch test data and questions in parallel
      // Test endpoint gives us test metadata and question IDs
      // Questions endpoint gives us questions with translations
      // IMPORTANT: Use direct axios for /questions to bypass age_group_id filter
      // so translations are available for ALL users, not just specific age groups
      const userToken = localStorage.getItem("token") || 
                       localStorage.getItem("userToken") || 
                       localStorage.getItem("authToken");
      
      const questionsHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (userToken) {
        questionsHeaders.Authorization = `Bearer ${userToken}`;
      }
      
      const [testResponse, questionsResponse] = await Promise.all([
        apiClient.get(`/tests/${idToUse}/take`),
        axios.get(`${API_BASE_URL}/questions`, { headers: questionsHeaders })
      ]);

      // Extract test name from test response
      let extractedName = "Assessment Test";
      if (testResponse.data?.status && testResponse.data.data) {
        const testData = testResponse.data.data;
        extractedName =
          testData.title ||
          testData.name ||
          testData.test_name ||
          testData.testName ||
          testData?.test?.title ||
          testData?.test?.name ||
          testResponse.data?.data?.test?.title ||
          testResponse.data?.data?.test?.name ||
          "Assessment Test";
      } else if (testResponse.data?.data) {
        const testData = testResponse.data.data;
        extractedName =
          testData.title ||
          testData.name ||
          testData.test_name ||
          testData.testName ||
          testData?.test?.title ||
          testData?.test?.name ||
          "Assessment Test";
      }
      setTestName(extractedName);

      // Extract question IDs from test response
      let testQuestionIds = [];
      if (testResponse.data?.status && testResponse.data.data) {
        const testData = testResponse.data.data;
        if (testData.questions && Array.isArray(testData.questions)) {
          testQuestionIds = testData.questions.map((q) => q.id);
        } else if (testData.data?.questions && Array.isArray(testData.data.questions)) {
          testQuestionIds = testData.data.questions.map((q) => q.id);
        }
      } else if (testResponse.data?.data) {
        const testData = testResponse.data.data;
        if (Array.isArray(testData)) {
          testQuestionIds = testData.map((q) => q.id);
        } else if (testData.questions && Array.isArray(testData.questions)) {
          testQuestionIds = testData.questions.map((q) => q.id);
        }
      }

      // Extract questions with translations from /questions endpoint
      let allQuestions = [];
      if (questionsResponse.data?.status && questionsResponse.data.data) {
        allQuestions = Array.isArray(questionsResponse.data.data) 
          ? questionsResponse.data.data 
          : [questionsResponse.data.data];
      } else if (Array.isArray(questionsResponse.data)) {
        allQuestions = questionsResponse.data;
      } else if (questionsResponse.data?.data && Array.isArray(questionsResponse.data.data)) {
        allQuestions = questionsResponse.data.data;
      }

      // If we have question IDs from test, filter questions; otherwise use all questions
      let finalQuestions = [];
      if (testQuestionIds.length > 0) {
        // Create a map for quick lookup
        const questionsMap = new Map();
        allQuestions.forEach((q) => {
          questionsMap.set(q.id, q);
        });

        // Filter and map questions in the order they appear in the test
        finalQuestions = testQuestionIds
          .map((id) => questionsMap.get(id))
          .filter((q) => q !== undefined)
          .map((q) => ({
            id: q.id,
            question_text: q.question_text || q.questionText || q.question || "",
            category: q.category || "",
            order_no: q.order_no || q.orderNo || 0,
            translations: q.translations || [],
          }));
      } else {
        // If no question IDs from test, use questions from test response as fallback
        // but try to enrich with translations from /questions endpoint
        let testQuestions = [];
        if (testResponse.data?.status && testResponse.data.data) {
          const testData = testResponse.data.data;
          if (testData.questions && Array.isArray(testData.questions)) {
            testQuestions = testData.questions;
          } else if (testData.data?.questions && Array.isArray(testData.data.questions)) {
            testQuestions = testData.data.questions;
          }
        } else if (testResponse.data?.data) {
          const testData = testResponse.data.data;
          if (Array.isArray(testData)) {
            testQuestions = testData;
          }
        }

        // Create a map of questions with translations
        const questionsMap = new Map();
        allQuestions.forEach((q) => {
          questionsMap.set(q.id, q);
        });

        // Merge test questions with translations from /questions endpoint
        finalQuestions = testQuestions.map((q) => {
          const enrichedQuestion = questionsMap.get(q.id) || q;
          return {
            id: q.id,
            question_text: enrichedQuestion.question_text || q.question_text || q.questionText || q.question || "",
            category: q.category || "",
            order_no: q.order_no || q.orderNo || 0,
            translations: enrichedQuestion.translations || q.translations || [],
          };
        });
      }

      if (finalQuestions.length > 0) {
        setQuestions(finalQuestions);
      } else {
        setError("No questions found for this test");
      }
    } catch (err) {
      console.error("Error fetching test data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load test. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    if (isAuthenticated) {
      fetchUserId(); // Fetch user ID from API
    }
  }, [isAuthenticated]);

  // Fetch test data when authenticated
  useEffect(() => {
    if (isAuthenticated && testId) {
      setLoading(true);
      fetchTestData();
    } else if (isAuthenticated && !testId) {
      // If authenticated but no testId, check localStorage first
      const storedTestId = localStorage.getItem("currentTestId");
      if (storedTestId) {
        setTestId(storedTestId);
      } else {
        // If no testId in localStorage, automatically fetch the first available test
        setLoading(true);
        fetchFirstTest();
      }
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [testId, isAuthenticated]);

  // Get user age from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const age = user.age ? parseInt(user.age) : null;
        setUserAge(age);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  // Don't auto-load saved language - English is default
  // Language selection persists during session but defaults to English on new page load

  // Load saved answers from localStorage when questions are loaded
  useEffect(() => {
    if (!loading && questions.length > 0 && testId) {
      const savedAnswersKey = `test_${testId}_answers`;
      const savedAnswers = localStorage.getItem(savedAnswersKey);
      if (savedAnswers) {
        try {
          const parsedAnswers = JSON.parse(savedAnswers);
          setAnswers(parsedAnswers);
        } catch (err) {
          console.error("Error parsing saved answers:", err);
        }
      }
    }
  }, [loading, questions.length, testId]);

  // Language selection is available only for age group 13-17
  const isEligibleForLanguageSelection = userAge !== null && userAge >= 13 && userAge <= 17;

  // Reset language selection if user is not eligible
  useEffect(() => {
    if (!isEligibleForLanguageSelection && selectedLanguage) {
      setSelectedLanguage(null);
      localStorage.removeItem("selectedLanguage");
    }
  }, [isEligibleForLanguageSelection, selectedLanguage]);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
    // Save selected language to localStorage
    if (language) {
      localStorage.setItem("selectedLanguage", JSON.stringify(language));
    } else {
      localStorage.removeItem("selectedLanguage");
    }
  };

  const handleEnglishSelect = () => {
    setSelectedLanguage(null);
    setShowLanguageDropdown(false);
    localStorage.removeItem("selectedLanguage");
  };

  // Helper function to get translated text for a question
  const getQuestionText = useCallback((question) => {
    // If no language is selected, show English by default
    if (!selectedLanguage) {
      return {
        text: question.question_text || "",
        hasTranslation: false,
      };
    }

    // If no translations available, show English
    if (!question.translations || !Array.isArray(question.translations) || question.translations.length === 0) {
      return {
        text: question.question_text || "",
        hasTranslation: false,
      };
    }

    // Normalize language codes for matching
    // Handle common variations: "hi", "hin", "hindi", "HI", etc.
    const normalizeCode = (code) => {
      if (!code) return "";
      const normalized = code.toLowerCase().trim();
      // Map common variations
      const codeMap = {
        "hin": "hi",
        "hindi": "hi",
        "tel": "te",
        "telugu": "te",
        "tam": "ta",
        "tamil": "ta",
        "kan": "kn",
        "kannada": "kn",
        "mal": "ml",
        "malayalam": "ml",
      };
      return codeMap[normalized] || normalized;
    };

    const selectedCode = normalizeCode(selectedLanguage.code);

    // Find translation matching the selected language code
    const translation = question.translations.find(
      (t) => {
        if (!t || !selectedLanguage.code) return false;
        
        const tCode = normalizeCode(t.language_code);
        const codeMatch = tCode === selectedCode;
        const hasText = t.translated_text && typeof t.translated_text === 'string' && t.translated_text.trim() !== "";
        const isActive = t.is_active !== false;
        
        // Debug log for Hindi specifically
        if (selectedLanguage.code === "hi" || selectedLanguage.name === "Hindi") {
          console.log("Hindi Translation Check:", {
            questionId: question.id,
            selectedCode,
            tCode,
            language_code: t.language_code,
            codeMatch,
            hasText,
            isActive,
            translated_text: t.translated_text?.substring(0, 50) + "..."
          });
        }
        
        return codeMatch && hasText && isActive;
      }
    );

    // If translation found, return it
    if (translation && translation.translated_text) {
      return {
        text: translation.translated_text.trim(),
        hasTranslation: true,
      };
    }

    // No translation found for selected language - show English with warning
    return {
      text: question.question_text || "",
      hasTranslation: false,
    };
  }, [selectedLanguage]);

  // Show consent modal after test data is loaded
  useEffect(() => {
    if (!loading && !error && questions.length > 0) {
      // Check if user has already given consent (stored in sessionStorage for this session)
      const hasConsented = sessionStorage.getItem(`test_${testId}_consent`);
      if (!hasConsented && !showConsentModal) {
        setShowConsentModal(true);
      } else if (hasConsented) {
        setIsConsent(true);
      }
    }
  }, [loading, error, questions.length, testId, showConsentModal]);

  // Check authentication status
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("authToken");

    if (token) {
      setIsAuthenticated(true);
      // Fetch user ID when authenticated
      fetchUserId();
      // If testId exists in localStorage, make sure it's set
      const storedTestId = localStorage.getItem("currentTestId");
      if (storedTestId && !testId) {
        setTestId(storedTestId);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [navigate, fetchUserId, testId]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    const updatedAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(updatedAnswers);
    
    // Save answers to localStorage
    if (testId) {
      const savedAnswersKey = `test_${testId}_answers`;
      localStorage.setItem(savedAnswersKey, JSON.stringify(updatedAnswers));
    }
  };

  const getUnansweredQuestions = useCallback(
    (questionList) =>
      (questionList || []).filter(
        (question) => answers[question.id] === undefined || answers[question.id] === null
      ),
    [answers]
  );

  const checkAuthentication = () => {
    const token = localStorage.getItem("token") || 
                  localStorage.getItem("userToken") || 
                  localStorage.getItem("authToken");
    const adminToken = localStorage.getItem("adminToken");
    return !!token && !adminToken;
  };

  const submitTestData = useCallback(async (currentUserId) => {
    setSubmitError(null);
    setSubmitting(true);

    try {
      let finalUserId = currentUserId || userId;
      if (!finalUserId) {
        finalUserId = await fetchUserId();
      }
      
      if (!finalUserId) {
        setSubmitError("User ID not found. Please login again.");
        setSubmitting(false);
        return;
      }

      // Map answers to the required format - only include answered questions
      const answersArray = questions
        .filter((question) => answers[question.id] !== undefined && answers[question.id] !== null)
        .map((question) => {
          const optionIndex = answers[question.id];
          const selectedOption = options[optionIndex];
          const answerValue = selectedOption?.value !== null && selectedOption?.value !== undefined
            ? selectedOption.value
            : optionIndex + 1; // Fallback to index + 1 if value is null

          return {
            question_id: question.id,
            answer_value: answerValue,
          };
        });

      if (!testId) {
        setSubmitError("Test ID is required for submission");
        setSubmitting(false);
        return;
      }

      const payload = {
        user_id: finalUserId,
        answers: answersArray,
        is_consent: isConsent,
      };

      const response = await apiClient.post(`/tests/${testId}/submit`, payload);

      if (response.data?.status) {
        // Store test results in localStorage
        const testResult = {
          testId: testId ? parseInt(testId) : (response.data.data?.test_id || Date.now()),
          userId: finalUserId,
          submittedAt: new Date().toISOString(),
          answers: answersArray,
          totalQuestions: questions.length,
          answeredQuestions: answersArray.length
        };
        
        // Update userId state
        setUserId(finalUserId);
        
        // Get existing test results
        const existingTests = JSON.parse(localStorage.getItem("userTestResults") || "[]");
        existingTests.push(testResult);
        localStorage.setItem("userTestResults", JSON.stringify(existingTests));
        
        // Clear saved answers from localStorage after successful submission
        if (testId) {
          const savedAnswersKey = `test_${testId}_answers`;
          localStorage.removeItem(savedAnswersKey);
        }
        
        // Show success modal
        setShowSuccessModal(true);
      } else {
        setSubmitError(response.data?.message || "Failed to submit test");
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          (err.response?.status === 404 
                            ? `Endpoint not found. Please check if the test ID (${testId}) is valid.`
                            : err.response?.statusText || "Failed to submit test. Please try again.");
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, options, testId, userId, fetchUserId]);

  const handleSubmit = useCallback(async () => {
    // Check if consent is given
    if (!isConsent) {
      setShowConsentModal(true);
      setSubmitError("You must provide consent before submitting the test.");
      return;
    }

    // Ensure all questions have been answered
    const unanswered = getUnansweredQuestions(questions);
    if (unanswered.length > 0) {
      setSubmitError("Please answer all the questions before submitting the test.");
      return;
    }

    // Check if user is authenticated first
    if (!checkAuthentication()) {
      setIsAuthenticated(false);
      setSubmitError("Please login to submit the test.");
      return;
    }

    // User is authenticated, fetch user ID from API
    let currentUserId = userId;
    console.log("currentUserId -------------------", currentUserId);
    if (!currentUserId) {
      currentUserId = await fetchUserId();
    }
    
    if (!currentUserId) {
      setSubmitError("User ID not found. Please login again.");
      return;
    }

    // User ID exists, submit directly
    await submitTestData(currentUserId);
  }, [
    navigate,
    getUnansweredQuestions,
    questions,
    userId,
    checkAuthentication,
    testId,
    submitTestData,
    fetchUserId,
    isConsent,
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page > currentPage) {
      const currentSliceStart = (currentPage - 1) * itemsPerPage;
      const currentSliceEnd = Math.min(currentPage * itemsPerPage, questions.length);
      const currentSlice = questions.slice(currentSliceStart, currentSliceEnd);
      const unansweredOnPage = getUnansweredQuestions(currentSlice);
      if (unansweredOnPage.length > 0) {
        setSubmitError("Please answer all the questions before continuing.");
        return;
      }
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Login validation
  const validateEmailOrUsername = (value) => {
    if (!value) return "Email or Username is required";
    if (value.length < 2) return "Email or Username must be at least 2 characters";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      return "";
    } else {
      if (value.length < 3) return "Username must be at least 3 characters";
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Username can only contain letters, numbers, underscores, and dashes";
      return "";
    }
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleLoginBlur = (field) => {
    setLoginTouched({ ...loginTouched, [field]: true });
    if (field === "email") {
      setLoginErrors({ ...loginErrors, email: validateEmailOrUsername(loginEmail) });
    } else if (field === "password") {
      setLoginErrors({ ...loginErrors, password: validatePassword(loginPassword) });
    }
  };

  const handleLoginChange = (field, value) => {
    if (field === "email") {
      setLoginEmail(value);
      setLoginError("");
      if (loginTouched.email) {
        setLoginErrors({ ...loginErrors, email: validateEmailOrUsername(value) });
      }
    } else if (field === "password") {
      setLoginPassword(value);
      setLoginError("");
      if (loginTouched.password) {
        setLoginErrors({ ...loginErrors, password: validatePassword(value) });
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);
    
    const emailError = validateEmailOrUsername(loginEmail);
    const passwordError = validatePassword(loginPassword);

    if (emailError || passwordError) {
      setLoginErrors({ email: emailError, password: passwordError });
      setLoginTouched({ email: true, password: true });
      setIsLoginLoading(false);
      return;
    }

    try {
      const response = await apiClient.post("/login", {
        email: loginEmail,
        password: loginPassword,
      });

      if (response.data?.status || response.status === 200) {
        const user = response.data.data?.user;
        const userRole = user?.role || user?.user_type || user?.type;
        
        if (userRole && (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "administrator")) {
          setLoginError("Invalid credentials. This account has admin access. Please use the admin login page.");
          setIsLoginLoading(false);
          return;
        }
        
        const userId = user?.id || user?.user_id;
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("userId", userId);
          localStorage.setItem("adminSelectedVariantId", response.data.data.user.age_group_id ? response.data.data.user.age_group_id : response.data.data.age_group_id);
        }
        if (response.data.data?.token) {
          localStorage.setItem("token", response.data.data.token);
          localStorage.setItem("adminSelectedVariantId", response.data.data.user.age_group_id ? response.data.data.user.age_group_id : response.data.data.age_group_id);
        }
        
        // Set authenticated and reload user data
        setIsAuthenticated(true);
        setUserId(userId);
        await fetchUserId();
        
        // Reload user age for language selection
        const age = user.age ? parseInt(user.age) : null;
        setUserAge(age);
        
        // Check for testId in current state or localStorage
        const currentTestId = testId || localStorage.getItem("currentTestId");
        
        // Fetch test data if testId exists
        if (currentTestId) {
          // Ensure testId is set in state
          if (!testId) {
            setTestId(currentTestId);
          }
          // Fetch test data with the current testId
          await fetchTestData(currentTestId);
        } else {
          // If no testId, automatically fetch the first available test
          setLoading(true);
          await fetchFirstTest();
        }
      } else {
        setLoginError(response.data?.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Login failed. Please try again."
      );
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden blue-bg-100">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10 relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={logoImage}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              {showLoginForm ? "User Login" : "Create Account"}
            </h2>
          </div>

          {showLoginForm ? (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {loginError && (
                <div className="warning-bg-light border warning-border-light warning-text px-3 py-2 rounded-md text-xs flex items-center gap-2">
                  <HiExclamationCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium neutral-text-muted">
                  Email or Username
                </label>
                <div
                  className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                    loginErrors.email && loginTouched.email
                      ? "border-red-500"
                      : "border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
                    <HiMail className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => handleLoginChange("email", e.target.value)}
                    onBlur={() => handleLoginBlur("email")}
                    placeholder="Enter email or username"
                    className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
                  />
                </div>
                {loginErrors.email && loginTouched.email && (
                  <p className="danger-text text-xs mt-1 flex items-center gap-1">
                    <HiExclamationCircle className="w-3 h-3" />
                    {loginErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium neutral-text-muted">
                  Password
                </label>
                <div
                  className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                    loginErrors.password && loginTouched.password
                      ? "border-red-500"
                      : "border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light">
                    <HiLockClosed className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => handleLoginChange("password", e.target.value)}
                    onBlur={() => handleLoginBlur("password")}
                    placeholder="Enter password"
                    className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
                  />
                  <div
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="flex items-center justify-center px-3 cursor-pointer"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? (
                      <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                    ) : (
                      <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                    )}
                  </div>
                </div>
                {loginErrors.password && loginTouched.password && (
                  <p className="danger-text text-xs mt-1 flex items-center gap-1">
                    <HiExclamationCircle className="w-3 h-3" />
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isLoginLoading}
                className="w-full py-3 px-4 rounded-lg yellow-bg-400 yellow-text-950 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoginLoading ? (
                  <>
                    <span className="spinner spinner-sm mr-2"></span>
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm neutral-text-muted mb-4">
                Registration is available on the main registration page.
              </p>
              <button
                onClick={() => setShowLoginForm(true)}
                className="btn btn-primary"
              >
                Back to Login
              </button>
            </div>
          )}

          <div className="mt-6 border-t neutral-border-light pt-4">
            <p className="text-center text-xs neutral-text-muted">
              {showLoginForm ? "New to Strengths Compass?" : "Already have an account?"}
            </p>
            <button
              onClick={() => navigate("/register")}
              className="mt-3 inline-flex items-center justify-center w-full btn btn-ghost"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-screen neutral-text bg">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner spinner-lg mx-auto mb-4"></div>
            <p className="neutral-text-muted">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-screen neutral-text bg">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="danger-text mb-4">{error}</p>
            <button onClick={fetchTestData} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen blue-bg-50 text-slate-900">
      {/* Consent Modal with Blur Background */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blur Background */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              // Don't allow closing by clicking outside if consent is not given
              if (isConsent) {
                setShowConsentModal(false);
              }
            }}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 md:p-8 z-10">
            <div className="mb-6">
              <h2 className="text-lg md:text-3xl font-bold text-gray-800 mb-4">
                Consent to Take Assessment
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  I consent to take this assessment for personal development purposes only. Results are self-reported tendencies, not diagnostic. I agree to use responsibly and release creators from liability.
                </p>
                <div className="flex items-start pt-2">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      id="consent-checkbox"
                      checked={isConsent}
                      onChange={(e) => setIsConsent(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <label 
                    htmlFor="consent-checkbox" 
                    className="ml-3 text-sm text-gray-900 cursor-pointer"
                  >
                    I agree to the terms and conditions above
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  if (isConsent) {
                    // Store consent in sessionStorage for this test
                    if (testId) {
                      sessionStorage.setItem(`test_${testId}_consent`, 'true');
                    }
                    setShowConsentModal(false);
                  }
                }}
                disabled={!isConsent}
                className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={!!submitError}
        onClose={() => setSubmitError(null)}
        type="error"
        title=" Error"
        message={submitError || ""}
      />
      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/profile");
        }}
        type="success"
        title="Test Submitted Successfully!"
        message={<>Congratulations! You have successfully completed the test. Thank you for taking the time to complete the assessment.<br /><br />Our team will review your results and get back to you soon.</>}
        primaryText="View Profile"
        onPrimary={() => {
          setShowSuccessModal(false);
          navigate("/profile");
        }}
      />
      <Navbar />

      {!showConsentModal && (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Language Dropdown - Available only for age group 13-17 */}
        {isEligibleForLanguageSelection && (
          <div className="mb-6 flex justify-end">
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-2 px-4 py-2 yellow-bg-400 border border-yellow-500 rounded-lg shadow-sm hover:yellow-bg-500 transition-colors"
              >
                <HiTranslate className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">
                  {selectedLanguage ? selectedLanguage.name : "English"}
                </span>
                <HiChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
             
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white/80 backdrop-blur p-5 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
            {testName}
          </h1>
          <p className="text-sm text-slate-600">
          Read each sentence and think about how true it is for you in your daily life. Answer based on how you really are, not how you wish to be. There are no right or wrong answers.          </p>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-4 md:p-6 mb-6 w-full">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                
              </thead>
              <tbody>
                {currentQuestions.map((question) => {
                  const selectedAnswer = answers[question.id];
                  const questionData = getQuestionText(question);
                  
                  // Debug: Log first question to verify translations
                  if (question.id === currentQuestions[0]?.id && selectedLanguage) {
                    console.log("Debug - Question:", question.id);
                    console.log("Debug - Selected Language:", selectedLanguage);
                    console.log("Debug - Question Translations:", question.translations);
                    console.log("Debug - Question Data:", questionData);
                  }

                  return (
                    <React.Fragment key={question.id}>
                      <tr className="border-b neutral-border-light">
                        <td className="py-4 px-4 md:px-6">
                          <div className="flex items-start gap-2">
                            <span className="secondary-text text-2xl font-bold mt-1">•</span>
                            <div className="flex-1">
                              <p className="font-semibold neutral-text text-base md:text-lg">
                                {questionData.text}
                              </p>
                              {selectedLanguage && !questionData.hasTranslation && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                  <HiExclamationCircle className="w-3 h-3" />
                                  No translation available
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 md:px-6 pb-5">
                          <div className="flex flex-wrap gap-2 md:gap-2.5">
                            {options.length > 0 ? (
                              options.map((option, optionIndex) => {
                                const isSelected = selectedAnswer === optionIndex;
                                const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D, E

                          return (
                            <button
                                    key={option.id || optionIndex}
                                    type="button"
                                    onClick={() => handleAnswerSelect(question.id, optionIndex)}
                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                      isSelected
                                        ? "secondary-bg neutral-text shadow-sm"
                                        : "primary-bg-light primary-text border-2 primary-border-light hover:primary-bg-medium"
                                    }`}
                                  >
                                    <span className="font-semibold">{optionLetter}.</span>
                                    <span>{option.label}</span>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-4 neutral-bg-medium rounded-lg">
                                <p className="neutral-text-muted text-sm">
                                  Loading options...
                                </p>
                                  </div>
                                )}
                              </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
              </div>

        {/* Pagination and Submit */}
        <div className="flex flex-col gap-4">
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <HiChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                Next
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Submit Button - Only on Last Page */}
          {currentPage === totalPages && (
            <div className="card p-4 md:p-6 primary-bg-light border-2 primary-border">
                    <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full btn btn-secondary"
              >
                {submitting ? (
                  <>
                    <span className="spinner spinner-sm mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Test
                    <HiCheck className="w-4 h-4" />
                  </>
                )}
                    </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
