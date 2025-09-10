import React from "react";

type HeaderProps = {
  topTemplate?: React.ReactNode;
};

export default function Header({ topTemplate }: HeaderProps) {
  return (
    <>
      <section
        data-loc="client/components/Header.tsx:before:1:1"
        aria-label="header-top-template"
        className="w-full flex items-center justify-center font-normal bg-transparent"
      >
        {topTemplate || null}
      </section>

      <header
        data-loc="client/components/Header.tsx:1:1"
        className="bg-white shadow-sm"
      >
        <div
          data-loc="client/components/Header.tsx:10:9"
          className="max-w-[1325px] w-full mx-auto flex items-center justify-between h-[98px] px-4 md:px-6 lg:px-10 box-border"
        >
          <div
            data-loc="client/components/Header.tsx:13:11"
            className="flex items-center gap-6 md:gap-12"
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/5f7df3a15766597dc453f8c077d8e30d33f5cefb?width=574"
              alt="Carzino Logo"
              data-loc="client/components/Header.tsx:14:13"
              className="h-5 md:h-6 block"
            />
          </div>

          <nav
            data-loc="client/components/Header.tsx:22:11"
            className="hidden md:flex items-center flex-1 justify-center gap-6 md:gap-8 min-w-0"
          >
            <a
              href="#"
              data-loc="client/components/Header.tsx:23:13"
              className="text-[#24272C] font-medium text-sm md:text-base transition"
            >
              Cars For Sale
            </a>
            <a
              href="#"
              data-loc="client/components/Header.tsx:26:13"
              className="text-[#24272C] font-medium text-sm md:text-base transition"
            >
              Trade in your car
            </a>
            <a
              href="#"
              data-loc="client/components/Header.tsx:29:13"
              className="text-[#24272C] font-medium text-sm md:text-base transition"
            >
              Sell your car
            </a>

            <div data-loc="client/components/Header.tsx:32:13" className="relative">
              <div
                data-loc="client/components/Header.tsx:33:15"
                className="flex items-center text-[#24272C] font-medium gap-1 text-sm md:text-base"
              >
                Dealers
              </div>
            </div>

            <a
              href="#"
              data-loc="client/components/Header.tsx:37:25"
              className="text-[#24272C] font-medium text-sm md:text-base transition"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              {/* search, notifications, profile - show condensed on mobile */}
              <button
                data-loc="client/components/Header.tsx:47:15"
                aria-label="search"
                className="p-2 rounded-md hover:bg-gray-100 md:p-1"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block h-5 w-5"
                >
                  <path
                    d="M21.5306 20.4693L16.8365 15.7762C18.1971 14.1428 18.8755 12.0478 18.7307 9.92691C18.5859 7.80604 17.629 5.82265 16.0591 4.38932C14.4892 2.95599 12.4271 2.18308 10.3019 2.23138C8.17663 2.27968 6.15181 3.14547 4.64864 4.64864C3.14547 6.15181 2.27968 8.17663 2.23138 10.3019C2.18308 12.4271 2.95599 14.4892 4.38932 16.0591C5.82265 17.629 7.80604 18.5859 9.92691 18.7307C12.0478 18.8755 14.1428 18.1971 15.7762 16.8365L20.4693 21.5306C21.6003 21.6003 21.6556 21.3782 21.6933 21.2871C21.731 21.1961 21.7504 21.0985 21.7504 21C21.7504 20.9014 21.731 20.8038 21.6933 20.7128C21.6556 20.6218 21.6003 20.539 21.5306 20.4693Z"
                    fill="#24272C"
                  />
                </svg>
              </button>

              <button
                data-loc="client/components/Header.tsx:57:15"
                className="p-2 rounded-md hover:bg-gray-100 md:p-1"
                aria-label="notifications"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block h-5 w-5"
                >
                  <path
                    d="M16.6875 3C14.7516 3 13.0566 3.8325 12 5.23969C10.9434 3.8325 9.24844 3 7.3125 3C5.77146 3.00174 4.29404 3.61468 3.20436 4.70436C2.11468 5.79404 1.50174 7.27146 1.5 8.8125C1.5 15.375 11.2303 20.6869 11.6447 20.9062C11.7539 20.965 11.876 20.9958 12 20.9958C12.124 20.9958 12.2461 20.965 12.3553 20.9062C12.7697 20.6869 22.5 15.375 22.5 8.8125C22.4983 7.27146 21.8853 5.79404 20.7956 4.70436C19.706 3.61468 18.2285 3.00174 16.6875 3ZM12 19.3875C10.2881 18.39 3 13.8459 3 8.8125C3.00149 7.66921 3.45632 6.57317 4.26475 5.76475C5.07317 4.95632 6.16921 4.50149 7.3125 4.5C9.13594 4.5 10.6669 5.47125 11.3062 7.03125C11.3628 7.16881 11.4589 7.28646 11.5824 7.36926C11.7059 7.45207 11.8513 7.49627 12 7.49627C12.1487 7.49627 12.2941 7.45207 12.4176 7.36926C12.5411 7.28646 12.6372 7.16881 12.6937 7.03125C13.3331 5.46844 14.8641 4.5 16.6875 4.5C17.8308 4.50149 18.9268 4.95632 19.7353 5.76475C20.5437 6.57317 20.9985 7.66921 21 8.8125C21 13.8384 13.71 18.3891 12 19.3875Z"
                    fill="#24272C"
                  />
                </svg>
              </button>

              <a
                data-loc="client/components/Header.tsx:67:15"
                href="#"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                >
                  <path
                    d="M21.6484 19.875C20.2206 17.4065 18.0203 15.6365 15.4525 14.7975C16.7226 14.0414 17.7094 12.8892 18.2614 11.5179C18.8134 10.1467 18.8999 8.63211 18.5078 7.20688C18.1157 5.78165 17.2666 4.52454 16.0909 3.6286C14.9151 2.73266 13.4778 2.24744 11.9996 2.24744C10.5215 2.24744 9.08414 2.73266 7.90842 3.6286C6.73269 4.52454 5.88358 5.78165 5.49146 7.20688C5.09935 8.63211 5.18592 10.1467 5.73788 11.5179C6.28984 12.8892 7.27668 14.0414 8.54683 14.7975C5.97902 15.6356 3.77871 17.4056 2.35089 19.875C2.29853 19.9604 2.2638 20.0554 2.24875 20.1544C2.2337 20.2534 2.23863 20.3544 2.26326 20.4515C2.28789 20.5486 2.33171 20.6397 2.39214 20.7196C2.45257 20.7995 2.52838 20.8664 2.6151 20.9165C2.70183 20.9666 2.79771 20.9988 2.89709 21.0113C2.99647 21.0237 3.09733 21.0161 3.19373 20.989C3.29012 20.9618 3.3801 20.9156 3.45835 20.8531C3.5366 20.7906 3.60154 20.713 3.64933 20.625C5.41558 17.5725 8.53746 15.75 11.9996 15.75C15.4618 15.75 18.5837 17.5725 20.35 20.625C20.3977 20.713 20.4627 20.7906 20.5409 20.8531C20.6192 20.9156 20.7092 20.9618 20.8056 20.989C20.902 21.0161 21.0028 21.0237 21.1022 21.0113C21.2016 20.9988 21.2975 20.9666 21.3842 20.9165C21.4709 20.8664 21.5467 20.7995 21.6072 20.7196C21.6676 20.6397 21.7114 20.5486 21.736 20.4515C21.7607 20.3544 21.7656 20.2534 21.7505 20.1544C21.7355 20.0554 21.7008 19.9604 21.6484 19.875Z"
                    fill="#24272C"
                  />
                </svg>
                <span className="text-[#E82121] font-medium hidden lg:inline">Sign up</span>
              </a>
            </div>

            <button
              data-loc="client/components/Header.tsx:84:11"
              className="md:hidden p-2 rounded-md"
              aria-label="menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
              >
                <path d="M3 12H21M3 6H21M3 18H21" stroke="#24272C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
