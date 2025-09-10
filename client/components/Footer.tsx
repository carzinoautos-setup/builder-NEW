import React, { useState } from "react";

export default function Footer() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const sections: { title: string; links?: string[]; content?: React.ReactNode }[] = [
    {
      title: "Links",
      links: [
        "Trade in your Cars",
        "Careers With Us",
        "Terms & Conditions",
        "Privacy Policy",
        "Corporate Policies",
        "Investors",
        "FAQs",
      ],
    },
    {
      title: "Popular used car",
      links: [
        "Chevrolet",
        "Land Rover",
        "Tesla",
        "Volkswagen",
        "Honda",
        "Hyundai",
        "Mercedes benz",
      ],
    },
    {
      title: "Other",
      links: [
        "How it work",
        "Terms and Conditions",
        "Privacy Policy",
        "Copyrights",
        "Help center",
        "Car sales trends",
        "Personal loan",
      ],
    },
    {
      title: "Newsletter",
      content: (
        <div>
          <div className="opacity-80 text-sm">Stay on top of the latest car trends, tips, and tricks for selling your car.</div>
          <div className="mt-5">
            <input
              type="email"
              placeholder="Your email address"
              className="w-full h-12 rounded-lg px-4 bg-white/5 text-white placeholder:text-white/70 border-none"
            />
          </div>
          <button className="w-full mt-4 h-12 bg-[#E82121] rounded-lg text-white font-medium">Send</button>
        </div>
      ),
    },
  ];

  return (
    <footer className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#24272C] text-white py-10 px-4 sm:px-6 lg:px-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-10">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/e421d674e9adf980588eb4900a3d949d9f0e742c?width=536"
            alt="Carzino Logo"
            className="block h-16"
          />
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {sections.map((s, idx) => (
            <div key={s.title}>
              {/* Mobile: accordion button */}
              <div className="lg:hidden">
                <button
                  type="button"
                  aria-expanded={openIdx === idx}
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="font-semibold text-lg text-left">{s.title}</div>
                  <svg
                    className={`w-5 h-5 ml-3 transform transition-transform duration-200 ${openIdx === idx ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div
                  className={`mt-4 overflow-hidden transition-all duration-200 ${openIdx === idx ? "max-h-[1000px]" : "max-h-0"}`}
                >
                  {s.links ? (
                    <nav className="mt-0 opacity-80 flex flex-col gap-3">
                      {s.links.map((l) => (
                        <a key={l} className="block" href="#">
                          {l}
                        </a>
                      ))}
                    </nav>
                  ) : (
                    <div className="mt-0">{s.content}</div>
                  )}
                </div>
              </div>

              {/* Desktop: static */}
              <div className="hidden lg:block">
                <div className="font-semibold text-lg">{s.title}</div>
                <div className="mt-6 opacity-80">
                  {s.links ? (
                    <nav>
                      {s.links.map((l) => (
                        <a key={l} className={`block ${l ? "mt-0" : "mt-3"}`} href="#">
                          {l}
                        </a>
                      ))}
                    </nav>
                  ) : (
                    s.content
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/5 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">© 2025 Carzino. All rights reserved</div>

          <div className="flex items-center gap-3">
            <a href="#" aria-label="facebook" className="flex items-center justify-center bg-white/8 rounded-full h-10 w-10">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0z" fill="#fff" fillOpacity="0.08"/>
              </svg>
            </a>
            <a href="#" aria-label="twitter" className="flex items-center justify-center bg-white/8 rounded-full h-10 w-10">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0z" fill="#fff" fillOpacity="0.08"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
