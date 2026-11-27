# Suivi du projet — YowYob Payment (yy-pay)

> Dernière mise à jour : 2026-11-13
> Branche : `main` — dernier commit : `a027781` (2026-07-31)

## 1. Résumé

**yy-pay** est l'interface web (Next.js 16 + BFF) de la plateforme de paiement **YowYob / Kernel IWM**.
Elle permet à un utilisateur de se connecter (MFA), choisir un tenant puis une organisation,
gérer un wallet, consulter ses transactions et souscrire à des plans commerciaux, avec paiement
par wallet ou via **MYCOOLPAY**. Elle expose aussi un flux de **paiement direct** (popup) pour des services externes.

| Élément | Valeur |
| --- | --- |
| Framework | Next.js 16.2.10 (App Router, `proxy.ts`, React Compiler) |
| UI | React 19.2, Tailwind v4 (préfixe `yypay:`), Radix UI, lucide-react, sonner |
| État client | Zustand (`cart-store`, `auth-wizard-store`) |
| API | BFF Next.js → Kernel IWM (`openapi-fetch`, types générés depuis `openapi/*.json`) |
| i18n | FR / EN maison (`src/i18n/messages`) |
| Thème | Clair / sombre (`next-themes`) |
| Typecheck (`tsc --noEmit`) | ✅ OK |
| Lint (`npm run lint` = ESLint + garde-fou préfixe Tailwind) | ✅ OK |
| Tests unitaires (`npm test`, runner natif Node) | ✅ 22/22 |
| Tests E2E | ❌ À ajouter (Playwright non installé) |

## 2. Architecture

```
Navigateur ──(cookies httpOnly)──> BFF Next.js (src/app/api/*) ──(X-Client-Id, X-Api-Key, X-Tenant-Id)──> Kernel IWM
                                                                                                      └──> MYCOOLPAY / STRIPE
```

- `src/proxy.ts` : protection des routes (token → tenant → organisation → console).
- `src/lib/iwm-*-client.ts` : clients typés vers le Kernel ; `bff-client.ts` côté navigateur.
- Le front **ne fournit jamais le montant** d'un paiement MYCOOLPAY : devis calculé par le Kernel.
- ~80 routes BFF : auth (30), payments/wallets (15), plans (8), commercial-plans (7), service-bundles (5), direct-payment (3), session/users (7).

## 3. Interface — écrans

| Écran | Route | État | Capture |
| --- | --- | --- | --- |
| Page d'accueil (hero, tarifs) | `/` | ✅ | `PageAccueil.png` |
| Connexion (identifiant + MFA e-mail) | `/login` | ✅ | `FormulaireDeConnexion.png`, `VerificationMFA.png` |
| Choix du tenant | `/tenants` | ✅ | `ListeDesTenants.png` |
| Choix de l'organisation | `/organizations` | ✅ | `ListeDesOrganisations.png` |
| Visite guidée (onboarding) | console | ✅ | `Onboarding.png` |
| Tableau de bord / wallet | `/console` | ✅ | `CreationWallet*.png`, `WalletCree.png` |
| Transactions | `/console/transactions` | ✅ | `historiqueTransactions*.png` |
| Plans disponibles | `/console/plans` | ✅ | `PlanDisponible.png` |
| Panier + paiement | tiroir `CartSheet` | ✅ | `AjoutPlanPanier.png`, `PanierAvecLePlanAjoute.png` |
| Thème + langue | en-tête | ✅ | `ChangementThemeEtLangue.png` |
| Paiement direct (popup) | `/direct-payment`, `/direct-payment/return` | ✅ | — |

Captures et guide utilisateur LaTeX (`yowpay.tex`) dans `CaptureApiDePaiement/`.

## 4. Historique

| Date | Auteur | Jalon |
| --- | --- | --- |
| 2026-07-17 | NathanaelZuchuon | Initialisation, workflow, service bundles |
| 2026-07-18 → 20 | NathanaelZuchuon | Paiements enrichis, configuration d'environnement |
| 2026-07-21 | ALEMDJOU | Refonte console (sidebar responsive, multi-pages, onboarding) ; accueil + i18n |
| 2026-07-27 | ALEMDJOU | Formulaire de connexion : e-mail → identifiant |
| 2026-07-30 → 31 | ALEMDJOU | Corrections front, URLs et URLs de redirection (callbacks) |

## 5. Travail en cours (non commité)

