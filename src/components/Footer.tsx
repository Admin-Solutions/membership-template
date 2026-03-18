import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Network, Wallet, Gift, ArrowUpLeft, X, Settings, Bell, HelpCircle, LogOut, Shield } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getHistory, onHistoryChange } from "../utils/helpers";
import { handleBack } from "../utils/hubNavigation";
import { LazyWallet } from "./LazyWallet";

interface FooterProps {
  navCollapsed: boolean;
  navExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
}

interface NavItem {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  path?: string;
  isModal?: boolean;
  isMain?: boolean;
  onClick?: () => void;
}

export default function Footer({ navCollapsed, navExpanded, setNavExpanded }: FooterProps) {
  const location = useLocation();
  const [historyLength, setHistoryLength] = useState(getHistory()?.length || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const activeGUIDRef = useRef<string | null>(null);

  // Main navigation items (without Profile - moved to header)
  // Wallet is special - opens modal instead of navigating
  const navItems: NavItem[] = [
    { title: "Hub", icon: Network, path: "/hub" },
    { title: "Wallet", icon: Wallet, path: "/wallet", isModal: true },
    { title: "Benefits", icon: Gift, path: "/benefits" },
  ];

  // Hamburger menu items
  const menuItems = [
    { title: "Settings", icon: Settings, action: "settings" },
    { title: "Notifications", icon: Bell, action: "notifications" },
    { title: "Help", icon: HelpCircle, action: "help" },
    { title: "Sign Out", icon: LogOut, action: "signout" },
  ];

  useEffect(() => {
    const unsubscribe = onHistoryChange(() => {
      setHistoryLength(getHistory()?.length || 0);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (menuOpen) {
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
  }, [menuOpen]);

  const showBack = location.pathname.startsWith("/hub") && historyLength > 1;

  const handleBackClick = () => {
    const result = handleBack({
      activeGUIDRef,
    });

    if (result?.action === "redirect" && result.url) {
      window.location.href = result.url;
    }
  };

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    // Handle menu actions
    switch (action) {
      case "settings":
        // Navigate to settings
        break;
      case "notifications":
        // Show notifications
        break;
      case "help":
        // Show help
        break;
      case "signout":
        // Sign out
        break;
    }
  };

  // Determine if nav pill should be collapsed
  const isCollapsed = navCollapsed && !navExpanded;

  const mainButton = showBack
    ? { title: "Back", icon: ArrowUpLeft, onClick: handleBackClick, path: undefined }
    : { title: "Home", icon: Home, path: "/", onClick: undefined };

  // Toggle nav expansion when collapsed trigger is clicked
  const toggleNavExpansion = () => {
    setNavExpanded(!navExpanded);
  };

  // Build all nav items including home/back
  const allNavItems: NavItem[] = [
    { ...mainButton, isMain: true },
    ...navItems,
  ];

  return (
    <>
      <div className="footer-container">
        {/* Left Nav Pill - Collapsible */}
        <div className={`nav-pill ${isCollapsed ? "nav-pill-collapsed" : "nav-pill-expanded"}`}>
          {allNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = item.path === location.pathname ||
              (item.path === "/hub" && location.pathname.startsWith("/hub")) ||
              (item.isModal && walletOpen);
            const isTrigger = isCollapsed && isActive;
            const isHidden = isCollapsed && !isActive;

            // Determine class names
            const classNames = [
              "nav-item",
              isActive ? "nav-item-active" : "",
              isTrigger ? "nav-item-trigger" : "",
              isHidden ? "nav-item-hidden" : "",
            ].filter(Boolean).join(" ");

            // Handle click - if trigger, expand nav; otherwise normal action
            const handleClick = (e: React.MouseEvent) => {
              if (isTrigger) {
                e.preventDefault();
                toggleNavExpansion();
                return;
              }
              if (item.isModal) {
                setWalletOpen(true);
              } else if (item.onClick) {
                item.onClick();
              }
            };

            // Use NavLink for items with paths (except modals), button otherwise
            if (item.path && !item.isModal && !item.onClick) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={isTrigger ? (e) => { e.preventDefault(); toggleNavExpansion(); } : undefined}
                  className={classNames}
                >
                  <IconComponent size={20} />
                  <span className="nav-label">{item.title}</span>
                </NavLink>
              );
            }

            return (
              <button
                key={item.path || item.title}
                onClick={handleClick}
                className={classNames}
              >
                <IconComponent size={20} />
                <span className="nav-label">{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Hamburger Pill */}
        <button
          className="hamburger-pill"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8H13.75M5 12H19M10.25 16L19 16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
        </button>
      </div>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="menu-backdrop"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="menu-panel"
            >
              <button
                className="menu-close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>

              <div className="menu-header">
                <div className="menu-header-content">
                  <div className="menu-header-icon">
                    <Shield size={20} />
                  </div>
                  <div className="menu-header-text">
                    <h2>Membership</h2>
                    <p>Navigation</p>
                  </div>
                </div>
                <div className="menu-header-divider" />
              </div>

              <div className="menu-items">
                {menuItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={item.action}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + index * 0.04 }}
                      className="menu-item-slide"
                      onClick={() => handleMenuAction(item.action)}
                    >
                      <div className="menu-item-icon">
                        <IconComponent size={18} />
                      </div>
                      <span>{item.title}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lazy-loaded Wallet Modal */}
      <LazyWallet
        isOpen={walletOpen}
        onClose={() => setWalletOpen(false)}
      />
    </>
  );
}
