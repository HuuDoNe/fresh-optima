"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as app)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // Listen for Chrome/Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else if (isIos) {
      setShowIosTip(true);
    } else {
      // General instructions for browsers where prompt wasn't captured
      alert("Để cài đặt FreshOptima thành App:\n- Trên Chrome/Cốc Cốc: Nhấn vào biểu tượng Cài đặt trên thanh địa chỉ hoặc Menu (⋮) -> 'Cài đặt ứng dụng'.\n- Trên điện thoại: Nhấn Menu -> 'Thêm vào màn hình chính'.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
        title="Cài đặt FreshOptima như một ứng dụng trên điện thoại/máy tính"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cài App</span>
      </button>

      {/* iOS Guide Modal */}
      {showIosTip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                📲
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Cài FreshOptima trên iPhone</h3>
                <p className="text-xs text-zinc-500">Mở toàn màn hình không viền trình duyệt</p>
              </div>
            </div>

            <div className="text-xs text-zinc-600 space-y-2 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <p>1. Bấm nút <strong>Chia sẻ (biểu tượng mũi tên ⬆️)</strong> ở dưới thanh trình duyệt Safari.</p>
              <p>2. Cuộn xuống chọn <strong>&quot;Thêm vào MH chính&quot; (Add to Home Screen)</strong>.</p>
              <p>3. Bấm <strong>&quot;Thêm&quot;</strong> ở góc trên bên phải là xong!</p>
            </div>

            <button
              type="button"
              onClick={() => setShowIosTip(false)}
              className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
