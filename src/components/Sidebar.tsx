import { useState, useEffect } from 'react';

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/getUserInfo');
        const data = await response.json();
        if (data.role === 'Admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-50 transition-transform md:block">
      {/* Logo Section */}
      <div className="flex items-center justify-center py-6 border-b border-gray-200">
        <a href="/dash" className="text-2xl font-bold text-gray-800 flex items-center">
          Stock{" "}
          <span className="ml-1 bg-indigo-500 text-white px-2 py-1 rounded-lg">
            Verse
          </span>
        </a>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col mt-6">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl shadow-md mx-4 py-4 px-3">
            <a
              href="/dash"
              className="block text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg px-4 py-2 transition duration-300"
            >
              Dashboard
            </a>
            <a
              href="/todo"
              className="block text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg px-4 py-2 transition duration-300"
            >
              Tasks
            </a>
            {isAdmin && (
              <>
                <a
                  href="/personal"
                  className="block text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg px-4 py-2 transition duration-300"
                >
                  Personal
                </a>
                <a
                  href="/stocks"
                  className="block text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg px-4 py-2 transition duration-300"
                >
                  Stocks
                </a>
                <a
                  href="/accounts"
                  className="block text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg px-4 py-2 transition duration-300"
                >
                  Accounts
                </a>
              </>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl shadow-md mx-4 py-4 px-3">
            <a
              href="/profile"
              className="block text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg px-4 py-2 transition duration-300"
            >
              Profile
            </a>
            <a
              href="/logout"
              className="block text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg px-4 py-2 transition duration-300"
            >
              Log Out
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}