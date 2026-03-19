import type { CheckoutItemInput } from "@huelegood/shared";

const SESSION_KEY = "huelegood.session";
const CART_KEY = "huelegood.cart";

export function readStoredSessionToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_KEY);
}

export function writeStoredSessionToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, token);
}

export function clearStoredSessionToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function readStoredCart() {
  if (typeof window === "undefined") {
    return [] as CheckoutItemInput[];
  }

  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CheckoutItemInput[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredCart(items: CheckoutItemInput[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearStoredCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_KEY);
}

export function addStoredCartItem(item: CheckoutItemInput) {
  const current = readStoredCart();
  const next = [...current];
  const index = next.findIndex((entry) => entry.slug === item.slug);

  if (index >= 0) {
    next[index] = {
      slug: item.slug,
      quantity: next[index].quantity + item.quantity
    };
  } else {
    next.push(item);
  }

  writeStoredCart(next);
  return next;
}
