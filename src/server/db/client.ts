import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/server/env'
import * as schema from './schema'

declare global {
  // Réutilise la connexion entre les rechargements à chaud en développement.
  var __amicaleDb: ReturnType<typeof createDatabase> | undefined
}

function createDatabase() {
  const sql = postgres(env.DATABASE_URL, { max: 10, idle_timeout: 30 })
  return drizzle(sql, { schema, casing: 'snake_case' })
}

type RealDatabase = ReturnType<typeof createDatabase>

function getDatabase(): RealDatabase {
  globalThis.__amicaleDb ??= createDatabase()
  return globalThis.__amicaleDb
}

/** Connexion créée au premier usage (aucune connexion pendant le build). */
export const db: RealDatabase = new Proxy({} as RealDatabase, {
  get: (_target, key) => {
    const real = getDatabase()
    const value: unknown = Reflect.get(real, key)
    return typeof value === 'function' ? value.bind(real) : value
  },
})

export type Database = RealDatabase
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
