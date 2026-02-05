import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchWalletProfiles } from "../store/membershipSlice";
import {
  formatEventDate,
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

export default function Benefits() {
  const dispatch = useAppDispatch();

  const [activeWalletLink, setActiveWalletLink] = useState<string | null>(null);

  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showEventsIntro, setShowEventsIntro] = useState(true);

  const walletProfilesData = useAppSelector((state) => state.walletProfiles);
  const wallets: WalletProfile[] = walletProfilesData?.data?.dataPayload?.value || [];

  useEffect(() => {
    dispatch(fetchWalletProfiles());
  }, [dispatch]);

  useEffect(() => {
    if (showEventsModal) {
      setShowEventsIntro(true);
      const timer = setTimeout(() => setShowEventsIntro(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showEventsModal]);

  useEffect(() => {
    if (activeWalletLink || showEventsModal) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
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

  return (
    <div id="benefits">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid-wrap">
          <div className="grid-item">
            <div
              className="box box-travel"
              onClick={() => setActiveWalletLink(TRAVEL_URL)}
            >
              <div className="title">Travel</div>
            </div>
          </div>

          <div className="grid-item">
            <div
              className="box box-events"
              onClick={() => setShowEventsModal(true)}
            >
              <div className="title">Events</div>
            </div>
          </div>

          <div className="grid-item">
            <div
              className="box box-games"
              onClick={() => setActiveWalletLink(NFT_URL)}
            >
              <div className="title">Games</div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showEventsModal && (
          <>
            <motion.div
              className="benefits-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEventsModal(false)}
            />

            <motion.div
              className="events-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120) setShowEventsModal(false);
              }}
            >
              <AnimatePresence mode="wait">
                {showEventsIntro ? (
                  <motion.div
                    key="intro"
                    className="flex items-center justify-center text-center"
                    style={{ height: "60vh" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <p className="text-white text-lg">
                      You can use your membership at the following events.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="max-w-xl mx-auto px-4">
                      <h5 className="my-4 text-white text-lg">
                        You can use your membership at the following events.
                      </h5>
                      <div className="grid-wrap">
                        {wallets.map((wallet) => (
                          <div key={wallet.VirtualProxyGUID} className="grid-item">
                            <div
                              className="box flex items-center"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setShowEventsModal(false);
                                setActiveWalletLink(
                                  buildWalletURLWithVirtualProxy(wallet.VirtualProxyGUID)
                                );
                              }}
                            >
                              <img
                                src={wallet.EventWalletBGImage}
                                alt=""
                                className="w-36 h-36 object-cover rounded-lg"
                              />
                              <div className="ml-4">
                                <div className="title">{wallet.EventWalletTitle}</div>
                                <div className="text-white text-sm">
                                  {formatEventDate(wallet.StartTime)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {iframeSrc && (
          <>
            <motion.div
              className="benefits-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
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
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120) closeContainer();
              }}
            >
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
