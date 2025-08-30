/**
 * Builder.io SDK Configuration
 * Connects Builder.io visual models with WooCommerce vehicle data
 */

import { builder } from '@builder.io/sdk';

// Initialize Builder.io with your API key
// You'll need to set VITE_BUILDER_API_KEY in your environment variables
const BUILDER_API_KEY = import.meta.env.VITE_BUILDER_API_KEY;

if (!BUILDER_API_KEY) {
  console.warn('⚠️ VITE_BUILDER_API_KEY not found. Builder.io integration will not work.');
} else {
  builder.init(BUILDER_API_KEY);
  console.log('✅ Builder.io SDK initialized');
}

// Builder.io model names - these should match your Builder.io space
export const BUILDER_MODELS = {
  VEHICLE_INVENTORY: 'vehicle-inventory-page', // Your Builder.io model name
  VEHICLE_CARD: 'vehicle-card-component',      // Optional: if you have a card component model
} as const;

/**
 * Fetch Builder.io content with vehicle data injection
 */
export async function getBuilderContent(
  modelName: string,
  vehicleData: any[] = [],
  options: {
    userAttributes?: Record<string, any>;
    url?: string;
  } = {}
) {
  try {
    const content = await builder
      .get(modelName, {
        userAttributes: {
          // Inject vehicle data into Builder.io context
          vehicles: vehicleData,
          vehicleCount: vehicleData.length,
          ...options.userAttributes,
        },
        url: options.url || '/',
      })
      .toPromise();

    return content;
  } catch (error) {
    console.error(`Failed to fetch Builder.io content for model "${modelName}":`, error);
    return null;
  }
}

/**
 * Transform WooCommerce vehicle data for Builder.io
 */
export function transformVehiclesForBuilder(vehicles: any[]) {
  return vehicles.map(vehicle => ({
    id: vehicle.id,
    title: vehicle.title,
    price: vehicle.price,
    formattedPrice: vehicle.formattedPrice || `$${vehicle.price?.toLocaleString()}`,
    payment: vehicle.payment,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    mileage: vehicle.mileage,
    formattedMileage: vehicle.formattedMileage || `${vehicle.mileage?.toLocaleString()} mi`,
    transmission: vehicle.transmission,
    doors: vehicle.doors,
    fuelType: vehicle.fuel_type,
    drivetrain: vehicle.drivetrain,
    bodyStyle: vehicle.body_style,
    exteriorColor: vehicle.exterior_color,
    interiorColor: vehicle.interior_color,
    condition: vehicle.condition,
    certified: vehicle.certified,
    images: vehicle.images || [],
    primaryImage: vehicle.images?.[0] || '/placeholder-vehicle.jpg',
    dealer: vehicle.dealer,
    location: vehicle.location,
    sellerType: vehicle.seller_type || 'Dealer',
    features: vehicle.features || [],
    // Add any custom fields your Builder.io models expect
    builderUrl: `/vehicles/${vehicle.id}`, // For linking to detail pages
  }));
}

export { builder };
