import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "@lovable.dev/cloud-auth-js/styles.css";

const GoogleG = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

export function AuthScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("No pudimos entrar: revisa tu correo y contraseña");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("Revisa tu correo para confirmar la cuenta");
    }
    setBusy(false);
  }

  async function social(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) toast.error("No se pudo iniciar sesión");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6 py-10">
      <div className="space-y-3">
        <img src="/icon-512.png" alt="" width={64} height={64} className="rounded-2xl" />
        <h1 className="text-4xl font-black tracking-tight">GiooTalk Flick</h1>
        <p className="text-muted-foreground">Mantén presionado y habla. Tus grupos y contactos, al instante.</p>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => social("google")}
          className="flex h-11 w-full items-center justify-center gap-[10px] rounded-full border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]"
        >
          <GoogleG />
          Continuar con Google
        </button>
        <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>
          Continue with Lovable
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Input type="email" required placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        <Input type="password" required minLength={6} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-full font-bold">
          {mode === "in" ? "Entrar" : "Crear cuenta"}
        </Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-muted-foreground underline">
          {mode === "in" ? "¿No tienes cuenta? Crea una" : "Ya tengo cuenta"}
        </button>
      </form>
    </main>
  );
}
