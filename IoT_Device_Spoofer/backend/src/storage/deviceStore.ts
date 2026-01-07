import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { EntityDefinition } from '../entities/baseEntity.js'

const DATA_DIR = '/data'
const FILE_PATH = path.join(DATA_DIR, 'devices.json')

export interface DeviceDefinition {
  id: string
  name: string
  manufacturer: string
  entities: EntityDefinition[]
}

export interface NewDeviceInput {
  name: string
  manufacturer?: string
  entities?: EntityDefinition[]
}

export interface DeviceUpdateInput {
  name?: string
  manufacturer?: string
  entities?: EntityDefinition[]
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

export function addDevice(input: NewDeviceInput): DeviceDefinition {
  const devices = getDevices()
  const device: DeviceDefinition = {
    id: randomUUID(),
    name: input.name,
    manufacturer: input.manufacturer ?? 'IoT Device Spoofer',
    entities: (input.entities ?? []).map((e) => ({
      ...e,
      id: e.id ?? randomUUID(),
    })),
  }

  devices.push(device)
  saveDevices(devices)
  return device
}

export function updateDevice(
  id: string,
  updated: DeviceUpdateInput
): DeviceDefinition | null {
  const devices = getDevices()
  const index = devices.findIndex((d) => d.id === id)
  if (index === -1) return null

  const nextEntities = updated.entities
    ? updated.entities.map((e) => ({ ...e, id: e.id ?? randomUUID() }))
    : devices[index].entities

  devices[index] = {
    ...devices[index],
    // ignore manufacturer field updates; always keep default
    name: updated.name ?? devices[index].name,
    entities: nextEntities,
  }
  saveDevices(devices)
  return devices[index]
}

export function deleteDevice(id: string) {
  const devices = getDevices()
  const filtered = devices.filter((d) => d.id !== id)
  const changed = filtered.length !== devices.length
  saveDevices(filtered)
  return changed
}
