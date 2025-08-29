# WordPress Sync Setup

This document explains how to keep your WordPress seller data synchronized with the optimized location-based search system.

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
