import React from 'react';
import Device from '../Components/device';
import './Base.scss';

interface BaseProps {
    devices: any[];
    onDeleteDevice: (id: number) => void;
}

const Base: React.FC<BaseProps> = ({ devices, onDeleteDevice }) => {
    return (
        <div className="device-list">
            {devices.map((device) => (
                <Device 
                    key={device.id} 
                    id={device.id.toString()} 
                    name={device.name} 
                    description={`Status: ${device.status}`} 
                    entities={[]} 
                    onDelete={() => onDeleteDevice(device.id)}
                />
            ))}
        </div>
    );
};

export default Base;
