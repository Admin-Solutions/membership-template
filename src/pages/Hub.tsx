import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { api } from "../actions/api";
import type { ApiPayload } from "../store/config";
import { pushHistory, decodeHtml, decodeMapper } from "../utils/helpers";
import { handleBack } from "../utils/hubNavigation";
import type {
  PanelStackItem,
  StructuralItem,
  AggregatedToken,
} from "../utils/hubNavigation";

const chitAuthority =
  (window as unknown as { __BOOTSTRAP__?: { WTOB_GUID?: string } }).__BOOTSTRAP__?.WTOB_GUID ||
  (window as unknown as { eventInfo?: { EventNexusGUID?: string } }).eventInfo?.EventNexusGUID ||
  "1009d4e8-af8e-4339-8711-f85604bf153e";
const specialRoles = [785109, 817713, 817475];
const iFrameRoles = [829034, 829036, 831349];

interface GridItem extends Partial<StructuralItem>, Partial<AggregatedToken> {
  _type: string;
}

interface LinkItem {
  LinkURL: string;
  LinkImage: string;
  LinkTitle: string;
  LinkText: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortAlpha<T extends Record<string, any>>(arr: T[] | undefined): T[] {
  return (arr || [])
    .slice()
    .map((x) => decodeMapper(x) as T)
    .sort((a, b) =>
      (a?.nexusProfileTitle || "").localeCompare(b?.nexusProfileTitle || "")
    );
}

export default function Hub() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [members, setMembers] = useState<{ loading: boolean; data: any }>({ loading: false, data: null });
  const [links, setLinks] = useState<{ data?: { dataPayload?: { value?: LinkItem[] } } }>({});

  const fetchData = useCallback(async (payload: ApiPayload) => {
    setMembers((prev) => ({ ...prev, loading: true }));
    try {
      const data = await api.fetchMembershipData(payload);
      setMembers({ loading: false, data });
    } catch {
      setMembers({ loading: false, data: null });
    }
  }, []);

  const fetchLinks = useCallback(async (walletGUIDForLinks: string) => {
    try {
      const data = await api.fetchMembershipLinks({ "@WalletGUIDForLinks": walletGUIDForLinks });
      setLinks({ data: data as { dataPayload?: { value?: LinkItem[] } } });
    } catch {
      // links remain empty
    }
  }, []);

  // Listen for back navigation triggered from Footer
  useEffect(() => {
    const handler = (e: Event) => fetchData((e as CustomEvent).detail as ApiPayload);
    window.addEventListener("membership:fetch", handler);
    return () => window.removeEventListener("membership:fetch", handler);
  }, [fetchData]);

  const [panelStack, setPanelStack] = useState<PanelStackItem[]>([]);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<AggregatedToken | null>(null);
  const [selectedData, setSelectedData] = useState<GridItem | null>(null);
  const [isIframeActive, setIsIframeActive] = useState(false);
  const [slideDirection, setSlideDirection] = useState("forward");

  const activeGUIDRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const goBack = useCallback(() => {
    if (panelStack.length <= 1) return;
    const result = handleBack({
      onFetch: fetchData,
      setPanelStack,
      setSlideDirection,
      activeGUIDRef,
    });
    if (result.action === "redirect" && result.url) {
      navigate(result.url);
    }
  }, [panelStack.length, fetchData, navigate]);

  useEffect(() => {
    fetchData({ "@ChitAuthority": chitAuthority });
    pushHistory(chitAuthority);
    activeGUIDRef.current = chitAuthority;
  }, [fetchData]);

  const mainValue = members?.data?.dataPayload?.value?.[0] || {};
  const structural = sortAlpha(mainValue.structural);
  const aggregatedTokens = sortAlpha(mainValue.aggregatedTokens);

  useEffect(() => {
    if (!mainValue || !activeGUIDRef.current) return;

    if (panelStack.length === 0) {
      setPanelStack([
        {
          structural,
          aggregatedTokens,
          guid: activeGUIDRef.current,
          header: mainValue.header || [],
        },
      ]);
      return;
    }

    const last = panelStack[panelStack.length - 1];
    if (last.guid !== activeGUIDRef.current) return;

    setPanelStack((old) => {
      const copy = [...old];
      copy[copy.length - 1] = {
        ...copy[copy.length - 1],
        structural,
        aggregatedTokens,
        header: mainValue.header || last.header,
      };
      return copy;
    });
  }, [members]);

  const slideVariants = {
    forwardHidden: { x: "100%" },
    visible: { x: 0 },
    forwardExit: { x: "-100%" },
    backwardHidden: { x: "-100%" },
    backwardExit: { x: "100%" },
  };

