"use client";

import { useState, useEffect } from "react";
import { Download, Check } from "lucide-react";

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Capturar o evento de instalação
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
      console.log("PWA: Pronto para instalar 🔥");
    };

    // 2. Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
       setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar o prompt nativo
    deferredPrompt.prompt();

    // Esperar a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Escolha do usuário: ${outcome}`);

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsInstalled(true);
    }
  };

  if (isInstalled || !isVisible) return null;

  return (
    <button
      id="installButton"
      onClick={handleInstallClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 mb-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm"
    >
      <Download size={18} />
      <span>Instalar Studio Paty Heinz 📱</span>
    </button>
  );
}
