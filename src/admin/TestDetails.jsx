import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiArrowLeft, HiPencil, HiCheckCircle, HiX } from "react-icons/hi";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";

export default function TestDetails() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/tests/${testId}`);
      
      if (response.data?.status && response.data.data) {
        setTest(response.data.data);
        
        // Questions are already in selected_questions array
        if (response.data.data.selected_questions && Array.isArray(response.data.data.selected_questions)) {
          setQuestions(response.data.data.selected_questions);
        } else {
          setQuestions([]);
        }
      } else {
        setError("Failed to load test details");
      }
    } catch (err) {
      console.error("Error fetching test details:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load test details. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Organize questions by cluster -> construct -> category
  const organizeQuestions = () => {
    if (!test || !test.clusters || !questions.length) return {};
    
    const organized = {};
    
    // Iterate through clusters
    test.clusters.forEach((cluster) => {
      const clusterName = cluster.name || `Cluster #${cluster.id}`;
      organized[clusterName] = {};
      
      // Iterate through constructs in this cluster
      if (cluster.constructs && Array.isArray(cluster.constructs)) {
        cluster.constructs.forEach((construct) => {
          const constructName = construct.name || `Construct #${construct.id}`;
          organized[clusterName][constructName] = { P: [], R: [], SDB: [] };
          
          // Find questions for this construct and cluster
          const constructQuestions = questions.filter((q) => {
            const qConstructId = q.construct_id;
            const qClusterId = q.pivot?.cluster_id;
            return qConstructId === construct.id && qClusterId === cluster.id;
          });
          
          // Organize by category
          constructQuestions.forEach((question) => {
            const category = (question.category || "").toUpperCase();
            if (category === "P" || category === "R" || category === "SDB") {
              organized[clusterName][constructName][category].push(question);
            }
          });
          
          // Sort each category by pivot order_no
          ["P", "R", "SDB"].forEach((cat) => {
            organized[clusterName][constructName][cat].sort((a, b) => {
              const orderA = a.pivot?.order_no || 0;
              const orderB = b.pivot?.order_no || 0;
              return orderA - orderB;
            });
          });
        });
      }
    });
    
    return organized;
  };

  const organizedQuestions = organizeQuestions();
  const testClusters = test?.clusters || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="spinner spinner-lg mb-4"></span>
          <p className="text-neutral-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <AlertModal
          isOpen={!!error}
          onClose={() => navigate("/admin/dashboard/master/tests")}
          type="error"
          title="Error"
          message={error || ""}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/dashboard/master/tests")}
            className="btn btn-ghost btn-icon"
            title="Back to Tests"
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold neutral-text">
              Test Details
            </h1>
            <p className="text-sm neutral-text-muted mt-1">
              View complete test information
            </p>
          </div>
        </div>
        {test && (
          <button
            onClick={() => navigate("/admin/dashboard/master/tests")}
            className="btn btn-accent"
          >
            <HiPencil className="w-4 h-4 mr-2" />
            Back to Tests
          </button>
        )}
      </div>

      {test && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold neutral-text mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold neutral-text-muted block mb-2">
                  Title
                </label>
                <div className="text-base neutral-text font-medium p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  {test.title || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold neutral-text-muted block mb-2">
                  Status
                </label>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span
                    className={`badge ${
                      test.is_active
                        ? "badge-accent"
                        : "badge-neutral"
                    }`}
                  >
                    {test.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold neutral-text-muted block mb-2">
                  Description
                </label>
                <div className="text-base neutral-text p-3 bg-neutral-50 rounded-lg border border-neutral-200 min-h-[60px]">
                  {test.description || "No description provided"}
                </div>
              </div>
            </div>
          </div>

          {/* Clusters */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold neutral-text mb-4">
              Clusters ({test?.clusters?.length || 0})
            </h2>
            {test?.clusters && test.clusters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {test.clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2"
                  >
                    <span className="neutral-text font-medium text-sm">
                      {cluster.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm neutral-text-muted">
                No clusters assigned to this test.
              </p>
            )}
          </div>

          {/* Selected Questions */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold neutral-text mb-4">
              Selected Questions ({test.selected_questions_count || questions.length})
            </h2>
            
            {questions.length === 0 ? (
              <p className="text-sm neutral-text-muted">
                No questions selected for this test.
              </p>
            ) : (
              <div className="space-y-8">
                {Object.keys(organizedQuestions).map((clusterName) => {
                  const clusterData = organizedQuestions[clusterName];
                  
                  return (
                    <div
                      key={clusterName}
                      className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50"
                    >
                      <h3 className="text-xl font-bold neutral-text mb-4 pb-2 border-b border-blue-300">
                        {clusterName}
                      </h3>

                      <div className="space-y-6">
                        {Object.keys(clusterData).map((constructName) => {
                          const constructQuestions = clusterData[constructName];
                          const totalQuestions = 
                            (constructQuestions.P?.length || 0) +
                            (constructQuestions.R?.length || 0) +
                            (constructQuestions.SDB?.length || 0);

                          if (totalQuestions === 0) return null;

                          return (
                            <div
                              key={constructName}
                              className="border border-neutral-200 rounded-lg p-4 bg-white"
                            >
                              <h4 className="text-lg font-semibold neutral-text mb-4">
                                {constructName}
                              </h4>

                              <div className="space-y-4">
                                {["P", "R", "SDB"].map((category) => {
                                  const categoryQuestions = constructQuestions[category] || [];
                                  if (categoryQuestions.length === 0) return null;

                                  // Sort by pivot order_no
                                  const sortedQuestions = [...categoryQuestions].sort((a, b) => {
                                    const orderA = a.pivot?.order_no || 0;
                                    const orderB = b.pivot?.order_no || 0;
                                    return orderA - orderB;
                                  });

                                  return (
                                    <div key={category} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-semibold neutral-text">
                                          {category} Questions
                                        </h5>
                                        <span className="text-sm neutral-text-muted bg-blue-100 px-3 py-1 rounded-full font-medium">
                                          {categoryQuestions.length} question{categoryQuestions.length !== 1 ? "s" : ""}
                                        </span>
                                      </div>
                                      <div className="space-y-2">
                                        {sortedQuestions.map((question) => (
                                          <div
                                            key={question.id}
                                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-blue-300 transition-colors"
                                          >
                                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                              <span className="text-xs font-semibold text-blue-700">
                                                {question.pivot?.order_no || "—"}
                                              </span>
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-sm neutral-text font-medium">
                                                {question.question_text || question.questionText || "N/A"}
                                              </p>
                                              <div className="flex items-center gap-3 mt-1">
                                             
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

