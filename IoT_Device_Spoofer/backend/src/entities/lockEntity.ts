import BaseEntity, { EntityDefinition } from './baseEntity.js'

export class LockEntity extends BaseEntity {
  constructor(def: EntityDefinition) {
    super({ ...def, type: 'lock' })
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      state_topic: this.state_topic,
      command_topic: this.command_topic,
    }
  }

  static fromJSON(json: EntityDefinition) {
    return new LockEntity(json)
  }
}
