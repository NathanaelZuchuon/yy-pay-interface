"use client";

import { useConsoleData } from "@/components/console/console-data-provider";
import { PlansGrid } from "@/components/console/plans-grid";

export default function PlansPage() {
  const { refreshKey } = useConsoleData();

  return (
    <>
      <div className="yypay:mb-8">
        <h1 className="yypay:text-2xl yypay:font-bold yypay:text-foreground sm:yypay:text-3xl">
          Plans disponibles
        </h1>
        <p className="yypay:mt-2 yypay:text-muted-foreground">
          Souscrivez à un plan adapté à vos besoins.
        </p>
      </div>
      <PlansGrid refreshKey={refreshKey} />
    </>
  );
}
