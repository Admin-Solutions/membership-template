import { useEffect } from "react";
import type { ReactNode } from "react";

interface ViewportProviderProps {
  children: ReactNode;
}

export default function ViewportProvider({ children }: ViewportProviderProps) {
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  return <>{children}</>;
}
