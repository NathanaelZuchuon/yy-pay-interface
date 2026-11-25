import type { PaymentActivitySource } from "@/lib/payment-activity";
import {
  ArrowDownToLine,
  CreditCard,
  Package,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const ACTIVITY_SOURCE_ICONS: Record<PaymentActivitySource, LucideIcon> = {
  wallet: Wallet,
  recharge_order: ArrowDownToLine,
  payment_order: CreditCard,
  plan_order: Tag,
  bundle_order: Package,
};
