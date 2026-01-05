import React, { useState } from 'react';
import Button from '../Components/button';
import Base from './Base';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import './Head.scss';

const Head: React.FC = () => {
    const [devices, setDevices] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [deviceStatus, setDeviceStatus] = useState('offline');

    const handleAddDevice = () => {
        setShowForm(true);
    };

    const handleSubmitDevice = () => {
        if (deviceName.trim()) {
            const newDevice = {
                id: Date.now(),
                name: deviceName,
                status: deviceStatus,
            };
            setDevices([...devices, newDevice]);
            setDeviceName('');
            setDeviceStatus('offline');
            setShowForm(false);
        }
    };

    const handleCancel = () => {
        setDeviceName('');
        setDeviceStatus('offline');
        setShowForm(false);
    };

    const handleDeleteDevice = (deviceId: number) => {
        setDevices(devices.filter(device => device.id !== deviceId));
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>IoT Device Spoofer</h1>
                <button className="add-device-btn" onClick={handleAddDevice}>
                    <AddCircleIcon style={{ marginRight: '8px' }} />
                    Add Device
                </button>
            </header>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Device</h2>
                        <input
                            type="text"
                            placeholder="Device Name"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmitDevice()}
                        />
                        <select
                            value={deviceStatus}
                            onChange={(e) => setDeviceStatus(e.target.value)}
                        >
                            <option value="offline">Offline</option>
                            <option value="online">Online</option>
                            <option value="idle">Idle</option>
                        </select>
                        <div className="modal-buttons">
                            <Button name="Create" onClick={handleSubmitDevice} />
                            <Button name="Cancel" onClick={handleCancel} />
                        </div>
                    </div>
                </div>
            )}

            <Base devices={devices} onDeleteDevice={handleDeleteDevice} />
        </div>
    );
};

export default Head;