/**
 * Shipping companies and payment gateways the dashboard can store keys for
 * (Integrations page). Keys stay on the server: they live in db.integrations,
 * which is never part of the public catalog.
 */
export type IntegrationKind = "shipping" | "payment";

export type IntegrationField = {
  key: string;
  label: string;
  /** Hidden in the form and never sent back to the browser once saved. */
  secret?: boolean;
  placeholder?: string;
};

export type IntegrationProvider = {
  id: string;
  kind: IntegrationKind;
  name: string;
  blurb: string;
  /** Where the merchant gets their keys. */
  docs: string;
  fields: IntegrationField[];
};

const env = { key: "mode", label: "Mode", placeholder: "test or live" };

export const INTEGRATIONS: IntegrationProvider[] = [
  /* --- shipping companies --- */
  {
    id: "bosta",
    kind: "shipping",
    name: "Bosta",
    blurb: "Door-to-door delivery and cash collection across Egypt.",
    docs: "https://business.bosta.co",
    fields: [{ key: "apiKey", label: "API key", secret: true }, { key: "pickupLocationId", label: "Pickup location ID" }, env],
  },
  {
    id: "aramex",
    kind: "shipping",
    name: "Aramex",
    blurb: "Domestic and international shipping.",
    docs: "https://www.aramex.com/solutions-services/developers-solutions-center",
    fields: [
      { key: "username", label: "Username" },
      { key: "password", label: "Password", secret: true },
      { key: "accountNumber", label: "Account number" },
      { key: "accountPin", label: "Account PIN", secret: true },
      { key: "entity", label: "Account entity", placeholder: "CAI" },
    ],
  },
  {
    id: "mylerz",
    kind: "shipping",
    name: "Mylerz",
    blurb: "E-commerce delivery with COD in Egypt and North Africa.",
    docs: "https://mylerz.com",
    fields: [{ key: "username", label: "Username" }, { key: "password", label: "Password", secret: true }, env],
  },
  {
    id: "jt",
    kind: "shipping",
    name: "J&T Express",
    blurb: "Express parcel delivery.",
    docs: "https://www.jtexpress-eg.com",
    fields: [{ key: "customerCode", label: "Customer code" }, { key: "apiAccount", label: "API account" }, { key: "privateKey", label: "Private key", secret: true }],
  },
  /* --- payment gateways --- */
  {
    id: "paymob",
    kind: "payment",
    name: "Paymob",
    blurb: "Cards, wallets, Valu and installments in Egypt.",
    docs: "https://accept.paymob.com",
    fields: [
      { key: "secretKey", label: "Secret key", secret: true },
      { key: "publicKey", label: "Public key" },
      { key: "integrationId", label: "Card integration ID" },
      { key: "hmac", label: "HMAC secret", secret: true },
    ],
  },
  {
    id: "fawry",
    kind: "payment",
    name: "Fawry",
    blurb: "Pay at Fawry outlets, cards and wallets.",
    docs: "https://developer.fawrystaging.com",
    fields: [{ key: "merchantCode", label: "Merchant code" }, { key: "securityKey", label: "Security key", secret: true }, env],
  },
  {
    id: "kashier",
    kind: "payment",
    name: "Kashier",
    blurb: "Cards and wallets with fast settlement.",
    docs: "https://developers.kashier.io",
    fields: [{ key: "merchantId", label: "Merchant ID" }, { key: "apiKey", label: "Payment API key", secret: true }, env],
  },
  {
    id: "stripe",
    kind: "payment",
    name: "Stripe",
    blurb: "International cards, Apple Pay and Google Pay.",
    docs: "https://dashboard.stripe.com/apikeys",
    fields: [
      { key: "publishableKey", label: "Publishable key", placeholder: "pk_live_…" },
      { key: "secretKey", label: "Secret key", secret: true, placeholder: "sk_live_…" },
      { key: "webhookSecret", label: "Webhook secret", secret: true, placeholder: "whsec_…" },
    ],
  },
];
