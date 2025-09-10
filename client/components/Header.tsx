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
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: 400,
          justifyContent: "center",
          width: "100%",
        }}
      >
        {topTemplate || null}
      </section>

      <header
        data-loc="client/components/Header.tsx:1:1"
        style={{
          backgroundColor: "rgb(255, 255, 255)",
          fontWeight: 400,
          boxShadow: "rgba(0, 0, 0, 0.08) 0px 6px 18px 0px",
        }}
      >
        <div
          data-loc="client/components/Header.tsx:10:9"
          style={{
            display: "flex",
            alignItems: "center",
            fontWeight: 400,
            height: "98px",
            justifyContent: "space-between",
            maxWidth: "1325px",
            width: "100%",
            margin: "0 auto",
            padding: "0 40px",
            boxSizing: "border-box",
          }}
        >
          <div
            data-loc="client/components/Header.tsx:13:11"
            style={{ display: "flex", alignItems: "center", gap: "48px" }}
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/5f7df3a15766597dc453f8c077d8e30d33f5cefb?width=574"
              alt="Carzino Logo"
              data-loc="client/components/Header.tsx:14:13"
              style={{ display: "block", height: "20px" }}
            />
          </div>

          <nav
            data-loc="client/components/Header.tsx:22:11"
            style={{
              display: "flex",
              alignItems: "center",
              flexBasis: "0%",
              flexGrow: 1,
              gap: "23px",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <a
              data-loc="client/components/Header.tsx:23:13"
              href="#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "none",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Cars For Sale
            </a>

            <a
              data-loc="client/components/Header.tsx:26:13"
              href="#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "none",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Trade in your car
            </a>

            <a
              data-loc="client/components/Header.tsx:29:13"
              href="#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "none",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Sell your car
            </a>

            <div data-loc="client/components/Header.tsx:32:13" style={{ position: "relative", fontWeight: 400 }}>
              <div
                data-loc="client/components/Header.tsx:33:15"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "rgb(36, 39, 44)",
                  fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                  fontWeight: 500,
                  gap: "4px",
                }}
              >
                Dealers
              </div>
            </div>

            <a
              data-loc="client/components/Header.tsx:37:25"
              href="#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "none",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Contact
            </a>
          </nav>

          <div data-loc="client/components/Header.tsx:43:11" style={{ display: "flex", alignItems: "center", gap: "10px", maxWidth: "360px" }}>
            <div data-loc="client/components/Header.tsx:45:13" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <button
                data-loc="client/components/Header.tsx:47:15"
                aria-label="search"
                style={{
                  borderRadius: "8px",
                  display: "block",
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  borderColor: "rgba(0, 0, 0, 0)",
                  padding: "6px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21.5306 20.4693L16.8365 15.7762C18.1971 14.1428 18.8755 12.0478 18.7307 9.92691C18.5859 7.80604 17.629 5.82265 16.0591 4.38932C14.4892 2.95599 12.4271 2.18308 10.3019 2.23138C8.17663 2.27968 6.15181 3.14547 4.64864 4.64864C3.14547 6.15181 2.27968 8.17663 2.23138 10.3019C2.18308 12.4271 2.95599 14.4892 4.38932 16.0591C5.82265 17.629 7.80604 18.5859 9.92691 18.7307C12.0478 18.8755 14.1428 18.1971 15.7762 16.8365L20.4693 21.5306"
                    fill="#24272C"
                  />
                </svg>
              </button>

              <div style={{ width: 1, height: 18, backgroundColor: "rgb(36, 39, 44)", opacity: 0.2 }} />

              <button
                data-loc="client/components/Header.tsx:57:15"
                aria-label="notifications"
                style={{
                  borderRadius: "8px",
                  display: "block",
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  borderColor: "rgba(0, 0, 0, 0)",
                  padding: "6px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.6875 3C14.7516 3 13.0566 3.8325 12 5.23969C10.9434 3.8325 9.24844 3 7.3125 3C5.77146 3.00174 4.29404 3.61468 3.20436 4.70436C2.11468 5.79404 1.50174 7.27146 1.5 8.8125C1.5 15.375 11.2303 20.6869 11.6447 20.9062C11.7539 20.965 11.876 20.9958 12 20.9958C12.124 20.9958 12.2461 20.965 12.3553 20.9062C12.7697 20.6869 22.5 15.375 22.5 8.8125C22.4983 7.27146 21.8853 5.79404 20.7956 4.70436C19.706 3.61468 18.2285 3.00174 16.6875 3Z" fill="#24272C" />
                </svg>
              </button>

              <a
                data-loc="client/components/Header.tsx:67:15"
                href="#"
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px", borderRadius: "8px" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.6484 19.875C20.2206 17.4065 18.0203 15.6365 15.4525 14.7975C16.7226 14.0414 17.7094 12.8892 18.2614 11.5179C18.8134 10.1467 18.8999 8.63211 18.5078 7.20688C18.1157 5.78165 17.2666 4.52454 16.0909 3.6286C14.9151 2.73266 13.4778 2.24744 11.9996 2.24744C10.5215 2.24744 9.08414 2.73266 7.90842 3.6286C6.73269 4.52454 5.88358 5.78165 5.49146 7.20688C5.09935 8.63211 5.18592 10.1467 5.73788 11.5179C6.28984 12.8892 7.27668 14.0414 8.54683 14.7975C5.97902 15.6356 3.77871 17.4056 2.35089 19.875C2.29853 19.9604 2.2638 20.0554 2.24875 20.1544 2.2337 20.2534 2.23863 20.3544 2.26326 20.4515" fill="#24272C" />
                </svg>
                <span style={{ color: "rgb(232, 33, 33)", fontWeight: 500, display: "none" }}>Sign up</span>
              </a>
            </div>

            <button data-loc="client/components/Header.tsx:84:11" aria-label="menu" style={{ display: "none", padding: "8px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21M3 6H21M3 18H21" stroke="#24272C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
