import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AlertModal from "../components/AlertModal";
import apiClient from "../config/api";
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

export default function SchoolDetails() {
    const { schoolId } = useParams();
    const navigate = useNavigate();
    const [schoolData, setSchoolData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSchoolDetails();
    }, [schoolId]);

    const fetchSchoolDetails = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/schools/${schoolId}/users`);

            if (response.data?.status && response.data.data) {
                setSchoolData(response.data.data);
            } else {
                setError("Failed to load school details");
            }
        } catch (err) {
            console.error("Error fetching school details:", err);
            setError(
                err.response?.data?.message || "Failed to load school details. Please try again."
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
                    <p className="text-sm neutral-text-muted">Loading school details...</p>
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
                        onClose={() => navigate("/admin/dashboard/master/schools")}
                    />
                </div>
            </div>
        );
    }

    const { school, users } = schoolData || {};

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/admin/dashboard/master/schools")}
                                className="flex items-center text-white hover:text-gray-900 transition-colors"
                            >
                                <HiArrowLeft className="w-5 h-5 mr-2" />
                                Back to Schools
                            </button>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {school?.name || "School Details"}
                                </h1>
                                <p className="text-sm text-gray-500">School Information & Users</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => navigate(`/admin/dashboard/master/schools?edit=${school?.id}`)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <HiPencil className="w-4 h-4 mr-2" />
                                Edit School
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* School Details Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <HiOfficeBuilding className="w-5 h-5 mr-2 text-blue-600" />
                            School Information
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        School Name
                                    </label>
                                    <div className="text-sm font-medium text-gray-900">
                                        {school?.name || "N/A"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Shortcode
                                    </label>
                                    <div className="text-sm text-gray-900">
                                        {school?.shortcode || "N/A"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Registration No
                                    </label>
                                    <div className="text-sm text-gray-900">
                                        {school?.registration_no || "N/A"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Status
                                    </label>
                                    <div className="flex items-center">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${school?.is_active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {school?.is_active ? (
                                                <HiCheckCircle className="w-3 h-3 mr-1" />
                                            ) : (
                                                <HiXCircle className="w-3 h-3 mr-1" />
                                            )}
                                            {school?.is_active ? "Active" : "Inactive"}
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
                                        {school?.email || "N/A"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center">
                                        <HiPhone className="w-4 h-4 mr-1" />
                                        Contact Number
                                    </label>
                                    <div className="text-sm text-gray-900">
                                        {school?.contact_number || "N/A"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1 flex items-center">
                                        <HiUser className="w-4 h-4 mr-1" />
                                        Principal Name
                                    </label>
                                    <div className="text-sm text-gray-900">
                                        {school?.principal_name || "N/A"}
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
                                        {school?.address || "N/A"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 block mb-1">
                                            City
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {school?.city || "N/A"}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 block mb-1">
                                            State
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {school?.state || "N/A"}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500 block mb-1">
                                            Country
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {school?.country || "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        {/* <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                <div>
                                    <span className="font-medium">Created:</span> {formatDate(school?.created_at)}
                                </div>
                                <div>
                                    <span className="font-medium">Last Updated:</span> {formatDate(school?.updated_at)}
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>

                {/* Users Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <HiUserGroup className="w-5 h-5 mr-2 text-green-600" />
                            School Users ({users?.length || 0})
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
                                                Class
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Registration No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gender
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Age
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
                                                    {user.class || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.registration_no || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                                    {user.gender || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.age || "N/A"}
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
                                    This school doesn't have any registered users yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}