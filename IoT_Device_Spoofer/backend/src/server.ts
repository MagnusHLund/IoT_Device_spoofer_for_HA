import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  DeviceDefinition,
} from './storage/deviceStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// Serve React build
app.use(express.static(path.join(__dirname, '../frontend')))

app.get('/api/devices', (req, res) => {
  res.json(getDevices())
})

app.post('/api/devices', (req, res) => {
  const device = req.body as DeviceDefinition
  addDevice(device)
  res.json({ success: true })
})

app.put('/api/devices/:id', (req, res) => {
  const ok = updateDevice(req.params.id, req.body)
  res.json({ success: ok })
})

app.delete('/api/devices/:id', (req, res) => {
  deleteDevice(req.params.id)
  res.json({ success: true })
})

// Ingress fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'))
})

app.listen(8080, () => console.log('Backend running on port 8080'))
