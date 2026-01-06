import { BinarySensorEntity } from '../entities/binarySensorEntity'
import { LockEntity } from '../entities/lockEntity'
import { LightEntity } from '../entities/lightEntity'
import { NumberEntity } from '../entities/numberEntity'
import { SwitchEntity } from '../entities/switchEntity'
import { EntityDefinition } from '../entities/baseEntity'

export function createEntity(entityDefinition: EntityDefinition) {
  switch (entityDefinition.type) {
    case 'binary_sensor':
      return BinarySensorEntity.fromJSON(entityDefinition)
    case 'sensor':
      return LightEntity.fromJSON(entityDefinition)
    case 'lock':
      return LockEntity.fromJSON(entityDefinition)
    case 'light':
      return LightEntity.fromJSON(entityDefinition)
    case 'number':
      return NumberEntity.fromJSON(entityDefinition)
    case 'switch':
      return SwitchEntity.fromJSON(entityDefinition)
    default:
      throw new Error(`Unknown entity type: ${entityDefinition.type}`)
  }
}
