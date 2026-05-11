import { useState } from "react";
import { BuyButton } from "@/components/BuyButton";
import { Check, Crown } from "lucide-react";

const Index = () => {
  const [isPro, setIsPro] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Crown className="h-3.5 w-3.5" />
            {isPro ? "Pro plan active" : "Upgrade to Pro"}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isPro ? "You're on Pro 🎉" : "Go Pro"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPro
              ? "Thanks for your payment. Enjoy all Pro features."
              : "Unlock all features for Ksh 50/week. Pay instantly with M-Pesa."}
          </p>
        </div>

        <ul className="space-y-2 text-sm">
          {["All premium features", "Priority support", "Cancel anytime"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="rounded-lg bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary">
            Pro unlocked
          </div>
        ) : (
          <BuyButton
            amount={50}
            accountReference="ProWeekly"
            description="Pro weekly"
            className="w-full"
            onSuccess={() => setIsPro(true)}
          >
            Ksh 50/week
          </BuyButton>
        )}
      </div>
    </div>
  );
};

export default Index;
