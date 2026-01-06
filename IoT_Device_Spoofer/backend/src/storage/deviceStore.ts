import fs from 'fs'
import path from 'path'
import BaseEntity, { EntityDefinition } from '../entities/baseEntity'

const DATA_DIR = '/data'
const FILE_PATH = path.join(DATA_DIR, 'devices.json')

export interface DeviceDefinition {
  id: string
  name: string
  manufacturer: string
  entities: EntityDefinition[]
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2))
  }
}

export function getDevices(): DeviceDefinition[] {
  ensureDataFile()
  const raw = fs.readFileSync(FILE_PATH, 'utf-8')
  return JSON.parse(raw)
}

export function saveDevices(devices: DeviceDefinition[]) {
  ensureDataFile()

  // Atomic write: write to temp file, then replace
  const tmpPath = FILE_PATH + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(devices, null, 2))
  fs.renameSync(tmpPath, FILE_PATH)
}

export function addDevice(device: DeviceDefinition) {
  const devices = getDevices()
  devices.push(device)
  saveDevices(devices)
}

export function updateDevice(id: string, updated: Partial<DeviceDefinition>) {
  const devices = getDevices()
  const index = devices.findIndex((d) => d.id === id)
  if (index === -1) return false

  devices[index] = { ...devices[index], ...updated }
  saveDevices(devices)
  return true
}

export function deleteDevice(id: string) {
  const devices = getDevices()
  const filtered = devices.filter((d) => d.id !== id)
  saveDevices(filtered)
}
