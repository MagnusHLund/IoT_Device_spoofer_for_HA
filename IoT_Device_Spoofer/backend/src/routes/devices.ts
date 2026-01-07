import { Router } from 'express'
import {
  getDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  NewDeviceInput,
  DeviceUpdateInput,
} from '../storage/deviceStore.js'

export const deviceRouter = Router()

deviceRouter.get('/', (req, res) => {
  res.json(getDevices())
})

deviceRouter.post('/', (req, res) => {
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

deviceRouter.put('/:id', (req, res) => {
  const payload = req.body as DeviceUpdateInput
  const updated = updateDevice(req.params.id, payload)
  if (!updated) {
    return res.status(404).json({ success: false, message: 'device not found' })
  }
  res.json(updated)
})

deviceRouter.delete('/:id', (req, res) => {
  const deleted = deleteDevice(req.params.id)
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'device not found' })
  }
  res.json({ success: true })
})
