import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

let isConnecting = false
let isConnected = false

export async function connectMongo() {
  if (process.env.NODE_ENV === 'test') {
    // Strictly isolate tests from production cloud database to guarantee zero data contamination
    return null
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('[MongoDB] No MONGODB_URI found in environment. Skipping MongoDB connection.')
    return null
  }

  if (isConnecting) {
    return new Promise((resolve) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection))
      mongoose.connection.once('error', () => resolve(null))
    })
  }

  isConnecting = true

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })

    isConnected = true
    isConnecting = false
    console.log('[MongoDB Atlas] Connected successfully to cluster database:', mongoose.connection.name)

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]', err.message)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Disconnected] Attempting reconnect...')
      isConnected = false
    })

    return mongoose.connection
  } catch (err) {
    isConnecting = false
    isConnected = false
    console.error('[MongoDB Connection Failed]', err.message)
    return null
  }
}

export function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1
}

export async function disconnectMongo() {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    isConnected = false
    isConnecting = false
  }
}
