export interface WiiMDevice {
  location: string;
  friendlyName: string;
}

export interface TrackData {
  "dc:title"?: string;
  "upnp:artist"?: string;
  "upnp:album"?: string;
  "upnp:albumArtURI"?: string;
  TrackSource?: string;
  [key: string]: unknown;
}

export interface TransportInfo {
  CurrentTransportState: string;
  CurrentTransportStatus: string;
  CurrentSpeed: string;
}

export interface PositionInfo {
  RelTime: string;
  TrackDuration: string;
  Track: number;
}
