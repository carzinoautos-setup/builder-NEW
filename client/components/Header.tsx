import React, { useEffect, useRef, useState } from "react";

type HeaderProps = {
  topTemplate?: React.ReactNode;
};

export default function Header({ topTemplate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current) return;
      // if click target is outside the panel, close
      if (mobileOpen && !panelRef.current.contains(e.target as Node)) setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // use click instead of mousedown to avoid ordering issues with button handlers
    document.addEventListener("click", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
    };
  }, [mobileOpen]);

  // mobile panel class with reduced height
  const mobilePanelClass =
    "md:hidden fixed left-0 right-0 bg-white shadow-md z-[220] max-h-[50vh] overflow-auto transition-all duration-150 origin-top " +
    (mobileOpen ? "block" : "hidden");


  useEffect(() => {
    // add class to body to allow other components to hide when header menu is open
    if (mobileOpen) {
      document.body.classList.add("header-menu-open");
      // prevent body scroll while menu open
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("header-menu-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("header-menu-open");
      document.body.style.overflow = "";
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

      <header className="w-full bg-white shadow-sm relative" style={{ left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', width: '100vw', boxShadow: '1px 1px 12px 5px rgba(205,200,200,1)', zIndex: 40 }}>
        {/* Red top bar: 10px on mobile, 20px on desktop */}
        <div className="w-full bg-red-600 h-2.5 md:h-5" />
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

            <nav className="hidden lg:flex flex-1 items-center justify-center min-w-0 gap-[23px]" aria-label="Primary">
              <a className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors" href="#">
                Cars For Sale
              </a>
              <a className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors" href="#">
                Trade in your car
              </a>
              <a className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors" href="#">
                Sell your car
              </a>
              <a className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors" href="#">
                Dealers
              </a>
              <a className="text-gray-800 font-bold whitespace-nowrap hover:text-red-600 transition-colors" href="#">
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 max-w-[360px]">
                <button aria-label="search" className="p-[6px] rounded-[8px] hover:bg-gray-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                    <path d="M21.5306 20.4693L16.8365 15.7762C18.1971 14.1428 18.8755 12.0478 18.7307 9.92691C18.5859 7.80604 17.629 5.82265 16.0591 4.38932C14.4892 2.95599 12.4271 2.18308 10.3019 2.23138C8.17663 2.27968 6.15181 3.14547 4.64864 4.64864C3.14547 6.15181 2.27968 8.17663 2.23138 10.3019C2.18308 12.4271 2.95599 14.4892 4.38932 16.0591C5.82265 17.629 7.80604 18.5859 9.92691 18.7307C12.0478 18.8755 14.1428 18.1971 15.7762 16.8365L20.4693 21.5306C20.539 21.6003 20.6218 21.6556 20.7128 21.6933C20.8038 21.731 20.9014 21.7504 21 21.7504C21.0985 21.7504 21.1961 21.731 21.2871 21.6933C21.3782 21.6556 21.4609 21.6003 21.5306 21.5306C21.6003 21.4609 21.6556 21.3782 21.6933 21.2871C21.731 21.1961 21.7504 21.0985 21.7504 21C21.7504 20.9014 21.731 20.8038 21.6933 20.7128C21.6556 20.6218 21.6003 20.539 21.5306 20.4693ZM3.74997 10.5C3.74997 9.16495 4.14585 7.8599 4.88755 6.74987C5.62925 5.63984 6.68346 4.77467 7.91686 4.26378C9.15026 3.75289 10.5075 3.61922 11.8168 3.87967C13.1262 4.14012 14.3289 4.78299 15.2729 5.727C16.2169 6.671 16.8598 7.87374 17.1203 9.18311C17.3807 10.4925 17.2471 11.8497 16.7362 13.0831C16.2253 14.3165 15.3601 15.3707 14.2501 16.1124C13.14 16.8541 11.835 17.25 10.5 17.25C8.71037 17.248 6.99463 16.5362 5.72919 15.2708C4.46375 14.0053 3.75196 12.2896 3.74997 10.5Z" fill="#24272C" />
                  </svg>
                </button>

                <div className="h-4 w-px bg-gray-300 opacity-50" />

                <button aria-label="notifications" className="p-[6px] rounded-[8px] hover:bg-gray-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                    <path d="M16.6875 3C14.7516 3 13.0566 3.8325 12 5.23969C10.9434 3.8325 9.24844 3 7.3125 3C5.77146 3.00174 4.29404 3.61468 3.20436 4.70436C2.11468 5.79404 1.50174 7.27146 1.5 8.8125C1.5 15.375 11.2303 20.6869 11.6447 20.9062C11.7539 20.965 11.876 20.9958 12 20.9958C12.124 20.9958 12.2461 20.965 12.3553 20.9062C12.7697 20.6869 22.5 15.375 22.5 8.8125C22.4983 7.27146 21.8853 5.79404 20.7956 4.70436C19.706 3.61468 18.2285 3.00174 16.6875 3ZM12 19.3875C10.2881 18.39 3 13.8459 3 8.8125C3.00149 7.66921 3.45632 6.57317 4.26475 5.76475C5.07317 4.95632 6.16921 4.50149 7.3125 4.5C9.13594 4.5 10.6669 5.47125 11.3062 7.03125C11.3628 7.16881 11.4589 7.28646 11.5824 7.36926C11.7059 7.45207 11.8513 7.49627 12 7.49627C12.1487 7.49627 12.2941 7.45207 12.4176 7.36926C12.5411 7.28646 12.6372 7.16881 12.6937 7.03125C13.3331 5.46844 14.8641 4.5 16.6875 4.5C17.8308 4.50149 18.9268 4.95632 19.7353 5.76475C20.5437 6.57317 20.9985 7.66921 21 8.8125C21 13.8384 13.71 18.3891 12 19.3875Z" fill="#24272C" />
                  </svg>
                </button>

                <div className="h-4 w-px bg-gray-300 opacity-50" />

                <a href="#" className="flex items-center gap-2 px-2 py-1 rounded-[8px] hover:bg-gray-50 text-red-600 font-bold">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                    <path d="M21.6484 19.875C20.2206 17.4065 18.0203 15.6365 15.4525 14.7975C16.7226 14.0414 17.7094 12.8892 18.2614 11.5179C18.8134 10.1467 18.8999 8.63211 18.5078 7.20688C18.1157 5.78165 17.2666 4.52454 16.0909 3.6286C14.9151 2.73266 13.4778 2.24744 11.9996 2.24744C10.5215 2.24744 9.08414 2.73266 7.90842 3.6286C6.73269 4.52454 5.88358 5.78165 5.49146 7.20688C5.09935 8.63211 5.18592 10.1467 5.73788 11.5179C6.28984 12.8892 7.27668 14.0414 8.54683 14.7975C5.97902 15.6356 3.77871 17.4056 2.35089 19.875C2.29853 19.9604 2.2638 20.0554 2.24875 20.1544 2.2337 20.2534 2.23863 20.3544 2.26326 20.4515" fill="#24272C" />
                  </svg>
                  <span className="text-red-600 font-bold">Sign up</span>
                </a>
              </div>

              <button
                aria-label="menu"
                className="flex items-center justify-center md:hidden p-2"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setMobileOpen((s) => !s); }}
                aria-expanded={mobileOpen}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M3 6h14M3 12h14M3 18h14" stroke="#24272C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={panelRef}
          className={mobilePanelClass}
          style={{ zIndex: 99999, maxHeight: '50vh', top: '80px' }}
          onClick={(e) => {
            // if clicking on the panel background (not the inner content), close menu
            if (e.target === panelRef.current) {
              setMobileOpen(false);
            }
          }}
        >
          <div className="mx-auto max-w-[1325px] px-4 sm:px-6 lg:px-10 box-border">
            <div className="flex flex-col py-4">
              <a href="#" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors">
                Cars For Sale
              </a>
              <a href="#" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors">
                Trade in your car
              </a>
              <a href="#" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors">
                Sell your car
              </a>
              <a href="#" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors">
                Dealers
              </a>
              <a href="#" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800 font-bold hover:text-red-600 transition-colors">
                Contact
              </a>
              <div className="border-t border-gray-100 my-2" />
              <a href="#" onClick={() => setMobileOpen(false)} className="py-2 text-red-600 font-bold">
                Sign up
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
