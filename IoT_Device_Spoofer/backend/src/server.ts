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
  console.log('🚀 Starting IoT Device Spoofer...')

  // Try to connect to MQTT, but don't crash if unavailable; mqtt.js will reconnect
  try {
    await initializeMqtt(mqttConfig)
  } catch (err) {
    console.error('✗ MQTT connection error:', (err as Error)?.message || err)
    console.error('↻ Will keep trying to reconnect in the background...')
  }

  // Start HTTP server regardless of initial MQTT connectivity
  app.listen(8080, () => {
    console.log('✓ Backend running on port 8080')
  })

  // Attempt to publish discovery when MQTT becomes available
  const devices = getDevices()
  if (devices.length === 0) return

  let published = false
  const tryPublish = async () => {
    if (published) return
    const mqttClient = getMqttClient()
    if (!mqttClient) return
    try {
      console.log(
        `📡 Attempting discovery publish for ${devices.length} device(s)...`
      )
      for (const device of devices) {
        await mqttClient.publishDiscovery(device)
      }
      console.log('✓ Discovery published')
      published = true
      clearInterval(timer)
    } catch {
      // Likely not connected yet; keep trying
    }
  }

  const timer = setInterval(tryPublish, 5000)
  // Also try immediately once
  void tryPublish()
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
