"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function timeToSeconds(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatTime(totalSec: number): string {
  totalSec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0)
    return (
      h +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0")
    );
  return m + ":" + String(s).padStart(2, "0");
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

interface DeviceInfo {
  location: string;
  friendlyName: string;
}

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState("--");
  const [artist, setArtist] = useState("--");
  const [artUrl, setArtUrl] = useState("");
  const [elapsed, setElapsed] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [progressPct, setProgressPct] = useState(0);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const oldTrackKeyRef = useRef("");
  const artLoadedRef = useRef(false);

  // Read device name cookie on mount
  useEffect(() => {
    setDeviceName(getCookie("wiim-device-name"));
  }, []);

  const sendCmd = useCallback(
    (cmd: string) => {
      if (cmd === "toggle") cmd = isPlaying ? "pause" : "play";
      fetch("/api/" + cmd).catch((err) => console.log("cmd error:", err));
    },
    [isPlaying]
  );

  // Status polling
  useEffect(() => {
    const poll = () => {
      fetch("/api/status")
        .then((r) => r.json())
        .then((data) => {
          setIsPlaying(data.CurrentTransportState === "PLAYING");
        })
        .catch((err) => console.log("status error:", err));
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  // Track data polling
  useEffect(() => {
    const poll = () => {
      fetch("/api/getdata")
        .then((r) => r.json())
        .then((data) => {
          const trackKey =
            (data["upnp:artist"] || "") +
            (data["upnp:album"] || "") +
            (data["dc:title"] || "");
          const trackChanged = trackKey !== oldTrackKeyRef.current;

          if (trackChanged) {
            oldTrackKeyRef.current = trackKey;
            artLoadedRef.current = false;
            setTrack(data["dc:title"] || "--");
            setArtist(data["upnp:artist"] || "--");
          }

          if (artLoadedRef.current) return;

          const artUri = data["upnp:albumArtURI"];
          if (artUri) {
            const proxyUrl =
              "/api/albumart?url=" +
              encodeURIComponent(artUri) +
              "&_t=" +
              Date.now();
            const img = new Image();
            img.onload = () => {
              setArtUrl(proxyUrl);
              artLoadedRef.current = true;
            };
            img.src = proxyUrl;
          }
        })
        .catch((err) => console.log("getdata error:", err));
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  // Position polling
  useEffect(() => {
    const poll = () => {
      fetch("/api/position")
        .then((r) => r.json())
        .then((data) => {
          const el = timeToSeconds(data.RelTime);
          const total = timeToSeconds(data.TrackDuration);
          setElapsed(formatTime(el));
          setDuration(formatTime(total));
          setProgressPct(total > 0 ? (el / total) * 100 : 0);
        })
        .catch((err) => console.log("position error:", err));
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, []);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
    setLoadingDevices(true);
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) => {
        setDevices(data.devices || []);
        setActiveLocation(data.activeLocation || null);
      })
      .catch((err) => console.log("devices error:", err))
      .finally(() => setLoadingDevices(false));
  }, []);

  const selectDevice = useCallback((device: DeviceInfo) => {
    fetch("/api/devices/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setActiveLocation(device.location);
          setDeviceName(data.friendlyName);
          // Force refresh track data on switch
          oldTrackKeyRef.current = "";
          artLoadedRef.current = false;
        }
      })
      .catch((err) => console.log("select error:", err));
    setPickerOpen(false);
  }, []);

  const bgStyle = artUrl
    ? { backgroundImage: `url("${artUrl}")` }
    : undefined;

  return (
    <>
      {/* Device picker button — top right, very subtle */}
      <button className="device-picker-btn" onClick={openPicker} title={deviceName || "Switch device"}>
        <svg viewBox="0 0 24 24">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM4 6h9v2H4V6zm0 4h9v2H4v-2zm0 4h9v2H4v-2zm11-8h5v10h-5V6z" />
        </svg>
      </button>

      {/* Device picker modal */}
      {pickerOpen && (
        <div className="device-picker-overlay" onClick={() => setPickerOpen(false)}>
          <div className="device-picker-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Devices</h3>
            {loadingDevices ? (
              <div className="device-picker-loading">Scanning network...</div>
            ) : devices.length === 0 ? (
              <div className="device-picker-loading">No devices found</div>
            ) : (
              <ul className="device-picker-list">
                {devices.map((d) => (
                  <li key={d.location}>
                    <button
                      className={`device-picker-item${d.location === activeLocation ? " active" : ""}`}
                      onClick={() => selectDevice(d)}
                    >
                      <span className="device-picker-dot" />
                      {d.friendlyName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Background layers */}
      <div id="bg-art" style={bgStyle} />
      <div id="bg-art-sharp" style={bgStyle} />
      <div id="bg-dimming" />

      {/* Footer bar */}
      <div id="footer">
        <div id="albumart" style={bgStyle} />

        <div id="info-block">
          <div id="track">{track}</div>
          <div id="artist">{artist}</div>
          <div id="progress-row">
            <span className="progress-time" id="elapsed">
              {elapsed}
            </span>
            <div id="progress-bar-bg">
              <div
                id="progress-bar"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="progress-time" id="duration">
              {duration}
            </span>
          </div>
        </div>

        <div id="controls">
          <button
            className="ctrl-btn"
            id="btn-prev"
            onClick={() => sendCmd("prev")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>
          <button
            className="ctrl-btn"
            id="btn-toggle"
            onClick={() => sendCmd("toggle")}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24">
                <path d="M6 19h4V5H6zm8-14v14h4V5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            className="ctrl-btn"
            id="btn-next"
            onClick={() => sendCmd("next")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
