import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg p-4">
      <div className="w-full max-w-md card p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 secondary-bg rounded-full mb-4 mx-auto">
          <span className="text-4xl font-bold white-text">404</span>
        </div>
        <h1 className="text-4xl font-bold neutral-text mb-2">Page Not Found</h1>
        <p className="neutral-text-muted mb-6">The page you're looking for doesn't exist.</p>
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full btn btn-primary"
          >
            Go to Home
          </Link>
          <Link
            to="/login"
            className="block w-full btn btn-secondary"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
