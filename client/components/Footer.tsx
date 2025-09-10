import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="max-w-[1325px] mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/placeholder.svg"
              alt="Carzino Logo"
              className="w-28 h-auto"
            />
            <div className="text-sm text-gray-600">
              Carzino — quality used cars and trusted dealers.
            </div>
          </div>

          <nav className="flex gap-6 text-sm text-gray-700">
            <a href="#" className="hover:text-red-600">
              Inventory
            </a>
            <a href="#" className="hover:text-red-600">
              Financing
            </a>
            <a href="#" className="hover:text-red-600">
              About
            </a>
            <a href="#" className="hover:text-red-600">
              Contact
            </a>
          </nav>

          <div className="w-full md:w-auto">
            <form className="flex items-center gap-2">
              <input
                aria-label="Email"
                type="email"
                placeholder="Your email"
                className="w-full md:w-56 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Subscribe
              </button>
            </form>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
              <span>Follow us:</span>
              <a href="#" className="hover:text-red-600">Twitter</a>
              <a href="#" className="hover:text-red-600">Facebook</a>
              <a href="#" className="hover:text-red-600">Instagram</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between">
          <div>© 2025 Carzino. All rights reserved.</div>
          <div className="mt-2 md:mt-0">Site by Carzino Autos</div>
        </div>
      </div>
    </footer>
  );
}
