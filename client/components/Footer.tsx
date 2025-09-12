import React, { useState, useEffect } from "react";
import { BuilderComponent } from "@builder.io/react";
import { builder } from "../lib/builder";
import { useNavigate } from "react-router-dom";

export default function Footer({ onResetAndNavigate }: { onResetAndNavigate?: (href: string) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  const sections: {
    title: string;
    links?: Array<string | { label: string; url: string }>;
    content?: React.ReactNode;
  }[] = [
    {
      title: "Links",
      links: [
        { label: "Trade In Your Car", url: "https://www.carzino.com/trade-in-your-car/" },
        { label: "Carzino for Dealers", url: "https://www.carzino.com/dealers/" },
        { label: "Carzino for Private Sellers", url: "https://www.carzino.com/dealers/" },
        { label: "About Us", url: "https://uploadbackup62225.kinsta.cloud/about-us/" },
        { label: "Sell Your Car", url: "https://www.carzino.com/sell-your-car/" },
        { label: "Create Account", url: "https://www.carzino.com/select-account-type/" },
        { label: "Sign In", url: "https://www.carzino.com/sign-in/" },
        { label: "Contact Us", url: "https://www.carzino.com/Contact/" },
        { label: "Site Map", url: "https://www.carzino.com/site_map/" },
        { label: "FAQ", url: "https://www.carzino.com/frequently-asked-questions/" },
        { label: "Report a Suspicious Listing", url: "https://www.carzino.com/Contact/" },
        { label: "Monthly Payment Terms*", url: "https://uploadbackup62225.kinsta.cloud/payment-terms" },
      ],
    },
    {
      title: "Popular Makes & Types",
      links: [
        { label: "Coupes", url: "/cars-for-sale/?bodyStyle=coupe" },
        { label: "Crossover SUVs", url: "/cars-for-sale/?bodyStyle=crossover-suv" },
        { label: "Hatchbacks", url: "/cars-for-sale/?bodyStyle=hatchback" },
        { label: "Sedans", url: "/cars-for-sale/?bodyStyle=sedan" },
        { label: "Wagons", url: "/cars-for-sale/?bodyStyle=wagon" },
        { label: "Crew Cabs", url: "/cars-for-sale/?bodyStyle=crew-cab" },
        { label: "Trucks (all trucks)", url: "/cars-for-sale/?bodyStyle=truck" },
        { label: "Extended Cab Trucks", url: "/cars-for-sale/?bodyStyle=extended-cab" },
        { label: "Vans", url: "/cars-for-sale/?bodyStyle=van" },
        { label: "Ford Cars for Sale", url: "/cars-for-sale/?make=Ford" },
        { label: "Chevrolet Trucks for Sale", url: "/cars-for-sale/?make=Chevrolet&bodyStyle=truck" },
        { label: "Toyota SUVs for Sale", url: "/cars-for-sale/?make=Toyota&bodyStyle=suv" },
        { label: "Honda Cars for Sale", url: "/cars-for-sale/?make=Honda&bodyStyle=sedan" },
      ],
    },
    {
      title: "Popular Searches",
      links: [
        { label: "Cheap Cars Under $4,000", url: "/cars-for-sale/?price_min=1&price_max=4000" },
        { label: "Cars Under $10,000", url: "/cars-for-sale/?price_min=1&price_max=10000" },
        { label: "Sedans Under $10,000", url: "/cars-for-sale/?bodyStyle=sedan&price_min=1&price_max=10000" },
        { label: "Fuel-Efficient Cars 30+ MPG", url: "/cars-for-sale/?mpg_min=30&search=fuel%20efficient%20cars%2030%20mpg" },
        { label: "Affordable Cars Under $20,000", url: "/cars-for-sale/?price_min=1&price_max=20000" },
        { label: "Used Cars for Sale", url: "/cars-for-sale/?condition=used" },
        { label: "Used Trucks for Sale", url: "/cars-for-sale/?condition=used&bodyStyle=truck" },
        { label: "Used SUVs and Crossovers for Sale", url: "/cars-for-sale/?condition=used&bodyStyle=suv,crossover-suv" },
        { label: "Trucks Under $15,000", url: "/cars-for-sale/?bodyStyle=truck&price_min=1&price_max=15000" },
        { label: "Trucks Under $30,000", url: "/cars-for-sale/?bodyStyle=truck&price_min=1&price_max=30000" },
      ],
    },
    {
      title: "Newsletter",
      content: (
        <div>
          <div className="opacity-95 text-sm">
            Stay on top of the latest car trends, tips, and tricks for selling
            your car.
          </div>
          <div className="mt-5">
            <input
              type="email"
              placeholder="Your email address"
              className="w-full h-12 rounded-lg px-4 bg-white/5 text-white placeholder:text-white/70 border-none"
            />
          </div>
          <button className="w-full mt-4 h-12 bg-[#E82121] rounded-lg text-white font-medium">
            Send
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    try {
      if (builder && builder.registerComponent) {
        // existing promo component
        builder.registerComponent({
          name: "footer-promo",
          inputs: [
            { name: "image", type: "file" },
            { name: "headline", type: "string" },
            { name: "subtext", type: "string" },
            { name: "note", type: "string" },
          ],
        });

        // full-width editable footer content
        builder.registerComponent({
          name: "footer-fullwidth",
          inputs: [
            { name: "content", type: "richText" },
            {
              name: "links",
              type: "list",
              subFields: [
                { name: "label", type: "string" },
                { name: "url", type: "string" },
              ],
            },
          ],
        });

        // simple text block model
        builder.registerComponent({
          name: "footer-text",
          inputs: [{ name: "text", type: "richText" }],
        });

        // links grid model
        builder.registerComponent({
          name: "footer-links-grid",
          inputs: [
            {
              name: "items",
              type: "list",
              subFields: [
                { name: "label", type: "string" },
                { name: "url", type: "string" },
              ],
            },
          ],
        });

        // footer links editor (single column list)
        builder.registerComponent({
          name: "footer-links",
          inputs: [
            {
              name: "items",
              type: "list",
              subFields: [
                { name: "label", type: "string" },
                { name: "url", type: "string" },
              ],
            },
          ],
        });
      }
    } catch (e) {
      // ignore if builder not initialized
    }
  }, []);

  return (
    <footer className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#24272C] text-white pt-0 pb-10 px-4 sm:px-6 lg:px-16">
      {/* Builder-editable promo: create a Builder model named 'footer-promo' to edit this content in Design */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-gray-100">
        <div className="max-w-[1280px] mx-auto">
          <div className="py-3 px-4 flex items-center justify-center">
            <div className="w-full footer-promo">
              <BuilderComponent
                model="footer-promo"
                options={{ includeRefs: true }}
              />
              {/* Fallback static content (visible when Builder model not present) */}
              <div className="footer-promo-fallback">
                <div className="text-center">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F2c48de389c614655b60a7c83a7b13cc9?format=webp&width=800"
                    alt="Carzino promo"
                    className="mx-auto h-16 mb-2 object-contain"
                  />
                  <div className="text-sm text-gray-700">
                    "Find it. Love it. Drive it. Carzino it."
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Dealers: Exclusive early access now available- enjoy three
                    3-6 months of free listings. Learn more.
                  </div>
                  <div className="text-xs text-red-600 mt-2 font-medium">
                    Coming soon for Private sellers.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto pt-10">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {sections.map((s, idx) => (
            <div key={s.title}>
              {/* Mobile: accordion button */}
              <div className="lg:hidden pl-5 lg:pl-0">
                <button
                  type="button"
                  aria-expanded={openIdx === idx}
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="font-semibold text-lg text-left">
                    {s.title}
                  </div>
                  <svg
                    className={`w-5 h-5 ml-3 transform transition-transform duration-200 ${openIdx === idx ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div
                  className={`mt-4 overflow-hidden transition-all duration-200 ${openIdx === idx ? "max-h-[1000px]" : "max-h-0"}`}
                >
                  {s.links ? (
                    s.title === "Links" || s.title === "Popular Searches" ? (
                      <nav className="mt-0 opacity-95 flex flex-col gap-3">
                        <BuilderComponent model="footer-links" options={{ includeRefs: true }} />

                      {/* Static fallback when Builder model not present */}
                      {s.links.map((item) => {
                        const label = typeof item === "string" ? item : item.label;
                        const href = typeof item === "string" ? "#" : item.url;
                        return (
                          <a key={label} href={href} className="block mt-2 md:text-sm lg:text-sm md:leading-[19px] lg:leading-[19px] leading-[19px] text-gray-300 font-normal">
                            {label}
                          </a>
                        );
                      })}
                      </nav>
                    ) : (
                      <nav className="mt-0 opacity-95 flex flex-col gap-3">
                        {s.links.map((item) => {
                          const label = typeof item === "string" ? item : item.label;
                          const href = typeof item === "string" ? "#" : item.url;
                          const isInternal = href && href.startsWith("/");
                          return (
                            <a
                              key={label}
                              href={href}
                              className="block mt-2 md:text-sm lg:text-sm md:leading-[19px] lg:leading-[19px] leading-[19px] text-gray-300 font-normal"
                              onClick={(e) => {
                                if (isInternal) {
                                  e.preventDefault();
                                  if (onResetAndNavigate) {
                                    onResetAndNavigate(href);
                                  } else {
                                    navigate(href, { replace: false });
                                  }
                                }
                              }}
                            >
                              {label}
                            </a>
                          );
                        })}
                      </nav>
                    )
                  ) : (
                    <div className="mt-0">{s.content}</div>
                  )}
                </div>
              </div>

              {/* Desktop: static */}
              <div className="hidden lg:block">
                <div className="font-semibold text-lg">{s.title}</div>
                <div className="mt-6 opacity-95">
                  {s.links ? (
                    s.title === "Links" || s.title === "Popular Searches" ? (
                      <nav>
                        {s.links.map((item) => {
                          const label = typeof item === "string" ? item : item.label;
                          const href = typeof item === "string" ? "#" : item.url;
                          return (
                            <a
                              key={label}
                              href={href}
                              className={`block mt-2 md:text-sm lg:text-sm md:leading-[19px] lg:leading-[19px] leading-[19px] text-gray-300 font-normal`}
                              onClick={(e) => {
                                if (href && href.startsWith("/")) {
                                  e.preventDefault();
                                  if (onResetAndNavigate) {
                                    onResetAndNavigate(href);
                                  } else {
                                    navigate(href, { replace: false });
                                  }
                                }
                              }}
                            >
                              {label}
                            </a>
                          );
                        })}
                      </nav>
                    ) : (
                      <nav>
                        {s.links.map((item) => {
                          const label = typeof item === "string" ? item : item.label;
                          const href = typeof item === "string" ? "#" : item.url;
                          return (
                            <a
                              key={label}
                              href={href}
                              className={`block mt-2 md:text-sm lg:text-sm md:leading-[19px] lg:leading-[19px] leading-[19px] text-gray-300 font-normal`}
                              onClick={(e) => {
                                if (href && href.startsWith("/")) {
                                  e.preventDefault();
                                  if (onResetAndNavigate) {
                                    onResetAndNavigate(href);
                                  } else {
                                    navigate(href, { replace: false });
                                  }
                                }
                              }}
                            >
                              {label}
                            </a>
                          );
                        })}
                      </nav>
                    )
                  ) : (
                    s.content
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/5 mb-6" />

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto pt-0 pb-6 px-4 sm:px-6 lg:px-16 w-full">
            <div className="bg-transparent text-white">
              {/* Four links above the text - responsive: 4/2/1 columns */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-4 w-full">
                <a href="https://www.carzino.com/privacy-policy/" className="text-white/90 font-medium block w-full px-2 sm:px-0 py-1">Privacy policy</a>
                <a href="https://www.carzino.com/terms-conditions/" className="text-white/90 font-medium block w-full px-2 sm:px-0 py-1">Terms &amp; Conditions</a>
                <a href="https://www.carzino.com/return-policy/" className="text-white/90 font-medium block w-full px-2 sm:px-0 py-1">Return Policy</a>
                <a href="https://www.carzino.com/safety-guidelines/" className="text-white/90 font-medium block w-full px-2 sm:px-0 py-1">Safety guidelines</a>
              </div>

              <div className="text-center text-sm opacity-90" style={{paddingTop: '20px'}}>
                {/* Editable paragraph in Design tab */}
                <BuilderComponent model="footer-fullwidth" options={{ includeRefs: true }} />

                {/* Static fallback when builder model missing */}
                <div className="mt-2">
                  <p className="text-xs">
                    Carzino 2025© All rights reserved. | By using Carzino.com, you agree to the monitoring plus storing your interactions on the website, including those with Carzino dealers, with the purpose of enhancing and customizing our services. Refer to our Privacy Policy for more information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">© 2025 Carzino. All rights reserved</div>

          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="facebook"
              className="flex items-center justify-center bg-white/8 rounded-full h-10 w-10"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0z"
                  fill="#fff"
                  fillOpacity="0.08"
                />
              </svg>
            </a>
            <a
              href="#"
              aria-label="twitter"
              className="flex items-center justify-center bg-white/8 rounded-full h-10 w-10"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0z"
                  fill="#fff"
                  fillOpacity="0.08"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
