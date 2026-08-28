import { createContext, useEffect, useState } from "react";
import Akili from "./media/logo/akili.png";
import AkiliDark from "./media/logo/akili-dark.png";
import AkiliLoginLogo from "./media/logo/akili-icon.png";
import System from "./models/system";

export const REFETCH_LOGO_EVENT = "refetch-logo";
export const LogoContext = createContext();

export function LogoProvider({ children }) {
  const [logo, setLogo] = useState("");
  const [loginLogo, setLoginLogo] = useState("");
  const [isCustomLogo, setIsCustomLogo] = useState(false);
  const DefaultLoginLogo = AkiliLoginLogo;

  async function fetchInstanceLogo() {
    try {
      const { isCustomLogo, logoURL } = await System.fetchLogo();
      if (logoURL) {
        setLogo(logoURL);
        setLoginLogo(isCustomLogo ? logoURL : DefaultLoginLogo);
        setIsCustomLogo(isCustomLogo);
      } else {
        localStorage.getItem("theme") !== "default"
          ? setLogo(AkiliDark)
          : setLogo(Akili);
        setLoginLogo(DefaultLoginLogo);
        setIsCustomLogo(false);
      }
    } catch (err) {
      localStorage.getItem("theme") !== "default"
        ? setLogo(AkiliDark)
        : setLogo(Akili);
      setLoginLogo(DefaultLoginLogo);
      setIsCustomLogo(false);
      console.error("Failed to fetch logo:", err);
    }
  }

  useEffect(() => {
    fetchInstanceLogo();
    window.addEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
    return () => {
      window.removeEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
    };
  }, []);

  return (
    <LogoContext.Provider value={{ logo, setLogo, loginLogo, isCustomLogo }}>
      {children}
    </LogoContext.Provider>
  );
}
