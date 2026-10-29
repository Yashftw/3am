import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Smartphone } from "lucide-react";
import { WIDGET_VIEWS, type WidgetView } from "@/pages/Widget";
import { toast } from "sonner";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { Switch } from "@/components/ui/switch";
import { useBadge } from "@/lib/badge-sync";
import { spring, tap } from "@/lib/motion";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

const STEPS: Record<Platform, { title: string; steps: string[] }> = {
  ios: {
    title: "On iPhone",
    steps: [
      "Open this page in Safari (not Chrome — only Safari can install).",
      "Tap the Share button, then Add to Home Screen.",
      "Name the tile after the view, for example “Tasks”.",
      "Repeat for any other view you want its own tile for.",
    ],
  },
  android: {
    title: "On Android",
    steps: [
      "Open this page in Chrome.",
      "Tap the ⋮ menu, then Add to Home screen.",
      "Repeat for any other view you want its own tile for.",
      "Long-press the main 3am icon for Tasks, Training and Spending shortcuts.",
    ],
  },
  desktop: {
    title: "On desktop",
    steps: [
      "Click the install icon in your browser's address bar.",
      "The app opens in its own window.",
      "Pin it to your taskbar or dock to see the icon badge.",
    ],
  },
};

/**
 * Getting the summary onto a phone.
 *
 * Neither iOS nor Android lets a web app publish a real home-screen widget —
 * WidgetKit and App Widgets are native-only surfaces. Rather than pretend
 * otherwise, this panel sets up the two things that genuinely work: a
 * home-screen tile that opens straight to the glanceable summary, and a live
 * number on the app icon.
 */
export const PhoneWidgetPanel = () => {
  const { mode, setMode, supported, installed, value } = useBadge();
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [selected, setSelected] = useState<WidgetView>("overview");
  const [copied, setCopied] = useState<WidgetView | null>(null);

  useEffect(() => setPlatform(detectPlatform()), []);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const current = WIDGET_VIEWS.find((v) => v.id === selected)!;
  const widgetUrl = `${origin}${current.path}`;
  const guide = STEPS[platform];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(widgetUrl);
      setCopied(selected);
      setTimeout(() => setCopied(null), 2000);
      toast.success(`${current.name} link copied`, {
        description: "Open it on your phone, then Add to Home Screen.",
      });
    } catch {
      toast.error("Couldn't copy", { description: widgetUrl });
    }
  };

  const toggleBadge = async (on: boolean) => {
    try {
      await setMode(on ? "budget" : "off");
      if (on) toast.success("Icon badge on", { description: "Your icon now shows percent of budget used." });
    } catch (err) {
      toast.error("Badge unavailable", {
        description: err instanceof Error ? err.message : "Your browser blocked it.",
      });
    }
  };

  return (
    <SpotlightCard id="phone" className="scroll-mt-24 rounded-sm p-8" reveal delay={0.2}>
      <div className="mb-1 flex items-center gap-2.5">
        <Smartphone className="h-4 w-4 text-white/70" />
        <h2 className="display-font text-2xl">On your phone</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Each of these is its own address, so you can put as many on your home screen
        as you like - one tile for tasks, another for training.
      </p>

      {/* Pick which tile */}
      <div className="mb-5 space-y-2">
        {WIDGET_VIEWS.map((v) => {
          const active = v.id === selected;
          return (
            <motion.button
              key={v.id}
              type="button"
              onClick={() => setSelected(v.id)}
              whileTap={tap}
              transition={spring.gentle}
              aria-pressed={active}
              className={`flex w-full items-center gap-3 border p-3.5 text-left transition-colors ${
                active
                  ? "border-white/40 bg-white/[0.07]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                  active ? "bg-white shadow-[0_0_8px_#fff]" : "bg-white/25"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${active ? "text-white" : "text-muted-foreground"}`}>
                  {v.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground/60">{v.blurb}</span>
              </span>
              <code className="mono-font hidden shrink-0 text-[10px] text-white/30 sm:block">
                {v.path}
              </code>
            </motion.button>
          );
        })}
      </div>

      {/* Preview whichever is selected */}
      <Link to={current.path} className="group/preview mb-6 block">
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={tap}
          transition={spring.gentle}
          className="hud-readout hud-frame relative flex items-center justify-between gap-4 p-4"
        >
          <div>
            <p className="hud-label mb-1">Preview</p>
            <p className="text-sm text-white">Open the {current.name.toLowerCase()} tile</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover/preview:text-white" />
        </motion.div>
      </Link>

      {/* Instructions */}
      <div className="mb-6">
        <p className="hud-label mb-3">{guide.title}</p>
        <ol className="space-y-2.5">
          {guide.steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mono-font mt-0.5 shrink-0 text-[10px] text-white/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <motion.button
          type="button"
          whileTap={tap}
          onClick={copy}
          className="ghost-button mt-4 flex items-center gap-2 px-3 py-2 text-xs"
        >
          {copied === selected ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied === selected ? "Copied" : `Copy the ${current.name.toLowerCase()} link`}
        </motion.button>
      </div>

      {/* Icon badge */}
      <div className="border-t border-white/5 pt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="font-medium">Live number on the app icon</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Shows the percent of your monthly funds used, updated as you log.
              {mode !== "off" && value !== null && (
                <span className="text-white"> Currently {value}.</span>
              )}
            </p>
          </div>
          <Switch
            checked={mode !== "off"}
            onCheckedChange={toggleBadge}
            disabled={!supported}
            aria-label="Show a number on the app icon"
          />
        </div>

        {!supported ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
            Your browser doesn't support icon badges. Android Chrome in particular never
            implemented this — the tile above still works there.
          </p>
        ) : !installed ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
            Install the app to your home screen first — badges only appear on an installed icon.
          </p>
        ) : null}
      </div>

      {/* The honest caveat */}
      <p className="mt-6 border-t border-white/5 pt-5 text-xs leading-relaxed text-muted-foreground/60">
        These are tiles you tap, not live widgets. The resizable kind that renders
        without opening anything can only be built by a native app — iOS and Android
        both keep those surfaces closed to web apps — so tiles and the icon badge are
        as far as this goes without a separate native build.
      </p>
    </SpotlightCard>
  );
};
