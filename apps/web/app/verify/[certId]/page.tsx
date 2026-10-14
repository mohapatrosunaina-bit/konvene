"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";

interface VerifyResult {
  valid: boolean;
  holderName?: string;
  eventTitle?: string;
  club?: string;
  issuedAt?: string;
  certId?: string;
}

export default function VerifyPage() {
  const { certId } = useParams<{ certId: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    api<VerifyResult>(`/verify/${certId}`).then(setResult).catch(() => setResult({ valid: false }));
  }, [certId]);

  if (!result) {
    return <div className="mx-auto h-48 max-w-md animate-pulse border-[1.5px] border-ink bg-paperAlt" />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
      {result.valid ? (
        <div className="card bg-paper p-10">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-ink bg-moss">
              <CheckCircle2 className="h-7 w-7 text-paper" />
            </div>
          </div>
          <h1 className="font-display text-xl font-semibold italic text-moss">Certificate Verified</h1>
          <p className="mt-5 font-display text-2xl font-semibold">{result.holderName}</p>
          <p className="mt-1 text-inkSoft">participated in {result.eventTitle}</p>
          <p className="text-sm text-inkSoft">organized by {result.club}</p>
          <p className="mt-6 font-mono text-xs text-inkSoft">Certificate ID: {result.certId}</p>
        </div>
      ) : (
        <div className="card bg-paper p-10">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-ink bg-berry">
              <XCircle className="h-7 w-7 text-paper" />
            </div>
          </div>
          <h1 className="font-display text-xl font-semibold italic text-berry">Certificate Not Found</h1>
          <p className="mt-2 text-inkSoft">This certificate ID does not match any issued certificate.</p>
        </div>
      )}
    </motion.div>
  );
}
