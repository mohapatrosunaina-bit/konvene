"use client";

import { useEffect, useRef } from "react";

interface Props {
  onScan: (decodedText: string) => void;
  active: boolean;
}

export function QrScanner({ onScan, active }: Props) {
  const containerId = "qr-reader";
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText: string) => onScan(decodedText),
          () => {}
        )
        .catch((err: unknown) => console.error("Camera start failed", err));
    });

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return <div id={containerId} className="mx-auto w-full max-w-xs overflow-hidden rounded-xl" />;
}
