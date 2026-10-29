import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toasts styled as the app's own surface.
 *
 * Theme is pinned to dark rather than read from next-themes: 3am has no light
 * mode, and letting the OS preference through produced white toasts on a
 * black page.
 *
 * Placement is responsive for a reason. On desktop, bottom-right keeps
 * confirmations out of the way of the entry form. On a phone that same corner
 * sits directly on top of the Add button and the thumb that just pressed it,
 * so toasts move to the top where they cover nothing you are about to touch.
 *
 * The bottom offset clears the sticky save bar on Settings, which the old
 * 20px offset overlapped.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme="dark"
      position={isMobile ? "top-center" : "bottom-right"}
      offset={isMobile ? 12 : 28}
      // Everything here is a confirmation, not a decision. Three seconds is
      // long enough to read one line and short enough to never be in the way.
      duration={3000}
      closeButton
      // Collapsed is Sonner's default: the toast behind peeks out as a bare
      // card edge with no text, which reads as a rendering fault rather than
      // a second message. Raising a limit fires two at once, so both need to
      // be readable.
      expand
      gap={10}
      visibleToasts={3}
      className="toaster group"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast hud-toast !rounded-sm !border-white/12 !bg-[#0f0f0f]/95 !text-foreground !backdrop-blur-xl !shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] !font-sans",
          title: "!text-sm !font-medium !text-white",
          description: "!text-xs !text-muted-foreground group-[.toast]:!text-muted-foreground",
          actionButton: "!rounded-sm !bg-white !text-black !font-semibold",
          cancelButton: "!rounded-sm !bg-white/10 !text-muted-foreground",
          closeButton:
            "!rounded-sm !border-white/15 !bg-[#141414] !text-muted-foreground hover:!text-white hover:!border-white/30",
          icon: "!text-white",
          success: "!border-white/15",
          warning: "!border-[#FF9500]/40",
          error: "!border-[#FF4060]/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
