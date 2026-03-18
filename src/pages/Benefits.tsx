import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { api } from "../actions/api";
import {
  buildWalletURLWithVirtualProxy,
  appendEmbedParam,
} from "../utils/helpers";

const TRAVEL_URL = "https://club.insidertravelclub.com";
const NFT_URL = "https://seemynft.page/mytoken/C0D11BC0-3F15-468D-BC1C-242FAB9EA2E6";

interface WalletProfile {
  VirtualProxyGUID: string;
  EventWalletBGImage: string;
  EventWalletTitle: string;
  StartTime: string;
}

interface BenefitCardProps {
  image: string;
  name: string;
  onClick: () => void;
  index: number;
}

function BenefitCard({ image, name, onClick, index }: BenefitCardProps) {
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

export default function Benefits() {
  const [activeWalletLink, setActiveWalletLink] = useState<string | null>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showEventsIntro, setShowEventsIntro] = useState(true);
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<WalletProfile[]>([]);

  const eventsDragControls = useDragControls();
  const iframeDragControls = useDragControls();

  useEffect(() => {
    setLoading(true);
    api.fetchWalletProfiles()
      .then((data) => setWallets(data?.dataPayload?.value || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showEventsModal) {
      setShowEventsIntro(true);
      const timer = setTimeout(() => setShowEventsIntro(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showEventsModal]);

  useEffect(() => {
    if (activeWalletLink || showEventsModal) {
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
  }, [activeWalletLink, showEventsModal]);

  useEffect(() => {
    const authMenu = document.getElementById("authIDMenu");
    if (authMenu) {
      authMenu.style.display =
        activeWalletLink || showEventsModal ? "none" : "block";
    }
  }, [activeWalletLink, showEventsModal]);

  const closeContainer = () => {
    setActiveWalletLink(null);
  };

  const iframeSrc = useMemo(
    () => (activeWalletLink ? appendEmbedParam(activeWalletLink) : null),
    [activeWalletLink]
  );

  const benefitCards = [
    {
      image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60",
      name: "Travel",
      onClick: () => setActiveWalletLink(TRAVEL_URL),
    },
    {
      image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9",
      name: "Events",
      onClick: () => setShowEventsModal(true),
    },
    {
      image: "https://images.pexels.com/photos/2708981/pexels-photo-2708981.jpeg",
      name: "Games",
      onClick: () => setActiveWalletLink(NFT_URL),
    },
  ];

  if (loading) return (
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

  return (
    <div id="benefits" style={{ paddingTop: 'var(--sai-top)' }}>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="content-max-width"
      >
        <h2 className="heading-oswald" style={{ marginBottom: 20 }}>
          Benefits
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {benefitCards.map((card, i) => (
            <BenefitCard
              key={card.name}
              image={card.image}
              name={card.name}
              onClick={card.onClick}
              index={i}
            />
          ))}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {showEventsModal && (
          <>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEventsModal(false)}
            />

            <motion.div
              className="bottom-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 28, stiffness: 180 }}
              drag="y"
              dragControls={eventsDragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 60 || info.velocity.y > 300) setShowEventsModal(false);
              }}
            >
              <div
                className="drag-handle-wrapper drag-handle-wrapper--top"
                onPointerDown={(e) => eventsDragControls.start(e)}
              >
                <div className="drag-handle-bar drag-handle-bar--md" />
              </div>
              <div className="bottom-sheet-scroll">
                <AnimatePresence mode="wait">
                  {showEventsIntro ? (
                    <motion.div
                      key="intro"
                      className="flex items-center justify-center text-center events-intro-container"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <p className="events-intro-text">
                        You can use your membership at the following events.
                      </p>
                    </motion.div>
                  ) : loading ? (
                    <motion.div
                      key="loading"
                      className="flex items-center justify-center events-intro-container"
                      style={{ gap: 8 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                          className="loading-dot"
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="events-grid-container">
                        <h5 className="events-grid-title">
                          You can use your membership at the following events.
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                          {wallets.map((wallet, i) => (
                            <BenefitCard
                              key={wallet.VirtualProxyGUID}
                              image={wallet.EventWalletBGImage}
                              name={wallet.EventWalletTitle}
                              onClick={() => {
                                setShowEventsModal(false);
                                setActiveWalletLink(
                                  buildWalletURLWithVirtualProxy(wallet.VirtualProxyGUID)
                                );
                              }}
                              index={i}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {iframeSrc && (
          <>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeContainer}
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
                if (info.offset.y > 60 || info.velocity.y > 300) closeContainer();
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
                  src={iframeSrc}
                  title="Membership Content"
                  className="iframe-content"
                  allow="camera; fullscreen"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
