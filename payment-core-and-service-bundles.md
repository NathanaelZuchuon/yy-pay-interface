# Payment Core & Service Bundle Checkout

Cette documentation décrit deux usages :

1. encaisser un paiement générique via `payment-core` ;
2. vendre un ensemble de services à la carte, avec prix calculé côté serveur, puis activer les services après paiement.

Base URL production :

```text
https://kernel-core.yowyob.com/kernel-api
```

## Authentification serveur-à-serveur

Les APIs applicatives s'appellent avec une ClientApplication Kernel :

```http
X-Client-Id: <client-id>
X-Api-Key: <api-key>
X-Tenant-Id: <tenant-id>
Content-Type: application/json
```

`PAYMENT` n'est plus un service allouable : une app authentifiée peut utiliser `payment-core` sans recevoir le service `PAYMENT` dans ses `allowedServices`.

## Paiement générique

### Initier un paiement

```http
POST /api/payments/orders
```

Body :

```json
{
  "clientId": "business-core",
  "serviceCode": "ORDER",
  "idempotencyKey": "order-123",
  "amount": 100,
  "currency": "XAF",
  "provider": "MYCOOLPAY",
  "method": "MOBILE_MONEY",
  "payerReference": "+237690295069",
  "description": "Paiement commande #123",
  "callbackUrl": "https://mon-backend.example.com/payments/callback"
}
```

Champs :

- `clientId` : app métier qui demande le paiement.
- `serviceCode` : usage métier libre (`ORDER`, `SERVICE_BUNDLE`, `SUBSCRIPTION`, etc.).
- `idempotencyKey` : clé unique métier. Deux appels avec la même clé retournent le même encaissement.
- `amount` : montant validé côté serveur appelant. Ne jamais prendre ce montant directement du front.
- `currency` : `XAF`, `EUR`, etc.
- `provider` : `MYCOOLPAY` ou `STRIPE`.
- `method` : `MOBILE_MONEY` ou `CARD`.
- `payerReference` : numéro mobile money, email ou référence payeur selon provider.
- `callbackUrl` : webhook optionnel de l'app appelante quand le paiement devient final.

Réponse :

```json
{
  "success": true,
  "data": {
    "id": "payment-order-uuid",
    "status": "PENDING",
    "providerReference": "provider-ref",
    "redirectUrl": "https://my-coolpay.com/payment/checkout/provider-ref"
  }
}
```

### Lire un paiement

```http
GET /api/payments/orders/{id}
```

### Rafraîchir le statut fournisseur

```http
POST /api/payments/orders/{id}/refresh
```

### Historique

```http
GET /api/payments/orders?limit=50
```

### Callback fournisseur

Route générique :

```http
POST /api/payments/orders/callbacks/{provider}
```

`provider` vaut `MYCOOLPAY` ou `STRIPE`.

Pour MyCoolPay, body attendu :

```json
{
  "transaction_ref": "provider-ref",
  "transaction_status": "SUCCESS"
}
```

Route dédiée MyCoolPay utilisable dans la console fournisseur :

```http
POST /yowyob-pay/api/v1/coolpay/callback
```

Statuts MyCoolPay reconnus :

- succès : `SUCCESS`, `SUCCESSFUL`, `COMPLETED`, `PAID` ;
- échec : `FAILED`, `CANCELED`, `CANCELLED`, `REJECTED` ;
- autre : reste `PENDING`.

## Service Bundle Checkout

Objectif : permettre à un owner d'acheter un ensemble de services qui n'est pas forcément un plan commercial.

Règle de sécurité : le front ne fournit jamais le montant. Le front choisit les services ; le Kernel calcule le prix depuis `payment_core.service_price`.

### Catalogue prix serveur

```http
GET /api/service-pricing
```

Réponse :

```json
{
  "success": true,
  "data": [
    { "serviceCode": "ACCOUNTING", "billingPeriod": "MONTHLY", "amount": 1000, "currency": "XAF" },
    { "serviceCode": "ACCOUNTING", "billingPeriod": "YEARLY", "amount": 10000, "currency": "XAF" }
  ]
}
```

Les prix initiaux sont seedés côté serveur. Les opérateurs peuvent les modifier en base dans `payment_core.service_price`.

