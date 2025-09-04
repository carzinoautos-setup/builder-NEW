/**
 * Builder.io + WooCommerce Integration Service
 * Connects WooCommerce vehicle data to Builder.io visual models
 */

import React from "react";
import {
  wooCommerceAPI,
  type WCVehicle,
  type VehicleFilters,
} from "./woocommerce";
import {
  getBuilderContent,
  transformVehiclesForBuilder,
  BUILDER_MODELS,
} from "./builder";

// Integration state interface
export interface IntegrationState {
  vehicles: any[];
  loading: boolean;
  error: string | null;
  builderContent: any;
  totalVehicles: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Main integration service class
 */
export class BuilderWooCommerceService {
  private state: IntegrationState = {
    vehicles: [],
    loading: false,
    error: null,
    builderContent: null,
    totalVehicles: 0,
    currentPage: 1,
    totalPages: 1,
  };

  private listeners: Array<(state: IntegrationState) => void> = [];

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: IntegrationState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<IntegrationState>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Get current state
   */
  getState(): IntegrationState {
    return { ...this.state };
  }

  /**
   * Load vehicles from WooCommerce and prepare for Builder.io
   */
  async loadVehicles(filters: VehicleFilters = {}): Promise<void> {
    this.setState({ loading: true, error: null });

    try {
      // Prefer the local /api/vehicles proxy (which itself proxies to WP custom API) to ensure ACF fields are returned
      try {
        const qs = new URLSearchParams(filters as Record<string, any>).toString();
        console.log("🔄 Fetching vehicles from local proxy /api/vehicles...", filters);
        const res = await fetch(`/api/vehicles${qs ? `?${qs}` : ""}`);
        if (!res.ok) throw new Error(`Proxy error ${res.status}`);
        const json = await res.json();

        // Normalize response shapes
        let vehiclesData: any[] = [];
        if (json && Array.isArray(json.data)) vehiclesData = json.data;
        else if (Array.isArray(json)) vehiclesData = json;

        const transformedVehicles = transformVehiclesForBuilder(vehiclesData);
        const totalVehicles = (json && json.meta && json.meta.totalRecords) || vehiclesData.length;
        const perPage = parseInt((filters as any).per_page) || 20;
        const currentPage = parseInt((filters as any).page) || 1;
        const totalPages = Math.ceil(totalVehicles / perPage) || 1;

        console.log(`✅ Loaded ${vehiclesData.length} vehicles from /api/vehicles proxy`);

        this.setState({
          vehicles: transformedVehicles,
          totalVehicles,
          currentPage,
          totalPages,
          loading: false,
        });
        return;
      } catch (err) {
        console.warn("⚠️ Local /api/vehicles proxy failed, falling back to WooCommerce client:", err);
      }

      // Fallback to WooCommerce client if proxy is not available
      if (!wooCommerceAPI.isAvailable()) {
        throw new Error(
          "WooCommerce API not available. Please check environment variables: VITE_WC_API_URL, VITE_WC_CONSUMER_KEY, VITE_WC_CONSUMER_SECRET",
        );
      }

      // Fetch vehicles from WooCommerce
      console.log("🔄 Fetching vehicles from WooCommerce...", filters);
      const wcVehicles = await wooCommerceAPI.getVehicles(filters);

      // Transform vehicles for Builder.io
      const transformedVehicles = transformVehiclesForBuilder(wcVehicles);

      // Calculate pagination info (WooCommerce should provide this in headers)
      const totalVehicles = wcVehicles.length; // This should come from WC response headers
      const perPage = filters.per_page || 20;
      const currentPage = filters.page || 1;
      const totalPages = Math.ceil(totalVehicles / perPage);

      console.log(`✅ Loaded ${wcVehicles.length} vehicles from WooCommerce`);

      this.setState({
        vehicles: transformedVehicles,
        totalVehicles,
        currentPage,
        totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("❌ Failed to load vehicles from WooCommerce:", error);
      this.setState({
        loading: false,
        error: error.message || "Failed to load vehicles",
        vehicles: [],
      });
    }
  }

  /**
   * Load Builder.io content with vehicle data
   */
  async loadBuilderContent(
    modelName: string = BUILDER_MODELS.VEHICLE_INVENTORY,
    options: {
      url?: string;
      userAttributes?: Record<string, any>;
    } = {},
  ): Promise<void> {
    try {
      console.log(`🔄 Loading Builder.io content for model: ${modelName}`);

      const builderContent = await getBuilderContent(
        modelName,
        this.state.vehicles,
        {
          userAttributes: {
            totalVehicles: this.state.totalVehicles,
            currentPage: this.state.currentPage,
            totalPages: this.state.totalPages,
            ...options.userAttributes,
          },
          url: options.url,
        },
      );

      if (builderContent) {
        console.log("✅ Builder.io content loaded successfully");
        this.setState({ builderContent });
      } else {
        console.warn("⚠️ No Builder.io content found for model:", modelName);
        this.setState({
          error: `No Builder.io content found for model: ${modelName}. Please check your Builder.io configuration.`,
        });
      }
    } catch (error) {
      console.error("❌ Failed to load Builder.io content:", error);
      this.setState({
        error: `Failed to load Builder.io content: ${error.message}`,
      });
    }
  }

  /**
   * Full integration: Load vehicles and Builder.io content
   */
  async initialize(
    filters: VehicleFilters = {},
    builderOptions: {
      modelName?: string;
      url?: string;
      userAttributes?: Record<string, any>;
    } = {},
  ): Promise<void> {
    console.log("🚀 Initializing Builder.io + WooCommerce integration...");

    // Load vehicles first
    await this.loadVehicles(filters);

    // Then load Builder.io content with the vehicle data
    if (this.state.vehicles.length > 0 || !this.state.error) {
      await this.loadBuilderContent(builderOptions.modelName, {
        url: builderOptions.url,
        userAttributes: builderOptions.userAttributes,
      });
    }

    console.log("✅ Integration initialization complete");
  }

  /**
   * Refresh data (reload vehicles and Builder.io content)
   */
  async refresh(filters: VehicleFilters = {}): Promise<void> {
    await this.initialize(filters);
  }

  /**
   * Search vehicles and update Builder.io
   */
  async searchVehicles(query: string, page: number = 1): Promise<void> {
    await this.loadVehicles({ search: query, page });
    await this.loadBuilderContent();
  }

  /**
   * Filter vehicles by specific criteria
   */
  async filterVehicles(filters: VehicleFilters): Promise<void> {
    await this.loadVehicles(filters);
    await this.loadBuilderContent();
  }

  /**
   * Load specific page of vehicles
   */
  async loadPage(page: number, filters: VehicleFilters = {}): Promise<void> {
    await this.loadVehicles({ ...filters, page });
    await this.loadBuilderContent();
  }
}

// Export singleton instance
export const builderWooCommerceService = new BuilderWooCommerceService();

/**
 * React hook for using the integration service
 */
export function useBuilderWooCommerce() {
  const [state, setState] = React.useState<IntegrationState>(
    builderWooCommerceService.getState(),
  );

  React.useEffect(() => {
    const unsubscribe = builderWooCommerceService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    loadVehicles: (filters?: VehicleFilters) =>
      builderWooCommerceService.loadVehicles(filters),
    loadBuilderContent: (modelName?: string, options?: any) =>
      builderWooCommerceService.loadBuilderContent(modelName, options),
    initialize: (filters?: VehicleFilters, builderOptions?: any) =>
      builderWooCommerceService.initialize(filters, builderOptions),
    refresh: (filters?: VehicleFilters) =>
      builderWooCommerceService.refresh(filters),
    searchVehicles: (query: string, page?: number) =>
      builderWooCommerceService.searchVehicles(query, page),
    filterVehicles: (filters: VehicleFilters) =>
      builderWooCommerceService.filterVehicles(filters),
    loadPage: (page: number, filters?: VehicleFilters) =>
      builderWooCommerceService.loadPage(page, filters),
  };
}

// Helper function to get vehicle data for Builder.io repeater
export function getVehiclesForBuilder(): any[] {
  return builderWooCommerceService.getState().vehicles;
}

// Helper function to check if integration is ready
export function isIntegrationReady(): boolean {
  const state = builderWooCommerceService.getState();
  return (
    !state.loading &&
    !state.error &&
    state.vehicles.length > 0 &&
    state.builderContent
  );
}
