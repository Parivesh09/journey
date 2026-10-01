import { requireAdmin } from "@/lib/auth";
import ThemeSetter from "./theme-setter";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  
  if (!user) {
    // This should ideally redirect to login, but for API routes we return 403
    // For pages, we'll show a simple message
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
    <div className="min-h-screen bg-gray-50">
      <ThemeSetter />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img className="h-8 w-auto" src="/logo.svg" alt="Roadmap Admin" />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="/admin/users" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Users</a>
                  <a href="/admin/roadmaps" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Roadmaps</a>
                  <a href="/admin/ai-providers" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">AI Providers</a>
                  <a href="/admin/diagrams" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Diagrams</a>
                  <a href="/admin/audit" className="text-indigo-600 font-medium px-3 py-2 rounded-md text-sm">Audit Log</a>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 flex items-center md:ml-6">
                <span className="text-sm font-medium text-gray-700">
                  Welcome, {user.name || user.email} ({user.role})
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}