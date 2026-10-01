'use client';
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/auth-client";

export default function UsersPage() {
  const [users, setUsers] = useState<Array<any>>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const { user: currentUser, loading: userLoading } = useUser();

  // Fetch users when search, page, currentUser, or userLoading changes
  useEffect(() => {
    if (!currentUser || userLoading) {
      // No user yet or still loading user info – skip fetch
      return;
    }
    fetchUsers();
  }, [search, page, currentUser, userLoading]);

  async function fetchUsers() {
    setFetching(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
      setTotal(0);
    } finally {
      setFetching(false);
    }
  }

  // If we are still loading the user info (from useUser), show a global loading indicator
  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center py-8">Loading...</div>;
  }
  // If no user (should not happen due to layout protection), show access denied
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        {currentUser?.role === "ADMIN" && (
          <Link href="/admin/users/new" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
            New User
          </Link>
        )}
      </div>
      
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {fetching ? (
        <div className="text-center py-8">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No users found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-full w-full rounded-full" src={user.image || "/default-avatar.png"} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "ADMIN" 
                        ? "bg-indigo-100 text-indigo-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role === "ADMIN" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-gray-500">
          Showing {users.length} of {total} users
        </div>
        <div>
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          {Math.ceil(total / 50) > page && (
            <button
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}