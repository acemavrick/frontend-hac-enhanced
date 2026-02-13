import { integer, sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// helper for UUID PKs
const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const timestamp = (name: string) => integer(name, { mode: 'timestamp' });

// ------------------------------------------------------------------
// users
// ------------------------------------------------------------------
export const users = sqliteTable('users', {
	id: id(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	hacUsername: text('hac_username'),
	hacPasswordEncrypted: text('hac_password_encrypted'),
	hacPasswordIv: text('hac_password_iv'),
	createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
	updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date())
});

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	scrapeOrders: many(scrapeOrders),
	attendanceRecords: many(attendanceRecords)
}));

// ------------------------------------------------------------------
// master password — single-row table for account recovery
// ------------------------------------------------------------------
export const masterPassword = sqliteTable('master_password', {
	id: integer('id').primaryKey().default(1),
	hash: text('hash').notNull(),
	createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date())
});

// ------------------------------------------------------------------
// sessions
// ------------------------------------------------------------------
export const sessions = sqliteTable('sessions', {
	id: id(),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date())
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

// ------------------------------------------------------------------
// scrape orders
// ------------------------------------------------------------------
export const scrapeOrders = sqliteTable('scrape_orders', {
	id: id(),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	scraperUid: text('scraper_uid').notNull(),
	tasks: text('tasks').notNull(), // JSON array, e.g. ["attendance"]
	status: text('status').notNull().default('pending'),
	progress: real('progress').notNull().default(0),
	error: text('error'),
	rawResponse: text('raw_response'),
	createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date()),
	completedAt: timestamp('completed_at')
}, (table) => [
	index('scrape_orders_user_idx').on(table.userId),
	index('scrape_orders_status_idx').on(table.status)
]);

export const scrapeOrdersRelations = relations(scrapeOrders, ({ one, many }) => ({
	user: one(users, { fields: [scrapeOrders.userId], references: [users.id] }),
	attendanceRecords: many(attendanceRecords)
}));

// ------------------------------------------------------------------
// attendance records — one row per day (normalized from scraper JSON)
// ------------------------------------------------------------------
export const attendanceRecords = sqliteTable('attendance_records', {
	id: id(),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	orderId: text('order_id').notNull().references(() => scrapeOrders.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // ISO "2026-01-15"
	year: integer('year').notNull(),
	month: integer('month').notNull(),
	day: integer('day').notNull(),
	rawStatus: text('raw_status').notNull(),
	category: text('category').notNull(), // "present" | "absent" | "tardy" | "other"
	period: text('period'),
	time: text('time'),
	createdAt: timestamp('created_at').notNull().$defaultFn(() => new Date())
}, (table) => [
	index('attendance_user_idx').on(table.userId),
	index('attendance_date_idx').on(table.date),
	index('attendance_order_idx').on(table.orderId),
	index('attendance_range_idx').on(table.year, table.month)
]);

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
	user: one(users, { fields: [attendanceRecords.userId], references: [users.id] }),
	order: one(scrapeOrders, { fields: [attendanceRecords.orderId], references: [scrapeOrders.id] })
}));
