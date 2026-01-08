import BaseEntity, { EntityDefinition } from './baseEntity.js'

export class NumberEntity extends BaseEntity {
  min?: number
  max?: number
  unit?: string

  constructor(
    def: EntityDefinition,
    min?: number,
    max?: number,
    unit?: string
  ) {
    super({ ...def, type: 'number' })
    this.min = min
    this.max = max
    this.unit = unit
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      state_topic: this.state_topic,
      command_topic: this.command_topic,
      min: this.min,
      max: this.max,
      unit: this.unit,
    }
  }

  static fromJSON(json: EntityDefinition) {
    return new NumberEntity(json)
  }
}
