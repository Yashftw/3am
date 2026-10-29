import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, DollarSign, FileText, Loader2, Save, ShieldCheck, Smartphone, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/lib/user-context";
import { useCurrency, type Currency } from "@/lib/currency-context";
import { useSync } from "@/lib/sync-status";
import { useReports } from "@/lib/reports-context";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { PhoneWidgetPanel } from "@/components/settings/PhoneWidgetPanel";
import { formatMonthKey, previousMonthKey, relativeTime } from "@/lib/date-utils";
import { EASE_OUT, spring, tap } from "@/lib/motion";

const SECTIONS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "display", icon: DollarSign, label: "Display" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "reports", icon: FileText, label: "Reports" },
  { id: "phone", icon: Smartphone, label: "On your phone" },
  { id: "data", icon: ShieldCheck, label: "Your data" },
];

const Settings = () => {
  const { user, username, setUsernameOverride } = useUser();
  const { currency: globalCurrency, setCurrency: setGlobalCurrency } = useCurrency();
  const { state: syncState, lastSyncedAt } = useSync();
  const { availableMonths, downloadReport, isGenerating, promptFor } = useReports();

  const [name, setName] = useState(username);
  const [email, setEmail] = useState("");
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    setName(username);
    if (user?.email) setEmail(user.email);
  }, [username, user]);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const q = query(collection(db, "settings"), where("user_id", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) return;
        const data = snap.docs[0].data();
        setSettingsId(snap.docs[0].id);
        if (data.priceAlerts !== undefined) setPriceAlerts(data.priceAlerts);
        if (data.weeklyDigest !== undefined) setWeeklyDigest(data.weeklyDigest);
        if (data.currency !== undefined) setGlobalCurrency(data.currency as Currency);
      } catch (err) {
        console.error("[3am] Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, [user, setGlobalCurrency]);

  const handleNotificationToggle = async (type: "price" | "weekly", value: boolean) => {
    if (type === "price") setPriceAlerts(value);
    if (type === "weekly") setWeeklyDigest(value);

    if (value && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied by your browser.");
        if (type === "price") setPriceAlerts(false);
        if (type === "weekly") setWeeklyDigest(false);
      }
    }
  };

  const save = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      if (name !== username) {
        await updateProfile(user, { displayName: name });
        setUsernameOverride(name);
      }

      const targetId = settingsId ?? crypto.randomUUID();
      if (!settingsId) setSettingsId(targetId);

      await setDoc(
        doc(db, "settings", targetId),
        { user_id: user.uid, priceAlerts, weeklyDigest, currency: globalCurrency },
        { merge: true },
      );

      toast.success("Settings saved", { description: "Synced across all your devices." });
    } catch (err) {
      toast.error("Failed to save settings", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const lastClosedMonth = previousMonthKey();

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <main className="mx-auto max-w-[1200px] px-6 py-12 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.75, ease: EASE_OUT }}
          className="mb-12"
        >
          <p className="eyebrow mb-4">Preferences</p>
          <h1 className="display-font text-5xl text-gradient md:text-7xl">SETTINGS</h1>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
          {/* Section nav with a sliding indicator */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className="relative flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                >
                  {activeSection === s.id && (
                    <motion.span
                      layoutId="settings-nav"
                      className="absolute inset-0 border border-white/10 bg-white/[0.06]"
                      transition={spring.layout}
                    />
                  )}
                  <s.icon
                    className={`relative z-[1] h-4 w-4 transition-colors ${
                      activeSection === s.id ? "text-white" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`relative z-[1] transition-colors ${
                      activeSection === s.id ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            {/* Profile */}
            <SpotlightCard id="profile" className="scroll-mt-24 rounded-sm p-8" reveal>
              <h2 className="display-font mb-1 text-2xl">Profile</h2>
              <p className="mb-6 text-sm text-muted-foreground">Your personal account details.</p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="eyebrow">Display name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="hud-input"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="eyebrow">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="hud-input cursor-not-allowed opacity-50"
                    placeholder="your@email.com"
                  />
                  <p className="mt-1 text-xs text-muted-foreground/50">Email cannot be changed.</p>
                </div>
              </div>
            </SpotlightCard>

            {/* Display */}
            <SpotlightCard id="display" className="scroll-mt-24 rounded-sm p-8" reveal delay={0.05}>
              <h2 className="display-font mb-1 text-2xl">Display</h2>
              <p className="mb-6 text-sm text-muted-foreground">How values appear across your dashboard.</p>
              <div className="max-w-xs space-y-2">
                <Label className="eyebrow">Base currency</Label>
                <div className="relative flex gap-1 border border-white/10 bg-white/[0.02] p-1">
                  {(["INR", "USD"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGlobalCurrency(c)}
                      className="relative flex-1 px-4 py-2 text-sm"
                    >
                      {globalCurrency === c && (
                        <motion.span
                          layoutId="settings-currency"
                          className="absolute inset-0 bg-white"
                          transition={spring.layout}
                        />
                      )}
                      <span
                        className={`mono-font relative z-[1] transition-colors ${
                          globalCurrency === c ? "text-black" : "text-muted-foreground"
                        }`}
                      >
                        {c === "INR" ? "₹ INR" : "$ USD"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* Notifications */}
            <SpotlightCard id="notifications" className="scroll-mt-24 rounded-sm p-8" reveal delay={0.1}>
              <h2 className="display-font mb-1 text-2xl">Notifications</h2>
              <p className="mb-6 text-sm text-muted-foreground">Stay informed without the noise.</p>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-medium">Budget alerts</p>
                    <p className="text-sm text-muted-foreground">Notify when a category nears its limit</p>
                  </div>
                  <Switch checked={priceAlerts} onCheckedChange={(v) => handleNotificationToggle("price", v)} />
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-medium">Weekly digest</p>
                    <p className="text-sm text-muted-foreground">A summary every Monday morning</p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={(v) => handleNotificationToggle("weekly", v)} />
                </div>
              </div>
            </SpotlightCard>

            {/* Reports */}
            <SpotlightCard id="reports" className="scroll-mt-24 rounded-sm p-8" reveal delay={0.15}>
              <h2 className="display-font mb-1 text-2xl">Reports</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                At the end of each month you'll be offered a PDF of your spending and progress.
                You can also pull any month on demand.
              </p>

              <div className="mb-5 flex flex-wrap gap-2">
                {availableMonths.slice(0, 8).map((m) => (
                  <motion.button
                    key={m}
                    type="button"
                    whileTap={tap}
                    onClick={() => downloadReport(m)}
                    disabled={isGenerating}
                    className="ghost-button px-3 py-1.5 text-xs"
                  >
                    {formatMonthKey(m)}
                  </motion.button>
                ))}
              </div>

              <motion.button
                type="button"
                whileTap={tap}
                onClick={() => promptFor(lastClosedMonth)}
                className="ghost-button flex items-center gap-2 px-4 py-2 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Preview the {formatMonthKey(lastClosedMonth)} summary
              </motion.button>
            </SpotlightCard>

            <PhoneWidgetPanel />

            {/* Data */}
            <SpotlightCard id="data" className="scroll-mt-24 rounded-sm p-8" reveal delay={0.2}>
              <h2 className="display-font mb-1 text-2xl">Your data</h2>
              <p className="mb-6 text-sm text-muted-foreground">Where everything you log actually lives.</p>

              <div className="space-y-4 text-sm">
                <div className="surface-well flex items-start gap-3 rounded-sm p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
                  <div>
                    <p className="font-medium text-white">Saved twice, always</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      Every entry is written to this device the moment you log it, then synced to your
                      account. If you're offline, it waits in a queue and uploads itself when you're back —
                      even if you close the app in between.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-muted-foreground">Sync status</span>
                  <span className="mono-font text-xs uppercase tracking-wider text-white">
                    {syncState === "offline"
                      ? "Offline — queued"
                      : syncState === "saving"
                        ? "Saving"
                        : syncState === "error"
                          ? "Retrying"
                          : "Up to date"}
                  </span>
                </div>
                {lastSyncedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last synced</span>
                    <span className="mono-font text-xs text-white/70">
                      {relativeTime(new Date(lastSyncedAt).toISOString())}
                    </span>
                  </div>
                )}
              </div>
            </SpotlightCard>

            {/* Save */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="sticky bottom-4 z-20"
            >
              <div className="surface-card surface-solid flex items-center justify-between gap-4 rounded-sm p-5 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.9)]">
                <div>
                  <p className="text-sm font-medium">Save changes</p>
                  <p className="text-xs text-muted-foreground">Applies your name, currency and alerts.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setName(username)} className="rounded-sm">
                    Reset
                  </Button>
                  <Button
                    onClick={save}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-sm bg-white font-semibold text-black transition-colors hover:bg-gray-200"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
