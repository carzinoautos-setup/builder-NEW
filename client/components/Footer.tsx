import React from "react";

export default function Footer() {
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
          <div>
            <div className="font-semibold text-lg">Links</div>
            <nav className="mt-6 opacity-80">
              <a className="block mt-0" href="#">Trade in your Cars</a>
              <a className="block mt-3" href="#">Careers With Us</a>
              <a className="block mt-3" href="#">Terms & Conditions</a>
              <a className="block mt-3" href="#">Privacy Policy</a>
              <a className="block mt-3" href="#">Corporate Policies</a>
              <a className="block mt-3" href="#">Investors</a>
              <a className="block mt-3" href="#">FAQs</a>
            </nav>
          </div>

          <div>
            <div className="font-semibold text-lg">Popular used car</div>
            <nav className="mt-6 opacity-80">
              <a className="block" href="#">Chevrolet</a>
              <a className="block mt-3" href="#">Land Rover</a>
              <a className="block mt-3" href="#">Tesla</a>
              <a className="block mt-3" href="#">Volkswagen</a>
              <a className="block mt-3" href="#">Honda</a>
              <a className="block mt-3" href="#">Hyundai</a>
              <a className="block mt-3" href="#">Mercedes benz</a>
            </nav>
          </div>

          <div>
            <div className="font-semibold text-lg">Other</div>
            <nav className="mt-6 opacity-80">
              <a className="block" href="#">How it work</a>
              <a className="block mt-3" href="#">Terms and Conditions</a>
              <a className="block mt-3" href="#">Privacy Policy</a>
              <a className="block mt-3" href="#">Copyrights</a>
              <a className="block mt-3" href="#">Help center</a>
              <a className="block mt-3" href="#">Car sales trends</a>
              <a className="block mt-3" href="#">Personal loan</a>
            </nav>
          </div>

          <div>
            <div className="font-semibold text-lg">Newsletter</div>
            <div className="mt-6">
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
          </div>
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
