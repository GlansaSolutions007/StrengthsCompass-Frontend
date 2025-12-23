import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";
import {
  HiArrowLeft,
  HiUserGroup,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiOfficeBuilding,
  HiCheckCircle,
  HiXCircle,
  HiUser,
  HiAcademicCap,
  HiIdentification,
  HiPencil,
} from "react-icons/hi";

export default function OrganizationDetails() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [organizationData, setOrganizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [organizationId]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/organizations/${organizationId}/users`);

      if (response.data?.status && response.data.data) {
        setOrganizationData(response.data.data);
      } else {
        setError("Failed to load organization details");
      }
    } catch (err) {
      console.error("Error fetching organization details:", err);
      setError(
        err.response?.data?.message || "Failed to load organization details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <span className="spinner spinner-lg mb-3"></span>
          <p className="text-sm neutral-text-muted">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <AlertModal
            isOpen={true}
            type="error"
            message={error}
            onClose={() => navigate("/admin/dashboard/master/organizations")}
          />
        </div>
      </div>
    );
  }

  const { organization, users } = organizationData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/dashboard/master/organizations")}
                className="flex items-center text-white hover:text-gray-900 transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 mr-2" />
                Back to Organizations
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {organization?.name || "Organization Details"}
                </h1>
                <p className="text-sm text-gray-500">Organization Information & Users</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/admin/dashboard/master/organizations?edit=${organization?.id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <HiPencil className="w-4 h-4 mr-2" />
                Edit Organization
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <HiOfficeBuilding className="w-5 h-5 mr-2 text-blue-600" />
              Organization Information
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Organization Name
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {organization?.name || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Shortcode
                  </label>
                  <div className="text-sm text-gray-900">
                    {organization?.shortcode || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Registration No
                  </label>
                  <div className="text-sm text-gray-900">
                    {organization?.registration_no || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Status
                  </label>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        organization?.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {organization?.is_active ? (
                        <HiCheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <HiXCircle className="w-3 h-3 mr-1" />
                      )}
                      {organization?.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center">
                    <HiMail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <div className="text-sm text-gray-900">
                    {organization?.email || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center">
                    <HiPhone className="w-4 h-4 mr-1" />
                    Contact Number
                  </label>
                  <div className="text-sm text-gray-900">
                    {organization?.contact_number || "N/A"}
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center">
                    <HiLocationMarker className="w-4 h-4 mr-1" />
                    Address
                  </label>
                  <div className="text-sm text-gray-900">
                    {organization?.address || "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      City
                    </label>
                    <div className="text-sm text-gray-900">
                      {organization?.city || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      State
                    </label>
                    <div className="text-sm text-gray-900">
                      {organization?.state || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Country
                    </label>
                    <div className="text-sm text-gray-900">
                      {organization?.country || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <HiUserGroup className="w-5 h-5 mr-2 text-green-600" />
              Organization Users ({users?.length || 0})
            </h2>
          </div>

          <div className="p-6">
            {users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email/Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profession
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <HiUser className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.employee_id || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {user.gender || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.age || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.profession || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <HiCheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <HiUserGroup className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This organization doesn't have any registered users yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}