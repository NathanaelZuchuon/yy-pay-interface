import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "yypay:inline-flex yypay:items-center yypay:rounded-full yypay:px-2.5 yypay:py-0.5 yypay:text-xs yypay:font-medium",
  {
    variants: {
      variant: {
        default: "yypay:bg-primary/10 yypay:text-primary",
        secondary: "yypay:bg-muted yypay:text-secondary",
        success: "yypay:bg-emerald-100 yypay:text-emerald-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
