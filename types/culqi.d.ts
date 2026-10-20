declare class CulqiCheckout {
  constructor(publicKey: string, config: unknown);

  open(): void;

  close(): void;

  order: unknown;

  error: unknown;

  token?: { id: string };

  culqi: () => void;
}

interface Window {
  CulqiCheckout: typeof CulqiCheckout;
}
