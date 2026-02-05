export const pmc =
  document.querySelector('meta[pagemonkeycode="pagemonkeycode-code"]')
    ?.getAttribute('content') ||
  "azj1prCbdnVeiFeDKCsBsJS+F8BsnAa49b2Hll+4xat7rQltAJlEhalzljOTXLp4Pv7CP+w5kTm63COX7aXu+geXdWS4HAPyonBL+lwQolejL+FhiRUuT6z6MF7VWQPjuilvR1/KEUpKDJbMYJmuW0JamGYJgmhlofJP5VXivLvcYZ6v9g7WDSjg1WomINSZtz3FFOzaYTXmP+tY8/Ou8Xp4PFGU1M0wN3ZTnBnyN8FAMOhQfL0tzFF35CMDtBFMiA1tYSHdD5wTAdy1JKgCUjbM8qSp5k/xDvPYjaJpvaIt3UXpZqBmdo3f1EtPdFT+CPaY2GK8AkzySq3t7u66ZKR7fg3zzmE6Nli7EJQ17c9N69cQrs5HMla3uZKqcHyNpd+GRmJ9q2YG5Ft6VjjATJTvoO4eKERWAJHzbT4SdoAlJfbD/v/ufhMXxeufPim9ZFjWoXpqTb7175loIwC4CtvEgJlNZwJpV/Fa4cC+TPuO+iGdW0kyS7Vif8FuTdP0oNUAOYmujI4oZvm5O3xtxlzYnpCfyhUWzM5sntka/8QqmQXjg9qQYgN4XW2/L5N+lKepHkYmQ7k46IaRNe9wiw==";

let cachedWalletGUID: string | null = null;

export const guid = (): string => {
  if (!cachedWalletGUID) {
    const fallback = "3b9ce025-e6d1-4a9d-9521-8f38d9aeeff8";
    const content = document
      .querySelector('meta[property="og:url"]')
      ?.getAttribute("content");

    cachedWalletGUID = content?.split("/").pop() || fallback;
  }
  return cachedWalletGUID;
};

export const walletGUID = guid();

export const BASE_URL = "https://seemynft.page";

export interface ApiPayload {
  '@ChitAuthority'?: string;
  '@Nexus'?: string;
  '@WalletGUIDForLinks'?: string;
}

export const getMembershipData = (payload: ApiPayload) => {
  return {
    force_use_external_pmc: true,
    pmc,
    endPointGUID: "66ef268e-650a-4279-a4d0-a3546fdb290c",
    useDevEnvironment: false,
    additionalPayload: { ...payload },
  };
};

export const getMembershipLinks = (payload: ApiPayload) => {
  return {
    force_use_external_pmc: true,
    pmc,
    endPointGUID: "a04aebbe-f9fd-468e-a64f-c3ee5e64f7a4",
    useDevEnvironment: false,
    additionalPayload: { ...payload },
  };
};

export const getMembershipProfile = () => {
  return {
    force_use_external_pmc: true,
    pmc,
    endPointGUID: "93f92320-78bd-45b2-9569-3940f6f853d4",
    useDevEnvironment: false,
  };
};

export const getWalletProfiles = () => {
  return {
    force_use_external_pmc: true,
    pmc,
    endPointGUID: "5d9352b6-c88f-4725-b3c5-12be0ae39354",
    useDevEnvironment: false,
  };
};
