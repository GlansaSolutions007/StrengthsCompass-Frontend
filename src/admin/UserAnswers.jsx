import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { HiArrowLeft, HiChevronLeft, HiChevronRight, HiDownload } from "react-icons/hi";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";

const extractAnswersArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.answers)) return payload.answers;
  if (Array.isArray(payload.data?.answers)) return payload.data.answers;
  if (Array.isArray(payload.data?.data?.answers)) return payload.data.data.answers;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.questions)) return payload.questions;
  if (Array.isArray(payload.data?.questions)) return payload.data.questions;
  if (Array.isArray(payload.questions_with_answers)) return payload.questions_with_answers;
  if (Array.isArray(payload.data?.questions_with_answers))
    return payload.data.questions_with_answers;

  return [];
};

const normalizeAnswersData = (rawAnswers = []) =>
  rawAnswers.map((item, index) => {
    const question =
      item.question ||
      item.question_details ||
      item.question_data ||
      {};
    const answerPayload = item.answer || item.selected_answer || item.response || {};
    const optionSource = item.options || question.options;
    const normalizedOptions = Array.isArray(optionSource)
      ? optionSource.map((option, optIndex) => ({
          id: option.id || `${item.question_id || question.id || index}-${optIndex}`,
          label:
            option.label ||
            option.option_text ||
            option.optionText ||
            option.text ||
            option.name ||
            `Option ${optIndex + 1}`,
          value:
            option.value !== undefined && option.value !== null
              ? Number(option.value)
              : option.option_value !== undefined
              ? Number(option.option_value)
              : option.score !== undefined
              ? Number(option.score)
              : optIndex + 1,
        }))
      : [];

      const selectedOption = item.selected_option || item.answer_option;
    const selectedValueRaw =
      answerPayload.answer_value ??
      item.answer_value ??
      item.selected_value ??
      item.selected_option_value ??
      item.answer ??
      (selectedOption && selectedOption.value !== undefined
        ? selectedOption.value
        : answerPayload.final_score ?? null);
    const selectedIndexRaw =
      item.selected_option_index ??
      item.option_index ??
      (typeof selectedOption?.index === "number" ? selectedOption.index : null);
    const selectedLabel =
      answerPayload.answer_label ||
      item.answer_label ||
      item.answer_text ||
      item.selected_option_label ||
      selectedOption?.label ||
      item.option_label ||
      null;

    const categoryCode =
      (question.category ||
        question.category_code ||
        item.category ||
        answerPayload.category ||
        question.construct?.code ||
        question.construct?.short_name ||
        question.construct?.shortName ||
        "").toString().trim();

    return {
      id: item.question_id || question.id || index + 1,
      questionText:
        question.question_text ||
        question.questionText ||
        question.text ||
        item.question_text ||
        item.question ||
        `Question ${index + 1}`,
      categoryCode: categoryCode ? categoryCode.toUpperCase() : null,
      constructName:
        question.construct?.name ||
        question.construct_name ||
        question.constructName ||
        item.construct?.name ||
        null,
      clusterName:
        question.construct?.cluster?.name ||
        question.cluster?.name ||
        question.cluster_name ||
        item.construct?.cluster?.name ||
        null,
      options: normalizedOptions,
      selectedValue:
        selectedValueRaw !== null && selectedValueRaw !== undefined
          ? Number(selectedValueRaw)
          : null,
      selectedIndex:
        selectedIndexRaw !== null && selectedIndexRaw !== undefined
          ? Number(selectedIndexRaw)
          : null,
      selectedLabel,
    };
  });

