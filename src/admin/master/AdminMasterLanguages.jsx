import React, { useState } from "react";
import { HiTranslate, HiX, HiEye } from "react-icons/hi";
import AlertModal from "../../components/AlertModal";

// Static languages for 13-17 age group
const languages = [
  { id: 1, name: "Telugu", code: "te", isActive: true },
  { id: 2, name: "Hindi", code: "hi", isActive: true },
  { id: 3, name: "Tamil", code: "ta", isActive: true },
  { id: 4, name: "Kannada", code: "kn", isActive: true },
  { id: 5, name: "Malayalam", code: "ml", isActive: true },
];

export default function AdminMasterLanguages() {
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    language: null,
  });
  const [isClosingView, setIsClosingView] = useState(false);

  const handleView = (language) => {
    setViewModal({ isOpen: true, language });
  };

  const closeViewModal = () => {
    if (isClosingView) return;
    setIsClosingView(true);
    setTimeout(() => {
      setViewModal({ isOpen: false, language: null });
      setIsClosingView(false);
    }, 220);
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold neutral-text">Languages</h2>
          <p className="text-sm neutral-text-muted mt-1">
            Manage languages available for users aged 13-17 years
          </p>
        </div>
      </div>

      {/* Languages Table */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Language Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((language) => (
                <tr key={language.id}>
                  <td>{language.id}</td>
                  <td className="font-medium">{language.name}</td>
                  <td>
                    <span className="badge badge-neutral">{language.code}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        language.isActive ? "badge-accent" : "badge-neutral"
                      }`}
                    >
                      {language.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(language)}
                        className="btn-view"
                        title="View Details"
                      >
                        <HiEye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {languages.length === 0 && (
          <div className="text-center py-12">
            <HiTranslate className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="neutral-text-muted">No languages found</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {(viewModal.isOpen || isClosingView) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/40 ${
              isClosingView ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            onClick={closeViewModal}
          ></div>
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 ${
              isClosingView ? "animate-modal-out" : "animate-modal-in"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold neutral-text">
                Language Details
              </h3>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {viewModal.language && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium neutral-text-muted">
                    Language ID
                  </label>
                  <p className="neutral-text">{viewModal.language.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium neutral-text-muted">
                    Language Name
                  </label>
                  <p className="neutral-text font-medium">
                    {viewModal.language.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium neutral-text-muted">
                    Language Code
                  </label>
                  <p className="neutral-text">
                    <span className="badge badge-neutral">
                      {viewModal.language.code}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium neutral-text-muted">
                    Status
                  </label>
                  <p className="neutral-text">
                    <span
                      className={`badge ${
                        viewModal.language.isActive
                          ? "badge-accent"
                          : "badge-neutral"
                      }`}
                    >
                      {viewModal.language.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium neutral-text-muted">
                    Age Group
                  </label>
                  <p className="neutral-text">13 - 17 years</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={closeViewModal} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

