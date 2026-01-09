import { LockEntity } from '../entities/lockEntity.js'
import { LightEntity } from '../entities/lightEntity.js'
import { NumberEntity } from '../entities/numberEntity.js'
import { SwitchEntity } from '../entities/switchEntity.js'
import { EntityDefinition } from '../entities/baseEntity.js'

const ENTITY_REGISTRY = {
  lock: LockEntity,
  light: LightEntity,
  number: NumberEntity,
  switch: SwitchEntity,
}

export function createEntity(entityDefinition: EntityDefinition) {
  const EntityClass =
    ENTITY_REGISTRY[entityDefinition.type as keyof typeof ENTITY_REGISTRY]
  if (!EntityClass) {
    throw new Error(`Unknown entity type: ${entityDefinition.type}`)
  }
  return EntityClass.fromJSON(entityDefinition)
}

export function getAvailableEntityTypes(): string[] {
  return Object.keys(ENTITY_REGISTRY)
}
