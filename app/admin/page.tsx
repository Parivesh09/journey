import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const user = await requireAdmin();
  
  if (!user) {
    return null; // Handled by layout
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600">
        Welcome to the admin panel. Use the navigation above to manage users, roadmaps, AI providers, diagrams, and audit logs.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users" className="group">
          <div className="flex min-h-[80px] w-full flex-col items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-6 sm:px-8 hover:bg-gray-50 hover:border-gray-300">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112-0v1zm0 0h6v-2.343a4 4 0 00-4-4.342z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Users</p>
              <p className="text-xs text-gray-500">Manage user accounts</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/roadmaps" className="group">
          <div className="flex min-h-[80px] w-full flex-col items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-6 sm:px-8 hover:bg-gray-50 hover:border-gray-300">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946.536c.355.193.682.295.983.295h3.462c.301 0 .628-.102.983-.295 1.121-.317 2.08-.962 2.647-1.838.573-.876.16-1.978-.376-2.805A5.413 5.413 0 006.583 8.69a3.42 3.42 0 00-1.946-.536z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Roadmaps</p>
              <p className="text-xs text-gray-500">Manage learning roadmaps</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/ai-providers" className="group">
          <div className="flex min-h-[80px] w-full flex-col items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-6 sm:px-8 hover:bg-gray-50 hover:border-gray-300">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 8.5L14 12l-3.5 3.5m5.507-4.146a2.278 2.278 0 011.155.636l.318 1.318a2.278 2.278 0 01-2.25 2.238l-.318 1.319a2.278 2.278 0 01-2.25 2.238l-.318 1.318a2.278 2.278 0 01-1.155.636l-.318-1.319a2.278 2.278 0 01-2.25-2.238l-.318-1.319a2.278 2.278 0 011.155-.636l1.757-.733a2.278 2.278 0 013.333 0l1.757.734a2.278 2.278 0 011.155.636l.318 1.318a2.278 2.278 0 01-2.25 2.238l-.318 1.319a2.278 2.278 0 01-2.25 2.238l-.318 1.318a2.278 2.278 0 01-1.155.636z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">AI Providers</p>
              <p className="text-xs text-gray-500">Manage AI API connections</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/audit" className="group">
          <div className="flex min-h-[80px] w-full flex-col items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-6 sm:px-8 hover:bg-gray-50 hover:border-gray-300">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Audit Log</p>
              <p className="text-xs text-gray-500">View system activity</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}