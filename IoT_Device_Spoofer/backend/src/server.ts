import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { deviceRouter } from './routes/devices.js'
import { entityRouter } from './routes/entities.js'
import {
  initializeMqtt,
  getMqttClient,
  shutdownMqtt,
} from './mqtt/mqttClient.js'
import { getDevices } from './storage/deviceStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// Serve React build
app.use(express.static(path.join(__dirname, '../frontend')))

// API routes
app.use('/api/devices', deviceRouter)
app.use('/api/entities', entityRouter)

// Ingress fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'))
})

// Try to read Home Assistant add-on options from /data/options.json
function readAddonOptions(): {
  mqtt_host?: string
  mqtt_port?: number
  mqtt_username?: string
  mqtt_password?: string
} | null {
  try {
    const optionsPath = '/data/options.json'
    if (fs.existsSync(optionsPath)) {
      const raw = fs.readFileSync(optionsPath, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {
    // ignore and fall back to env/defaults
  }
  return null
}

const addonOptions = readAddonOptions()

// MQTT configuration from add-on options, environment, or defaults
const mqttConfig = {
  host: process.env.MQTT_HOST || addonOptions?.mqtt_host || 'localhost',
  port: parseInt(
    process.env.MQTT_PORT || String(addonOptions?.mqtt_port ?? 1883),
    10
  ),
  username: process.env.MQTT_USERNAME ?? addonOptions?.mqtt_username,
  password: process.env.MQTT_PASSWORD ?? addonOptions?.mqtt_password,
}

// Initialize MQTT and publish discovery for existing devices
async function startServer() {
  try {
    console.log('🚀 Starting IoT Device Spoofer...')

    // Connect to MQTT broker
    await initializeMqtt(mqttConfig)

    // Publish discovery for all existing devices
    const devices = getDevices()
    const mqttClient = getMqttClient()

    if (mqttClient && devices.length > 0) {
      console.log(
        `📡 Publishing discovery for ${devices.length} existing device(s)...`
      )
      for (const device of devices) {
        await mqttClient.publishDiscovery(device)
      }
    }

    // Start HTTP server
    app.listen(8080, () => {
      console.log('✓ Backend running on port 8080')
    })
  } catch (err) {
    console.error('✗ Failed to start server:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  await shutdownMqtt()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  await shutdownMqtt()
  process.exit(0)
})

startServer()
