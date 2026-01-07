import React, { useState } from "react";
import Button from "../Components/button";
import Base from "./Base";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { addDevice, Device } from "../api";
import "./Head.scss";

interface HeadProps {
  devices: Device[];
  onDeleteDevice: (id: string) => void;
  onRefresh: () => void;
}

const Head: React.FC<HeadProps> = ({ devices, onDeleteDevice, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceManufacturer, setDeviceManufacturer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddDevice = () => {
    setShowForm(true);
  };

  const handleSubmitDevice = async () => {
    if (deviceName.trim() && deviceManufacturer.trim()) {
      try {
        setLoading(true);
        setError(null);
        await addDevice({
          name: deviceName,
          manufacturer: deviceManufacturer,
          entities: [],
        });
        setDeviceName("");
        setDeviceManufacturer("");
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
    setDeviceManufacturer("");
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
            <input
              type="text"
              placeholder="Manufacturer"
              value={deviceManufacturer}
              onChange={(e) => setDeviceManufacturer(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmitDevice()}
              disabled={loading}
            />
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

      <Base devices={devices} onDeleteDevice={onDeleteDevice} />
    </div>
  );
};

export default Head;
