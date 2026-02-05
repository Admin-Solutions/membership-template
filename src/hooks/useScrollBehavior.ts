import { useState, useEffect, useRef, useCallback } from "react";
import type { RefObject } from "react";

interface ScrollBehavior {
  headerVisible: boolean;
  navCollapsed: boolean;
  navExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
  scrollRef: RefObject<HTMLElement | null>;
}

const COLLAPSE_THRESHOLD = 120;
const SCROLL_MIN = 5;

export function useScrollBehavior(): ScrollBehavior {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);

  const scrollRef = useRef<HTMLElement | null>(null);
  const lastScrollY = useRef(0);
  const navCollapsedRef = useRef(false);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // Delay mounting to prevent flash on page refresh/browser scroll restoration
    const mountTimer = setTimeout(() => {
      hasMountedRef.current = true;
    }, 100);

    const handleScroll = () => {
      if (!hasMountedRef.current) return;

      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      const currentScrollY = scrollElement.scrollTop;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const scrollingDown = scrollDelta > SCROLL_MIN;
      const scrollingUp = scrollDelta < -SCROLL_MIN;

      if (Math.abs(scrollDelta) > SCROLL_MIN) {
        // Header visibility: hide on scroll down, show on scroll up
        if (scrollingDown && currentScrollY > 60) {
          setHeaderVisible(false);
        } else if (scrollingUp) {
          setHeaderVisible(true);
        }

        // Nav collapse: mobile only (< 768px)
        if (window.innerWidth < 768) {
          if (navCollapsedRef.current && (scrollingDown || scrollDelta >= 0)) {
            setNavExpanded(false);
          } else if (scrollingUp) {
            setNavCollapsed(false);
            navCollapsedRef.current = false;
            setNavExpanded(false);
          } else if (scrollingDown && currentScrollY > COLLAPSE_THRESHOLD) {
            setNavCollapsed(true);
            navCollapsedRef.current = true;
            setNavExpanded(false);
          }
        } else {
          // Desktop - always expanded
          setNavCollapsed(false);
          navCollapsedRef.current = false;
        }

        lastScrollY.current = currentScrollY;
      }
    };

    // Set up scroll listener on the ref element
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      lastScrollY.current = scrollElement.scrollTop;
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      clearTimeout(mountTimer);
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Re-attach listener when scrollRef changes
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      if (!hasMountedRef.current) return;

      const currentScrollY = scrollElement.scrollTop;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const scrollingDown = scrollDelta > SCROLL_MIN;
      const scrollingUp = scrollDelta < -SCROLL_MIN;

      if (Math.abs(scrollDelta) > SCROLL_MIN) {
        if (scrollingDown && currentScrollY > 60) {
          setHeaderVisible(false);
        } else if (scrollingUp) {
          setHeaderVisible(true);
        }

        if (window.innerWidth < 768) {
          if (navCollapsedRef.current && (scrollingDown || scrollDelta >= 0)) {
            setNavExpanded(false);
          } else if (scrollingUp) {
            setNavCollapsed(false);
            navCollapsedRef.current = false;
            setNavExpanded(false);
          } else if (scrollingDown && currentScrollY > COLLAPSE_THRESHOLD) {
            setNavCollapsed(true);
            navCollapsedRef.current = true;
            setNavExpanded(false);
          }
        } else {
          setNavCollapsed(false);
          navCollapsedRef.current = false;
        }

        lastScrollY.current = currentScrollY;
      }
    };

    lastScrollY.current = scrollElement.scrollTop;
    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [scrollRef.current]);

  const handleSetNavExpanded = useCallback((expanded: boolean) => {
    setNavExpanded(expanded);
  }, []);

  return {
    headerVisible,
    navCollapsed,
    navExpanded,
    setNavExpanded: handleSetNavExpanded,
    scrollRef,
  };
}
