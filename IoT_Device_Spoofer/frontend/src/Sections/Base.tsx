import React from "react";
import Device from "../Components/device";
import { Device as DeviceType } from "../api";
import "./Base.scss";

interface BaseProps {
  devices: DeviceType[];
  onDeleteDevice: (id: string) => void;
}

const Base: React.FC<BaseProps> = ({ devices, onDeleteDevice }) => {
  return (
    <div className="device-list">
      {devices.map((device) => (
        <Device
          key={device.id}
          id={device.id}
          name={device.name}
          description={device.manufacturer}
          entities={device.entities}
          onDelete={() => onDeleteDevice(device.id)}
        />
      ))}
    </div>
  );
};

export default Base;