export default function UserAnswers() {
  const { userId, testResultId } = useParams();
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
  const [answerOptions, setAnswerOptions] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answersError, setAnswersError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("adminToken");
        if (!token) {
          setError("Authentication required. Please login.");
          setLoading(false);
          return;
        }

        const [userRes, testsRes, optionsRes] = await Promise.all([
          apiClient.get(`/users/${userId}`),
          apiClient.get(`/users/${userId}/test-results`, { params: { all: true } }),
          apiClient.get("/options"),
        ]);

        const userData =
          userRes.data?.data ||
          userRes.data?.user ||
          userRes.data ||
          {};
        setUser({
          id: userData.id,
          name:
            userData.name ||
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
            userData.username ||
            "User",
          email: userData.email || "N/A",
        });

        let resultsData = null;
        if (testsRes.data?.data && Array.isArray(testsRes.data.data)) {
          resultsData = testsRes.data.data;
        } else if (Array.isArray(testsRes.data?.test_results)) {
          resultsData = testsRes.data.test_results;
        } else if (Array.isArray(testsRes.data)) {
          resultsData = testsRes.data;
        }

        const sortedResults = Array.isArray(resultsData)
          ? [...resultsData].sort((a, b) => {
              const dateA = new Date(a.completed_at || a.created_at || 0).getTime();
              const dateB = new Date(b.completed_at || b.created_at || 0).getTime();
              return dateB - dateA;
            })
          : [];
        setTestResults(sortedResults);

        let optionsData = [];
        if (optionsRes.data?.status && Array.isArray(optionsRes.data.data)) {
          optionsData = optionsRes.data.data;
        } else if (Array.isArray(optionsRes.data?.data)) {
          optionsData = optionsRes.data.data;
        } else if (Array.isArray(optionsRes.data)) {
          optionsData = optionsRes.data;
        }
        const mappedOptions = optionsData
          .map((option) => ({
            id: option.id,
            label:
              option.label ||
              option.option_text ||
              option.optionText ||
              option.text ||
              option.name ||
              "",
            value:
              option.value !== undefined && option.value !== null
                ? Number(option.value)
                : option.option_value !== undefined
                ? Number(option.option_value)
                : option.score !== undefined
                ? Number(option.score)
                : null,
          }))
          .sort((a, b) => {
            if (a.value !== null && b.value !== null) {
              return a.value - b.value;
            }
            return 0;
          });
        setAnswerOptions(mappedOptions);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to load answers. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    if (!testResults.length) return;
    const preferredId =
      (testResultId && Number(testResultId)) ||
      Number(testResults[0]?.id || testResults[0]?.test_result_id || testResults[0]?.testResultId);
    if (preferredId && preferredId !== selectedTestId) {
      setSelectedTestId(preferredId);
    }
  }, [testResults, testResultId, selectedTestId]);

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!selectedTestId) return;
      try {
        setAnswersLoading(true);
        setAnswersError(null);
        const response = await apiClient.get(`/test-results/${selectedTestId}/answers`);
        const answersArray = extractAnswersArray(response.data);
        const normalized = normalizeAnswersData(answersArray);
        setAnswers(normalized);
      } catch (err) {
        console.error("Error fetching answers:", err);
        setAnswersError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to load answers."
        );
        setAnswers([]);
      } finally {
        setAnswersLoading(false);
      }
    };

    fetchAnswers();
  }, [selectedTestId]);

  const selectedTestMeta = useMemo(() => {
    if (!selectedTestId || !testResults.length) return null;
    const numericId = Number(selectedTestId);
    const match = testResults.find(
      (result) =>
        Number(result.id || result.test_result_id || result.testResultId) === numericId
    );
    if (!match) return null;
    return {
      title:
        match?.test?.title ||
        match?.test_title ||
        match?.test_name ||
        match?.test?.name ||
        "Assessment Test",
      completedAt: match?.completed_at || match?.created_at || null,
    };
  }, [selectedTestId, testResults]);

  const getOptionsForQuestion = (question) => {
    if (Array.isArray(question.options) && question.options.length) {
      return question.options;
    }
    return answerOptions;
  };

  const isOptionSelected = (question, option, optionIndex) => {
    if (
      question.selectedValue !== null &&
      question.selectedValue !== undefined &&
      option.value !== null &&
      option.value !== undefined &&
      Number(option.value) === Number(question.selectedValue)
    ) {
      return true;
    }
    if (
      question.selectedIndex !== null &&
      question.selectedIndex !== undefined &&
      Number(optionIndex) === Number(question.selectedIndex)
    ) {
      return true;
    }
    if (
      question.selectedLabel &&
      option.label &&
      option.label.trim().toLowerCase() === question.selectedLabel.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  const formatAttemptLabel = (result) => {
    const title =
      result?.test?.title ||
      result?.test_title ||
      result?.test_name ||
      result?.test?.name ||
      "Assessment Test";
    const dateValue = result?.completed_at || result?.created_at;
    const formattedDate = dateValue
      ? new Date(dateValue).toLocaleString()
      : "Unknown date";
    return `${title} • ${formattedDate}`;
  };

  const handleTestChange = (event) => {
    const newId = Number(event.target.value);
    if (!newId) return;
    setSelectedTestId(newId);
    navigate(`/admin/dashboard/users/${userId}/answers/${newId}`, {
      replace: true,
      state: { fromTestResults },
    });
  };

  const handleDownloadExcel = async () => {
    if (!answers.length) {
      setAnswersError("No answers available to download.");
      return;
    }

    try {
      setExcelLoading(true);

      const xlsxModule = await import("xlsx").catch(() => null);
      const XLSX = xlsxModule?.default || xlsxModule;
      if (!XLSX) {
        throw new Error("Unable to load Excel library. Please try again.");
      }

      const rows = answers.map((question, index) => {
        const optionList = getOptionsForQuestion(question);
        const selectedOption =
          optionList.find((option, optIndex) =>
            isOptionSelected(question, option, optIndex)
          ) || null;
        const displayAnswer =
          selectedOption?.label ||
          question.selectedLabel ||
          (question.selectedValue !== null && question.selectedValue !== undefined
            ? `Option Value ${question.selectedValue}`
            : "N/A");
        const finalScore = selectedOption?.value ?? question.selectedValue ?? "";

        return {
          "#": index + 1,
          "Question (Category)": `${question.questionText}${
            question.categoryCode ? ` (${question.categoryCode})` : ""
          }`,
          Answer: displayAnswer,
          Score: finalScore,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: ["#", "Question (Category)", "Answer", "Score"],
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Answers");

      const fileName = `User_${userId || "answers"}_${selectedTestId || "test"}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Error generating Excel:", err);
      setAnswersError(err.message || "Failed to generate Excel file. Please try again.");
    } finally {
      setExcelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="neutral-text bg min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="spinner spinner-lg mb-3"></span>
          <p className="text-sm neutral-text-muted">Loading answers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neutral-text bg min-h-screen p-4 md:p-8">
        <AlertModal
          isOpen={!!error}
          onClose={handleBackNavigation}
          type="error"
          title="Error"
          message={error}
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
        isOpen={!!answersError}
        onClose={() => setAnswersError(null)}
        type="error"
        title="Error"
        message={answersError || ""}
      />

      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackNavigation}
            className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" /> {backLabel}
          </button>
          <div>
            <h1 className="text-2xl font-bold neutral-text">User Answers</h1>
            {user && (
              <p className="text-xs neutral-text-muted mt-1">
                {user.name} ({user.email})
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {testResults.length > 0 && (
            <select
              value={selectedTestId || ""}
              onChange={handleTestChange}
              className="input max-w-xs"
            >
              {testResults.map((result) => {
                const value =
                  result.id || result.test_result_id || result.testResultId;
                return (
                  <option key={value} value={value}>
                    {formatAttemptLabel(result)}
                  </option>
                );
              })}
            </select>
          )}
          <button
            onClick={handleDownloadExcel}
            disabled={excelLoading || !answers.length}
            className="btn secondary-bg black-text hover:secondary-bg-dark shadow flex items-center gap-2 disabled:opacity-60"
          >
            {excelLoading ? (
              <>
                <span className="spinner spinner-sm"></span>
                Preparing Excel...
              </>
            ) : (
              <>
                <HiDownload className="w-4 h-4" />
                Download Excel
              </>
            )}
          </button>
        </div>
      </div>

      {selectedTestMeta && (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white/80 backdrop-blur p-5 shadow-sm">
          <h2 className="text-xl font-semibold neutral-text mb-1">
            {selectedTestMeta.title}
          </h2>
          {selectedTestMeta.completedAt && (
            <p className="text-sm neutral-text-muted">
              Completed on {new Date(selectedTestMeta.completedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {answersLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow">
          <span className="spinner spinner-lg mb-3"></span>
          <p className="text-sm neutral-text-muted">Loading answers...</p>
        </div>
      ) : answers.length ? (
        <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary/5 text-xs uppercase tracking-wide text-primary border-b border-primary/20">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Answer</th>
                  <th className="py-3 px-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((question, qIndex) => {
                  const optionList = getOptionsForQuestion(question);
                  const selectedOption =
                    optionList.find((option, idx) => isOptionSelected(question, option, idx)) ||
                    null;
                  const displayAnswer =
                    selectedOption?.label ||
                    question.selectedLabel ||
                    (question.selectedValue !== null && question.selectedValue !== undefined
                      ? `Option Value ${question.selectedValue}`
                      : "N/A");

                  return (
                    <tr
                      key={question.id || qIndex}
                      className="border-b border-neutral-border-light last:border-none"
                    >
                      <td className="py-4 px-4 align-top text-sm font-semibold text-secondary">
                        {qIndex + 1}
                      </td>
                      <td className="py-4 px-4 align-top text-sm text-neutral-text">
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span>{question.questionText}</span>
                          {question.categoryCode && (
                            <span className="text-xs text-neutral-text-muted">
                              ({question.categoryCode})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 align-top text-sm font-medium text-gray-800">
                        {displayAnswer}
                      </td>
                      <td className="py-4 px-4 align-top text-sm text-gray-500">
                        {selectedOption?.value ??
                          question.selectedValue ??
                          "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center border border-dashed border-neutral-border-light rounded-2xl bg-white">
          <p className="text-sm neutral-text-muted">
            No answers available for this attempt.
          </p>
        </div>
      )}
    </div>
  );
}

