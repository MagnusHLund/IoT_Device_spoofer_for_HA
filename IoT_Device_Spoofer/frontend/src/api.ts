// Support Home Assistant ingress by prefixing with the ingress path when present.
// HA ingress pages render under /api/hassio_ingress/<token>/..., so we detect that prefix.
const ingressPrefix = (() => {
  if (typeof window === 'undefined') return ''
  const match = window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/)
  return match ? match[0] : ''
})()

const API_BASE = import.meta.env.VITE_API_BASE ?? `${ingressPrefix}/api`

export interface Entity {
  id: string;
  name: string;
  value: string;
  type: string;
}

export interface Device {
  id: string;
  name: string;
  manufacturer: string;
  entities: Entity[];
}

// Get all devices
export async function getDevices(): Promise<Device[]> {
  const response = await fetch(`${API_BASE}/devices`);
  if (!response.ok) throw new Error('Failed to fetch devices');
  return response.json();
}

// Add a new device
export async function addDevice(device: Omit<Device, 'id'>): Promise<Device> {
  const response = await fetch(`${API_BASE}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  });
  if (!response.ok) throw new Error('Failed to add device');
  return response.json();
}

// Update a device
export async function updateDevice(
  id: string,
  device: Partial<Device>
): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  });
  if (!response.ok) throw new Error('Failed to update device');
}

// Delete a device
export async function deleteDevice(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete device');
}
