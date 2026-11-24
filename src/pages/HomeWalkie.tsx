import React, { useState } from "react";
import { PttMicButton } from "../components/PttMicButton";

interface Channel {
  id: string;
  name: string;
  code: string;
  onlineCount: number;
}

const INITIAL_CHANNELS: Channel[] = [
  { id: "amor", name: "Amor", code: "66E13D", onlineCount: 2 },
];

export const HomeWalkie: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>("amor");
  const [activeTab, setActiveTab] = useState<"canales" | "contactos">("canales");
  const [lastNotice, setLastNotice] = useState<string>("Listo para transmitir");

  const activeChannel =
    channels.find((c) => c.id === activeChannelId) ?? channels[0];

  const handleCreateGroup = () => {
    const name = window.prompt("Nombre del nuevo canal o grupo:");
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    const id = `${cleanName.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString().slice(-3)}`;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCh: Channel = { id, name: cleanName, code, onlineCount: 1 };
    setChannels((prev) => [newCh, ...prev]);
    setActiveChannelId(id);
    setActiveTab("canales");
    setLastNotice(`Canal "${cleanName}" creado (${code})`);
  };

  const handleJoinGroup = () => {
    const code = window.prompt("Ingresa el código del canal (ej. 66E13D):");
    if (!code || !code.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    const existing = channels.find((c) => c.code === cleanCode);
    if (existing) {
      setActiveChannelId(existing.id);
      setLastNotice(`Conectado a "${existing.name}"`);
    } else {
      const joined: Channel = {
        id: `room-${cleanCode}`,
        name: `Canal ${cleanCode}`,
        code: cleanCode,
        onlineCount: 1,
      };
      setChannels((prev) => [...prev, joined]);
      setActiveChannelId(joined.id);
      setLastNotice(`Unido al canal ${cleanCode}`);
    }
    setActiveTab("canales");
  };

  return (
    <div className="gioo-shell">
      <header className="gioo-header">
        <div className="gioo-brand">
          <img
            src="/logo-giootalk.png"
            alt="Logo GiooTalk Flick"
            className="gioo-logo-img"
          />
          <div>
            <h1 className="gioo-title">GiooTalk Flick</h1>
            <p className="gioo-subtitle">@eldacardozo24</p>
          </div>
        </div>

        <nav className="gioo-top-actions" aria-label="Acciones principales">
          <button
            type="button"
            className={`gioo-icon-btn ${activeTab === "canales" ? "active" : ""}`}
            onClick={() => setActiveTab("canales")}
          >
            <span aria-hidden="true">📡</span>
            <span>Canales</span>
          </button>

          <button
            type="button"
            className={`gioo-icon-btn ${activeTab === "contactos" ? "active" : ""}`}
            onClick={() => setActiveTab("contactos")}
          >
            <span aria-hidden="true">👤</span>
            <span>Contactos</span>
          </button>

          <button
            type="button"
            className="gioo-icon-btn"
            onClick={() => setLastNotice("Sesión en espera")}
          >
            <span aria-hidden="true">↪</span>
            <span>Salir</span>
          </button>
        </nav>
      </header>

      <div className="gioo-status-pill">
        <span className="gioo-dot" />
        <span>Conectados ahora (1): eldacardozo24 · {lastNotice}</span>
      </div>

      <section aria-label="Accesos rápidos">
        <div className="gioo-drawer-grid">
          <button
            type="button"
            className="gioo-drawer-box"
            onClick={handleCreateGroup}
          >
            <span aria-hidden="true">➕</span>
            <span>Nuevo grupo</span>
          </button>

          <button
            type="button"
            className="gioo-drawer-box"
            onClick={handleJoinGroup}
          >
            <span aria-hidden="true">📶</span>
            <span>Unirme</span>
          </button>

          <button
            type="button"
            className="gioo-drawer-box contacts-box"
            onClick={() => setActiveTab("contactos")}
          >
            <span aria-hidden="true">📇</span>
            <span>Contactos</span>
          </button>
        </div>
      </section>

      {activeTab === "canales" ? (
        <section aria-label="Canales conectados">
          <h2 className="gioo-section-title">Canales conectados ahora</h2>
          <div className="gioo-channels-list">
            {channels.map((ch) => {
              const isSelected = ch.id === activeChannel?.id;
              return (
                <div
                  key={ch.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveChannelId(ch.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveChannelId(ch.id);
                    }
                  }}
                  className={`gioo-channel-card ${isSelected ? "selected" : ""}`}
                >
                  <div>
                    <div className="gioo-channel-name">{ch.name}</div>
                    <div className="gioo-channel-meta">
                      {ch.onlineCount} personas · {ch.code}
                    </div>
                  </div>
                  <span className="gioo-live-badge">
                    {isSelected ? "EN AIRE" : "CONECTAR"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section aria-label="Contactos">
          <h2 className="gioo-section-title">Contactos del canal</h2>
          <div className="gioo-channels-list">
            <div className="gioo-channel-card">
              <div>
                <div className="gioo-channel-name">serviciosexpressyucatan</div>
                <div className="gioo-channel-meta">Activo en canal Amor</div>
              </div>
              <span className="gioo-live-badge">CONTACTO</span>
            </div>
          </div>
        </section>
      )}

      {activeChannel && (
        <PttMicButton
          channelName={activeChannel.name}
          onStartTalking={() =>
            setLastNotice(`Hablando en ${activeChannel.name}`)
          }
          onStopTalking={(ms) =>
            setLastNotice(
              `Nota de voz (${Math.max(0.4, +(ms / 1000).toFixed(1))}s) en ${activeChannel.name}`
            )
          }
        />
      )}
    </div>
  );
};
