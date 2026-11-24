import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { AuthScreen } from "@/components/walkie/AuthScreen";
import { WalkieApp } from "@/components/walkie/WalkieApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GiooTalk Flick — Walkie-talkie con grupos y chat" },
      { name: "description", content: "Mantén presionado y habla: mensajes de voz y texto con grupos y contactos." },
      { property: "og:title", content: "GiooTalk Flick — Walkie-talkie con grupos y chat" },
      { property: "og:description", content: "Mantén presionado y habla: mensajes de voz y texto con grupos y contactos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, ready } = useSession();
  if (!ready) return <div className="min-h-screen" />;
  return session ? <WalkieApp key={session.user.id} session={session} /> : <AuthScreen />;
}
