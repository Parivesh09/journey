'use client';
import { useUser } from "@/lib/auth-client";

export default function DiagramsPage() {
  const { user: currentUser, loading: userLoading } = useUser();

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center py-8">Loading...</div>;
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
          <a href="/" className="text-blue-600 hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <h2 className="text-2xl font-bold text-gray-900">Diagrams</h2>
      <p className="text-gray-600">
        Diagrams management page under construction.
      </p>
    </div>
  );
}