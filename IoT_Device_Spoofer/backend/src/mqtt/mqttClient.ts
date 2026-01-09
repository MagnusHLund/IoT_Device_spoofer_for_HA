import mqtt from 'mqtt'
import {
  DeviceDefinition,
  getDevices,
  updateDevice,
} from '../storage/deviceStore.js'
import { EntityDefinition } from '../entities/baseEntity.js'

interface MqttConfig {
  host: string
  port: number
  username?: string
  password?: string
}

interface CommandHandler {
  (deviceId: string, entityId: string, payload: string): Promise<void>
}

class MqttClient {
  private client: mqtt.MqttClient | null = null
  private config: MqttConfig
  private discoveryPrefix = 'homeassistant'
  private commandHandler: CommandHandler | null = null

  constructor(config: MqttConfig) {
    this.config = config
  }

  setCommandHandler(handler: CommandHandler) {
    this.commandHandler = handler
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `mqtt://${this.config.host}:${this.config.port}`

      this.client = mqtt.connect(url, {
        username: this.config.username,
        password: this.config.password,
        reconnectPeriod: 5000,
      })

      this.client.on('connect', () => {
        console.log('✓ Connected to MQTT broker')
        // Subscribe to command topics
        this.subscribeToCommands()
        resolve()
      })

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message.toString()).catch((err) => {
          console.error(`Error handling message on ${topic}:`, err)
        })
      })

      this.client.on('error', (err) => {
        console.error('✗ MQTT connection error:', err.message)
        reject(err)
      })

      this.client.on('offline', () => {
        console.warn('⚠ MQTT client offline')
      })

      this.client.on('reconnect', () => {
        console.log('↻ Reconnecting to MQTT broker...')
      })
    })
  }

  private subscribeToCommands(): void {
    if (!this.client?.connected) return

    try {
      const devices = getDevices()
      for (const device of devices) {
        for (const entity of device.entities) {
          const commandTopic = `iot_spoofer/${device.id}/${entity.id}/set`
          this.client.subscribe(commandTopic, (err) => {
            if (err) {
              console.error(`Failed to subscribe to ${commandTopic}:`, err)
            } else {
              console.log(`✓ Subscribed to command topic: ${commandTopic}`)
            }
          })
        }
      }
    } catch (err) {
      console.error('Failed to subscribe to command topics:', err)
    }
  }

  private async handleMessage(topic: string, payload: string): Promise<void> {
    console.log(`📥 Received message on ${topic}: ${payload}`)

    // Parse topic: iot_spoofer/<device_id>/<entity_id>/set
    const parts = topic.split('/')
    if (
      parts.length === 4 &&
      parts[0] === 'iot_spoofer' &&
      parts[3] === 'set'
    ) {
      const deviceId = parts[1]
      const entityId = parts[2]

      try {
        console.log(
          `⚙️  Processing command for device ${deviceId}, entity ${entityId}`
        )

        // Call the command handler if set
        if (this.commandHandler) {
          await this.commandHandler(deviceId, entityId, payload)
        }

        // Publish the new state back
        // Normalize payload for state topic based on entity type
        const stateValue = this.normalizeStatePayload(payload)
        const stateTopic = `iot_spoofer/${deviceId}/${entityId}/state`
        await this.publish(stateTopic, stateValue, true)
        console.log(`📤 Published state to ${stateTopic}: ${stateValue}`)
      } catch (err) {
        console.error(`Failed to handle command on ${topic}:`, err)
      }
    } else {
      console.log(`⚠️  Ignoring message on unknown topic: ${topic}`)
    }
  }

  private normalizeStatePayload(payload: string): string {
    // Normalize common payload values
    const normalized = payload.toLowerCase().trim()

    // Map common variations to standard Home Assistant values
    const mapping: Record<string, string> = {
      on: 'On',
      '1': 'On',
      true: 'On',
      off: 'Off',
      '0': 'Off',
      false: 'Off',
      lock: 'Lock',
      locked: 'Lock',
      unlock: 'Unlock',
      unlocked: 'Unlock',
    }

    return mapping[normalized] || payload
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(false, {}, () => {
          console.log('✓ Disconnected from MQTT broker')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  private publish(
    topic: string,
    payload: string,
    retain = true
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client?.connected) {
        reject(new Error('MQTT client not connected'))
        return
      }

      this.client.publish(topic, payload, { retain, qos: 1 }, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async publishDiscovery(device: DeviceDefinition): Promise<void> {
    if (!this.client?.connected) {
      console.warn('⚠ Cannot publish discovery: MQTT not connected')
      return
    }

    console.log(`📡 Publishing discovery for device: ${device.name}`)

    for (const entity of device.entities) {
      await this.publishEntityDiscovery(device, entity)
    }
  }

  private async publishEntityDiscovery(
    device: DeviceDefinition,
    entity: EntityDefinition
  ): Promise<void> {
    const component = this.mapEntityTypeToComponent(entity.type)
    const objectId = `${device.id}_${entity.id}`
    const uniqueId = `iot_spoofer_${objectId}`

    // Home Assistant MQTT discovery topic format:
    // <discovery_prefix>/<component>/[<node_id>/]<object_id>/config
    const configTopic = `${this.discoveryPrefix}/${component}/${objectId}/config`

    const basePayload = {
      name: `${entity.name}`,
      unique_id: uniqueId,
      state_topic: `iot_spoofer/${device.id}/${entity.id}/state`,
      command_topic: `iot_spoofer/${device.id}/${entity.id}/set`,
      device: {
        identifiers: [device.id],
        name: device.name,
        manufacturer: device.manufacturer,
        model: 'IoT Device Spoofer',
        via_device: 'iot_device_spoofer',
      },
      availability: {
        topic: `iot_spoofer/${device.id}/availability`,
        payload_available: 'online',
        payload_not_available: 'offline',
      },
    }

    // Add entity-type-specific configuration
    const discoveryPayload = this.buildEntitySpecificPayload(
      basePayload,
      entity,
      component
    )

    try {
      await this.publish(configTopic, JSON.stringify(discoveryPayload), true)

      // Mark device as available
      await this.publish(
        `iot_spoofer/${device.id}/availability`,
        'online',
        true
      )

      console.log(`  ✓ Published ${component} entity: ${entity.id}`)
    } catch (err) {
      console.error(`  ✗ Failed to publish entity ${entity.id}:`, err)
    }
  }

  private buildEntitySpecificPayload(
    basePayload: Record<string, unknown>,
    entity: EntityDefinition,
    component: string
  ): Record<string, unknown> {
    const payload = { ...basePayload }

    switch (component) {
      case 'switch':
      case 'light':
        // For switches and lights, use payload_on/payload_off
        payload.payload_on = 'On'
        payload.payload_off = 'Off'
        break

      case 'lock':
        // For locks, use lock/unlock payloads
        payload.payload_lock = 'Lock'
        payload.payload_unlock = 'Unlock'
        break

      case 'number':
        // For numbers, ensure numeric state values
        payload.min = 0
        payload.max = 100
        break

      case 'binary_sensor':
        // For binary sensors, use payload_on/payload_off
        payload.payload_on = 'on'
        payload.payload_off = 'off'
        break

      case 'sensor':
      default:
        // Sensors work with any string value
        break
    }

    return payload
  }

  async removeDiscovery(device: DeviceDefinition): Promise<void> {
    if (!this.client?.connected) {
      console.warn('⚠ Cannot remove discovery: MQTT not connected')
      return
    }

    console.log(`🗑️  Removing discovery for device: ${device.name}`)

    for (const entity of device.entities) {
      await this.removeEntityDiscovery(device, entity)
    }

    // Mark device as unavailable
    await this.publish(`iot_spoofer/${device.id}/availability`, 'offline', true)
  }

  private async removeEntityDiscovery(
    device: DeviceDefinition,
    entity: EntityDefinition
  ): Promise<void> {
    const component = this.mapEntityTypeToComponent(entity.type)
    const objectId = `${device.id}_${entity.id}`
    const configTopic = `${this.discoveryPrefix}/${component}/${objectId}/config`

    try {
      // Send empty payload to remove the entity
      await this.publish(configTopic, '', true)
      console.log(`  ✓ Removed ${component} entity: ${entity.id}`)
    } catch (err) {
      console.error(`  ✗ Failed to remove entity ${entity.id}:`, err)
    }
  }

  private mapEntityTypeToComponent(entityType: string): string {
    // Map entity types to Home Assistant components
    const mapping: Record<string, string> = {
      binary_sensor: 'binary_sensor',
      sensor: 'sensor',
      light: 'light',
      switch: 'switch',
      lock: 'lock',
      number: 'number',
    }

    return mapping[entityType] || 'sensor'
  }

  async publishState(
    deviceId: string,
    entityId: string,
    state: string
  ): Promise<void> {
    const stateTopic = `iot_spoofer/${deviceId}/${entityId}/state`
    await this.publish(stateTopic, state, true)
    console.log(`📤 Published state to ${stateTopic}: ${state}`)
  }
}

// Singleton instance
let mqttClientInstance: MqttClient | null = null

export function initializeMqtt(config: MqttConfig): Promise<void> {
  mqttClientInstance = new MqttClient(config)
  return mqttClientInstance.connect()
}

export function getMqttClient(): MqttClient | null {
  return mqttClientInstance
}

export async function shutdownMqtt(): Promise<void> {
  if (mqttClientInstance) {
    await mqttClientInstance.disconnect()
    mqttClientInstance = null
  }
}
