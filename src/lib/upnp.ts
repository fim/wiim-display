import type { DeviceClient } from "./device";

/**
 * Promise wrapper around callAction.
 */
function callAction(
  client: DeviceClient,
  serviceId: string,
  actionName: string,
  params: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    client.callAction(serviceId, actionName, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function getMediaInfo(client: DeviceClient) {
  return callAction(client, "AVTransport", "GetMediaInfo", { InstanceID: 0 });
}

export function getTransportInfo(client: DeviceClient) {
  return callAction(client, "AVTransport", "GetTransportInfo", { InstanceID: 0 });
}

export function getPositionInfo(client: DeviceClient) {
  return callAction(client, "AVTransport", "GetPositionInfo", { InstanceID: 0 });
}

export function play(client: DeviceClient) {
  return callAction(client, "AVTransport", "Play", { InstanceID: 0, Speed: "1" });
}

export function pause(client: DeviceClient) {
  return callAction(client, "AVTransport", "Pause", { InstanceID: 0 });
}

export function next(client: DeviceClient) {
  return callAction(client, "AVTransport", "Next", { InstanceID: 0 });
}

export function previous(client: DeviceClient) {
  return callAction(client, "AVTransport", "Previous", { InstanceID: 0 });
}
