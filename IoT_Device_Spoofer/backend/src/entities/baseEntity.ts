export interface EntityDefinition {
  id: string
  type: string
  name: string
  state_topic: string
  command_topic?: string
  states?: {
    available_states: string[]
    default_state: string
  }
}

export default abstract class BaseEntity {
  id: string
  type: string
  name: string
  state_topic: string
  command_topic?: string
  states?: {
    available_states: string[]
    default_state: string
  }

  constructor(def: EntityDefinition) {
    this.id = def.id
    this.type = def.type
    this.name = def.name
    this.state_topic = def.state_topic
    this.command_topic = def.command_topic
    this.states = def.states
  }

  abstract toJSON(): EntityDefinition

  static fromJSON(_json: EntityDefinition): BaseEntity {
    throw new Error('fromJSON must be implemented in subclasses')
  }
}
