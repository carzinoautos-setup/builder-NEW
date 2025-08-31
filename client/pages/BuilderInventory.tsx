/**
 * Builder.io Powered Vehicle Inventory Page
 * Renders your Builder.io visual model with WooCommerce vehicle data
 */

import React, { useEffect, useState } from "react";
import { BuilderComponent, builder } from "@builder.io/react";
import { useBuilderWooCommerce } from "../lib/builderWooCommerceIntegration";
import { BUILDER_MODELS } from "../lib/builder";
import { VehicleFilters } from "../lib/woocommerce";
import { Loader, AlertCircle, RefreshCw } from "lucide-react";

interface BuilderInventoryProps {
  /**
   * Builder.io model name to render
   * Defaults to 'vehicle-inventory-page'
   */
  modelName?: string;

  /**
   * Initial filters for vehicle loading
   */
  initialFilters?: VehicleFilters;

  /**
   * Custom URL for Builder.io targeting
   */
  builderUrl?: string;
}

export const BuilderInventory: React.FC<BuilderInventoryProps> = ({
  modelName = BUILDER_MODELS.VEHICLE_INVENTORY,
  initialFilters = { per_page: 20, page: 1 },
  builderUrl = "/inventory",
}) => {
  const {
    vehicles,
    loading,
    error,
    builderContent,
    totalVehicles,
    currentPage,
    totalPages,
    initialize,
    refresh,
    searchVehicles,
    filterVehicles,
    loadPage,
  } = useBuilderWooCommerce();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the integration on component mount
  useEffect(() => {
    const initializeIntegration = async () => {
      console.log("🔄 Initializing Builder.io Inventory Page...");

      try {
        await initialize(initialFilters, {
          modelName,
          url: builderUrl,
          userAttributes: {
            pageType: "vehicle-inventory",
            timestamp: new Date().toISOString(),
          },
        });
        setIsInitialized(true);
        console.log("✅ Builder.io Inventory Page initialized");
      } catch (err) {
        console.error("❌ Failed to initialize Builder.io Inventory:", err);
      }
    };

    initializeIntegration();
  }, [modelName, builderUrl]);

  // Register custom components for Builder.io
  useEffect(() => {
    // Register vehicle data for use in Builder.io repeater blocks
    builder.registerComponent({
      name: "VehicleRepeater",
      inputs: [
        {
          name: "vehicles",
          type: "list",
          subFields: [
            { name: "id", type: "number" },
            { name: "title", type: "string" },
            { name: "price", type: "number" },
            { name: "formattedPrice", type: "string" },
            { name: "payment", type: "string" },
            { name: "make", type: "string" },
            { name: "model", type: "string" },
            { name: "year", type: "number" },
            { name: "mileage", type: "number" },
            { name: "formattedMileage", type: "string" },
            { name: "primaryImage", type: "string" },
            { name: "dealer", type: "string" },
            { name: "location", type: "string" },
          ],
        },
      ],
    });

    // Register pagination controls
    builder.registerComponent({
      name: "VehiclePagination",
      inputs: [
        { name: "currentPage", type: "number" },
        { name: "totalPages", type: "number" },
        { name: "totalVehicles", type: "number" },
      ],
    });

    // Register search and filter controls
    builder.registerComponent({
      name: "VehicleFilters",
      inputs: [
        { name: "onSearch", type: "string" },
        { name: "onFilter", type: "string" },
      ],
    });
  }, []);

  // Handle loading state
  if (loading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Vehicle Inventory
          </h2>
          <p className="text-gray-600 max-w-md">
            Connecting to WooCommerce and preparing your Builder.io content...
          </p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Configuration Error
            </h2>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={() => refresh(initialFilters)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>

          <div className="mt-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">
              Setup Checklist:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Set VITE_BUILDER_API_KEY in environment variables</li>
              <li>✓ Set VITE_WC_API_URL to your WooCommerce store URL</li>
              <li>✓ Set VITE_WC_CONSUMER_KEY from WooCommerce REST API</li>
              <li>✓ Set VITE_WC_CONSUMER_SECRET from WooCommerce REST API</li>
              <li>✓ Create vehicle-inventory-page model in Builder.io</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where Builder.io content is not available
  if (!builderContent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              Builder.io Content Not Found
            </h2>
            <p className="text-yellow-700 text-sm mb-4">
              No content found for model:{" "}
              <code className="bg-yellow-100 px-1 rounded">{modelName}</code>
            </p>
            <p className="text-yellow-600 text-sm">
              Please create this model in your Builder.io space or check your
              API key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main render: Builder.io content with vehicle data
  return (
    <div className="min-h-screen bg-white">
      {/* Render Builder.io content */}
      <BuilderComponent
        model={modelName}
        content={builderContent}
        data={{
          // Inject vehicle data into Builder.io context
          vehicles,
          totalVehicles,
          currentPage,
          totalPages,
          // Pagination functions
          loadPage: (page: number) => loadPage(page, initialFilters),
          searchVehicles: (query: string) => searchVehicles(query, 1),
          filterVehicles: (filters: VehicleFilters) => filterVehicles(filters),
          // Helper functions
          formatPrice: (price: number) => `$${price?.toLocaleString()}`,
          formatMileage: (mileage: number) => `${mileage?.toLocaleString()} mi`,
        }}
        // Custom context for targeting and personalization
        context={{
          userAgent: navigator.userAgent,
          url: builderUrl,
          device: window.innerWidth > 768 ? "desktop" : "mobile",
        }}
      />

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs max-w-sm">
          <div>🚗 Vehicles: {vehicles.length}</div>
          <div>
            📄 Page: {currentPage} / {totalPages}
          </div>
          <div>🏗️ Model: {modelName}</div>
          <div>✅ Content: {builderContent ? "Loaded" : "None"}</div>
        </div>
      )}
    </div>
  );
};

export default BuilderInventory;
