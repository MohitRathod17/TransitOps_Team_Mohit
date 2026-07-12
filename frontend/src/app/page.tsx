"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

// SVG Icons
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M22 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("manager");

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What types of fleets can TransitOps manage?",
      a: "TransitOps is highly flexible and manages semi-trucks, medium delivery vans, regional carrier vehicles, and service cars. You can customize payload parameters, fuel indicators, and operational regions for any vehicle type."
    },
    {
      q: "Does TransitOps support real-time driver tracking?",
      a: "Yes. Drivers on duty are monitored through integrated dispatch logs and route tracking systems, which update coordinates, safety parameters, and trip logs dynamically on the operational dashboard."
    },
    {
      q: "How does predictive maintenance notification work?",
      a: "The platform tracks vehicle odometer readings and service history, automatically alerting fleet managers when a vehicle is nearing its oil change, tire rotation, or safety inspection intervals."
    },
    {
      q: "Is there a limit on the number of vehicles or drivers I can onboard?",
      a: "The Starter tier allows up to 5 active vehicles and drivers. The Growth and Enterprise tiers support unlimited vehicles and drivers with full analytical metrics, automated ROI reporting, and CSV data extraction."
    }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", color: "var(--text-primary)" }}>
      {/* Sticky Navbar */}
      <header className="landing-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 800 }}>
          <LogoIcon /> TransitOps
        </div>
        <nav className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#solutions" className="landing-nav-link">Solutions</a>
          <a href="#pricing" className="landing-nav-link">Pricing</a>
          <a href="#faq" className="landing-nav-link">FAQ</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Theme">
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          <Link href="/login" className="landing-nav-link" style={{ fontWeight: 600 }}>Sign In</Link>
          <Link href="/register" className="btn btn-primary w-auto" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-section landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Fleet operations <span>simplified</span> for modern logistics.
          </h1>
          <p className="landing-hero-subtitle">
            Onboard operators, register transport assets, schedule preventive maintenance, and audit financial efficiency. A clean, premium dashboard designed to manage fleets of any scale.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/register" className="btn btn-primary w-auto" style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}>
              Start Free Trial
            </Link>
            <Link href="/login" className="btn btn-secondary w-auto" style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}>
              Launch Platform
            </Link>
          </div>
        </div>
        
        <div className="landing-hero-visual">
          <div className="landing-dashboard-preview">
            {/* Mock Dashboard Window Header */}
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-card)", background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#eab308" }}></div>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e" }}></div>
              <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>transitops.app/dashboard</div>
            </div>
            {/* Mock Dashboard Preview Content */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ height: "14px", width: "120px", background: "var(--text-secondary)", opacity: 0.25, borderRadius: "4px" }}></div>
                  <div style={{ height: "8px", width: "180px", background: "var(--text-secondary)", opacity: 0.15, borderRadius: "4px", marginTop: "6px" }}></div>
                </div>
                <div style={{ height: "28px", width: "80px", background: "var(--color-primary)", opacity: 0.2, borderRadius: "6px" }}></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div style={{ border: "1px solid var(--border-card)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ height: "8px", width: "60px", background: "var(--text-secondary)", opacity: 0.2, borderRadius: "2px" }}></div>
                  <div style={{ height: "24px", width: "40px", background: "var(--text-primary)", opacity: 0.8, borderRadius: "4px", marginTop: "8px" }}></div>
                </div>
                <div style={{ border: "1px solid var(--border-card)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ height: "8px", width: "60px", background: "var(--text-secondary)", opacity: 0.2, borderRadius: "2px" }}></div>
                  <div style={{ height: "24px", width: "40px", background: "var(--color-success)", opacity: 0.8, borderRadius: "4px", marginTop: "8px" }}></div>
                </div>
                <div style={{ border: "1px solid var(--border-card)", padding: "1rem", borderRadius: "8px" }}>
                  <div style={{ height: "8px", width: "60px", background: "var(--text-secondary)", opacity: 0.2, borderRadius: "2px" }}></div>
                  <div style={{ height: "24px", width: "45px", background: "var(--color-info)", opacity: 0.8, borderRadius: "4px", marginTop: "8px" }}></div>
                </div>
              </div>
              <div style={{ border: "1px solid var(--border-card)", height: "100px", borderRadius: "8px", padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ height: "8px", width: "100px", background: "var(--text-secondary)", opacity: 0.2, borderRadius: "2px" }}></div>
                <div style={{ display: "flex", alignItems: "flex-end", height: "50px", gap: "8px" }}>
                  <div style={{ height: "20%", flex: 1, background: "var(--color-primary)", opacity: 0.3, borderRadius: "2px" }}></div>
                  <div style={{ height: "45%", flex: 1, background: "var(--color-primary)", opacity: 0.3, borderRadius: "2px" }}></div>
                  <div style={{ height: "30%", flex: 1, background: "var(--color-primary)", opacity: 0.3, borderRadius: "2px" }}></div>
                  <div style={{ height: "70%", flex: 1, background: "var(--color-primary)", opacity: 0.3, borderRadius: "2px" }}></div>
                  <div style={{ height: "85%", flex: 1, background: "var(--color-primary)", opacity: 0.8, borderRadius: "2px" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" style={{ borderTop: "1px solid var(--border-card)" }}>
        <div className="landing-section">
          <h2 className="landing-section-title">Designed for modern transit networks</h2>
          <p className="landing-section-subtitle">
            All the configurations, data states, and analytical insights your organization requires inside a single modular control console.
          </p>

          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              </div>
              <h3 className="landing-feature-title">Vehicle Registry</h3>
              <p className="landing-feature-desc">
                Organize models, capacities, license plates, and regional parameters. Monitor active, retired, or in-shop transport assets.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              </div>
              <h3 className="landing-feature-title">Operator Onboarding</h3>
              <p className="landing-feature-desc">
                Manage driver licenses, contact information, expiry alert thresholds, availability states, and performance metrics in one directory.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
              </div>
              <h3 className="landing-feature-title">Preventive Maintenance</h3>
              <p className="landing-feature-desc">
                Put vehicles in maintenance, log repair descriptions, track final service invoices, and schedule next audits to avoid breakdown costs.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </div>
              <h3 className="landing-feature-title">Reports & Analytics</h3>
              <p className="landing-feature-desc">
                Monitor return on investment (ROI) metric by vehicle, audit fuel consumption, and export platform logs to CSV spreadsheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Interactive Tabs Section */}
      <section id="solutions" style={{ borderTop: "1px solid var(--border-card)", background: "rgba(0,0,0,0.01)" }}>
        <div className="landing-section">
          <h2 className="landing-section-title">Tailored solutions for your organization</h2>
          <p className="landing-section-subtitle">
            TransitOps provides customized perspectives depending on your role in the transport pipeline.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "3rem" }}>
            <button 
              className="btn w-auto" 
              style={{
                borderRadius: "20px",
                padding: "0.5rem 1.5rem",
                backgroundColor: activeTab === "manager" ? "var(--color-primary)" : "var(--bg-card)",
                color: activeTab === "manager" ? "#fff" : "var(--text-secondary)",
                border: activeTab === "manager" ? "none" : "1px solid var(--border-card)"
              }}
              onClick={() => setActiveTab("manager")}
            >
              Fleet Manager
            </button>
            <button 
              className="btn w-auto" 
              style={{
                borderRadius: "20px",
                padding: "0.5rem 1.5rem",
                backgroundColor: activeTab === "officer" ? "var(--color-primary)" : "var(--bg-card)",
                color: activeTab === "officer" ? "#fff" : "var(--text-secondary)",
                border: activeTab === "officer" ? "none" : "1px solid var(--border-card)"
              }}
              onClick={() => setActiveTab("officer")}
            >
              Safety Officer
            </button>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "16px", padding: "3rem", display: "flex", gap: "3rem", alignItems: "center" }}>
            {activeTab === "manager" ? (
              <>
                <div style={{ flex: 1.2 }}>
                  <h3 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem" }}>Master asset control & dispatch efficiency</h3>
                  <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                    Fleet Managers obtain global oversight of all physical logistics. Easily register brand-new vehicles, audit acquisition margins, evaluate active fuel logs, and dispatch optimal payload weights to maximize platform revenue.
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none", padding: 0 }}>
                    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}><CheckIcon /> Real-time active vehicle state monitoring</li>
                    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}><CheckIcon /> Comprehensive asset lifecycle evaluation</li>
                    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}><CheckIcon /> Export financial breakdowns for audit reviews</li>
                  </ul>
                </div>
                <div style={{ flex: 0.8, padding: "1.5rem", background: "rgba(0,0,0,0.15)", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                  <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700 }}>Fleet Manager Actions</div>
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ height: "36px", width: "100%", background: "var(--color-primary)", opacity: 0.9, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, fontSize: "0.85rem" }}>Register New Cargo Vehicle</div>
                    <div style={{ height: "36px", width: "100%", background: "var(--bg-app)", border: "1px solid var(--border-card)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>Compile ROI Report</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1.2 }}>
                  <h3 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem" }}>Enforce safety records & track licenses</h3>
                  <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                    Safety Officers are equipped with directories detailing driver status records, safety scorecard indexes, contact information, and license category audits. Identify expired operator permits before routes are dispatched.
                  </p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none", padding: 0 }}>
                    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}><CheckIcon /> Automatic warnings for license expirations</li>
                    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}><CheckIcon /> Safety scores based on driver dispatch checks</li>
                    <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}><CheckIcon /> Suspend licenses/profiles instantly on hazard alert</li>
                  </ul>
                </div>
                <div style={{ flex: 0.8, padding: "1.5rem", background: "rgba(0,0,0,0.15)", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                  <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700 }}>Safety Officer Alerts</div>
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", padding: "0.75rem", borderRadius: "8px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div>
                      <div style={{ fontSize: "0.75rem", color: "#fca5a5" }}>Driver License Expiry Alert</div>
                    </div>
                    <div style={{ border: "1px solid rgba(234,179,8,0.2)", background: "rgba(234,179,8,0.05)", padding: "0.75rem", borderRadius: "8px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#eab308" }}></div>
                      <div style={{ fontSize: "0.75rem", color: "#fde047" }}>Odometer Service Inspection Due</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ borderTop: "1px solid var(--border-card)" }}>
        <div className="landing-section">
          <h2 className="landing-section-title">Transparent pricing for fleets of any scale</h2>
          <p className="landing-section-subtitle">
            Start completely free of charge and upgrade as your distribution footprint expands.
          </p>

          <div className="landing-pricing-grid">
            <div className="landing-pricing-card">
              <div className="landing-pricing-tier">Starter</div>
              <div className="landing-pricing-price">$0<span>/month</span></div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Ideal for local operations and testing platform workflows.</p>
              <ul className="landing-pricing-features">
                <li><CheckIcon /> Up to 5 Active Vehicles</li>
                <li><CheckIcon /> Up to 5 Operator Profiles</li>
                <li><CheckIcon /> Basic KPI Dashboard</li>
                <li style={{ opacity: 0.5 }}><CheckIcon /> Financial ROI Breakdowns</li>
              </ul>
              <Link href="/register" className="btn btn-secondary" style={{ marginTop: "auto" }}>Get Started</Link>
            </div>

            <div className="landing-pricing-card popular">
              <div className="landing-pricing-tier">Growth</div>
              <div className="landing-pricing-price">$49<span>/month</span></div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Perfect for regional operators needing detailed analytics.</p>
              <ul className="landing-pricing-features">
                <li><CheckIcon /> Unlimited Active Vehicles</li>
                <li><CheckIcon /> Unlimited Operator Profiles</li>
                <li><CheckIcon /> Advanced KPI dashboard</li>
                <li><CheckIcon /> Financial ROI Breakdowns</li>
                <li><CheckIcon /> CSV Data Export</li>
              </ul>
              <Link href="/register" className="btn btn-primary" style={{ marginTop: "auto" }}>Start 14-Day Trial</Link>
            </div>

            <div className="landing-pricing-card">
              <div className="landing-pricing-tier">Enterprise</div>
              <div className="landing-pricing-price">Custom</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Tailored dashboards and support for global freight agencies.</p>
              <ul className="landing-pricing-features">
                <li><CheckIcon /> Multi-organization clusters</li>
                <li><CheckIcon /> Dedicated database integration</li>
                <li><CheckIcon /> Custom analytics exports</li>
                <li><CheckIcon /> 99.9% Service SLA</li>
              </ul>
              <a href="mailto:sales@transitops.com" className="btn btn-secondary" style={{ marginTop: "auto" }}>Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ borderTop: "1px solid var(--border-card)", background: "rgba(0,0,0,0.01)" }}>
        <div className="landing-section">
          <h2 className="landing-section-title">Frequently Asked Questions</h2>
          <p className="landing-section-subtitle">
            Have questions about TransitOps? We have compiled responses to common queries.
          </p>

          <div className="landing-faq-container">
            {faqs.map((faq, idx) => (
              <div key={idx} className="landing-faq-item" onClick={() => toggleFaq(idx)}>
                <div className="landing-faq-question">
                  <span>{faq.q}</span>
                  <span style={{ fontSize: "1.25rem", color: "var(--color-primary)" }}>{activeFaq === idx ? "−" : "+"}</span>
                </div>
                {activeFaq === idx && (
                  <p className="landing-faq-answer">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem", textAlign: "left", marginBottom: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1rem" }}>
              <LogoIcon /> TransitOps
            </div>
            <p style={{ maxWidth: "260px", fontSize: "0.85rem", lineHeight: "1.5" }}>
              Smart transport operations and asset performance software for logistics networks.
            </p>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", marginBottom: "1rem", fontSize: "0.95rem" }}>Platform</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
              <a href="#features">Features</a>
              <a href="#solutions">Solutions</a>
              <a href="#pricing">Pricing</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "var(--text-primary)", marginBottom: "1rem", fontSize: "0.95rem" }}>Company</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        <div style={{ fontSize: "0.8rem", borderTop: "1px solid var(--border-card)", paddingTop: "2rem" }}>
          &copy; {new Date().getFullYear()} TransitOps Inc. All rights reserved. Designed for logistics performance.
        </div>
      </footer>
    </div>
  );
}
