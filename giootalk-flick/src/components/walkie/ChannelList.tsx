import { useState } from "react";
import { toast } from "sonner";
import { Bell, LogOut, Plus, Radio, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestNotify } from "@/lib/notify";
import { InstallGuide } from "./InstallGuide";
import type { ChannelItem, Profile } from "./types";

export function ChannelList({
  me,
  channels,
  unread,
  onOpen,
  onChanged,
}: {
  me: Profile;
  channels: ChannelItem[];
  unread: Record<string, number>;
  onOpen: (id: string) => void;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<"create" | "join" | "dm" | null>(null);
  const [value, setValue] = useState("");

  async function go() {
    const v = value.trim();
    if (!v) return;
    const fn = tab === "create" ? "create_group" : tab === "join" ? "join_group" : "start_direct";
    const args = tab === "create" ? { _name: v } : tab === "join" ? { _code: v } : { _username: v };
    const { data, error } = await supabase.rpc(fn, args as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    setValue("");
    setTab(null);
    onChanged();
    onOpen(data as string);
  }

  async function enableNotify() {
    const r = await requestNotify();
    if (r === "granted") toast.success("Avisos activados");
    else if (r === "iframe") toast.error("Abre la app en su propia pestaña para activar los avisos");
    else if (r === "denied") toast.error("Permite las notificaciones en los ajustes del navegador");
    else toast.error("Este navegador no permite avisos. Instala la app en tu pantalla de inicio");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-10 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/icon-512.png" alt="" width={44} height={44} className="rounded-xl" />
          <div>
            <h1 className="text-3xl font-black tracking-tight">GiooTalk Flick</h1>
            <p className="font-mono text-xs text-muted-foreground">tu usuario: @{me.username}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <InstallGuide />
          <Button size="icon" variant="ghost" onClick={enableNotify} aria-label="Activar avisos"><Bell /></Button>
          <Button size="icon" variant="ghost" onClick={() => supabase.auth.signOut()} aria-label="Salir"><LogOut /></Button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {([
          ["create", "Nuevo grupo", Plus],
          ["join", "Unirme", Radio],
          ["dm", "Contacto", User],
        ] as const).map(([k, label, Icon]) => (
          <Button key={k} variant={tab === k ? "default" : "secondary"} className="h-16 flex-col gap-1 text-xs" onClick={() => setTab(tab === k ? null : k)}>
            <Icon className="size-5" />
            {label}
          </Button>
        ))}
      </div>

      {tab && (
        <form onSubmit={(e) => { e.preventDefault(); go(); }} className="mb-6 flex gap-2">
          <Input
            autoFocus
            className="h-11"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={tab === "create" ? "Nombre del grupo" : tab === "join" ? "Código (ej. A1B2C3)" : "Usuario de tu contacto"}
          />
          <Button type="submit" className="h-11">Listo</Button>
        </form>
      )}

      <ul className="space-y-2">
        {channels.length === 0 && (
          <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Crea un grupo y comparte su código, o agrega a un contacto por su usuario.
          </li>
        )}
        {channels.map((c) => (
          <li key={c.id}>
            <button onClick={() => onOpen(c.id)} className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left">
              <span className="grid size-10 place-items-center rounded-full bg-secondary">
                {c.kind === "group" ? <Users className="size-5" /> : <User className="size-5" />}
              </span>
              <span className="flex-1">
                <span className="block font-bold">{c.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.kind === "group" ? `${c.memberCount} personas · ${c.code}` : "Contacto"}
                </span>
              </span>
              {unread[c.id] ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{unread[c.id]}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
