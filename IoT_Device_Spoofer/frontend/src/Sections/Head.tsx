import React, { useState } from "react";
import Button from "../Components/button";
import Base from "./Base";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { addDevice, Device } from "../api";
import "./Head.scss";

interface HeadProps {
  devices: Device[];
  onDeleteDevice: (id: string) => void;
  onUpdateEntities: (
    id: string,
    entities: Device["entities"]
  ) => void | Promise<void>;
  onRefresh: () => void;
}

const Head: React.FC<HeadProps> = ({
  devices,
  onDeleteDevice,
  onUpdateEntities,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  // manufacturer is fixed on backend; no input needed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddDevice = () => {
    setShowForm(true);
  };

  const handleSubmitDevice = async () => {
    if (deviceName.trim()) {
      try {
        setLoading(true);
        setError(null);
        await addDevice({ name: deviceName, entities: [] });
        setDeviceName("");
        setShowForm(false);
        onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add device");
        console.error("Error adding device:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setDeviceName("");
    setShowForm(false);
    setError(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>IoT Device Spoofer</h1>
        <button className="add-device-btn" onClick={handleAddDevice}>
          <AddCircleIcon style={{ marginRight: "8px" }} />
          Add Device
        </button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Device</h2>
            {error && (
              <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
            )}
            <input
              type="text"
              placeholder="Device Name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmitDevice()}
              disabled={loading}
            />
            {/* manufacturer is always 'IoT Device Spoofer' */}
            <div className="modal-buttons">
              <Button
                name={loading ? "Creating..." : "Create"}
                onClick={handleSubmitDevice}
              />
              <Button name="Cancel" onClick={handleCancel} />
            </div>
          </div>
        </div>
      )}

      <Base
        devices={devices}
        onDeleteDevice={onDeleteDevice}
        onUpdateEntities={onUpdateEntities}
      />
    </div>
  );
};

export default Head;
