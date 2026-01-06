import React, { useState } from "react";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import Button from "./button";
import "./device.scss";

interface Entity {
  id: string;
  name: string;
  value: string;
  type: string;
}

interface DeviceProps {
  id: string;
  name: string;
  description: string;
  entities: Entity[];
  onDelete?: () => void;
}

const Device: React.FC<DeviceProps> = ({
  id,
  name,
  description,
  entities: initialEntities,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityType, setNewEntityType] = useState("sensor");
  const [newEntityValue, setNewEntityValue] = useState("");
  const [showEntityForm, setShowEntityForm] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddEntity = () => {
    if (newEntityName.trim() && newEntityType.trim()) {
      const entity: Entity = {
        id: Date.now().toString(),
        name: newEntityName,
        type: newEntityType,
        value: newEntityValue || "0",
      };
      setEntities([...entities, entity]);
      setNewEntityName("");
      setNewEntityType("sensor");
      setNewEntityValue("");
      setShowEntityForm(false);
    }
  };

  const handleRemoveEntity = (entityId: string) => {
    setEntities(entities.filter((entity) => entity.id !== entityId));
  };

  return (
    <div className="device-card">
      <div className="device-header">
        <div className="device-header-left" onClick={toggleExpand}>
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
          {entities.length === 0 ? (
            <p className="empty-entities">No entities yet. Add one below.</p>
          ) : (
            entities.map((entity) => (
              <div key={entity.id} className="entity-item">
                <div className="entity-details">
                  <span className="entity-name">{entity.name}</span>
                  <span className="entity-type">{entity.type}</span>
                </div>
                <div className="entity-actions">
                  <span className="entity-value">{entity.value}</span>
                  <button
                    className="entity-remove-btn"
                    onClick={() => handleRemoveEntity(entity.id)}
                    title="Remove entity"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
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
                <option value="sensor">Sensor</option>
                <option value="lamp">Lamp</option>
                <option value="switch">Switch</option>
                <option value="thermostat">Thermostat</option>
                <option value="camera">Camera</option>
                <option value="lock">Lock</option>
              </select>
              <input
                type="text"
                placeholder="Initial Value (optional)"
                value={newEntityValue}
                onChange={(e) => setNewEntityValue(e.target.value)}
              />
              <div className="entity-form-buttons">
                <Button name="Create" onClick={handleAddEntity} />
                <button
                  className="form-btn cancel"
                  onClick={() => {
                    setShowEntityForm(false);
                    setNewEntityName("");
                    setNewEntityType("sensor");
                    setNewEntityValue("");
                  }}
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
