import React, { useState, useEffect } from 'react'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteIcon from '@mui/icons-material/Delete'
import Button from './button'
import './device.scss'
import { getEntityTypes } from '../api'

interface Entity {
  id: string
  type: string
  name: string
  state_topic?: string
  command_topic?: string
}

interface DeviceProps {
  id: string
  name: string
  description: string
  entities: Entity[]
  onUpdateEntities: (entities: Entity[]) => Promise<void> | void
  onDelete?: () => void
}

const Device: React.FC<DeviceProps> = ({
  name,
  description,
  entities: initialEntities,
  onUpdateEntities,
  onDelete,
}) => {
  const defaultType = (types: string[]) => types[0] ?? 'light'
  const [isExpanded, setIsExpanded] = useState(false)
  const [entities, setEntities] = useState<Entity[]>(initialEntities)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityType, setNewEntityType] = useState(defaultType([]))
  const [showEntityForm, setShowEntityForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entityTypes, setEntityTypes] = useState<string[]>([])

  // Keep local entities in sync if parent updates them
  useEffect(() => {
    setEntities(initialEntities)
  }, [initialEntities])

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const types = await getEntityTypes()
      setEntityTypes(types)
      setNewEntityType((prev) =>
        types.includes(prev) ? prev : defaultType(types)
      )
    }
    fetchEntityTypes()
  }, [])

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev)
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    // Ignore clicks inside the entities area or on interactive controls
    if (
      target.closest('.device-entities') ||
      target.closest('button, input, select, textarea, a')
    ) {
      return
    }
    toggleExpand()
  }

  const persistEntities = async (next: Entity[]) => {
    setSaving(true)
    setError(null)
    try {
      await onUpdateEntities(next)
      setEntities(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entities')
      console.error('Error saving entities', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddEntity = () => {
    if (newEntityName.trim() && newEntityType.trim()) {
      const entity: Entity = {
        id: Date.now().toString(),
        type: newEntityType,
        name: newEntityName,
      }
      const next = [...entities, entity]
      persistEntities(next)
      setNewEntityName('')
      setNewEntityType(defaultType(entityTypes))
      setShowEntityForm(false)
    }
  }

  const handleRemoveEntity = (entityId: string) => {
    const next = entities.filter((entity) => entity.id !== entityId)
    persistEntities(next)
  }

  return (
    <div
      className="device-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleExpand()
        }
      }}
      aria-expanded={isExpanded}
    >
      <div className="device-header">
        <div className="device-header-left">
          <span className="toggle-icon">
            {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </span>
          <div className="device-info">
            <h3 className="device-name">{name}</h3>
            <p className="device-description">{description}</p>
          </div>
        </div>
        {onDelete && (
          <button
            className="device-delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Delete device"
          >
            <DeleteIcon />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="device-entities">
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {entities.length === 0 ? (
            <p className="empty-entities">No entities yet. Add one below.</p>
          ) : (
            <div className="entity-list">
              {entities.map((entity) => (
                <div key={entity.id} className="entity-item">
                  <div className="entity-row">
                    <div className="entity-header">
                      <div className="entity-details">
                        <span className="entity-name">{entity.name}</span>
                        <span className="entity-type">{entity.type}</span>
                        {entity.state_topic && (
                          <span className="entity-topic">
                            {entity.state_topic}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="entity-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveEntity(entity.id)
                      }}
                      title="Remove entity"
                      disabled={saving}
                    ></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showEntityForm ? (
            <div className="add-entity-btn-wrapper">
              <Button
                name="Add Entity"
                onClick={() => setShowEntityForm(true)}
                icon={<AddCircleIcon />}
              />
            </div>
          ) : (
            <div className="entity-form">
              <input
                type="text"
                placeholder="Entity Name (e.g., Kitchen Light)"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
              />
              <select
                value={newEntityType}
                onChange={(e) => setNewEntityType(e.target.value)}
              >
                {entityTypes.map((type) => {
                  const label = type
                    .replace(/_/g, ' ')
                    .replace(/^([a-z])/, (m) => m.toUpperCase())
                  return (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  )
                })}
              </select>
              <div className="entity-form-buttons">
                <Button
                  name={saving ? 'Saving...' : 'Create'}
                  onClick={handleAddEntity}
                />
                <button
                  className="form-btn cancel"
                  onClick={() => {
                    setShowEntityForm(false)
                    setNewEntityName('')
                    setNewEntityType(defaultType(entityTypes))
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Device
