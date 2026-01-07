import React from "react";
import Device from "../Components/device";
import { Device as DeviceType } from "../api";
import "./Base.scss";

interface BaseProps {
  devices: DeviceType[];
  onDeleteDevice: (id: string) => void;
  onUpdateEntities: (
    id: string,
    entities: DeviceType["entities"]
  ) => void | Promise<void>;
}

const Base: React.FC<BaseProps> = ({
  devices,
  onDeleteDevice,
  onUpdateEntities,
}) => {
  return (
    <div className="device-list">
      {devices.map((device) => (
        <Device
          key={device.id}
          id={device.id}
          name={device.name}
          description={"IoT Device Spoofer"}
          entities={device.entities}
          onUpdateEntities={(entities) => onUpdateEntities(device.id, entities)}
          onDelete={() => onDeleteDevice(device.id)}
        />
      ))}
    </div>
  );
};

export default Base;
