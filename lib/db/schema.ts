import { pgTable, serial, text, timestamp, boolean, uuid, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

export const osEnum = pgEnum("os", ["android", "ios"]);
export const roleEnum = pgEnum("role", ["admin", "user"]);

export const applications = pgTable("applications", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    bundleId: text("bundle_id").notNull(),
    os: osEnum("os").notNull(),
    description: text("description"),
    iconUrl: text("icon_url"),
    downloadCount: integer("download_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    uniqueApp: uniqueIndex("unique_app_bundle").on(table.bundleId, table.os),
}));

export const versions = pgTable("versions", {
    id: serial("id").primaryKey(),
    appId: integer("app_id").references(() => applications.id, { onDelete: 'cascade' }).notNull(),
    version: text("version").notNull(),
    buildNumber: text("build_number").notNull(),
    fileUrl: text("file_url").notNull(),
    size: text("size"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey().notNull(), // Supabase Auth ID
    name: text("name"),
    email: text("email"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
    id: serial("id").primaryKey(),
    appId: integer("app_id").references(() => applications.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    adminReply: text("admin_reply"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    uniqueReview: uniqueIndex("unique_review").on(table.appId, table.userId),
}));

export const downloads = pgTable("downloads", {
    id: serial("id").primaryKey(),
    appId: integer("app_id").references(() => applications.id, { onDelete: 'cascade' }).notNull(),
    guestId: text("guest_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    uniqueDownload: uniqueIndex("unique_download_guest").on(table.appId, table.guestId),
}));

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").default('user').notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
    token: text("token").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