### Calculer un devis

```http
POST /api/service-bundles/quote
```

Body :

```json
{
  "services": ["ACCOUNTING", "CASHIER", "TREASURY"],
  "billingPeriod": "MONTHLY"
}
```

Réponse :

```json
{
  "success": true,
  "data": {
    "billingPeriod": "MONTHLY",
    "lines": [
      { "serviceCode": "ACCOUNTING", "billingPeriod": "MONTHLY", "amount": 1000, "currency": "XAF" },
      { "serviceCode": "CASHIER", "billingPeriod": "MONTHLY", "amount": 1000, "currency": "XAF" },
      { "serviceCode": "TREASURY", "billingPeriod": "MONTHLY", "amount": 1000, "currency": "XAF" }
    ],
    "total": 3000,
    "currency": "XAF"
  }
}
```

### Lancer le checkout

```http
POST /api/service-bundles/checkout
```

Body :

```json
{
  "organizationId": "organization-uuid",
  "services": ["ACCOUNTING", "CASHIER", "TREASURY"],
  "billingPeriod": "MONTHLY",
  "clientId": "business-core",
  "provider": "MYCOOLPAY",
  "method": "MOBILE_MONEY",
  "payerReference": "+237690295069",
  "idempotencyKey": "org-uuid-accounting-cashier-treasury-2026-07"
}
```

Le backend :

1. valide que les services sont connus, allouables et abonnables ;
2. recalcule le total depuis `payment_core.service_price` ;
3. crée une commande `payment_core.service_bundle_order` ;
4. crée un `payment_core.payment_order` ;
5. retourne le lien de paiement provider.

Réponse :

```json
{
  "success": true,
  "data": {
    "orderId": "service-bundle-order-uuid",
    "paymentOrderId": "payment-order-uuid",
    "status": "PENDING_PAYMENT",
    "amount": 3000,
    "currency": "XAF",
    "redirectUrl": "https://my-coolpay.com/payment/checkout/provider-ref",
    "providerReference": "provider-ref"
  }
}
```

### Lire une commande bundle

```http
GET /api/service-bundles/orders/{orderId}
```

### Rafraîchir et activer les services

```http
POST /api/service-bundles/orders/{orderId}/refresh
```

Si le paiement lié est `SUCCESS`, le Kernel appelle l'API interne d'abonnement organisation pour chaque service, puis passe la commande bundle à `ACTIVE`.

Statuts bundle :

- `PENDING_PAYMENT` ;
- `ACTIVE` ;
- `FAILED` ;
- `CANCELLED`.

### Historique bundle

```http
GET /api/service-bundles/orders?limit=50
```

## Usage hors Kernel

Une application externe doit :

1. obtenir une ClientApplication (`clientId` + `apiKey`) ;
2. envoyer `X-Client-Id`, `X-Api-Key`, `X-Tenant-Id` ;
3. appeler soit les APIs payment génériques, soit les APIs service-bundles ;
4. ne jamais envoyer un montant choisi par le front pour les bundles.

Exemple quote hors Kernel :

```bash
curl -X POST "https://kernel-core.yowyob.com/kernel-api/api/service-bundles/quote" \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: business-core" \
  -H "X-Api-Key: <api-key>" \
  -H "X-Tenant-Id: 11111111-1111-1111-1111-111111111111" \
  -d '{
    "services": ["ACCOUNTING", "CASHIER"],
    "billingPeriod": "MONTHLY"
  }'
```

## Paiement des plans commerciaux par défaut

Les plans commerciaux existent déjà côté organisation (`STARTER`, `COMMERCE`, `FINANCE`, `OPERATIONS`, `ENTERPRISE`). Le flux de paiement ajoute une couche checkout sans recréer le catalogue.

Le front ne transmet jamais le montant. Il choisit seulement :

- le `planCode` ;
- les `addOnCodes` compatibles ;
- la période (`MONTHLY` ou `YEARLY`) ;
- le provider et la référence payeur.

Le Kernel calcule le prix à partir des services inclus dans le plan + add-ons et de la table `payment_core.service_price`.

### Obtenir un devis de plan

```http
POST /api/commercial-plans/{planCode}/quote
```

Exemple :

