import React, { useState, useEffect } from "react";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import Button from "./button";
import "./device.scss";
import { getEntityTypes } from "../api";

interface Entity {
  id: string;
  name: string;
  value: string;
  type: string;
  states?: State[];
}

interface State {
  id: string;
  name: string;
  value: string;
}

interface DeviceProps {
  id: string;
  name: string;
  description: string;
  entities: Entity[];
  onUpdateEntities: (entities: Entity[]) => Promise<void> | void;
  onDelete?: () => void;
}

const Device: React.FC<DeviceProps> = ({
  name,
  description,
  entities: initialEntities,
  onUpdateEntities,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityType, setNewEntityType] = useState("sensor");
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [expandedEntities, setExpandedEntities] = useState<
    Record<string, boolean>
  >({});
  const [stateForms, setStateForms] = useState<
    Record<string, { show: boolean; name: string; value: string }>
  >({});
  const [stateEdits, setStateEdits] = useState<
    Record<
      string,
      Record<string, { name: string; value: string; editing: boolean }>
    >
  >({});

  // Keep local entities in sync if parent updates them
  useEffect(() => {
    setEntities(initialEntities);
  }, [initialEntities]);

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const types = await getEntityTypes();
      setEntityTypes(types);
    };
    fetchEntityTypes();
  }, []);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Ignore clicks inside the entities area or on interactive controls
    if (
      target.closest(".device-entities") ||
      target.closest("button, input, select, textarea, a")
    ) {
      return;
    }
    toggleExpand();
  };

  const persistEntities = async (next: Entity[]) => {
    setSaving(true);
    setError(null);
    try {
      await onUpdateEntities(next);
      setEntities(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entities");
      console.error("Error saving entities", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEntity = () => {
    if (newEntityName.trim() && newEntityType.trim()) {
      const entity: Entity = {
        id: Date.now().toString(),
        name: newEntityName,
        type: newEntityType,
        value: "",
      };
      const next = [...entities, entity];
      persistEntities(next);
      setNewEntityName("");
      setNewEntityType("sensor");
      setShowEntityForm(false);
    }
  };

  const handleRemoveEntity = (entityId: string) => {
    const next = entities.filter((entity) => entity.id !== entityId);
    persistEntities(next);
  };

  const toggleEntityExpand = (entityId: string) => {
    setExpandedEntities((prev) => ({ ...prev, [entityId]: !prev[entityId] }));
  };

  const openStateForm = (entityId: string) => {
    setStateForms((prev) => ({
      ...prev,
      [entityId]: { show: true, name: "", value: "" },
    }));
  };

  const cancelStateForm = (entityId: string) => {
    setStateForms((prev) => ({
      ...prev,
      [entityId]: { show: false, name: "", value: "" },
    }));
  };

  const handleAddState = (entityId: string) => {
    const form = stateForms[entityId] || { show: false, name: "", value: "" };
    const name = form.name?.trim();
    const value = form.value?.trim();
    if (!name) return;

    const next = entities.map((e) => {
      if (e.id !== entityId) return e;
      const newState: State = {
        id: Date.now().toString(),
        name,
        value: value || "",
      };
      return { ...e, states: [...(e.states || []), newState] };
    });
    persistEntities(next);
    cancelStateForm(entityId);
  };

  const handleRemoveState = (entityId: string, stateId: string) => {
    const next = entities.map((e) => {
      if (e.id !== entityId) return e;
      const nextStates = (e.states || []).filter((s) => s.id !== stateId);
      return { ...e, states: nextStates };
    });
    persistEntities(next);
  };

  const beginEditState = (entityId: string, state: State) => {
    setStateEdits((prev) => ({
      ...prev,
      [entityId]: {
        ...(prev[entityId] || {}),
        [state.id]: { name: state.name, value: state.value, editing: true },
      },
    }));
  };

  const cancelEditState = (entityId: string, stateId: string) => {
    setStateEdits((prev) => {
      const entityMap = { ...(prev[entityId] || {}) };
      delete entityMap[stateId];
      return { ...prev, [entityId]: entityMap };
    });
  };

  const saveEditState = (entityId: string, stateId: string) => {
    const entityMap = stateEdits[entityId] || {};
    const edit = entityMap[stateId];
    if (!edit) return;
    const name = edit.name.trim();
    const value = edit.value.trim();
    if (!name) return;

    const next = entities.map((e) => {
      if (e.id !== entityId) return e;
      const nextStates = (e.states || []).map((s) =>
        s.id === stateId ? { ...s, name, value } : s
      );
      return { ...e, states: nextStates };
    });
    persistEntities(next);
    cancelEditState(entityId, stateId);
  };

  const setDefaultState = (entityId: string, state: State) => {
    const value = (state.value ?? "").trim() || state.name;
    const next = entities.map((e) => (e.id === entityId ? { ...e, value } : e));
    persistEntities(next);
  };

  return (
    <div
      className="device-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpand();
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
              e.stopPropagation();
              onDelete();
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
            entities.map((entity) => {
              const isEntityExpanded = !!expandedEntities[entity.id];
              const form = stateForms[entity.id] || {
                show: false,
                name: "",
                value: "",
              };
              return (
                <div key={entity.id} className="entity-item">
                  <div
                    className="entity-row"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEntityExpand(entity.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleEntityExpand(entity.id);
                      }
                    }}
                    aria-expanded={isEntityExpanded}
                  >
                    <div className="entity-header">
                      <span className="entity-toggle-icon">
                        {isEntityExpanded ? (
                          <ExpandMoreIcon />
                        ) : (
                          <ChevronRightIcon />
                        )}
                      </span>
                      <div className="entity-details">
                        <span className="entity-name">{entity.name}</span>
                        <span className="entity-type">{entity.type}</span>
                      </div>
                    </div>
                    <div className="entity-actions">
                      <span className="entity-value">{entity.value}</span>
                      <button
                        className="entity-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveEntity(entity.id);
                        }}
                        title="Remove entity"
                        disabled={saving}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {isEntityExpanded && (
                    <div className="entity-states">
                      {entity.states && entity.states.length > 0 ? (
                        <div className="state-list">
                          {entity.states.map((s) => {
                            const currentEdits = stateEdits[entity.id] || {};
                            const edit = currentEdits[s.id];
                            const isEditing = !!edit?.editing;
                            const isDefault =
                              (entity.value || "") ===
                              ((s.value ?? "").trim() || s.name);
                            return (
                              <div key={s.id} className="state-item">
                                {!isEditing ? (
                                  <>
                                    <span className="state-name">{s.name}</span>
                                    <span className="state-value">
                                      {s.value}
                                    </span>
                                    {isDefault && (
                                      <span className="state-badge active">
                                        Default
                                      </span>
                                    )}
                                    <div className="state-actions">
                                      {!isDefault && (
                                        <button
                                          className="state-action-btn set"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDefaultState(entity.id, s);
                                          }}
                                        >
                                          Set Default
                                        </button>
                                      )}
                                      <button
                                        className="state-action-btn edit"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          beginEditState(entity.id, s);
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="state-action-btn delete"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            window.confirm(
                                              "Delete this state? This cannot be undone."
                                            )
                                          ) {
                                            handleRemoveState(entity.id, s.id);
                                          }
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="state-edit-inline">
                                    <input
                                      type="text"
                                      value={edit.name}
                                      onChange={(e) =>
                                        setStateEdits((prev) => ({
                                          ...prev,
                                          [entity.id]: {
                                            ...(prev[entity.id] || {}),
                                            [s.id]: {
                                              ...edit,
                                              name: e.target.value,
                                            },
                                          },
                                        }))
                                      }
                                    />
                                    <input
                                      type="text"
                                      value={edit.value}
                                      onChange={(e) =>
                                        setStateEdits((prev) => ({
                                          ...prev,
                                          [entity.id]: {
                                            ...(prev[entity.id] || {}),
                                            [s.id]: {
                                              ...edit,
                                              value: e.target.value,
                                            },
                                          },
                                        }))
                                      }
                                    />
                                    <div className="state-actions">
                                      <button
                                        className="state-action-btn save"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          saveEditState(entity.id, s.id);
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        className="state-action-btn cancel"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cancelEditState(entity.id, s.id);
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="empty-states">
                          No states yet. Add one below.
                        </p>
                      )}

                      {!form.show ? (
                        <div className="add-state-btn-wrapper">
                          <Button
                            name="Add State"
                            onClick={() => openStateForm(entity.id)}
                            icon={<AddCircleIcon />}
                          />
                        </div>
                      ) : (
                        <div className="state-form">
                          <input
                            type="text"
                            placeholder="State Name (e.g., On)"
                            value={form.name}
                            onChange={(e) =>
                              setStateForms((prev) => ({
                                ...prev,
                                [entity.id]: { ...form, name: e.target.value },
                              }))
                            }
                          />
                          <input
                            type="text"
                            placeholder="State Value (optional)"
                            value={form.value}
                            onChange={(e) =>
                              setStateForms((prev) => ({
                                ...prev,
                                [entity.id]: { ...form, value: e.target.value },
                              }))
                            }
                          />
                          <div className="state-form-buttons">
                            <Button
                              name={saving ? "Saving..." : "Create"}
                              onClick={() => handleAddState(entity.id)}
                            />
                            <button
                              className="form-btn cancel"
                              onClick={() => cancelStateForm(entity.id)}
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
              );
            })
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
                placeholder="Entity Name (e.g., Temperature)"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
              />
              <select
                value={newEntityType}
                onChange={(e) => setNewEntityType(e.target.value)}
              >
                {entityTypes.map((type) => {
                  const label = type
                    .replace(/_/g, " ")
                    .replace(/^([a-z])/, (m) => m.toUpperCase());
                  return (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <div className="entity-form-buttons">
                <Button
                  name={saving ? "Saving..." : "Create"}
                  onClick={handleAddEntity}
                />
                <button
                  className="form-btn cancel"
                  onClick={() => {
                    setShowEntityForm(false);
                    setNewEntityName("");
                    setNewEntityType("sensor");
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
  );
};

export default Device;