  const handleBoxClick = (item: GridItem) => {
    setSlideDirection("forward");

    if (
      specialRoles.includes(item?.nexusRoleID || 0) ||
      iFrameRoles.includes(item?.confluenceChitRole || 0)
    ) {
      setSelectedData(item);
      setIsIframeActive(true);
      return;
    }

    if (!item.nexusGUID) return;

    activeGUIDRef.current = item.nexusGUID;
    fetchData({ "@Nexus": item.nexusGUID });
    pushHistory(item.nexusGUID);

    setPanelStack((old) => [
      ...old,
      {
        structural: null,
        aggregatedTokens: null,
        guid: item.nexusGUID!,
        header: [
          {
            nexusProfileTitle: item.nexusProfileTitle,
            nexusProfileText: item.nexusProfileText,
            nexusProfileImage: item.nexusProfileImage,
            nexusProfileExpText: item.nexusProfileExpText,
            nexusBGImage: item.nexusBGImage,
          },
        ],
      },
    ]);
  };

  const handleBoxModalClick = (item: GridItem) => {
    if (
      specialRoles.includes(item?.nexusRoleID || 0) ||
      iFrameRoles.includes(item?.confluenceChitRole || 0)
    ) {
      setSelectedData(item);
      setIsIframeActive(true);
      return;
    }

    setSelectedToken(item as AggregatedToken);
    if (item.brandWalletnexusGUID) {
      fetchLinks(item.brandWalletnexusGUID);
    }
  };

  const closeIframe = () => {
    setSelectedData(null);
    setIsIframeActive(false);
  };

  useEffect(() => {
    const authMenu = document.getElementById("authIDMenu");
    if (!authMenu) return;

    if ((selectedData && isIframeActive) || selectedToken) {
      authMenu.style.display = "none";
    } else {
      authMenu.style.display = "block";
    }
  }, [selectedData, isIframeActive, selectedToken]);

  // iOS scroll lock when modals are open
  useEffect(() => {
    const modalOpen = showHeaderModal || selectedToken || (selectedData && isIframeActive);
    if (modalOpen) {
      const appMain = document.querySelector('.app-main') as HTMLElement;
      const scrollY = appMain ? appMain.scrollTop : window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      if (appMain) appMain.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        if (appMain) appMain.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [showHeaderModal, selectedToken, selectedData, isIframeActive]);

  const iframeDragControls = useDragControls();
  const activePanel = panelStack.length > 0 ? panelStack[panelStack.length - 1] : null;
  if (!activePanel || members?.loading) return (
    <div className="flex justify-center items-center loading-dots-container">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          className="loading-dot"
        />
      ))}
    </div>
  );
  const headerInfo = activePanel.header?.[0] || null;

  return (
    <>
      <div className="slide-container relative w-full overflow-hidden" style={{ minHeight: "100dvh" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={panelStack.length}
            className="slide-panel"
            initial={slideDirection === "forward" ? "forwardHidden" : "backwardHidden"}
            animate="visible"
            exit={slideDirection === "forward" ? "forwardExit" : "backwardExit"}
            variants={slideVariants}
            transition={{ type: 'spring', damping: 28, stiffness: 160 }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              touchStartRef.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={(e) => {
              if (!touchStartRef.current) return;
              const touch = e.changedTouches[0];
              const dx = touch.clientX - touchStartRef.current.x;
              const dy = touch.clientY - touchStartRef.current.y;
              touchStartRef.current = null;
              if (dx > 80 && Math.abs(dy) < Math.abs(dx)) {
                goBack();
              }
            }}
            style={{ overflowY: (selectedToken || showHeaderModal || (selectedData && isIframeActive)) ? "hidden" : "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" as never }}
          >
            <motion.section
              className="hub-section-top"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="hub-header-row">
                {headerInfo?.nexusProfileImage && (
                  <motion.div
                    className="image-ring image-ring--white"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.15 }}
                  >
                    <img
                      src={headerInfo.nexusProfileImage}
                      alt="profile"
                    />
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
                >
                  <h2
                    className="heading-oswald"
                    style={{ lineHeight: 1.15, marginBottom: 8 }}
                  >
                    {decodeHtml(headerInfo?.nexusProfileTitle)}
                  </h2>
                  <div className="divider-accent-bar" style={{ marginBottom: 14 }} />
                  {headerInfo?.nexusProfileExpText && (
                    <button
                      className="read-more-btn"
                      onClick={() => setShowHeaderModal(true)}
                    >
                      Read More
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.section>

            <motion.section
              className="hub-section-grid"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            >
              {(activePanel.structural || activePanel.aggregatedTokens) && (
                <Grid
                  data={[
                    ...(activePanel.structural?.map((i) => ({
                      ...i,
                      _type: "structural",
                    })) || []),
                    ...(activePanel.aggregatedTokens?.map((i) => ({
                      ...i,
                      _type: "aggregatedTokens",
                    })) || []),
                  ]}
                  onClick={(item) =>
                    item._type === "structural"
                      ? handleBoxClick(item)
                      : handleBoxModalClick(item)
                  }
                  type="mixed"
                />
              )}
            </motion.section>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showHeaderModal && (
          <Modal onClose={() => setShowHeaderModal(false)}>
            <h2 className="heading-oswald" style={{ marginBottom: 12 }}>
              {decodeHtml(headerInfo?.nexusProfileTitle)}
            </h2>
            <div className="divider-accent" style={{ marginTop: 12, marginBottom: 12 }} />
            <div className="modal-body-text">
              {decodeHtml(headerInfo?.nexusProfileExpText)}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedToken && (
          <BottomSlide
            onClose={() => setSelectedToken(null)}
            links={links}
            token={selectedToken}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedData && isIframeActive && (
          <>
            <motion.div
              className="benefits-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={closeIframe}
            />

            <motion.div
              className="iframe-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              drag="y"
              dragControls={iframeDragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 60 || info.velocity.y > 300) closeIframe();
              }}
            >
              <div
                className="drag-handle-wrapper drag-handle-wrapper--iframe"
                onPointerDown={(e) => iframeDragControls.start(e)}
              >
                <div className="drag-handle-bar drag-handle-bar--sm" />
              </div>
              <div className="iframe-wrapper">
                <iframe
                  src={`https://seemynft.page/mytoken/${selectedData.confluenceChitAuthority}`}
                  className="iframe-content"
                  allowFullScreen
                  title="nft-view"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface GridProps {
  data: GridItem[];
  onClick: (item: GridItem) => void;
  type: string;
}

function Grid({ data, onClick, type }: GridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {data.map((item, i) => {
        const itemType = type === "mixed" ? item._type : type;
        const image =
          itemType === "structural"
            ? item.nexusBGImage
            : item.brandWalletnexusBGImage;
        const name =
          itemType === "aggregatedTokens"
            ? item.brandWalletnexusProfileTitle
            : item.nexusProfileTitle;

        return (
          <EntityCard
            key={i}
            image={image || ""}
            name={decodeHtml(name || "")}
            onClick={() => onClick(item)}
            index={i}
          />
        );
      })}
    </div>
  );
}

interface EntityCardProps {
  image: string;
  name: string;
  onClick?: () => void;
  index: number;
}

function EntityCard({ image, name, onClick, index }: EntityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.06, 0.8),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 },
      }}
      className="entity-card cursor-pointer"
      onClick={onClick}
    >
      <div className="entity-card-image">
        <img src={image} alt={name} />
      </div>
      <div className="entity-card-body">
        <h3 className="entity-card-title">{name}</h3>
      </div>
    </motion.div>
  );
}

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ children, onClose }: ModalProps) {
  return createPortal(
    <>
      <motion.div
        className="glass-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <div className="glass-modal-center" onClick={onClose}>
        <motion.div
          className="glass-modal-box"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="glass-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          {children}
        </motion.div>
      </div>
    </>,
    document.body
  );
}

