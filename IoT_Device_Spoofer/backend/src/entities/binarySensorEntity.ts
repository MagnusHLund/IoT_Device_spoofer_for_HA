import BaseEntity, { EntityDefinition } from './baseEntity'

export class BinarySensorEntity extends BaseEntity {
  unit?: string
  device_class?: string

  constructor(def: EntityDefinition, unit?: string, device_class?: string) {
    super({ ...def, type: 'binary_sensor' })
    this.unit = unit
    this.device_class = device_class
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      state_topic: this.state_topic,
      unit: this.unit,
      device_class: this.device_class,
    }
  }

  static fromJSON(json: EntityDefinition) {
    return new BinarySensorEntity(json)
  }
}
