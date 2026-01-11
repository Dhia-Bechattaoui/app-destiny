
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { runMigrations } = await import('./lib/db/migrate');
        await runMigrations();

        const { ensureAdminUser } = await import('./lib/auth/local');
        await ensureAdminUser();
    }
}
