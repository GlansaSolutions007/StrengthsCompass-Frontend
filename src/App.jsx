import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Landing from "./pages/Landing";
import AdminLoginPage from "./admin/AdminLoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Test from "./pages/Test";
import TestList from "./pages/TestList";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProfile from "./admin/AdminProfile";
import AdminMasterCluster from "./admin/master/AdminMasterCluster";
import AdminMasterConstruct from "./admin/master/AdminMasterConstruct";
import AdminMasterQuestions from "./admin/master/AdminMasterQuestions";
import AdminMasterOptions from "./admin/master/AdminMasterOptions";
import AdminMasterTests from "./admin/master/AdminMasterTests";
import AdminMasterAge from "./admin/master/AdminMasterAge";
import AdminUserList from "./admin/AdminUserList";
import UserDetails from "./admin/UserDetails";
import UserResults from "./admin/UserResults";
import UserAnswers from "./admin/UserAnswers";
import AdminTestResults from "./admin/AdminTestResults";
import TestDetails from "./admin/TestDetails";
import AdminLayout from "./layouts/AdminLayout";
import ResetPassword from "./pages/ResetPassword";
import AdminMasterSchools from "./admin/master/AdminMasterSchools";
import AdminMasterOrganizations from "./admin/master/AdminMasterOrganizations";
import SchoolDetails from "./admin/SchoolDetails";
import OrganizationDetails from "./admin/OrganizationDetails";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/testlist" element={<TestList />} />
      <Route path="/test" element={<Test />} />
      <Route path="/test/:testId" element={<Test />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      
      {/* Admin dashboard routes (no auth) */}
      <Route path="/admin/dashboard" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserList />} />
        <Route path="users/test-results" element={<AdminTestResults />} />
        <Route path="users/:userId/results" element={<UserResults />} />
        <Route path="users/:userId/answers" element={<UserAnswers />} />
        <Route path="users/:userId" element={<UserDetails />} />
        <Route path="master/cluster" element={<AdminMasterCluster />} />
        <Route path="master/construct" element={<AdminMasterConstruct />} />
        <Route path="master/questions" element={<AdminMasterQuestions />} />
        <Route path="master/options" element={<AdminMasterOptions />} />
        <Route path="master/tests" element={<AdminMasterTests />} />
        <Route path="master/tests/:testId" element={<TestDetails />} />
        <Route path="master/age" element={<AdminMasterAge />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="master/schools" element={<AdminMasterSchools />} />
        <Route path="master/schools/:schoolId" element={<SchoolDetails />} />
        <Route path="master/organizations" element={<AdminMasterOrganizations />} />
        <Route path="master/organizations/:organizationId" element={<OrganizationDetails />} />
      </Route>

     

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