```json
{
  "addOnCodes": ["POINT_OF_SALE_ADDON"],
  "billingPeriod": "MONTHLY"
}
```

Réponse :

```json
{
  "success": true,
  "data": {
    "plan": {"code": "COMMERCE"},
    "addOns": [{"code": "POINT_OF_SALE_ADDON"}],
    "billingPeriod": "MONTHLY",
    "lines": [
      {"serviceCode": "COMMERCIAL", "amount": 1000, "currency": "XAF"},
      {"serviceCode": "PRODUCT", "amount": 1000, "currency": "XAF"}
    ],
    "total": 6000,
    "currency": "XAF"
  }
}
```

### Lancer le checkout d'un plan

```http
POST /api/commercial-plans/{planCode}/checkout
```

Exemple :

```json
{
  "organizationId": "org-uuid",
  "addOnCodes": ["POINT_OF_SALE_ADDON"],
  "billingPeriod": "MONTHLY",
  "clientId": "business-core",
  "provider": "MYCOOLPAY",
  "method": "MOBILE_MONEY",
  "payerReference": "+237690295069",
  "idempotencyKey": "org-uuid-commerce-pos-2026-07"
}
```

Le backend :

1. résout le plan commercial existant ;
2. vérifie la compatibilité des add-ons ;
3. calcule les services finaux ;
4. recalcule le montant depuis `payment_core.service_price` ;
5. crée une commande `payment_core.commercial_plan_order` ;
6. crée un `payment_core.payment_order` provider ;
7. renvoie l'URL checkout.

### Lire ou rafraîchir la commande de plan

```http
GET  /api/commercial-plans/orders/{orderId}
POST /api/commercial-plans/orders/{orderId}/refresh
GET  /api/commercial-plans/orders?limit=50
```

Si le paiement lié devient `SUCCESS`, le Kernel applique le plan via l'API commerciale existante :

```http
POST /api/organizations/{organizationId}/commercial-subscriptions
```

La commande passe alors à `ACTIVE`. Si le provider renvoie `FAILED` ou `CANCELLED`, la commande est finalisée sans activer le plan.

## Recharge sécurisée d'un wallet

La route HTTP de recharge ne doit pas créditer un wallet directement. Elle lance maintenant un paiement externe via MyCoolPay ou Stripe. Le solde du wallet n'est augmenté qu'après confirmation provider `SUCCESS`.

### Créer ou récupérer le wallet

```http
POST /api/payments/wallets
```

### Initier la recharge provider

```http
POST /api/payments/wallets/{walletId}/recharge
```

Exemple MyCoolPay :

```json
{
  "amount": 1000,
  "currency": "XAF",
  "clientId": "business-core",
  "provider": "MYCOOLPAY",
  "method": "MOBILE_MONEY",
  "payerReference": "+237690295069",
  "idempotencyKey": "wallet-id-recharge-2026-07-17-001"
}
```

Réponse :

```json
{
  "success": true,
  "data": {
    "orderId": "wallet-recharge-order-uuid",
    "walletId": "wallet-uuid",
    "paymentOrderId": "payment-order-uuid",
    "transactionId": null,
    "status": "PENDING_PAYMENT",
    "amount": 1000,
    "currency": "XAF",
    "redirectUrl": "https://my-coolpay.com/payment/checkout/provider-ref",
    "providerReference": "provider-ref"
  }
}
```

### Rafraîchir et créditer le wallet

```http
POST /api/payments/wallets/recharge-orders/{orderId}/refresh
```

Si le provider confirme `SUCCESS`, le Kernel :

1. crée une transaction interne `RECHARGE` ;
2. crédite le wallet ;
3. stocke le `transactionId` dans `payment_core.wallet_recharge_order` ;
4. passe l'ordre à `RECHARGED`.

Les refresh suivants ne recréditent pas le wallet : l'ordre final `RECHARGED` est retourné tel quel.

### Lire l'historique

```http
GET /api/payments/wallets/recharge-orders/{orderId}
GET /api/payments/wallets/{walletId}/recharge-orders?limit=50
```

L'ancienne opération interne `PaymentUseCase.recharge(...)` existe toujours pour les services backend contrôlés, mais elle ne doit pas être exposée aux clients comme crédit direct.
