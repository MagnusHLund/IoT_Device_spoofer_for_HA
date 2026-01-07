import { BinarySensorEntity } from '../entities/binarySensorEntity'
import { LockEntity } from '../entities/lockEntity'
import { LightEntity } from '../entities/lightEntity'
import { NumberEntity } from '../entities/numberEntity'
import { SwitchEntity } from '../entities/switchEntity'
import { EntityDefinition } from '../entities/baseEntity'

const ENTITY_REGISTRY = {
  binary_sensor: BinarySensorEntity,
  sensor: LightEntity,
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
