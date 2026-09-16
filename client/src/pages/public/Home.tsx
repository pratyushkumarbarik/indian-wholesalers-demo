import { useState } from "react";
import { Search, ChevronDown, ArrowRight, ShieldCheck } from "lucide-react";

const departments = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  name: `Department ${String(index + 1).padStart(2, "0")}`,
  features: [
    `Feature ${index + 1}.01`,
    `Feature ${index + 1}.02`,
    `Feature ${index + 1}.03`,
    `Feature ${index + 1}.04`,
  ],
}));

export default function Home() {
  const [openDepartment, setOpenDepartment] = useState<number | null>(null);

  return (
    <>
      <style>{styles}</style>

      <div className="home-page">
        {/* NAVBAR */}
        <header className="navbar">
          <div className="nav-inner">
            <a href="/" className="logo">
              <div className="logo-mark">
                <ShieldCheck size={24} />
              </div>
              <div className="logo-text">
                <strong>Indian Wholesalers</strong>
                <span>Wholesale Business Network</span>
              </div>
            </a>

            <nav className="nav-links">
              <a href="#about">About Us</a>

              <a href="#departments" className="department-link">
                Departments
                <ChevronDown size={15} />
              </a>

              <a href="/user/login">Login</a>
              <a href="/user/signup" className="signup-nav">
                Sign Up
              </a>
              <a href="#support">Support</a>
            </nav>

            <button
              type="button"
              className="nav-search-button"
              aria-label="Search"
              onClick={() =>
                document
                  .getElementById("search")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Search size={19} />
            </button>
          </div>
        </header>

        {/* HERO */}
        <main>
          <section className="hero">
            <div className="hero-inner">
              <div className="hero-content">
                <span className="eyebrow">
                  INDIA'S WHOLESALE BUSINESS NETWORK
                </span>

                <h1>
                  Connect with the right
                  <span> wholesalers.</span>
                </h1>

                <p>
                  Indian Wholesalers is a platform designed to help
                  businesses discover wholesale products, connect with
                  suppliers, and manage their requirements from one place.
                </p>

                <div className="hero-actions">
                  <a href="/user/signup" className="primary-button">
                    Get Started
                    <ArrowRight size={18} />
                  </a>

                  <a href="#departments" className="secondary-button">
                    Explore Departments
                  </a>
                </div>
              </div>

              <div className="hero-card">
                <div className="hero-card-top">
                  <span>Wholesale Network</span>
                  <span className="status-dot">● Active</span>
                </div>

                <div className="hero-search">
                  <Search size={19} />
                  <span>Search products, suppliers or departments</span>
                </div>

                <div className="hero-mini-grid">
                  <div>
                    <strong>23</strong>
                    <span>Departments</span>
                  </div>
                  <div>
                    <strong>1000+</strong>
                    <span>Business Opportunities</span>
                  </div>
                  <div>
                    <strong>24/7</strong>
                    <span>Platform Access</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SEARCH */}
          <section className="search-section" id="search">
            <div className="section-container">
              <div className="section-heading compact">
                <span className="section-label">SEARCH</span>
                <h2>What are you looking for?</h2>
                <p>
                  Search across products, suppliers, and departments.
                </p>
              </div>

              <div className="main-search">
                <Search size={21} />
                <input
                  type="text"
                  placeholder="Search products, suppliers or departments..."
                />
                <button type="button">Search</button>
              </div>
            </div>
          </section>

          {/* ABOUT */}
          <section className="about-section" id="about">
            <div className="section-container about-grid">
              <div>
                <span className="section-label">ABOUT US</span>
                <h2>One platform for wholesale connections.</h2>
              </div>

              <div className="about-copy">
                <p>
                  Indian Wholesalers aims to make wholesale discovery and
                  business communication simpler by bringing customers and
                  wholesale businesses together on one platform.
                </p>

                <p>
                  Customers can explore departments, find relevant products,
                  and communicate their requirements through the platform.
                </p>
              </div>
            </div>
          </section>

          {/* DEPARTMENTS */}
          <section className="departments-section" id="departments">
            <div className="section-container">
              <div className="section-heading">
                <span className="section-label">DEPARTMENTS</span>
                <h2>Explore our departments</h2>
                <p>
                  These are placeholder departments for now. The final
                  department names and structure can be added later.
                </p>
              </div>

              <div className="department-grid">
                {departments.map((department) => {
                  const isOpen = openDepartment === department.id;

                  return (
                    <div
                      className={
                        isOpen
                          ? "department-item open"
                          : "department-item"
                      }
                      key={department.id}
                    >
                      <button
                        type="button"
                        className="department-card"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenDepartment(
                            isOpen ? null : department.id
                          )
                        }
                      >
                        <span className="department-number">
                          {String(department.id).padStart(2, "0")}
                        </span>

                        <span className="department-name">
                          {department.name}
                        </span>

                        <ChevronDown
                          size={17}
                          className="department-chevron"
                        />
                      </button>

                      <div className="department-features">
                        <div className="department-features-inner">
                          {department.features.map((feature) => (
                            <button
                              type="button"
                              className="feature-row"
                              key={feature}
                            >
                              <span>{feature}</span>
                              <ArrowRight size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SUPPORT */}
          <section className="support-section" id="support">
            <div className="section-container support-box">
              <div>
                <span className="section-label">SUPPORT</span>
                <h2>Need help?</h2>
                <p>
                  Our support section will help customers and businesses
                  with platform-related questions and requirements.
                </p>
              </div>

              <button type="button" className="support-button">
                Contact Support
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="logo-mark">
                <ShieldCheck size={21} />
              </div>

              <div>
                <strong>Indian Wholesalers</strong>
                <span>Wholesale Business Network</span>
              </div>
            </div>

            <div className="footer-links">
              <a href="#about">About Us</a>
              <a href="#departments">Departments</a>
              <a href="/user/login">Login</a>
              <a href="/user/signup">Sign Up</a>
              <a href="#support">Support</a>
            </div>

            <p>© 2026 Indian Wholesalers. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
  }

  .home-page {
    min-height: 100vh;
    background: #ffffff;
    color: #0f172a;
    overflow-x: hidden;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      sans-serif;
  }

  .navbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.96);
    border-bottom: 1px solid #e2e8f0;
    backdrop-filter: blur(12px);
  }

  .nav-inner {
    width: min(1180px, calc(100% - 40px));
    min-height: 76px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 11px;
    color: #0f172a;
    text-decoration: none;
    margin-right: auto;
  }

  .logo-mark {
    width: 43px;
    height: 43px;
    border-radius: 11px;
    background: #1e40af;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .logo-text strong {
    font-size: 16px;
    letter-spacing: -0.2px;
  }

  .logo-text span {
    color: #64748b;
    font-size: 10px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 25px;
  }

  .nav-links a {
    color: #475569;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  .nav-links a:hover {
    color: #1d4ed8;
  }

  .department-link {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .signup-nav {
    padding: 10px 15px;
    border-radius: 8px;
    background: #1e40af;
    color: #ffffff !important;
  }

  .signup-nav:hover {
    background: #1d4ed8;
  }

  .nav-search-button {
    width: 40px;
    height: 40px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #ffffff;
    color: #334155;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .nav-search-button {
    transition: transform 0.2s ease, background 0.2s ease,
      border-color 0.2s ease;
  }

  .nav-search-button:hover {
    background: #f8fafc;
    border-color: #93c5fd;
    transform: translateY(-2px);
  }

  .hero {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 92px 0 96px;
  }

  .hero-inner {
    width: min(1180px, calc(100% - 40px));
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 70px;
    align-items: center;
  }

  .eyebrow,
  .section-label {
    color: #2563eb;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .hero-content {
    animation: heroContentIn 0.75s ease-out both;
  }

  .hero-card {
    animation: heroCardIn 0.8s ease-out 0.12s both;
  }

  .hero-content h1 {
    max-width: 650px;
    margin: 18px 0 20px;
    font-size: clamp(42px, 5vw, 66px);
    line-height: 1.05;
    letter-spacing: -2.8px;
    font-weight: 800;
  }

  .hero-content h1 span {
    color: #2563eb;
  }

  .hero-content p {
    max-width: 610px;
    margin: 0;
    color: #64748b;
    font-size: 17px;
    line-height: 1.75;
  }

  .hero-actions {
    margin-top: 32px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .primary-button,
  .secondary-button {
    min-height: 48px;
    padding: 0 18px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
  }

  .primary-button {
    background: #1e40af;
    color: #ffffff;
    transition: transform 0.25s ease, box-shadow 0.25s ease,
      background 0.25s ease;
  }

  .primary-button:hover {
    background: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 9px 22px rgba(30, 64, 175, 0.18);
  }

  .secondary-button {
    border: 1px solid #cbd5e1;
    color: #334155;
    background: #ffffff;
    transition: transform 0.25s ease, box-shadow 0.25s ease,
      background 0.25s ease;
  }

  .secondary-button:hover {
    background: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 7px 18px rgba(15, 23, 42, 0.06);
  }

  .hero-card {
    padding: 25px;
    border: 1px solid #dbe3ee;
    border-radius: 17px;
    background: #ffffff;
    box-shadow: 0 20px 55px rgba(15, 23, 42, 0.08);
  }

  .hero-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 12px;
    font-weight: 700;
  }

  .status-dot {
    color: #16a34a;
    font-size: 11px;
  }

  .hero-search {
    height: 56px;
    padding: 0 15px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 11px;
    color: #94a3b8;
    font-size: 12px;
  }

  .hero-mini-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 16px;
  }

  .hero-mini-grid div {
    padding: 18px 12px;
    border-radius: 10px;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .hero-mini-grid strong {
    font-size: 19px;
    color: #0f172a;
  }

  .hero-mini-grid span {
    color: #64748b;
    font-size: 10px;
    line-height: 1.35;
  }

  .search-section,
  .about-section,
  .departments-section,
  .support-section {
    padding: 82px 0;
  }

  .section-container {
    width: min(1180px, calc(100% - 40px));
    margin: 0 auto;
  }

  .section-heading {
    max-width: 650px;
    margin-bottom: 34px;
  }

  .section-heading.compact {
    max-width: 600px;
  }

  .section-heading h2,
  .about-grid h2,
  .support-box h2 {
    margin: 11px 0 12px;
    color: #0f172a;
    font-size: 35px;
    line-height: 1.2;
    letter-spacing: -1px;
  }

  .section-heading p,
  .support-box p,
  .about-copy p {
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
  }

  .main-search {
    min-height: 62px;
    padding-left: 18px;
    border: 1px solid #cbd5e1;
    border-radius: 11px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 7px 25px rgba(15, 23, 42, 0.05);
  }

  .main-search > svg {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .main-search input {
    flex: 1;
    min-width: 0;
    height: 58px;
    border: none;
    outline: none;
    font-size: 14px;
    color: #0f172a;
  }

  .main-search input::placeholder {
    color: #94a3b8;
  }

  .main-search button {
    align-self: stretch;
    margin: 5px;
    padding: 0 23px;
    border: none;
    border-radius: 8px;
    background: #1e40af;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .about-section {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }

  .about-grid {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 90px;
    align-items: start;
  }

  .about-copy {
    display: flex;
    flex-direction: column;
    gap: 17px;
    padding-top: 4px;
  }

  .departments-section {
    background: #ffffff;
  }

  .department-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    align-items: start;
  }

  .department-item {
    min-width: 0;
  }

  .department-card {
    width: 100%;
    min-height: 105px;
    padding: 17px;
    border: 1px solid #e2e8f0;
    border-radius: 11px;
    background: #ffffff;
    display: grid;
    grid-template-columns: 32px 1fr 18px;
    align-items: center;
    gap: 8px;
    text-align: left;
    cursor: pointer;
    position: relative;
    z-index: 2;
    transition: transform 0.3s ease, border-color 0.3s ease,
      box-shadow 0.3s ease, border-radius 0.3s ease;
  }

  .department-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 9px 24px rgba(15, 23, 42, 0.07);
    transform: translateY(-3px);
  }

  .department-item.open .department-card {
    border-color: #93c5fd;
    border-bottom-left-radius: 7px;
    border-bottom-right-radius: 7px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  }

  .department-number {
    color: #2563eb;
    font-size: 11px;
    font-weight: 800;
  }

  .department-name {
    color: #334155;
    font-size: 13px;
    font-weight: 700;
  }

  .department-chevron {
    color: #94a3b8;
    transition: transform 0.3s ease;
  }

  .department-item.open .department-chevron {
    transform: rotate(180deg);
    color: #2563eb;
  }

  .department-features {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition: grid-template-rows 0.38s ease, opacity 0.25s ease;
  }

  .department-item.open .department-features {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  .department-features-inner {
    min-height: 0;
    overflow: hidden;
    padding: 0 9px;
    border: 1px solid transparent;
    border-top: none;
    border-radius: 0 0 10px 10px;
    background: #f8fafc;
    transition: padding 0.38s ease, border-color 0.38s ease;
  }

  .department-item.open .department-features-inner {
    padding: 9px;
    border-color: #e2e8f0;
  }

  .feature-row {
    width: 100%;
    min-height: 38px;
    padding: 0 7px;
    border: none;
    border-bottom: 1px solid #e8edf3;
    background: transparent;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
    font-size: 11px;
    cursor: pointer;
    transition: color 0.2s ease, padding 0.2s ease,
      background 0.2s ease;
  }

  .feature-row:last-child {
    border-bottom: none;
  }

  .feature-row:hover {
    padding-left: 11px;
    color: #1d4ed8;
    background: #ffffff;
  }

  .feature-row svg {
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .feature-row:hover svg {
    transform: translateX(3px);
  }

  .support-section {
    background: #f8fafc;
  }

  .support-box {
    padding: 38px;
    border: 1px solid #dbe3ee;
    border-radius: 15px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
  }

  .support-box h2 {
    margin-bottom: 8px;
  }

  .support-box p {
    max-width: 650px;
  }

  .support-button {
    min-height: 46px;
    padding: 0 17px;
    border: none;
    border-radius: 9px;
    background: #1e40af;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .support-button:hover {
    background: #1d4ed8;
  }

  .footer {
    background: #0f172a;
    color: #ffffff;
    padding: 32px 0;
  }

  .footer-inner {
    width: min(1180px, calc(100% - 40px));
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 30px;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: auto;
  }

  .footer-brand .logo-mark {
    width: 37px;
    height: 37px;
    border-radius: 9px;
  }

  .footer-brand div:last-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .footer-brand strong {
    font-size: 13px;
  }

  .footer-brand span {
    color: #94a3b8;
    font-size: 9px;
  }

  .footer-links {
    display: flex;
    gap: 18px;
  }

  .footer-links a {
    color: #cbd5e1;
    text-decoration: none;
    font-size: 11px;
  }

  .footer-links a:hover {
    color: #ffffff;
  }

  .footer-inner > p {
    margin: 0;
    color: #64748b;
    font-size: 10px;
  }

  @keyframes heroContentIn {
    from {
      opacity: 0;
      transform: translateY(22px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes heroCardIn {
    from {
      opacity: 0;
      transform: translateX(28px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }

    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media (max-width: 950px) {
    .nav-links {
      display: none;
    }

    .hero-inner {
      grid-template-columns: 1fr;
      gap: 45px;
    }

    .hero-card {
      max-width: 650px;
    }

    .department-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .about-grid {
      grid-template-columns: 1fr;
      gap: 25px;
    }

    .footer-inner {
      flex-wrap: wrap;
    }

    .footer-links {
      order: 3;
      width: 100%;
    }
  }

  @media (max-width: 650px) {
    .nav-inner,
    .section-container,
    .hero-inner,
    .footer-inner {
      width: min(100% - 30px, 1180px);
    }

    .navbar .logo-text span {
      display: none;
    }

    .hero {
      padding: 65px 0;
    }

    .hero-content h1 {
      font-size: 43px;
      letter-spacing: -1.8px;
    }

    .hero-content p {
      font-size: 15px;
    }

    .hero-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .primary-button,
    .secondary-button {
      width: 100%;
    }

    .hero-mini-grid {
      grid-template-columns: 1fr;
    }

    .search-section,
    .about-section,
    .departments-section,
    .support-section {
      padding: 60px 0;
    }

    .section-heading h2,
    .about-grid h2,
    .support-box h2 {
      font-size: 29px;
    }

    .main-search {
      padding: 7px;
      flex-wrap: wrap;
    }

    .main-search input {
      width: calc(100% - 40px);
    }

    .main-search button {
      width: 100%;
      min-height: 45px;
      margin: 0;
    }

    .department-grid {
      grid-template-columns: 1fr 1fr;
    }

    .support-box {
      padding: 25px;
      align-items: flex-start;
      flex-direction: column;
    }

    .support-button {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 420px) {
    .department-grid {
      grid-template-columns: 1fr;
    }

    .hero-card {
      padding: 18px;
    }
  }
`;
