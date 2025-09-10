import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        width: "100vw",
        backgroundColor: "rgb(36, 39, 44)",
        color: "rgb(255, 255, 255)",
        padding: "40px 64px",
      }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div style={{ marginBottom: 40 }}>
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/e421d674e9adf980588eb4900a3d949d9f0e742c?width=536"
            alt="Carzino Logo"
            style={{ display: "block", height: 64 }}
          />
        </div>

        <div className="grid gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <div>
            <div style={{ font: '500 20px/28px "Albert Sans", sans-serif' }}>
              Links
            </div>
            <nav style={{ marginTop: 24, opacity: 0.8 }}>
              <a className="block mt-0" href="#">
                Trade in your Cars
              </a>
              <a className="block mt-3" href="#">
                Careers With Us
              </a>
              <a className="block mt-3" href="#">
                Terms & Conditions
              </a>
              <a className="block mt-3" href="#">
                Privacy Policy
              </a>
              <a className="block mt-3" href="#">
                Corporate Policies
              </a>
              <a className="block mt-3" href="#">
                Investors
              </a>
              <a className="block mt-3" href="#">
                FAQs
              </a>
            </nav>
          </div>

          <div>
            <div style={{ font: '500 20px/28px "Albert Sans", sans-serif' }}>
              Popular used car
            </div>
            <nav style={{ marginTop: 24, opacity: 0.8 }}>
              <a className="block" href="#">
                Chevrolet
              </a>
              <a className="block mt-3" href="#">
                Land Rover
              </a>
              <a className="block mt-3" href="#">
                Tesla
              </a>
              <a className="block mt-3" href="#">
                Volkswagen
              </a>
              <a className="block mt-3" href="#">
                Honda
              </a>
              <a className="block mt-3" href="#">
                Hyundai
              </a>
              <a className="block mt-3" href="#">
                Mercedes benz
              </a>
            </nav>
          </div>

          <div>
            <div style={{ font: '500 20px/28px "Albert Sans", sans-serif' }}>
              Other
            </div>
            <nav style={{ marginTop: 24, opacity: 0.8 }}>
              <a className="block" href="#">
                How it work
              </a>
              <a className="block mt-3" href="#">
                Terms and Conditions
              </a>
              <a className="block mt-3" href="#">
                Privacy Policy
              </a>
              <a className="block mt-3" href="#">
                Copyrights
              </a>
              <a className="block mt-3" href="#">
                Help center
              </a>
              <a className="block mt-3" href="#">
                Car sales trends
              </a>
              <a className="block mt-3" href="#">
                Personal loan
              </a>
            </nav>
          </div>

          <div>
            <div style={{ font: '500 20px/28px "Albert Sans", sans-serif' }}>
              Newsletter
            </div>
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  opacity: 0.8,
                  font: '400 14px/23px "Albert Sans", sans-serif',
                }}
              >
                Stay on top of the latest car trends, tips, and tricks for
                selling your car.
              </div>
              <div style={{ marginTop: 20 }}>
                <input
                  type="email"
                  placeholder="Your email address"
                  style={{
                    display: "inline-block",
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderRadius: 16,
                    height: 48,
                    width: "100%",
                    padding: "0 20px",
                    font: '400 14px/20px "Albert Sans", sans-serif',
                    color: "#fff",
                    border: "none",
                  }}
                />
              </div>
              <button
                style={{
                  display: "inline-block",
                  backgroundColor: "rgb(232, 33, 33)",
                  borderRadius: 16,
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 500,
                  height: 48,
                  marginTop: 20,
                  width: "100%",
                  color: "#fff",
                  border: "none",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.06)",
            marginBottom: 24,
          }}
        />

        <div className="flex items-center justify-between" style={{ gap: 24 }}>
          <div style={{ font: '400 14px/23px "Albert Sans", sans-serif' }}>
            © 2025 Carzino. All rights reserved
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href="#"
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 9999,
                height: 40,
                width: 40,
                justifyContent: "center",
              }}
              aria-label="facebook"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.8027 10.5L12.2027 9.0522H10.7524V8.11265C10.7524 7.71655 10.9271 7.33045 11.487 7.33045H12.2555V6.0978C12.2555 6.0978 11.5396 6 10.8465 6C9.5168 6 8.84375 6.6935 8.84375 7.94875V9.0522H7.69922V10.5H8.84375V14H10.7524V10.5H11.8027Z"
                  fill="white"
                />
              </svg>
            </a>
            <a
              href="#"
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 9999,
                height: 40,
                width: 40,
                justifyContent: "center",
              }}
              aria-label="linkedin"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.79075 14H6.13215V8.6588H7.79075V14ZM6.96055 7.9302C6.4302 7.9302 6 7.49095 6 6.96055C6 6.70065 6.10125 6.45135 6.2813 6.2714C6.46135 6.09145 6.71065 5.9902 6.97055 5.9902C7.23045 5.9902 7.47975 6.09145 7.6598 6.2714C7.83985 6.45135 7.9411 6.70065 7.9411 6.96055C7.9411 7.49095 7.50915 7.9302 6.96055 7.9302ZM13.9984 14H12.3433V11.4C12.3433 10.7803 12.3309 9.9856 11.481 9.9856C10.6186 9.9856 10.4866 10.6589 10.4866 11.3553V14H8.8297V8.6588H10.4205V9.3874H10.4437C10.6651 8.96775 11.206 8.5249 12.013 8.5249C13.6916 8.5249 14.0002 9.63025 14.0002 11.066V14H13.9984Z"
                  fill="white"
                />
              </svg>
            </a>
            <a
              href="#"
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 9999,
                height: 40,
                width: 40,
                justifyContent: "center",
              }}
              aria-label="youtube"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.8329 7.8801C13.7408 7.5337 13.4698 7.26085 13.1256 7.16825C12.5017 7 10 7 10 7C10 7 7.49835 7 6.87445 7.16825C6.53025 7.26085 6.2592 7.5337 6.16715 7.8801C6 8.5081 6 9.8182 6 9.8182C6 9.8182 6 11.1283 6.16715 11.7563C6.2592 12.1027 6.53025 12.3642 6.87445 12.4568C7.49835 12.625 10 12.625 10 12.625C10 12.625 12.5017 12.625 13.1256 12.4568C13.4698 12.3642 13.7408 12.1027 13.8329 11.7563C14 11.1283 14 9.8182 14 9.8182C14 9.8182 14 8.5081 13.8329 7.8801ZM9.1818 11.0077V8.6287L11.2727 9.8182L9.1818 11.0077Z"
                  fill="white"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
