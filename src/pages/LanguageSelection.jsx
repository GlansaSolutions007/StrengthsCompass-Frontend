import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiTranslate, HiCheck } from "react-icons/hi";
import Navbar from "../components/Navbar";

const languages = [
  { id: 1, name: "Telugu", code: "te" },
  { id: 2, name: "Hindi", code: "hi" },
  { id: 3, name: "Tamil", code: "ta" },
  { id: 4, name: "Kannada", code: "kn" },
  { id: 5, name: "Malayalam", code: "ml" },
];

export default function LanguageSelection() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    // Save selected language to localStorage
    localStorage.setItem("selectedLanguage", JSON.stringify(language));
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      // Navigate back to test list or previous page
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen w-screen blue-bg-50">
      <Navbar />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <HiTranslate className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Select Your Language
              </h1>
              <p className="text-gray-600">
                Choose your preferred language for the assessment
              </p>
            </div>

            <div className="space-y-3">
              {languages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                    selectedLanguage?.id === language.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <span className="text-lg font-medium text-gray-800">
                    {language.name}
                  </span>
                  {selectedLanguage?.id === language.id && (
                    <HiCheck className="w-6 h-6 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedLanguage}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

