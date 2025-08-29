# WordPress Sync Setup

This document explains how to keep your WordPress seller data synchronized with the optimized location-based search system.

## Prerequisites ⚠️

Before running the sync system, you must complete these setup steps:

### 1. Database Configuration
The system needs access to both your **WordPress database** and **optimized MySQL database**:

```bash
# Set up database connection in environment variables
# Add these to your .env file or server environment:

# MySQL Database (for optimized structure)
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name

# WordPress Database (for sync source)
WP_DB_HOST=your-wordpress-mysql-host
WP_DB_USER=your-wordpress-mysql-user
WP_DB_PASSWORD=your-wordpress-mysql-password
WP_DB_NAME=your-wordpress-database-name
```

### 2. WordPress Database Access
The sync system needs **READ access** to your WordPress database tables:
- `wp_posts` (for SellersAccount and vehicle posts)
- `wp_postmeta` (for custom field data)

### 3. Required WordPress Meta Fields
Your WordPress setup must have these custom fields configured:
- `seller_account_numb` (on vehicle products)
- `account_number_seller` (on SellersAccount posts)
- `car_location_latitude` (on SellersAccount posts)
- `car_location_longitude` (on SellersAccount posts)
- `phone_seller`, `email_seller`, `city_seller`, `state_seller`, `zip_seller`

### 4. Database Connection Test
Verify your database connections work:
```bash
# Check sync status endpoint
curl http://localhost:8080/api/wordpress/sync-status

# Check database health
curl http://localhost:8080/api/health
```

## Workflow Overview

1. **Continue using WordPress** as normal for adding new sellers and vehicles
2. **Automated sync** keeps the optimized system updated every hour
3. **Fast location searches** work with up-to-date data

## Setup Process

### 1. Initial Migration (One Time)
Run this once to migrate all existing WordPress data:
```bash
npm run migrate:wordpress
```

### 2. Ongoing Sync (Automated)
This keeps new WordPress entries synchronized:
```bash
npm run sync:wordpress
```

## Automation Options

### Option A: Cron Job (Linux/Mac Server)
Add to your server's crontab to run sync every hour:
```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * cd /path/to/your/project && npm run sync:wordpress >> /var/log/wordpress-sync.log 2>&1
```

### Option B: PM2 Scheduler (Node.js)
Use PM2 to manage the sync process:
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 cron job
pm2 start npm --name "wordpress-sync" --cron "0 * * * *" -- run sync:wordpress
```

### Option C: Node.js Scheduler (Built-in)
Add to your main server to run sync automatically:

```javascript
// In your server/index.ts or similar
import { WordPressSync } from './scripts/syncWordPressUpdates';

const sync = new WordPressSync();

// Run sync every hour
setInterval(async () => {
  try {
    console.log('🔄 Running scheduled WordPress sync...');
    await sync.runSync();
  } catch (error) {
    console.error('❌ Scheduled sync failed:', error);
  }
}, 60 * 60 * 1000); // 1 hour in milliseconds
```

## Manual Sync
Run sync manually anytime:
```bash
npm run sync:wordpress
```

## How It Works

### Data Privacy
- Seller account numbers are stored in the database for relationships
- **Never exposed** in public API responses
- Only used internally for data synchronization

### Performance
- Location queries run on optimized MySQL structure (10-100x faster)
- WordPress continues to work normally for data entry
- Sync process is incremental (only new/changed data)

### Seller Relationships
1. New sellers added in WordPress are automatically synced
2. Their lat/lng coordinates are denormalized to vehicle records
3. Fast radius queries work immediately after sync

## Monitoring
Check sync logs to ensure it's working:
```bash
# If using cron
tail -f /var/log/wordpress-sync.log

# If using PM2
pm2 logs wordpress-sync
```

## Troubleshooting

### Sync Not Running
1. Check database connection
2. Verify WordPress table access
3. Check log files for errors

### Missing New Vehicles
1. Verify seller account numbers match in WordPress
2. Run manual sync: `npm run sync:wordpress`
3. Check that vehicle meta field `seller_account_numb` is populated

### Performance Issues
1. Monitor sync frequency (hourly is usually sufficient)
2. Check database indexes are created
3. Verify coordinate geocoding is working

## Benefits

✅ **Keep WordPress workflow** - no disruption to data entry  
✅ **10-100x faster searches** - optimized location queries  
✅ **Automatic updates** - new sellers appear in search  
✅ **Data privacy** - seller accounts remain hidden  
✅ **Zero downtime** - sync runs in background  
