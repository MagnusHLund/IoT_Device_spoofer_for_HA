import mqtt from 'mqtt'
import { DeviceDefinition } from '../storage/deviceStore.js'
import { EntityDefinition } from '../entities/baseEntity.js'

interface MqttConfig {
  host: string
  port: number
  username?: string
  password?: string
}

class MqttClient {
  private client: mqtt.MqttClient | null = null
  private config: MqttConfig
  private discoveryPrefix = 'homeassistant'

  constructor(config: MqttConfig) {
    this.config = config
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
        resolve()
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

    const discoveryPayload = {
      name: `${device.name} ${entity.id}`,
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
