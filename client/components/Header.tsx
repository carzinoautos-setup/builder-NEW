import React from "react";

type HeaderProps = {
  topTemplate?: React.ReactNode;
};

export default function Header({ topTemplate }: HeaderProps) {
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

      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto w-full max-w-[1325px] px-4 sm:px-6 lg:px-10 box-border">
          <div className="flex items-center justify-between h-[98px] md:h-[84px]">
            {/* Left / Logo */}
            <div className="flex items-center gap-6">
              <a href="/" className="inline-block">
                <img
                  alt="Carzino Logo"
                  src="https://api.builder.io/api/v1/image/assets/TEMP/5f7df3a15766597dc453f8c077d8e30d33f5cefb?width=574"
                  className="block h-5 sm:h-6"
                />
              </a>
            </div>

            {/* Center / Nav - hidden on small screens */}
            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center min-w-0">
              <a className="text-gray-800 font-medium whitespace-nowrap" href="#">
                Cars For Sale
              </a>
              <a className="text-gray-800 font-medium whitespace-nowrap" href="#">
                Trade in your car
              </a>
              <a className="text-gray-800 font-medium whitespace-nowrap" href="#">
                Sell your car
              </a>
              <a className="text-gray-800 font-medium whitespace-nowrap" href="#">
                Dealers
              </a>
              <a className="text-gray-800 font-medium whitespace-nowrap" href="#">
                Contact
              </a>
            </nav>

            {/* Right / Actions */}
            <div className="flex items-center gap-3">
              {/* Search/Notifications/Sign up visible on md+ */}
              <div className="hidden md:flex items-center gap-3 max-w-[360px]">
                <button aria-label="search" className="p-2 rounded-md hover:bg-gray-100">
                  {/* magnifier icon svg */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.53 20.47L16.84 15.77C18.2 14.14 18.88 12.05 18.73 9.926C18.59 7.806 17.63 5.823 16.06 4.389C14.49 2.956 12.43 2.183 10.302 2.231C8.177 2.28 6.152 3.145 4.649 4.649C3.146 6.152 2.28 8.177 2.231 10.302C2.183 12.427 2.956 14.489 4.389 16.059C5.822 17.629 7.806 18.586 9.927 18.731C12.048 18.876 14.143 18.197 15.776 16.836L20.47 21.53" fill="#24272C" />
                  </svg>
                </button>

                <div className="h-4 w-px bg-gray-300 opacity-50" />

                <button aria-label="notifications" className="p-2 rounded-md hover:bg-gray-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6875 3C14.7516 3 13.0566 3.8325 12 5.23969C10.9434 3.8325 9.24844 3 7.3125 3C5.77146 3.00174 4.29404 3.61468 3.20436 4.70436C2.11468 5.79404 1.50174 7.27146 1.5 8.8125C1.5 15.375 11.2303 20.6869 11.6447 20.9062C11.7539 20.965 11.876 20.9958 12 20.9958C12.124 20.9958 12.2461 20.965 12.3553 20.9062C12.7697 20.6869 22.5 15.375 22.5 8.8125C22.4983 7.27146 21.8853 5.79404 20.7956 4.70436C19.706 3.61468 18.2285 3.00174 16.6875 3ZM12 19.3875C10.2881 18.39 3 13.8459 3 8.8125C3.00149 7.66921 3.45632 6.57317 4.26475 5.76475C5.07317 4.95632 6.16921 4.50149 7.3125 4.5C9.13594 4.5 10.6669 5.47125 11.3062 7.03125C11.3628 7.16881 11.4589 7.28646 11.5824 7.36926C11.7059 7.45207 11.8513 7.49627 12 7.49627C12.1487 7.49627 12.2941 7.45207 12.4176 7.36926C12.5411 7.28646 12.6372 7.16881 12.6937 7.03125C13.3331 5.46844 14.8641 4.5 16.6875 4.5C17.8308 4.50149 18.9268 4.95632 19.7353 5.76475C20.5437 6.57317 20.9985 7.66921 21 8.8125C21 13.8384 13.71 18.3891 12 19.3875Z" fill="#24272C" />
                  </svg>
                </button>

                <div className="h-4 w-px bg-gray-300 opacity-50" />

                <a href="#" className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 text-red-600 font-medium">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.6484 19.875C20.2206 17.4065 18.0203 15.6365 15.4525 14.7975C16.7226 14.0414 17.7094 12.8892 18.2614 11.5179C18.8134 10.1467 18.8999 8.63211 18.5078 7.20688C18.1157 5.78165 17.2666 4.52454 16.0909 3.6286C14.9151 2.73266 13.4778 2.24744 11.9996 2.24744C10.5215 2.24744 9.08414 2.73266 7.90842 3.6286C6.73269 4.52454 5.88358 5.78165 5.49146 7.20688C5.09935 8.63211 5.18592 10.1467 5.73788 11.5179C6.28984 12.8892 7.27668 14.0414 8.54683 14.7975C5.97902 15.6356 3.77871 17.4056 2.35089 19.875C2.29853 19.9604 2.2638 20.0554 2.24875 20.1544 2.2337 20.2534 2.23863 20.3544 2.26326 20.4515" fill="#24272C" />
                  </svg>
                  <span className="text-red-600 font-medium">Sign up</span>
                </a>
              </div>

              {/* Menu button visible on small screens */}
              <button aria-label="menu" className="p-2 rounded-lg border border-red-600 text-red-600 md:hidden">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.75 5.625H16.25M3.75 10H16.25M3.75 14.375H16.25" stroke="#E82121" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Keep menu icon also on md+ in case design needs it */}
              <button aria-label="menu-desktop" className="hidden md:inline-flex p-2 rounded-lg border border-red-600 text-red-600 lg:hidden">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.75 5.625H16.25M3.75 10H16.25M3.75 14.375H16.25" stroke="#E82121" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
