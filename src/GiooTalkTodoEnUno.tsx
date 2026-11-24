import { useState } from "react";

type MensajeVoz = {
  id: number;
  canal: string;
  estado: string;
  hora: string;
};

const CANALES_INICIALES = ["Amor", "Familia", "Equipo"];

export function GiooTalkTodoEnUno() {
  const [canalActivo, setCanalActivo] = useState<string>("Amor");
  const [hablando, setHablando] = useState<boolean>(false);
  const [nuevoCanal, setNuevoCanal] = useState<string>("");
  const [canales, setCanales] = useState<string[]>(CANALES_INICIALES);
  const [registro, setRegistro] = useState<MensajeVoz[]>([
    {
      id: 1,
      canal: "Amor",
      estado: "Canal listo para push-to-chat",
      hora: "Listo",
    },
  ]);

  const agregarRegistro = (estadoTexto: string) => {
    const horaActual = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setRegistro((prev) => [
      {
        id: Date.now(),
        canal: canalActivo,
        estado: estadoTexto,
        hora: horaActual,
      },
      ...prev.slice(0, 7),
    ]);
  };

  const iniciarTransmision = () => {
    if (!hablando) {
      setHablando(true);
      agregarRegistro("Transmitiendo voz en vivo...");
    }
  };

  const detenerTransmision = () => {
    if (hablando) {
      setHablando(false);
      agregarRegistro("Transmisión enviada");
    }
  };

  const agregarCanal = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nuevoCanal.trim();
    if (!limpio) return;
    if (!canales.includes(limpio)) {
      setCanales((prev) => [...prev, limpio]);
    }
    setCanalActivo(limpio);
    setNuevoCanal("");
    agregarRegistro(`Entraste al canal "${limpio}"`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-5">
      <header className="w-full max-w-md flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            GiooTalk Flick
          </h1>
          <p className="text-xs text-slate-400">
            Modo todo-en-uno · Canal:{" "}
            <span className="text-rose-400 font-semibold">{canalActivo}</span>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            hablando
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          {hablando ? "EN AIRE" : "EN ESPERA"}
        </span>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-6 my-6">
        <div className="w-full">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
            Canales disponibles
          </p>
          <div className="flex flex-wrap gap-2">
            {canales.map((canal) => {
              const activo = canal === canalActivo;
              return (
                <button
                  key={canal}
                  type="button"
                  onClick={() => {
                    setCanalActivo(canal);
                    agregarRegistro(`Cambiaste a "${canal}"`);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activo
                      ? "bg-rose-600 text-white shadow"
                      : "bg-slate-900 text-slate-300 border border-slate-800"
                  }`}
                >
                  {canal}
                </button>
              );
            })}
          </div>

          <form onSubmit={agregarCanal} className="flex gap-2 mt-3">
            <input
              type="text"
              value={nuevoCanal}
              onChange={(e) => setNuevoCanal(e.target.value)}
              placeholder="Nuevo canal..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white"
            >
              Agregar
            </button>
          </form>
        </div>

        <button
          type="button"
          onMouseDown={iniciarTransmision}
          onMouseUp={detenerTransmision}
          onMouseLeave={detenerTransmision}
          onTouchStart={(e) => {
            e.preventDefault();
            iniciarTransmision();
          }}
          onTouchEnd={detenerTransmision}
          className={`w-44 h-44 rounded-full font-bold text-base flex flex-col items-center justify-center gap-1 select-none transition-transform ${
            hablando
              ? "bg-emerald-500 text-slate-950 scale-95 shadow-lg shadow-emerald-500/30"
              : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
          }`}
        >
          <span>{hablando ? "SOLTAR PARA ENVIAR" : "MANTÉN PARA HABLAR"}</span>
          <span className="text-xs font-normal opacity-90">
            Canal {canalActivo}
          </span>
        </button>

        <section className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
            Actividad reciente
          </h2>
          <ul className="space-y-2 text-sm">
            {registro.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b border-slate-800/70 pb-1.5 last:border-b-0 last:pb-0"
              >
                <span className="text-slate-200">
                  <strong className="text-rose-400">[{item.canal}]</strong>{" "}
                  {item.estado}
                </span>
                <span className="text-xs text-slate-500">{item.hora}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="w-full max-w-md text-center text-xs text-slate-500">
        GiooTalk Flick · Vista previa local
      </footer>
    </div>
  );
}

export default GiooTalkTodoEnUno;
