import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="font-semibold text-blue-600 hover:text-blue-700 text-sm [&.active]:font-bold [&.active]:border-b-2 [&.active]:border-blue-600"
            >
              New Invoice
            </Link>
            <Link
              to="/history"
              className="text-gray-600 hover:text-gray-900 text-sm [&.active]:font-semibold [&.active]:text-gray-900 [&.active]:border-b-2 [&.active]:border-gray-900"
            >
              History
            </Link>
            <Link
              to="/customers"
              className="text-gray-600 hover:text-gray-900 text-sm [&.active]:font-semibold [&.active]:text-gray-900 [&.active]:border-b-2 [&.active]:border-gray-900"
            >
              Customers
            </Link>
          </nav>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Open settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
