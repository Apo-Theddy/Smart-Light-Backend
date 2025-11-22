interface DeviceStatusPayload {
  mac: string;
  status: 'online' | 'offline';
}

export type { DeviceStatusPayload };
