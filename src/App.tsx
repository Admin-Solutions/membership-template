import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { HISTORY_KEY } from "./utils/helpers";
import { useScrollBehavior } from "./hooks/useScrollBehavior";
import Home from "./pages/Home";
import News from "./pages/News";
import Hub from "./pages/Hub";
import Wallet from "./pages/Wallet";
import Benefits from "./pages/Benefits";
import Profile from "./pages/Profile";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ToastContainer } from "./components/ToastContainer";

function App() {
  const location = useLocation();
  const { headerVisible, navCollapsed, navExpanded, setNavExpanded, scrollRef } = useScrollBehavior();

  const layoutPages = ["/hub", "/profile", "/wallet", "/benefits", "/news"];
  const showLayout = layoutPages.includes(location.pathname);

  useEffect(() => {
    if (!location.pathname.startsWith("/hub")) {
      sessionStorage.removeItem("membershipHistory");
      sessionStorage.removeItem(HISTORY_KEY);
    }
  }, [location.pathname]);

  return (
    <div className="app">
      {showLayout && <Header visible={headerVisible} />}

      <main
        ref={scrollRef as React.RefObject<HTMLElement>}
        className={`app-main ${showLayout ? "with-header" : ""}`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/benefits" element={<Benefits />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {showLayout && (
        <footer className="app-footer">
          <Footer
            navCollapsed={navCollapsed}
            navExpanded={navExpanded}
            setNavExpanded={setNavExpanded}
          />
        </footer>
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
