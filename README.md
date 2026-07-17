# yy-pay

BFF (Backend For Frontend) Next.js pour l'API IWM — authentification, paiements, portefeuilles et abonnements.

Les types TypeScript sont générés depuis les specs OpenAPI. Aucun schéma n'est défini en dur dans le code applicatif.

## Prérequis

- Node.js 20+
- npm

## Configuration

1. Copier le fichier d'exemple :

```bash
cp .env.example .env.local
```

2. Renseigner les variables dans `.env.local` :

| Variable | Description |
|----------|-------------|
| `IWM_API_BASE_URL` | URL de base de l'API IWM (ex. `https://kernel-core.yowyob.com/kernel-api`) |
| `IWM_CLIENT_ID` | Identifiant client (`X-Client-Id`) |
| `IWM_API_KEY` | Clé API (`X-Api-Key`) |

## Commandes

```bash
# Générer les types payment + auth
npm run generate:api

# Générer uniquement payment ou auth
npm run generate:api:payment
npm run generate:api:auth

# Build + démarrage (comportement actuel du script dev)
npm run dev

# Build de production (régénère les types via prebuild)
npm run build

# Démarrer en production
npm start

# Linter
npm run lint
```

## Authentification BFF

Le client auth (`iwm-auth-client`) transmet automatiquement :

- `X-Client-Id` et `X-Api-Key` depuis les variables d'environnement
- le header `Authorization` (Bearer JWT) si le client front l'envoie

Les routes protégées (`/api/users/me`, `change-password`, `logout`, etc.) nécessitent un JWT valide côté client.

## Endpoints BFF — payment

| Méthode | Route | Opération |
|---------|-------|-----------|
| GET | `/api/plans` | listPlans |
| GET | `/api/plans/subscriptions` | mySubscriptions |
| GET | `/api/plans/{code}` | getPlan |
| PUT | `/api/plans/{code}` | savePlan |
| DELETE | `/api/plans/{code}` | deletePlan |
| POST | `/api/plans/{code}/purchase` | purchase |
| POST | `/api/payments/wallets` | createWallet |
| GET | `/api/payments/wallets/owner/{ownerId}` | getWalletByOwner |
| GET | `/api/payments/wallets/{walletId}` | getWallet |
| POST | `/api/payments/wallets/{walletId}/recharge` | recharge |
| POST | `/api/payments/wallets/{walletId}/pay` | pay |
| GET | `/api/payments/wallets/{walletId}/transactions` | listTransactions |
| GET | `/api/payments/wallets/{walletId}/can-operate?amount=` | canOperate |
| GET | `/api/payments/orders` | history |
| POST | `/api/payments/orders` | initiate |
| GET | `/api/payments/orders/{id}` | get |
| POST | `/api/payments/orders/{id}/refresh` | refresh |

**Non exposé (payment) :** `POST /api/payments/orders/callbacks/{provider}` — webhooks Stripe/MYCOOLPAY → backend IWM direct.

## Endpoints BFF — auth

| Méthode | Route | Opération |
|---------|-------|-----------|
| GET | `/api/users/me` | getMe |
| PUT | `/api/users/me/plan` | updateMyPlan |
| PUT | `/api/users/me/onboarding` | updateOnboarding |
| PUT | `/api/users/me/identity-onboarding` | updateIdentityOnboarding |
| PUT | `/api/users/me/avatar` | updateMyAvatar |
| POST | `/api/auth/sign-up` | signUp |
| POST | `/api/auth/select-context` | selectContext |
| POST | `/api/auth/reset-password` | resetPassword |
| POST | `/api/auth/register` | register |
| POST | `/api/auth/refresh` | refresh |
| POST | `/api/auth/phone-verification/request` | requestPhoneVerification |
| POST | `/api/auth/phone-verification/confirm` | confirmPhoneVerification |
| POST | `/api/auth/password-reset/issue` | issuePasswordReset |
| POST | `/api/auth/otp` | issueOtp |
| POST | `/api/auth/otp/verify` | verifyOtp |
| POST | `/api/auth/mfa/enable` | enableMfa |
| POST | `/api/auth/mfa/disable` | disableMfa |
| POST | `/api/auth/mfa/confirm` | confirmMfa |
| POST | `/api/auth/me/spaces` | createOwnedSpace |
| POST | `/api/auth/logout` | logout |
| POST | `/api/auth/login` | login |
| POST | `/api/auth/login/mfa/confirm` | confirmLoginMfa |
| POST | `/api/auth/identify` | identify |
| POST | `/api/auth/forgot-password` | forgotPassword |
| POST | `/api/auth/email-verification/resend` | resendEmailVerification |
| POST | `/api/auth/email-verification/request` | requestEmailVerification |
| POST | `/api/auth/email-verification/confirm` | confirmEmailVerification |
| POST | `/api/auth/discover-sign-up-contexts` | discoverSignUpContexts |
| POST | `/api/auth/discover-contexts` | discoverContexts |
| POST | `/api/auth/change-password` | changePassword |
| POST | `/api/auth/captcha` | issueCaptcha |
| POST | `/api/auth/captcha/verify` | verifyCaptcha |
| POST | `/api/auth/users/{userId}/reset-password` | adminResetPassword |

## Mise à jour OpenAPI

1. Remplacer [`openapi/openapi-payment.json`](openapi/openapi-payment.json) et/ou [`openapi/openapi-auth.json`](openapi/openapi-auth.json)
2. Exécuter `npm run generate:api` (ou le script ciblé)
3. Vérifier que les routes BFF couvrent les nouvelles opérations
4. Committer `src/types/schemas-payment.d.ts` et `src/types/schemas-auth.d.ts`

## Design system

| Token | Valeur | Usage |
|-------|--------|-------|
| `primary` | `#1b4df5` | Accent, titres |
| `secondary` | `#48546b` | Texte secondaire |
| `white` | `#ffffff` | Fond |

- **Police :** Plus Jakarta Sans (via `next/font/google`)
- **Tailwind v4 :** préfixe obligatoire `yypay:` sur toutes les classes utilitaires (ex. `yypay:flex`, `yypay:text-primary`). Tailwind n'autorise que des lettres `a-z` dans le nom de préfixe — `yy-pay` n'est donc pas supporté nativement.

## Structure

```
openapi/
  openapi-payment.json        # Spec payment
  openapi-auth.json           # Spec auth
src/types/
  schemas-payment.d.ts        # Types payment générés
  schemas-auth.d.ts           # Types auth générés
src/lib/
  env.ts                      # Variables d'environnement
  iwm-payment-client.ts       # Client openapi-fetch payment
  iwm-auth-client.ts          # Client openapi-fetch auth (+ Bearer)
  bff-utils.ts                # Helpers de réponse BFF
src/app/api/                  # Route handlers proxy
```
