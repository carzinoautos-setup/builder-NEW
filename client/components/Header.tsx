import React from "react";

type HeaderProps = {
  topTemplate?: React.ReactNode;
};

export default function Header({ topTemplate }: HeaderProps) {
  return (
    <>
      <section
        aria-label="header-top-template"
        data-loc="client/components/Header.tsx:before:1:1"
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
          boxShadow:
            "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
          fontWeight: 400,
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
            style={{ display: "flex", alignItems: "center", gap: "48px", fontWeight: 400 }}
          >
            <img
              alt="Carzino Logo"
              data-loc="client/components/Header.tsx:14:13"
              src="https://api.builder.io/api/v1/image/assets/TEMP/5f7df3a15766597dc453f8c077d8e30d33f5cefb?width=574"
              style={{ display: "block", fontWeight: 400, height: "20px" }}
            />
          </div>

          <nav
            data-loc="client/components/Header.tsx:22:11"
            style={{
              display: "flex",
              alignItems: "center",
              flexBasis: "0%",
              flexGrow: 1,
              fontWeight: 400,
              gap: "23px",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <div
              data-loc="client/components/Header.tsx:23:13"
              href="https://21ee3aa5168a434f8a73a751f20a215d-a4f7450272b94c43a152bdef8.fly.dev/?reload=1757532622083#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "rgb(36, 39, 44)",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Cars For Sale
            </div>

            <div
              data-loc="client/components/Header.tsx:26:13"
              href="https://21ee3aa5168a434f8a73a751f20a215d-a4f7450272b94c43a152bdef8.fly.dev/?reload=1757532622083#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "rgb(36, 39, 44)",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Trade in your car
            </div>

            <div
              data-loc="client/components/Header.tsx:29:13"
              href="https://21ee3aa5168a434f8a73a751f20a215d-a4f7450272b94c43a152bdef8.fly.dev/?reload=1757532622083#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "rgb(36, 39, 44)",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Sell your car
            </div>

            <div data-loc="client/components/Header.tsx:32:13" style={{ fontWeight: 400, position: "relative" }}>
              <div
                data-loc="client/components/Header.tsx:33:15"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "rgb(36, 39, 44)",
                  fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                  fontWeight: 500,
                  gap: "4px",
                  textDecoration: "rgb(36, 39, 44)",
                  transitionDuration: "0.15s",
                  transitionProperty:
                    "color, background-color, border-color, text-decoration-color, fill, stroke",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  borderColor: "rgba(0, 0, 0, 0)",
                }}
              >
                Dealers
              </div>
            </div>

            <div
              data-loc="client/components/Header.tsx:37:25"
              href="https://21ee3aa5168a434f8a73a751f20a215d-a4f7450272b94c43a152bdef8.fly.dev/?reload=1757532622083#"
              style={{
                display: "block",
                color: "rgb(36, 39, 44)",
                fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                textDecoration: "rgb(36, 39, 44)",
                transitionDuration: "0.15s",
                transitionProperty:
                  "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Contact
            </div>
          </nav>

          <div
            data-loc="client/components/Header.tsx:43:11"
            style={{ display: "flex", alignItems: "center", fontWeight: 400, gap: "10px", maxWidth: "360px" }}
          >
            <div data-loc="client/components/Header.tsx:45:13" style={{ display: "flex", alignItems: "center", fontWeight: 400, gap: "2px" }}>
              <button
                data-loc="client/components/Header.tsx:47:15"
                aria-label="search"
                style={{
                  borderRadius: "8px",
                  display: "block",
                  fontWeight: 400,
                  transitionDuration: "0.15s",
                  transitionProperty:
                    "color, background-color, border-color, text-decoration-color, fill, stroke",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  borderColor: "rgba(0, 0, 0, 0)",
                  padding: "6px",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21.5306 20.4693L16.8365 15.7762C18.1971 14.1428 18.8755 12.0478 18.7307 9.92691C18.5859 7.80604 17.629 5.82265 16.0591 4.38932C14.4892 2.95599 12.4271 2.18308 10.3019 2.23138C8.17663 2.27968 6.15181 3.14547 4.64864 4.64864C3.14547 6.15181 2.27968 8.17663 2.23138 10.3019C2.18308 12.4271 2.95599 14.4892 4.38932 16.0591C5.82265 17.629 7.80604 18.5859 9.92691 18.7307C12.0478 18.8755 14.1428 18.1971 15.7762 16.8365L20.4693 21.5306"
                    fill="#24272C"
                    data-loc="client/components/Header.tsx:49:19"
                  />
                </svg>
              </button>

              <div style={{ backgroundColor: "rgb(36, 39, 44)", fontWeight: 400, height: "18px", opacity: 0.2, width: "1px" }} />

              <button
                data-loc="client/components/Header.tsx:57:15"
                aria-label="notifications"
                style={{
                  borderRadius: "8px",
                  display: "block",
                  fontWeight: 400,
                  transitionDuration: "0.15s",
                  transitionProperty:
                    "color, background-color, border-color, text-decoration-color, fill, stroke",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  borderColor: "rgba(0, 0, 0, 0)",
                  padding: "6px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.6875 3C14.7516 3 13.0566 3.8325 12 5.23969C10.9434 3.8325 9.24844 3 7.3125 3C5.77146 3.00174 4.29404 3.61468 3.20436 4.70436C2.11468 5.79404 1.50174 7.27146 1.5 8.8125C1.5 15.375 11.2303 20.6869 11.6447 20.9062C11.7539 20.965 11.876 20.9958 12 20.9958C12.124 20.9958 12.2461 20.965 12.3553 20.9062C12.7697 20.6869 22.5 15.375 22.5 8.8125C22.4983 7.27146 21.8853 5.79404 20.7956 4.70436C19.706 3.61468 18.2285 3.00174 16.6875 3ZM12 19.3875C10.2881 18.39 3 13.8459 3 8.8125C3.00149 7.66921 3.45632 6.57317 4.26475 5.76475C5.07317 4.95632 6.16921 4.50149 7.3125 4.5C9.13594 4.5 10.6669 5.47125 11.3062 7.03125C11.3628 7.16881 11.4589 7.28646 11.5824 7.36926C11.7059 7.45207 11.8513 7.49627 12 7.49627C12.1487 7.49627 12.2941 7.45207 12.4176 7.36926C12.5411 7.28646 12.6372 7.16881 12.6937 7.03125C13.3331 5.46844 14.8641 4.5 16.6875 4.5C17.8308 4.50149 18.9268 4.95632 19.7353 5.76475C20.5437 6.57317 20.9985 7.66921 21 8.8125C21 13.8384 13.71 18.3891 12 19.3875Z"
                    fill="#24272C"
                    data-loc="client/components/Header.tsx:59:19"
                  />
                </svg>
              </button>

              <div style={{ backgroundColor: "rgb(36, 39, 44)", fontWeight: 400, height: "18px", opacity: 0.2, width: "1px" }} />

              <a
                data-loc="client/components/Header.tsx:67:15"
                href="https://21ee3aa5168a434f8a73a751f20a215d-a4f7450272b94c43a152bdef8.fly.dev/?reload=1757532622083#"
                style={{ display: "flex", alignItems: "center", borderRadius: "8px", fontWeight: 400, gap: "8px", transitionDuration: "0.15s", transitionProperty: "color, background-color, border-color, text-decoration-color, fill, stroke", transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)", padding: "6px" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.6484 19.875C20.2206 17.4065 18.0203 15.6365 15.4525 14.7975C16.7226 14.0414 17.7094 12.8892 18.2614 11.5179C18.8134 10.1467 18.8999 8.63211 18.5078 7.20688C18.1157 5.78165 17.2666 4.52454 16.0909 3.6286C14.9151 2.73266 13.4778 2.24744 11.9996 2.24744C10.5215 2.24744 9.08414 2.73266 7.90842 3.6286C6.73269 4.52454 5.88358 5.78165 5.49146 7.20688C5.09935 8.63211 5.18592 10.1467 5.73788 11.5179C6.28984 12.8892 7.27668 14.0414 8.54683 14.7975C5.97902 15.6356 3.77871 17.4056 2.35089 19.875C2.29853 19.9604 2.2638 20.0554 2.24875 20.1544 2.2337 20.2534 2.23863 20.3544 2.26326 20.4515" fill="#24272C" />
                </svg>
                <div style={{ display: "block", color: "rgb(232, 33, 33)", fontFamily: '"Albert Sans", system-ui, -apple-system, sans-serif', fontWeight: 500, textDecoration: "rgb(232, 33, 33)" }}>
                  Sign up
                </div>
              </a>
            </div>

            <button
              data-loc="client/components/Header.tsx:75:13"
              aria-label="menu"
              style={{
                display: "flex",
                alignItems: "center",
                borderColor: "rgb(232, 33, 33)",
                borderRadius: "14px",
                borderWidth: "0.888889px",
                fontWeight: 400,
                gap: "8px",
                justifyContent: "center",
                transitionDuration: "0.15s",
                transitionProperty: "color, background-color, border-color, text-decoration-color, fill, stroke",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: "rgba(0, 0, 0, 0)",
                padding: "8px 12px",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M13.125 14.375V17.1875C13.125 17.705 12.705 18.125 12.1875 18.125H4.0625C3.81386 18.125 3.5754 18.0262 3.39959 17.8504C3.22377 17.6746 3.125 17.4361 3.125 17.1875V6.5625C3.125 6.045 3.545 5.625 4.0625 5.625H5.625C6.04381 5.62472 6.46192 5.65928 6.875 5.72834M13.125 14.375H15.9375C16.455 14.375 16.875 13.955 16.875 13.4375V9.375C16.875 5.65834 14.1725 2.57417 10.625 1.97834C10.2119 1.90928 9.79381 1.87472 9.375 1.875H7.8125C7.295 1.875 6.875 2.295 6.875 2.8125V5.72834M13.125 14.375H7.8125C7.56386 14.375 7.3254 14.2762 7.14959 14.1004C6.97377 13.9246 6.875 13.6861 6.875 13.4375V5.72834M16.875 11.25V9.6875C16.875 8.94158 16.5787 8.22621 16.0512 7.69876C15.5238 7.17132 14.8084 6.875 14.0625 6.875H12.8125C12.5639 6.875 12.3254 6.77623 12.1496 6.60041C11.9738 6.4246 11.875 6.18614 11.875 5.9375V4.6875C11.875 4.31816 11.8023 3.95243 11.6609 3.6112C11.5196 3.26998 11.3124 2.95993 11.0512 2.69876C10.7901 2.4376 10.48 2.23043 10.1388 2.08909C9.79757 1.94775 9.43184 1.875 9.0625 1.875H8.125"
                  stroke="#E82121"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
