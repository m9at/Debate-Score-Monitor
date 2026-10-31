import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BTN, BTN_SIZE } from "@/lib/brand";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setInstalled(standalone.matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setInstructionsOpen(false);
    };
    updateInstalled();
    standalone.addEventListener("change", updateInstalled);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      standalone.removeEventListener("change", updateInstalled);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) {
      setInstructionsOpen(true);
      return;
    }
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      setInstructionsOpen(true);
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={install}
        disabled={busy}
        className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
        data-testid="install-app-button"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        تثبيت التطبيق
      </button>
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent dir="rtl" className="w-[calc(100%-2rem)] rounded-2xl text-right">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>تثبيت مناظرات عُمان</DialogTitle>
            <DialogDescription>
              افتح رابط الموقع المنشور مباشرة في المتصفح، وليس داخل نافذة المعاينة.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 text-sm leading-7 list-disc pr-5">
            <li><strong>iPhone وiPad:</strong> افتح الموقع في Safari، ثم «مشاركة» ← «إضافة إلى الشاشة الرئيسية»، وفعّل «فتح كتطبيق ويب» إذا ظهر.</li>
            <li><strong>Android:</strong> افتح الموقع في Chrome، ثم قائمة ⋮ ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li>
            <li><strong>الكمبيوتر:</strong> افتح الموقع في Chrome أو Edge، ثم اضغط أيقونة التثبيت في شريط العنوان أو خيار تثبيت الموقع من قائمة المتصفح.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-6">
            يتطلب التثبيت رابط HTTPS ومتصفحًا يدعم PWA. يبقى الاتصال بالإنترنت مطلوبًا لتسجيل الدخول ومزامنة بيانات البطولات.
          </p>
          <Button onClick={() => setInstructionsOpen(false)}>حسنًا</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
