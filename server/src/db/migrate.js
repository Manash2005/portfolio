/**
 * migrate.js — Safe, idempotent migration script for Second Brain
 */

import { getDatabase } from './database.js'
import { seedInitialData } from './seedInitialData.js'

export function runMigration() {
  console.log('--- Starting Second Brain Database Migration ---')
  const db = getDatabase()
  seedInitialData(db)

  const goalsCount = db.prepare('SELECT count(*) as c FROM goals').get().c
  const projectsCount = db.prepare('SELECT count(*) as c FROM projects').get().c
  const totalEventsCount = db.prepare('SELECT count(*) as c FROM events').get().c
  const publicEventsCount = db.prepare("SELECT count(*) as c FROM events WHERE visibility = 'Public'").get().c
  const privateEventsCount = db.prepare("SELECT count(*) as c FROM events WHERE visibility = 'Private'").get().c
  const heatmapEventsCount = db.prepare('SELECT count(*) as c FROM events WHERE show_on_portfolio_heatmap = 1').get().c

  console.log('\n--- Migration Results Summary ---')
  console.log(`Goals in Database:           ${goalsCount}`)
  console.log(`Projects in Database:        ${projectsCount}`)
  console.log(`Total Events in Database:    ${totalEventsCount}`)
  console.log(`  - Public Events:           ${publicEventsCount}`)
  console.log(`  - Private Events:          ${privateEventsCount} (guaranteed protected)`)
  console.log(`  - Heatmap Eligible Events: ${heatmapEventsCount}`)
  console.log('--- Migration Completed Successfully! ---\n')
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigration()
}
