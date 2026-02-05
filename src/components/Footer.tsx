import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Network, Wallet, Gift, ArrowUpLeft, Menu, X, Settings, Bell, HelpCircle, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getHistory, onHistoryChange } from "../utils/helpers";
import { handleBack } from "../utils/hubNavigation";
import { useAppDispatch } from "../store/hooks";
import { LazyWallet } from "./LazyWallet";

interface FooterProps {
  navCollapsed: boolean;
  navExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
}

export default function Footer({ navCollapsed, navExpanded, setNavExpanded }: FooterProps) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [historyLength, setHistoryLength] = useState(getHistory()?.length || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const activeGUIDRef = useRef<string | null>(null);

  // Main navigation items (without Profile - moved to header)
  // Wallet is special - opens modal instead of navigating
  const navItems = [
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

  const showBack = location.pathname.startsWith("/hub") && historyLength > 1;

  const handleBackClick = () => {
    const result = handleBack({
      dispatch,
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

  // Find active nav item for collapsed state
  const activeNavItem = navItems.find((item) => location.pathname === item.path) || navItems[0];
  const ActiveIcon = activeNavItem.icon;

  // Determine if nav pill should be collapsed
  const isCollapsed = navCollapsed && !navExpanded;

  const mainButton = showBack
    ? { title: "Back", icon: ArrowUpLeft, onClick: handleBackClick }
    : { title: "Home", icon: Home, path: "/" };

  const MainIcon = mainButton.icon;

  return (
    <>
      <div className="footer-container">
        {/* Left Nav Pill - Collapsible */}
        <div className={`nav-pill ${isCollapsed ? "nav-pill-collapsed" : "nav-pill-expanded"}`}>
          {isCollapsed ? (
            // Collapsed: Show only active icon as trigger
            <button
              className="nav-trigger"
              onClick={() => setNavExpanded(true)}
              aria-label="Expand navigation"
            >
              <ActiveIcon size={22} />
            </button>
          ) : (
            // Expanded: Show all nav items
            <>
              {/* Home/Back button */}
              {mainButton.path ? (
                <NavLink to={mainButton.path} className="nav-item">
                  <MainIcon size={22} />
                  <span className="nav-label">{mainButton.title}</span>
                </NavLink>
              ) : (
                <button
                  className="nav-item"
                  onClick={mainButton.onClick}
                >
                  <MainIcon size={22} />
                  <span className="nav-label">{mainButton.title}</span>
                </button>
              )}

              {/* Nav items */}
              {navItems.map((item) => {
                const IconComponent = item.icon;

                // Wallet opens modal instead of navigating
                if (item.isModal) {
                  return (
                    <button
                      key={item.path}
                      onClick={() => setWalletOpen(true)}
                      className={`nav-item ${walletOpen ? "nav-item-active" : ""}`}
                    >
                      <IconComponent size={22} />
                      <span className="nav-label">{item.title}</span>
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "nav-item-active" : ""}`
                    }
                  >
                    <IconComponent size={22} />
                    <span className="nav-label">{item.title}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </div>

        {/* Right Hamburger Pill */}
        <button
          className="hamburger-pill"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
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
              <div className="menu-header">
                <h2>Menu</h2>
                <button
                  className="menu-close"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="menu-items">
                {menuItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={item.action}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="menu-item-slide"
                      onClick={() => handleMenuAction(item.action)}
                    >
                      <IconComponent size={20} />
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