- [x] **Sidebar type Gmail (Material 3)** : bouton ☰ dans le header, FAB « Recharger / Créer un wallet », pilule active `#d3e3fd`, icônes pleines à l'état actif, compteur panier + menu ⋮ au survol, filtres rapides de transactions (pastilles de couleur) dépliables via « Plus / Moins », mini-sidebar persistée, hover-to-expand en overlay, tiroir mobile avec backdrop. Fichiers : `console-sidebar.tsx`, `console-header.tsx`, `console-shell.tsx`, `hooks/use-sidebar-layout.ts`, tokens `--app-shell*` / `--app-nav*` / `--app-fab*` dans `globals.css`.
  - Le filtre de statut des transactions est maintenant dans l'URL (`?status=success|pending|failed`).
  - À valider visuellement après connexion (clair / sombre, desktop / mobile).
- [x] **Tableau de bord** : alertes (en attente / échecs 30 j), carte wallet (montant en FCFA, Recharger, Historique), carte abonnement (plan, échéance, jours restants), 5 dernières opérations.
- [x] **Identité** : logo centralisé (`BrandLogo`), titres d'onglet par page (`Transactions · YowYob Payment`), pied de page (copyright, version, liens support/légal optionnels), titre en double retiré du header.
- [x] **Logo YowYob Payment** (symbole « Y » en SVG, `src/components/brand/brand-logo.tsx` + favicon `src/app/icon.svg`).
- [x] **Page des plans** : économie annuelle (−X %), cartes refaites (prix formaté, économie, options lisibles, badge Recommandé), tableau comparatif ; un devis en échec ne masque plus les autres prix.
- [x] **Textes** : noms lisibles des modules/packs/options (table front, à compléter si l'API ajoute des codes), descriptions de plans traduites, plus de « Kernel / IWM / côté serveur », pluriels corrigés, montants formatés partout.
- [x] **Qualité** : `npm test` (33 tests unitaires), garde-fou `npm run lint:classes`, découpage de `cart-sheet.tsx`, hook partagé `usePaymentActivity`.
- [ ] Dossier `CaptureApiDePaiement/` (captures + `yowpay.tex`) non suivi par git : décider s'il doit être commité.

## 6. Points d'attention / dette

| Priorité | Sujet | Détail |
| --- | --- | --- |
| ✅ Corrigé | Classes Tailwind non générées | Avec Tailwind v4 le préfixe doit être en tête (`yypay:sm:px-6`). 107 classes mal ordonnées (`sm:yypay:…`, `hover:yypay:…`, `lg:yypay:…`, `dark:yypay:…`) corrigées dans 20 fichiers le 2026-11-13. Règle : toujours écrire `yypay:<variante>:<utilitaire>`. |
| Haute | Sécurité paiement direct | Paramètres URL non signés (cf. `docs/external-payment-integration.md` §15). Prévoir signature + allowlist `apiBaseUrl`. |
| Haute | Crédit wallet organisation | Route Kernel `POST /wallets/{id}/credit` non garantie ; repli sur webhook `payment.success` uniquement. |
| Moyenne | Tests E2E | Unitaires en place (`tests/unit`). Reste l'E2E (login MFA, panier, callbacks) : installer `@playwright/test`. |
| Moyenne | Script `npm run dev` | Fait `next build && next start` (pas de hot reload). Envisager `next dev` et un script séparé. |
| Moyenne | README obsolète | Section *Proxy* et *Structure des pages* ne mentionnent pas `/tenants`, `/console/plans`, `/console/transactions`, `/direct-payment`. |
| Basse | Gros composants | `cart-sheet.tsx` découpé (305 l. + 2 hooks + 2 composants). Restent `organizations/page.tsx` (386 l.) et `transaction-list.tsx`. |

## 7. Prochaines étapes proposées

1. Valider visuellement la sidebar et le nouveau tableau de bord, puis commiter.
2. Fournir le logo officiel YowYob (`src/components/brand/brand-logo.tsx`) et les URL support / mentions légales (`.env`).
3. Ajouter les tests E2E Playwright (login → organisation → paiement).
4. Mettre à jour le README (routes, proxy, structure).
5. Signer les URLs de paiement direct en coordination avec l'équipe Kernel.
6. Corriger le script `dev` (`next dev`).

## 8. Références

- `README.md` — configuration, endpoints BFF, design system
- `docs/external-payment-integration.md` — intégration paiement direct (popup + webhooks)
- `payment-core-and-service-bundles.md` — API Kernel payment-core & bundles
- `openapi/openapi-auth.json`, `openapi/openapi-payment.json` — specs sources des types
