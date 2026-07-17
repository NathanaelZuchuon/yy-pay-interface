"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { bffGet, bffPost } from "@/lib/bff-client";
import { RECHARGE_ORDER_STORAGE_KEY } from "@/lib/bundle-constants";
import type { components } from "@/types/schemas-auth";
import type { components as PaymentComponents } from "@/types/schemas-payment";
import { Loader2, Plus, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type UserAccountResponse = components["schemas"]["UserAccountResponse"];
type WalletResponse = PaymentComponents["schemas"]["WalletResponse"];
type WalletRechargeOrderResponse =
  PaymentComponents["schemas"]["WalletRechargeOrderResponse"];
type SessionContext = {
  organizationId: string | null;
  actorId: string | null;
  walletId: string | null;
};

type WalletCardProps = {
  onWalletChange?: (wallet: WalletResponse | null) => void;
};

function createRechargeIdempotencyKey(walletId: string) {
  return `wallet-${walletId}-recharge-${crypto.randomUUID()}`;
}

export function WalletCard({ onWalletChange }: WalletCardProps) {
  const [user, setUser] = useState<UserAccountResponse | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [context, setContext] = useState<SessionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [recharging, setRecharging] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const [me, sessionContext] = await Promise.all([
        bffGet<UserAccountResponse>("/api/session/me"),
        bffGet<SessionContext>("/api/session/context"),
      ]);
      setUser(me);
      setContext(sessionContext);
      const actorId = sessionContext.actorId ?? me.actorId;
      if (!actorId) {
        setWallet(null);
        onWalletChange?.(null);
        return;
      }
      try {
        const walletData = await bffGet<WalletResponse>(
          `/api/payments/wallets/owner/${actorId}`,
        );
        setWallet(walletData);
        onWalletChange?.(walletData);
      } catch {
        setWallet(null);
        onWalletChange?.(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible de charger le wallet",
      );
    } finally {
      setLoading(false);
    }
  }, [onWalletChange]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void loadWallet();
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [loadWallet]);

  async function handleCreateWallet() {
    const actorId = context?.actorId ?? user?.actorId;
    if (!actorId) return;
    setCreating(true);
    try {
      const created = await bffPost<WalletResponse>("/api/payments/wallets", {
        ownerId: actorId,
        ownerName: user?.username ?? user?.email ?? "Utilisateur",
      });
      setWallet(created);
      onWalletChange?.(created);
      toast.success("Wallet créé avec succès");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création du wallet impossible",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleRecharge() {
    if (!wallet?.id) return;
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setRecharging(true);
    try {
      const recharge = await bffPost<WalletRechargeOrderResponse>(
        `/api/payments/wallets/${wallet.id}/recharge`,
        {
          amount,
          currency: "XAF",
          provider: "MYCOOLPAY",
          method: "MOBILE_MONEY",
          idempotencyKey: createRechargeIdempotencyKey(wallet.id),
        },
      );

      if (recharge.orderId) {
        sessionStorage.setItem(RECHARGE_ORDER_STORAGE_KEY, recharge.orderId);
      }

      if (recharge.redirectUrl) {
        setDialogOpen(false);
        setRechargeAmount("");
        globalThis.location.assign(recharge.redirectUrl);
        return;
      }

      toast.error("URL de redirection MYCOOLPAY indisponible");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Recharge impossible",
      );
    } finally {
      setRecharging(false);
    }
  }

  if (loading) {
    return <Skeleton className="yypay:h-40 yypay:w-full" />;
  }

  return (
    <Card>
      <CardHeader className="yypay:flex yypay:flex-row yypay:items-start yypay:justify-between yypay:space-y-0">
        <div>
          <CardTitle className="yypay:flex yypay:items-center yypay:gap-2">
            <Wallet className="yypay:h-5 yypay:w-5 yypay:text-primary" />
            Mon wallet
          </CardTitle>
          <CardDescription>Solde et opérations</CardDescription>
        </div>
        {wallet && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Recharger">
                <Plus className="yypay:h-4 yypay:w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recharger le wallet</DialogTitle>
                <DialogDescription>
                  Paiement sécurisé via MYCOOLPAY. Le solde sera crédité après
                  confirmation du fournisseur.
                </DialogDescription>
              </DialogHeader>
              <div className="yypay:space-y-2">
                <Label htmlFor="amount">Montant (XAF)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleRecharge} disabled={recharging}>
                  {recharging && (
                    <Loader2 className="yypay:h-4 yypay:w-4 yypay:animate-spin" />
                  )}
                  Recharger via MYCOOLPAY
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!wallet ? (
          <div className="yypay:space-y-4">
            <p className="yypay:text-sm yypay:text-secondary">
              Vous n&apos;avez pas encore de wallet. Créez-en un pour commencer.
            </p>
            <Button onClick={handleCreateWallet} disabled={creating}>
              {creating && (
                <Loader2 className="yypay:h-4 yypay:w-4 yypay:animate-spin" />
              )}
              Créer mon wallet
            </Button>
          </div>
        ) : (
          <div>
            <p className="yypay:text-3xl yypay:font-bold yypay:text-navy">
              {wallet.balance?.toLocaleString("fr-FR") ?? 0}
            </p>
            <p className="yypay:mt-1 yypay:text-sm yypay:text-secondary">
              Dernière mise à jour :{" "}
              {wallet.updatedAt
                ? new Date(wallet.updatedAt).toLocaleString("fr-FR")
                : "-"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
