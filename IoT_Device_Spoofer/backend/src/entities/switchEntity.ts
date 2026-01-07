import BaseEntity, { EntityDefinition } from './baseEntity.js'

export class SwitchEntity extends BaseEntity {
  constructor(def: EntityDefinition) {
    super({ ...def, type: 'switch' })
  }

  toJSON() {
    return {
      id: this.id,
      type: 'switch',
      state_topic: this.state_topic,
      command_topic: this.command_topic,
    }
  }

  static fromJSON(json: EntityDefinition) {
    return new SwitchEntity(json)
  }
}
