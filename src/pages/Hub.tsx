import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMembershipData, fetchMembershipLinks } from "../store/membershipSlice";
import { pushHistory, decodeHtml, decodeMapper } from "../utils/helpers";
import type {
  PanelStackItem,
  StructuralItem,
  AggregatedToken,
} from "../utils/hubNavigation";

const chitAuthority = "1009d4e8-af8e-4339-8711-f85604bf153e";
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
  const dispatch = useAppDispatch();
  const members = useAppSelector((state) => state.membershipData);
  const links = useAppSelector((state) => state.membershipLinks);

  const [panelStack, setPanelStack] = useState<PanelStackItem[]>([]);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<AggregatedToken | null>(null);
  const [selectedData, setSelectedData] = useState<GridItem | null>(null);
  const [isIframeActive, setIsIframeActive] = useState(false);
  const [slideDirection, setSlideDirection] = useState("forward");

  const activeGUIDRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(fetchMembershipData({ "@ChitAuthority": chitAuthority }));
    pushHistory(chitAuthority);
    activeGUIDRef.current = chitAuthority;
  }, [dispatch]);

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
    dispatch(fetchMembershipData({ "@Nexus": item.nexusGUID }));
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
      dispatch(fetchMembershipLinks({ "@WalletGUIDForLinks": item.brandWalletnexusGUID }));
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

  const activePanel = panelStack.length > 0 ? panelStack[panelStack.length - 1] : null;
  if (!activePanel) return <div className="p-5 text-center text-white">Loading...</div>;
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
            transition={{ duration: 0.4 }}
            style={{ overflowY: "auto", overflowX: "hidden", touchAction: "pan-y" }}
          >
            <section className="header">
              <div className="flex items-center gap-4">
                {headerInfo?.nexusProfileImage && (
                  <img
                    src={headerInfo.nexusProfileImage}
                    className="logo"
                    alt="profile"
                  />
                )}
                <div>
                  <div className="title">{decodeHtml(headerInfo?.nexusProfileTitle)}</div>
                  {headerInfo?.nexusProfileExpText && (
                    <button
                      className="read-more-btn"
                      onClick={() => setShowHeaderModal(true)}
                    >
                      Read More
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="hub mt-6 px-2 md:px-4">
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
            </section>
          </motion.div>
        </AnimatePresence>
      </div>

      {showHeaderModal && (
        <Modal onClose={() => setShowHeaderModal(false)}>
          <h2 className="text-xl font-bold" style={{ marginBottom: 12, color: '#000' }}>
            {decodeHtml(headerInfo?.nexusProfileTitle)}
          </h2>
          <hr className="border-gray-300" style={{ marginTop: 12, marginBottom: 12 }} />
          <div className="text-gray-700">
            {decodeHtml(headerInfo?.nexusProfileExpText)}
          </div>
        </Modal>
      )}

      {selectedToken && (
        <BottomSlide
          onClose={() => setSelectedToken(null)}
          links={links}
          token={selectedToken}
        />
      )}

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
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120) closeIframe();
              }}
            >
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
    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
}

function EntityCard({ image, name, onClick }: EntityCardProps) {
  return (
    <div
      className="relative aspect-square rounded-3xl overflow-hidden cursor-pointer group border border-[#212121]"
      onClick={onClick}
    >
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0" style={{ padding: 16 }}>
        <h3 className="text-white text-lg leading-tight" style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 500 }}>{name}</h3>
      </div>
    </div>
  );
}

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-xl max-w-xl w-[90%] relative"
        style={{ padding: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute text-2xl bg-transparent border-none cursor-pointer"
          style={{ top: 8, right: 16 }}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

interface BottomSlideProps {
  onClose: () => void;
  links: { data?: { dataPayload?: { value?: LinkItem[] } } };
  token: AggregatedToken;
}

function BottomSlide({ onClose, links, token }: BottomSlideProps) {
  const linkList = links?.data?.dataPayload?.value || [];
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <motion.div
      className="bottom-slide"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.25}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (info.offset.y > 120) onClose();
      }}
    >
      <div className="bottom-slide-handle" />
      <div className="bottom-slide-content">
        <div className="max-w-md text-center" style={{ margin: '0 auto', padding: '16px 16px 40px' }}>
          <img
            src={token.brandWalletnexusProfileImage}
            className="w-36 h-36 rounded-full object-cover"
            style={{ margin: '0 auto' }}
            alt="token"
          />
          <h3 className="text-xl font-bold" style={{ marginTop: 12 }}>
            {token.brandWalletnexusProfileTitle}
          </h3>
          <p className="text-gray-300" style={{ marginTop: 12 }}>{token.brandWalletnexusProfileExpText}</p>

          {linkList.length > 0 ? (
            <div style={{ marginTop: 24 }}>
              <h4 className="text-lg font-semibold" style={{ marginBottom: 12 }}>Links</h4>
              {linkList.map((link, i) => (
                <div
                  key={i}
                  className="social-links"
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
                    className="social-links-icon"
                    src={link.LinkImage}
                    alt="link"
                  />
                  <div>
                    <div className="text-left font-bold">{link.LinkTitle}</div>
                    <div className="social-links-text">{link.LinkText}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="opacity-75" style={{ marginTop: 16 }}>No links available.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
