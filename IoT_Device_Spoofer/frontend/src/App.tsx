import { useState, useEffect } from "react";
import "./App.css";
import Head from "./Sections/Head";
import { getDevices, deleteDevice, updateDevice, Device, Entity } from "./api";

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await getDevices();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices");
      console.error("Error loading devices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    try {
      await deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete device");
      console.error("Error deleting device:", err);
    }
  };

  const handleUpdateEntities = async (id: string, entities: Entity[]) => {
    try {
      const updated = await updateDevice(id, { entities });
      setDevices((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, entities: updated.entities } : d
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update device");
      console.error("Error updating device:", err);
    }
  };

  const handleRefresh = () => {
    loadDevices();
  };

  return (
    <>
      <div>
        {error && <div style={{ color: "red", padding: "10px" }}>{error}</div>}
        {loading && <div>Loading devices...</div>}
        {!loading && (
          <Head
            devices={devices}
            onDeleteDevice={handleDeleteDevice}
            onUpdateEntities={handleUpdateEntities}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </>
  );
}

export default App;
