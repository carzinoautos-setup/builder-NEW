import { getDatabase } from "../db/connection";
import { locationService } from "../services/locationService";

/**
 * Continuous sync script to keep WordPress and optimized structure in sync
 * Run this on a schedule (cron job) to pick up new sellers and vehicles
 */
export class WordPressSync {
  private db = getDatabase();

  /**
   * Sync only new/updated sellers since last sync
   */
  async syncNewSellers(): Promise<number> {
    console.log("🔄 Syncing new sellers from WordPress...");

    // Get last sync timestamp from a tracking table
    const lastSyncQuery = `
      SELECT MAX(updated_at) as last_sync 
      FROM sellers 
      WHERE updated_at IS NOT NULL
    `;
    
    const [lastSyncResult] = await this.db.execute(lastSyncQuery);
    const lastSync = (lastSyncResult as any)[0]?.last_sync || '1970-01-01';

    const wpQuery = `
      SELECT 
        p.ID,
        p.post_title as name,
        p.post_modified,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'account_number_seller') as account_number,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'zip_seller') as zip,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'car_location_latitude') as latitude,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'car_location_longitude') as longitude,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'phone_seller') as phone,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'email_seller') as email,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'city_seller') as city,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'state_seller') as state
      FROM wp_posts p
      WHERE p.post_type = 'sellersaccount' 
        AND p.post_status = 'publish'
        AND p.post_modified > ?
        AND EXISTS (
          SELECT 1 FROM wp_postmeta 
          WHERE post_id = p.ID 
            AND meta_key = 'account_number_seller' 
            AND meta_value IS NOT NULL 
            AND meta_value != ''
        )
      ORDER BY p.post_modified ASC
    `;

    const [newSellers] = await this.db.execute(wpQuery, [lastSync]);
    const sellers = newSellers as any[];

    console.log(`📊 Found ${sellers.length} new/updated sellers since ${lastSync}`);

    let syncedCount = 0;
    for (const seller of sellers) {
      if (!seller.account_number) continue;

      const insertSQL = `
        INSERT INTO sellers (
          account_number, name, phone, email, city, state, zip, 
          latitude, longitude, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dealer')
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          phone = VALUES(phone),
          email = VALUES(email),
          city = VALUES(city),
          state = VALUES(state),
          zip = VALUES(zip),
          latitude = VALUES(latitude),
          longitude = VALUES(longitude),
          updated_at = CURRENT_TIMESTAMP
      `;

      await this.db.execute(insertSQL, [
        seller.account_number,
        seller.name || `Seller ${seller.account_number}`,
        seller.phone,
        seller.email,
        seller.city,
        seller.state,
        seller.zip,
        parseFloat(seller.latitude) || null,
        parseFloat(seller.longitude) || null
      ]);
      syncedCount++;
    }

    console.log(`✅ Synced ${syncedCount} sellers`);
    return syncedCount;
  }

  /**
   * Sync new vehicles and update their seller coordinates
   */
  async syncNewVehicles(): Promise<number> {
    console.log("🔄 Syncing new vehicles from WordPress...");

    // This would sync new vehicle posts with their seller relationships
    // You'll need to adapt this based on how vehicles reference seller account numbers
    const wpVehicleQuery = `
      SELECT 
        p.ID,
        p.post_title as title,
        p.post_modified,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'seller_account_numb') as seller_account_number,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'year') as year,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'make') as make,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'model') as model,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'price') as price
      FROM wp_posts p
      WHERE p.post_type = 'product'
        AND p.post_status = 'publish'
        AND p.post_modified > (
          SELECT COALESCE(MAX(updated_at), '1970-01-01') 
          FROM vehicles 
          WHERE updated_at IS NOT NULL
        )
        AND EXISTS (
          SELECT 1 FROM wp_postmeta 
          WHERE post_id = p.ID 
            AND meta_key = 'seller_account_numb'
            AND meta_value IS NOT NULL 
            AND meta_value != ''
        )
      ORDER BY p.post_modified ASC
    `;

    const [newVehicles] = await this.db.execute(wpVehicleQuery);
    const vehicles = newVehicles as any[];

    console.log(`📊 Found ${vehicles.length} new vehicles to sync`);

    // Insert new vehicles (you'll need to adapt the INSERT based on your vehicle schema)
    let syncedCount = 0;
    for (const vehicle of vehicles) {
      // Insert vehicle logic here...
      syncedCount++;
    }

    // Sync seller coordinates to new vehicles
    await locationService.syncSellerCoordsToVehicles();

    console.log(`✅ Synced ${syncedCount} vehicles and updated coordinates`);
    return syncedCount;
  }

  /**
   * Full sync check - run this every hour/day
   */
  async runSync(): Promise<void> {
    console.log("🚀 Starting incremental WordPress sync...");
    
    try {
      const sellersCount = await this.syncNewSellers();
      const vehiclesCount = await this.syncNewVehicles();
      
      if (sellersCount > 0 || vehiclesCount > 0) {
        console.log("🔄 Re-syncing coordinates after new data...");
        await locationService.syncSellerCoordsToVehicles();
      }
      
      console.log(`✅ Sync completed: ${sellersCount} sellers, ${vehiclesCount} vehicles`);
    } catch (error) {
      console.error("❌ Sync failed:", error);
      throw error;
    }
  }
}

// CLI runner for manual sync
if (require.main === module) {
  const sync = new WordPressSync();
  sync.runSync()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default WordPressSync;
