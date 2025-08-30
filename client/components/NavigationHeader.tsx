import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Database, Home } from "lucide-react";

export function NavigationHeader() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Carzino Autos</h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Home className="w-4 h-4" />
              Original Demo
            </Link>

            <Link
              to="/mysql-vehicles"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/mysql-vehicles")
                  ? "bg-red-100 text-red-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Database className="w-4 h-4" />
              MySQL Vehicles (50k)
            </Link>

            <Link
              to="/builder-inventory"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/builder-inventory") || isActive("/inventory")
                  ? "bg-red-100 text-red-700"
                  : "text-red-600 hover:text-red-700 hover:bg-red-50"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Builder.io Inventory
            </Link>
          </nav>

          {/* Stats/Info */}
          <div className="text-sm text-gray-500">
            {isActive("/mysql-vehicles") && "MySQL Vehicles (50k)"}
            {isActive("/") && "Original Demo"}
            {(isActive("/builder-inventory") || isActive("/inventory")) && "Builder.io + WooCommerce"}
          </div>
        </div>
      </div>
    </header>
  );
}
