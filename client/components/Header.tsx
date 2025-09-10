import React from "react";

export default function Header() {
  return (
    <header
      data-loc="client/components/Header.tsx:1:1"
      style={{ backgroundColor: "#fff" }}
    >
      <div
        data-loc="client/components/Header.tsx:10:9"
        style={{
          display: "flex",
          alignItems: "center",
          height: 98,
          justifyContent: "space-between",
          maxWidth: 1325,
          margin: "0 auto",
          padding: "0 40px",
        }}
      >
        <div
          data-loc="client/components/Header.tsx:13:11"
          style={{ display: "flex", alignItems: "center", gap: 24 }}
        >
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/5f7df3a15766597dc453f8c077d8e30d33f5cefb?width=574"
            alt="Carzino Logo"
            data-loc="client/components/Header.tsx:14:13"
            style={{ height: 24, display: "block" }}
          />
        </div>

        <nav
          data-loc="client/components/Header.tsx:22:11"
          style={{ display: "flex", alignItems: "center", gap: 20 }}
        >
          <a
            href="#"
            data-loc="client/components/Header.tsx:23:13"
            style={{ color: "#24272C", fontWeight: 500 }}
          >
            Cars For Sale
          </a>
          <a
            href="#"
            data-loc="client/components/Header.tsx:26:13"
            style={{ color: "#24272C", fontWeight: 500 }}
          >
            Trade in your car
          </a>
          <a
            href="#"
            data-loc="client/components/Header.tsx:29:13"
            style={{ color: "#24272C", fontWeight: 500 }}
          >
            Sell your car
          </a>
          <div
            data-loc="client/components/Header.tsx:32:13"
            style={{ color: "#24272C" }}
          >
            Dealers
          </div>
          <a
            href="#"
            data-loc="client/components/Header.tsx:37:25"
            style={{ color: "#24272C", fontWeight: 500 }}
          >
            Contact
          </a>
        </nav>

        <div
          data-loc="client/components/Header.tsx:43:11"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <button
            data-loc="client/components/Header.tsx:47:15"
            aria-label="search"
            style={{
              borderRadius: 8,
              padding: 6,
              background: "transparent",
              border: "none",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M21 21l-4.35-4.35"
                stroke="#24272C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            data-loc="client/components/Header.tsx:75:13"
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 14,
              border: "1px solid #E82121",
              padding: "8px 12px",
              gap: 8,
              background: "transparent",
              color: "#e82121",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="#E82121"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ color: "#E82121", fontWeight: 500 }}>Sign up</span>
          </button>
        </div>
      </div>
    </header>
  );
}
