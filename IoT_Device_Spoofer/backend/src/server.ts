import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  DeviceDefinition,
  NewDeviceInput,
  DeviceUpdateInput,
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
  const payload = req.body as Partial<NewDeviceInput>

  if (!payload?.name) {
    return res.status(400).json({ success: false, message: 'name is required' })
  }

  const created = addDevice({
    name: payload.name,
    manufacturer: payload.manufacturer, // optional; defaulted in store
    entities: payload.entities ?? [],
  })

  res.status(201).json(created)
})

app.put('/api/devices/:id', (req, res) => {
  const payload = req.body as DeviceUpdateInput
  const updated = updateDevice(req.params.id, payload)
  if (!updated) {
    return res.status(404).json({ success: false, message: 'device not found' })
  }
  res.json(updated)
})

app.delete('/api/devices/:id', (req, res) => {
  const deleted = deleteDevice(req.params.id)
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'device not found' })
  }
  res.json({ success: true })
})

// Ingress fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'))
})

app.listen(8080, () => console.log('Backend running on port 8080'))
