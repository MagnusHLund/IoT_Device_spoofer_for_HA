// Support Home Assistant ingress by prefixing with the ingress path when present.
// HA ingress pages render under /api/hassio_ingress/<token>/..., so we detect that prefix.
const ingressPrefix = (() => {
  if (typeof window === 'undefined') return ''
  const match = window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/)
  return match ? match[0] : ''
})()

const API_BASE = import.meta.env.VITE_API_BASE ?? `${ingressPrefix}/api`

export interface Entity {
  id: string
  name: string
  value: string
  type: string
}

export interface Device {
  id: string
  name: string
  manufacturer: string
  entities: Entity[]
}

// Get all devices
export async function getDevices(): Promise<Device[]> {
  const response = await fetch(`${API_BASE}/devices`)
  if (!response.ok) throw new Error('Failed to fetch devices')
  return response.json()
}

// Add a new device
type AddDeviceInput = { name: string; entities?: Entity[] }

export async function addDevice(device: AddDeviceInput): Promise<Device> {
  const response = await fetch(`${API_BASE}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  })
  if (!response.ok) throw new Error('Failed to add device')
  return response.json()
}

// Update a device
export async function updateDevice(
  id: string,
  device: Partial<Device>
): Promise<Device> {
  const response = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  })

  if (!response.ok) {
    const detail = await safeErrorMessage(response)
    throw new Error(detail ?? 'Failed to update device')
  }

  return response.json()
}

async function safeErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = await response.json()
    if (typeof body?.message === 'string') return body.message
    return null
  } catch {
    return null
  }
}

// Delete a device
export async function deleteDevice(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete device')
}

let cachedEntityTypes: string[]

export async function getEntityTypes(): Promise<string[]> {
  if (cachedEntityTypes) {
    return cachedEntityTypes
  }
  const response = await fetch(`${API_BASE}/entities/types`)
  if (!response.ok) throw new Error('Failed to fetch entity types')
  cachedEntityTypes = await response.json()
  return cachedEntityTypes
}
