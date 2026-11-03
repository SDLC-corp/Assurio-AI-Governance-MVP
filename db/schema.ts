import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', { id: text('id').primaryKey(), kind: text('kind').notNull(), data: text('data').notNull(), revision: integer('revision').notNull().default(1), updated: text('updated').notNull() });
export const audit = sqliteTable('audit', { id: text('id').primaryKey(), actor: text('actor').notNull(), action: text('action').notNull(), target: text('target').notNull(), detail: text('detail').notNull(), at: text('at').notNull() });
