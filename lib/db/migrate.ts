
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';

export async function runMigrations() {
    console.log('⏳ Running database migrations...');
    try {
        // This will automatically run needed migrations on the database
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        // Don't throw - we might want the app to start anyway if it's just a lock issue
        // But for schema mismatches it will crash later
    }
}