interface BottomSlideProps {
  onClose: () => void;
  links: { data?: { dataPayload?: { value?: LinkItem[] } } };
  token: AggregatedToken;
}

function BottomSlide({ onClose, links, token }: BottomSlideProps) {
  const dragControls = useDragControls();
  const linkList = links?.data?.dataPayload?.value || [];

  return createPortal(
    <>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="bottom-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 28, stiffness: 180 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 60 || info.velocity.y > 300) onClose();
        }}
      >
        <div
          className="drag-handle-wrapper drag-handle-wrapper--top"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="drag-handle-bar drag-handle-bar--md" />
        </div>
        <div className="bottom-sheet-scroll">
          <div className="bottom-sheet-inner">
            <motion.div
              className="image-ring image-ring--silver"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 180, delay: 0.1 }}
            >
              <img
                src={token.brandWalletnexusProfileImage}
                alt="token"
              />
            </motion.div>

            <motion.h3
              className="heading-oswald"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{ marginTop: 20 }}
            >
              {token.brandWalletnexusProfileTitle}
            </motion.h3>

            <motion.p
              className="text-body-silver"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ marginTop: 12 }}
            >
              {token.brandWalletnexusProfileExpText}
            </motion.p>

            {linkList.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{ marginTop: 28 }}
              >
                <h4 className="links-section-header">Links</h4>
                {linkList.map((link, i) => (
                  <motion.div
                    key={i}
                    className="link-card"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.06, duration: 0.3 }}
                    onClick={() =>
                      window.open(
                        link.LinkURL?.startsWith("http")
                          ? link.LinkURL
                          : `https://${link.LinkURL}`,
                        "_blank"
                      )
                    }
                  >
                    <img
                      src={link.LinkImage}
                      alt="link"
                      className="link-card-icon"
                    />
                    <div className="link-card-text">
                      <div className="link-card-title">{link.LinkTitle}</div>
                      <div className="link-card-subtitle">{link.LinkText}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-no-links">No links available.</p>
            )}
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
