import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  amount: number;
  accountReference?: string;
  description?: string;
  productId?: string;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (receipt: string) => void;
};

type Status = "idle" | "submitting" | "pending" | "success" | "failed";

export function BuyButton({
  amount, accountReference, description, productId, className, children, onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const pollRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
  }, []);

  const reset = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
    setStatus("idle");
    setMessage("");
  };

  const startPolling = (checkoutId: string) => {
    let attempts = 0;
    pollRef.current = window.setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from("mpesa_transactions")
        .select("status, result_desc, mpesa_receipt_number")
        .eq("checkout_request_id", checkoutId)
        .maybeSingle();

      if (data?.status === "success") {
        window.clearInterval(pollRef.current!);
        setStatus("success");
        setMessage(`Payment received. Receipt: ${data.mpesa_receipt_number}`);
        toast.success("Payment successful");
        onSuccess?.(data.mpesa_receipt_number ?? "");
      } else if (data?.status === "failed") {
        window.clearInterval(pollRef.current!);
        setStatus("failed");
        setMessage(data.result_desc ?? "Payment failed");
        toast.error(data.result_desc ?? "Payment failed");
      } else if (attempts > 40) {
        window.clearInterval(pollRef.current!);
        setStatus("failed");
        setMessage("Timed out waiting for payment confirmation.");
      }
    }, 3000);
  };

  const handlePay = async () => {
    setStatus("submitting");
    setMessage("");
    const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
      body: {
        phone,
        amount,
        accountReference: accountReference ?? productId ?? "Order",
        description: description ?? "Purchase",
      },
    });

    if (error || !data?.checkoutRequestId) {
      setStatus("failed");
      setMessage(error?.message ?? data?.error ?? "Could not initiate payment");
      toast.error("Could not initiate payment");
      return;
    }

    setStatus("pending");
    setMessage("Check your phone and enter your M-Pesa PIN to complete payment.");
    startPolling(data.checkoutRequestId);
  };

  return (
    <>
      <Button
        className={className}
        onClick={() => { reset(); setOpen(true); }}
      >
        {children ?? `Buy for KES ${amount.toLocaleString()}`}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with M-Pesa</DialogTitle>
            <DialogDescription>
              Amount: <strong>KES {amount.toLocaleString()}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
            <Input
              id="mpesa-phone"
              placeholder="07xx xxx xxx or 2547xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={status === "submitting" || status === "pending"}
              inputMode="tel"
            />
            {message && (
              <p className={`text-sm ${status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                {message}
              </p>
            )}
          </div>

          <DialogFooter>
            {status === "success" ? (
              <Button onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <Button
                onClick={handlePay}
                disabled={!phone || status === "submitting" || status === "pending"}
              >
                {(status === "submitting" || status === "pending") && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {status === "pending" ? "Waiting for confirmation…" : `Pay KES ${amount.toLocaleString()}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BuyButton;
