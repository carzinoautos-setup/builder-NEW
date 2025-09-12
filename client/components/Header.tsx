import React, { useEffect, useRef, useState } from "react";

type HeaderProps = {
  topTemplate?: React.ReactNode;
};

export default function Header({ topTemplate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current) return;
      // if click target is outside the panel, close
      if (mobileOpen && !panelRef.current.contains(e.target as Node))
        setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // use click instead of mousedown to avoid ordering issues with button handlers
    document.addEventListener("click", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
    };
  }, [mobileOpen]);

  // mobile panel class now expands with content (not fixed limited height)
  const mobilePanelClass =
    "md:hidden left-0 right-0 bg-white shadow-md z-[220] transition-all duration-150 origin-top " +
    (mobileOpen ? "block" : "hidden");

  useEffect(() => {
    // add class to body to allow other components to hide when header menu is open
    if (mobileOpen) {
      document.body.classList.add("header-menu-open");
    } else {
      document.body.classList.remove("header-menu-open");
    }
    return () => {
      document.body.classList.remove("header-menu-open");
    };
  }, [mobileOpen]);

  return (
    <>
      {topTemplate ? (
        <section
          aria-label="header-top-template"
          className="w-full bg-transparent flex items-center justify-center"
        >
          {topTemplate}
        </section>
      ) : null}

      <header
        className="w-full bg-white shadow-sm relative"
        style={{
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          width: "100vw",
          boxShadow: "1px 1px 12px 5px rgba(205,200,200,1)",
          zIndex: 40,
        }}
      >
        {/* Red top bar: 5px on mobile, 10px on desktop */}
        <div className="w-full bg-red-600 h-[5px] md:h-[10px]" />
        <div className="mx-auto w-full max-w-[1325px] px-4 sm:px-6 lg:px-10 box-border">
          <div className="flex items-center justify-between h-[70px] md:h-[98px]">
            <div className="flex items-center gap-[48px]">
              <a href="/" className="inline-block" aria-label="Home">
                <img
                  alt="Carzino Logo"
                  src="https://api.builder.io/api/v1/image/assets/TEMP/5f7df3a15766597dc453f8c077d8e30d33f5cefb?width=574"
                  className="block h-4 sm:h-5"
                />
              </a>
            </div>

            <nav
              className="hidden lg:flex flex-1 items-center justify-start min-w-0 gap-[23px] pl-10"
              aria-label="Primary"
            >
              <a
                className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors"
                href="/cars-for-sale/"
              >
                Cars For Sale
              </a>
              <a
                className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors"
                href="https://www.carzino.com/trade-in-your-car/"
              >
                Trade in your car
              </a>
              <a
                className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors"
                href="https://www.carzino.com/sell-your-car/"
              >
                Sell your car
              </a>
              <a
                className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors"
                href="https://www.carzino.com/dealers/"
              >
                Dealers
              </a>
              <a
                className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors"
                href="https://www.carzino.com/contact/"
              >
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 max-w-[360px]">
                <a
                  href="#"
                  className="flex items-center gap-2 px-2 py-1 rounded-[8px] hover:bg-gray-50 text-red-600 font-bold"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7v1h14v-1c0-3.866-3.134-7-7-7z" fill="#E11D48" />
                  </svg>
                  <span className="text-red-600 font-bold">Login / Sign up</span>
                </a>
              </div>

              <button
                aria-label="menu"
                className="flex items-center justify-center md:hidden p-2"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileOpen((s) => !s);
                }}
                aria-expanded={mobileOpen}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                >
                  <path
                    d="M3 6h14M3 12h14M3 18h14"
                    stroke="#24272C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={panelRef}
          className={mobilePanelClass}
          onClick={(e) => {
            // if clicking on the panel background (not the inner content), close menu
            if (e.target === panelRef.current) {
              setMobileOpen(false);
            }
          }}
        >
          <div className="mx-auto max-w-[1325px] px-4 sm:px-6 lg:px-10 box-border">
            <div className="flex flex-col py-4">
              <a
                href="/cars-for-sale/"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors"
              >
                Cars For Sale
              </a>
              <a
                href="https://www.carzino.com/trade-in-your-car/"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors"
              >
                Trade in your car
              </a>
              <a
                href="https://www.carzino.com/sell-your-car/"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors"
              >
                Sell your car
              </a>
              <a
                href="https://www.carzino.com/dealers/"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors"
              >
                Dealers
              </a>
              <a
                href="https://www.carzino.com/contact/"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors"
              >
                Contact
              </a>

              {/* Mobile accordion: Search by Vehicle Type */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setVehiclesOpen((s) => !s)}
                  className="w-full flex items-center justify-between py-2 px-0 mt-1"
                >
                  <span className="text-gray-800 font-bold">Search by Vehicle Type</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform text-red-600 ${vehiclesOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {vehiclesOpen && (
                  <div className="grid grid-cols-3 gap-3 pt-3 pb-2">
                    {(() => {
                    const vehicleImages: Record<string, string> = {
                      Convertible: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F064c51214995430a9384ae9f1722bee9",
                      Coupe: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F1d042ebb458842a8a468794ae563fcc6",
                      Sedans: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F0eccbe1eccb94b3b8eee4d8cfb611864",
                      Hatchback: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562",
                      "Crossover/SUV": "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F98d1869674c64e419bf7ca7da66e25b8",
                      Vans: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Ff0d0c6c20e02423dad8eefa6f0ef508a",
                      Wagons: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F24bf3ece0537462bbd1edd12a2485c0a",
                      "Shop Used": "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F30f147c94e904a5ba1b1ce7ce9ebd89b",
                      "Used Trucks": "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fd19800dca9084c47b346aae3c1681942",
                      Trucks: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
                      "Ext Cabs": "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F0eccbe1eccb94b3b8eee4d8cfb611864",
                      ELECTRIC: "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F87eaf3866c0e482c912cb9c0ca83d44a",
                    };

                    const displayMap: Record<string, React.ReactNode> = {
                      Convertible: "Convertible",
                      Coupe: "Coupe",
                      Sedans: "Sedans",
                      Hatchback: "Hatchback",
                      "Crossover/SUV": "Crossover/SUV",
                      Vans: "Vans/Minivans",
                      Wagons: "Wagons",
                      "Shop Used": "Truck",
                      "Used Trucks": "Extended Cab",
                      Trucks: "Crew Cab",
                      "Ext Cabs": "All Cars",
                      ELECTRIC: "All Trucks",
                    };

                    const labels = Object.keys(displayMap);

                    return labels.map((label) => {
                      const display = String(displayMap[label] || label);
                      const slug = display.toLowerCase().replace(/\s+/g, "-");
                      const url = `/cars-for-sale/${slug}/`;

                      return (
                        <a
                          key={label}
                          href={url}
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileOpen(false);
                            // Navigate to filtered inventory URL for this vehicle type
                            window.location.href = url;
                          }}
                          className="block text-center bg-white border border-gray-200 rounded-md p-2 text-sm hover:shadow-sm"
                        >
                          <img
                            src={vehicleImages[label] || import.meta.env.VITE_PLACEHOLDER_IMAGE}
                            alt={display}
                            className="w-full h-12 object-contain mb-1"
                          />
                          <div className="text-xs font-medium text-gray-800">{display}</div>
                        </a>
                      );
                    });
                  })()}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 my-2" />
              <a
                href="#"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-red-600 font-bold"
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
