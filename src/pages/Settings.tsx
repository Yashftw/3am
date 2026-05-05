import { motion } from "framer-motion";
import { Bell, DollarSign, Palette, Shield, User, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/lib/user-context";
import { useCurrency } from "@/lib/currency-context";

const Settings = () => {
  const { username, setUsername } = useUser();
  const { currency: globalCurrency, setCurrency: setGlobalCurrency } = useCurrency();
  const [name, setName] = useState(username);
  const [email, setEmail] = useState("");
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  useEffect(() => {
    setName(username);
  }, [username]);

  const sections = [
    { icon: User, label: "Profile" },
    { icon: DollarSign, label: "Display" },
    { icon: Bell, label: "Notifications" },
    { icon: Shield, label: "Security" },
    { icon: Save, label: "Save Changes", customId: "save-changes" },
  ];

  const save = () => {
    setUsername(name);
    toast.success("Settings saved", { description: "Your preferences have been updated." });
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <main className="px-6 md:px-12 py-12 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary mono-font mb-4">◆ Preferences</p>
          <h1 className="display-font text-5xl md:text-7xl">SETTINGS</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
          {/* Section nav */}
          <aside className="space-y-1">
            {sections.map((s, i) => (
              <a
                key={s.label}
                href={`#${s.customId || s.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors hover:bg-secondary/60 ${
                  i === 0 ? "bg-secondary text-foreground" : "text-muted-foreground"
                } ${s.label === "Save Changes" ? "mt-4 border border-white/10" : ""}`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </a>
            ))}
          </aside>

          <div className="space-y-6">
            {/* Profile */}
            <motion.section
              id="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-sm p-8 shadow-elegant"
            >
              <h2 className="display-font text-2xl mb-1">Profile</h2>
              <p className="text-sm text-muted-foreground mb-6">Your personal account details.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Display Name
                  </Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/50" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Email (Optional)
                  </Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/50" placeholder="your@email.com" />
                </div>
              </div>
            </motion.section>

            {/* Display */}
            <motion.section
              id="display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="glass-card rounded-sm p-8 shadow-elegant"
            >
              <h2 className="display-font text-2xl mb-1">Display</h2>
              <p className="text-sm text-muted-foreground mb-6">How values appear across your dashboard.</p>
              <div className="space-y-2 max-w-xs">
                <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Base Currency</Label>
                <div className="flex gap-2">
                  {(["INR", "USD"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setGlobalCurrency(c)}
                      className={`flex-1 px-4 py-2 rounded-sm mono-font text-sm transition-all ${
                        globalCurrency === c
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c === "INR" ? "₹ INR" : "$ USD"}
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Notifications */}
            <motion.section
              id="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card rounded-sm p-8 shadow-elegant"
            >
              <h2 className="display-font text-2xl mb-1">Notifications</h2>
              <p className="text-sm text-muted-foreground mb-6">Stay informed without the noise.</p>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Price alerts</p>
                    <p className="text-sm text-muted-foreground">Notify on big swings (&gt;5%)</p>
                  </div>
                  <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly digest</p>
                    <p className="text-sm text-muted-foreground">A summary every Monday morning</p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>
              </div>
            </motion.section>

            {/* Security */}
            <motion.section
              id="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="glass-card rounded-sm p-8 shadow-elegant"
            >
              <h2 className="display-font text-2xl mb-1">Security</h2>
              <p className="text-sm text-muted-foreground mb-6">Protect your account.</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-factor authentication</p>
                  <p className="text-sm text-muted-foreground">Required for sensitive actions</p>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </div>
            </motion.section>

            {/* Save Changes Section */}
            <motion.section
              id="save-changes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card rounded-sm p-8 shadow-elegant border-primary/20"
            >
              <h2 className="display-font text-2xl mb-1">Save Changes</h2>
              <p className="text-sm text-muted-foreground mb-6">Apply and save all your updated preferences.</p>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 max-w-[150px]">Cancel</Button>
                <Button onClick={save} className="flex-1 max-w-[200px] bg-white text-black hover:bg-gray-200 transition-colors font-semibold">
                  Save Settings
                </Button>
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
