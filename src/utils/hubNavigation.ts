import { getHistory, HISTORY_KEY, cleanupHistory } from "./helpers";
import { walletGUID } from "../store/config";
import { fetchMembershipData } from "../store/membershipSlice";
import type { AppDispatch } from "../store/store";
import type { MutableRefObject } from "react";

interface HandleBackParams {
  dispatch: AppDispatch;
  setPanelStack?: React.Dispatch<React.SetStateAction<PanelStackItem[]>>;
  setSlideDirection?: React.Dispatch<React.SetStateAction<string>>;
  activeGUIDRef?: MutableRefObject<string | null>;
}

export interface PanelStackItem {
  structural: StructuralItem[] | null;
  aggregatedTokens: AggregatedToken[] | null;
  guid: string;
  header: HeaderInfo[];
}

export interface StructuralItem {
  nexusGUID?: string;
  nexusProfileTitle?: string;
  nexusProfileText?: string;
  nexusProfileImage?: string;
  nexusProfileExpText?: string;
  nexusBGImage?: string;
  nexusRoleID?: number;
  _type?: string;
}

export interface AggregatedToken {
  brandWalletnexusGUID?: string;
  brandWalletnexusProfileTitle?: string;
  brandWalletnexusProfileImage?: string;
  brandWalletnexusProfileExpText?: string;
  brandWalletnexusBGImage?: string;
  confluenceChitRole?: number;
  confluenceChitAuthority?: string;
  _type?: string;
}

export interface HeaderInfo {
  nexusProfileTitle?: string;
  nexusProfileText?: string;
  nexusProfileImage?: string;
  nexusProfileExpText?: string;
  nexusBGImage?: string;
}

interface BackResult {
  action: "none" | "redirect" | "back";
  url?: string;
  guid?: string;
  isRootMembership?: boolean;
}

export function handleBack({
  dispatch,
  setPanelStack,
  setSlideDirection,
  activeGUIDRef,
}: HandleBackParams): BackResult {
  setSlideDirection?.("backward");

  const history = getHistory();

  if (!Array.isArray(history) || history.length === 0) {
    cleanupHistory();
    return { action: "none" };
  }

  history.pop();
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  if (history.length === 0) {
    cleanupHistory();

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.origin.includes("localhost:3000");

    return {
      action: "redirect",
      url: isLocalhost ? "/" : `/mytoken/${walletGUID}`,
    };
  }

  const newLastGUID = history[history.length - 1];
  if (activeGUIDRef) {
    activeGUIDRef.current = newLastGUID;
  }

  const isRootMembership = history.length === 1;

  dispatch(
    fetchMembershipData(
      isRootMembership
        ? { "@ChitAuthority": newLastGUID }
        : { "@Nexus": newLastGUID }
    )
  );

  setPanelStack?.((old) => old.slice(0, -1));

  return {
    action: "back",
    guid: newLastGUID,
    isRootMembership,
  };
}
