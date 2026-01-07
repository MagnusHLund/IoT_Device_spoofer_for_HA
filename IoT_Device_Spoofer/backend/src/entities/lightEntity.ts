import BaseEntity, { EntityDefinition } from './baseEntity.js'

export class LightEntity extends BaseEntity {
  constructor(def: EntityDefinition) {
    super({ ...def, type: 'light' })
  }

  toJSON() {
    return {
      id: this.id,
      type: 'light',
      state_topic: this.state_topic,
      command_topic: this.command_topic,
    }
  }

  static fromJSON(json: EntityDefinition) {
    return new LightEntity(json)
  }
}
