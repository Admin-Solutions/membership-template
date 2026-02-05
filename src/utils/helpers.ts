export const HISTORY_KEY = "membershipHistory";

type HistoryListener = () => void;
let listeners: HistoryListener[] = [];

export function getHistory(): string[] {
  const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
  return history;
}

export function pushHistory(guid: string): void {
  const history = getHistory();

  if (!history.includes(guid)) {
    history.push(guid);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    listeners.forEach((cb) => cb());
  }
}

export function popHistory(): void {
  const history = getHistory();
  history.pop();
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  listeners.forEach((cb) => cb());
}

export function peekHistory(): { guid: string; type: string } | null {
  const history = getHistory();
  if (!history || history.length === 0) return null;
  const last = history[history.length - 1];
  return { guid: last, type: "root" };
}

export function onHistoryChange(callback: HistoryListener): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

export function cleanupHistory(): void {
  sessionStorage.removeItem(HISTORY_KEY);
  sessionStorage.removeItem("membershipHistory");
}

export function decodeHtml(str: string = ""): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export function decodeMapper<T extends Record<string, unknown>>(itemObj: T): T {
  if (!itemObj) return {} as T;
  const newObj = { ...itemObj };
  Object.keys(newObj).forEach((key) => {
    if (typeof newObj[key] === "string") {
      (newObj as Record<string, unknown>)[key] = decodeHtml(newObj[key] as string);
    }
  });
  return newObj;
}

export function formatEventDate(isoString: string | undefined): string {
  if (!isoString) return "";

  const date = new Date(isoString);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function buildWalletURLWithVirtualProxy(virtualProxyGUID: string | undefined): string | null {
  try {
    let url = window.location.href.split("#")[0];
    url = url.replace(/\/+$/, "");
    if (virtualProxyGUID) url = `${url}/${virtualProxyGUID}`;
    return url;
  } catch (err) {
    console.error("Error building wallet URL:", err);
    return null;
  }
}

export function appendEmbedParam(link: string): string {
  try {
    const url = new URL(link);
    url.searchParams.set("embed", "true");
    return url.toString();
  } catch {
    return link;
  }
}
