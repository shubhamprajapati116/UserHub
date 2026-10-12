import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import apirequest from "../../api/apirequest";
import { useStore } from "../../stores/StoreContext";
import "./HelpSupport.css";

const FAQ_DATA = [
  {
    id: "faq-email-change",
    category: "Security & Account",
    question: "How do I change my primary verified email address?",
    answer:
      "To ensure zero unauthorized account takeover, UserHub uses a dual-handshake security flow: 1) Go to Settings → Security tab and click 'Change Email'. 2) Enter your new email; we will send a 6-digit OTP to your current verified email address. 3) Upon verifying the OTP, an email confirmation link is sent to your new email address. 4) An Emergency Lock link is also delivered to your original email, allowing you to instantly freeze your account if you did not initiate the request.",
    linkPath: "/settings",
    linkText: "Go to Settings → Security",
    tags: ["email", "change", "otp", "security", "emergency lock"],
  },
  {
    id: "faq-2fa-otp",
    category: "Security & Account",
    question: "How does 2FA Device OTP protect my account?",
    answer:
      "When logging in from a newly detected device, browser, or IP address, UserHub automatically triggers Device 2FA verification. A one-time 6-digit security code is dispatched directly to your registered email address. This prevents attackers with compromised passwords from gaining unauthorized access to your account.",
    linkPath: "/settings",
    linkText: "View Security Settings",
    tags: ["2fa", "otp", "device", "security", "login", "code"],
  },
  {
    id: "faq-profile-banner",
    category: "Profile & Customization",
    question: "How do I customize my profile banner and appearance?",
    answer:
      "You can personalize your visual presence at any time. Navigate to 'My Profile' and click on the 'Change Banner' camera icon located at the top-right of your profile hero banner. You can select from 13 curated architectural, fluid mesh, midnight bokeh, and executive SaaS artwork presets. Changes are saved instantly to your profile.",
    linkPath: "/profile",
    linkText: "Customize Profile Banner",
    tags: ["banner", "profile", "theme", "photo", "customize", "avatar"],
  },
  {
    id: "faq-remote-sessions",
    category: "Sessions & Devices",
    question: "How do I remotely disconnect or terminate another active device session?",
    answer:
      "If you left your account logged in on a public computer or notice an unfamiliar device: 1) Navigate to Settings → Active Sessions. 2) You will see all devices currently authorized with their browser, operating system, IP address, and last activity timestamp. 3) Click 'Revoke' on any specific device, or click 'Logout All Other Devices' to invalidate all remote JWT tokens simultaneously in real-time.",
    linkPath: "/active-sessions",
    linkText: "Manage Active Sessions",
    tags: ["session", "logout", "devices", "remote", "terminate", "ip"],
  },
  {
    id: "faq-forgot-password",
    category: "Security & Account",
    question: "What should I do if I forgot my password or get locked out?",
    answer:
      "Click 'Forgot password?' on the login screen and enter your registered email. A cryptographically secure, single-use password reset link will be sent to you (valid for 60 minutes). Note: For brute-force protection, accounts are automatically locked for 15 minutes after 5 consecutive failed login attempts.",
    linkPath: "/settings",
    linkText: "Manage Password in Settings",
    tags: ["password", "forgot", "reset", "lock", "recovery"],
  },
  {
    id: "faq-roles-permissions",
    category: "General",
    question: "What are the differences between Admin and Standard User roles?",
    answer:
      "Standard users have complete control over their personal identity, work experiences, visual banner, security preferences, and active sessions. Administrators hold higher organizational permissions to oversee the platform, inspect the user directory, manage roles, analyze growth telemetry, and enforce security policies.",
    tags: ["role", "admin", "user", "permissions", "access"],
  },
  {
    id: "faq-delete-account",
    category: "General",
    question: "How do I permanently delete my account or export personal data?",
    answer:
      "You have full ownership of your data. To permanently delete your account, navigate to Settings → Danger Zone. You will be prompted to confirm your decision. Account deletion permanently purges all your profile details, work history, uploaded media, and active authentication sessions.",
    linkPath: "/settings",
    linkText: "View Settings Danger Zone",
    tags: ["delete", "account", "danger", "purge", "privacy"],
  },
];

const CATEGORIES = [
  "All Topics",
  "Security & Account",
  "Profile & Customization",
  "Sessions & Devices",
  "General",
];

const LOCAL_STORAGE_FEEDBACK_KEY = "userhub_faq_feedback";

export default function HelpSupport() {
  const navigate = useNavigate();
  const { userStore } = useStore();
  const currentUser = userStore.currentUser;

  const [activeTab, setActiveTab] = useState("guides");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [expandedFaqId, setExpandedFaqId] = useState("faq-email-change");

  const [helpfulFeedback, setHelpfulFeedback] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [systemStatus, setSystemStatus] = useState({
    status: "operational",
    latency: "18ms",
    database: "operational",
    emailService: "Active",
    lastIncident: "None in 90 days",
    loading: true,
  });

  const [ticketCategory, setTicketCategory] = useState("Account & Security");
  const [ticketPriority, setTicketPriority] = useState("normal");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const ticketFormRef = useRef(null);

  const fetchSystemStatus = useCallback(async () => {
    const startTime = performance.now();
    try {
      const res = await apirequest("/support/status");
      const elapsed = Math.round(performance.now() - startTime);
      setSystemStatus({
        status: res.status || "operational",
        latency: `${elapsed}ms`,
        database: res.systems?.database?.status || "operational",
        emailService: res.systems?.emailService?.status === "operational" ? "Active" : "Degraded",
        lastIncident: res.lastIncident || "None in 90 days",
        loading: false,
      });
    } catch {
      setSystemStatus((prev) => ({
        ...prev,
        status: "degraded",
        latency: "Timeout",
        loading: false,
      }));
    }
  }, []);

  const fetchMyTickets = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMyTickets([]);
      return;
    }

    setLoadingTickets(true);
    try {
      const res = await apirequest("/support/my-tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res?.tickets) {
        setMyTickets(res.tickets);
      }
    } catch {
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemStatus();
    fetchMyTickets();
  }, [fetchSystemStatus, fetchMyTickets]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_DATA.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All Topics" || faq.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      const inQuestion = faq.question.toLowerCase().includes(q);
      const inAnswer = faq.answer.toLowerCase().includes(q);
      const inTags = faq.tags.some((tag) => tag.toLowerCase().includes(q));

      return inQuestion || inAnswer || inTags;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleFeedback = (id, isHelpful) => {
    setHelpfulFeedback((prev) => {
      const next = { ...prev, [id]: isHelpful };
      try {
        localStorage.setItem(LOCAL_STORAGE_FEEDBACK_KEY, JSON.stringify(next));
      } catch {
        console.warn("Failed to save FAQ feedback to localStorage.");
      }
      return next;
    });
    toast.success("Thank you for your feedback!", { autoClose: 1800 });
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();

    if (!ticketSubject.trim() || ticketSubject.trim().length < 3) {
      toast.error("Please enter a subject (minimum 3 characters).");
      return;
    }

    if (!ticketMessage.trim() || ticketMessage.trim().length < 10) {
      toast.error("Please write a detailed message (minimum 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await apirequest("/support/ticket", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category: ticketCategory,
          priority: ticketPriority,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
        }),
      });

      const newTicket = response.ticket || {
        ticketId: `TICK-${Math.floor(100000 + Math.random() * 900000)}`,
        category: ticketCategory,
        priority: ticketPriority,
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        status: "open",
        createdAt: new Date().toISOString(),
        estimatedResponseTime:
          ticketPriority === "urgent" ? "Under 30 minutes" : "Under 2 hours",
      };

      setSubmittedTicket(newTicket);
      toast.success("Support ticket submitted successfully!");
      setTicketSubject("");
      setTicketMessage("");
      fetchMyTickets();
    } catch (err) {
      toast.error(err?.message || "Failed to submit support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <AppLayout
      title="Help & Support"
      subtitle="Find quick answers, explore guides, or get in touch with our team"
      breadcrumbs={[{ label: "Help & Support" }]}
    >
      <div className="help-container">
        <section className="help-hero-card">
          <div className="help-hero-badge">
            <span className="help-badge-dot" />
            Knowledge Base & Support Center
          </div>
          <h1 className="help-hero-title">How can we help you today?</h1>
          <p className="help-hero-subtitle">
            Search verified guides, troubleshoot issues, or track direct support requests.
          </p>

          <div className="help-search-box">
            <svg
              className="help-search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="help-search-input"
              placeholder="Search by keyword (e.g. email change, 2FA, banner, session, password)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "guides") setActiveTab("guides");
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="help-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="help-quick-tags-container">
            <span className="help-quick-tags-label">Popular topics:</span>
            <div className="help-quick-tags">
              {[
                "Email Change",
                "Profile Banner",
                "Active Sessions",
                "2FA OTP",
                "Password Reset",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="help-tag-pill"
                  onClick={() => {
                    setSearchQuery(tag);
                    if (activeTab !== "guides") setActiveTab("guides");
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="help-status-banner">
          <div className="help-status-left">
            <div className="help-pulse-wrap">
              <span
                className={`help-status-pulse ${
                  systemStatus.status === "degraded" ? "pulse-warn" : ""
                }`}
              />
              <span
                className={`help-status-dot ${
                  systemStatus.status === "degraded" ? "dot-warn" : ""
                }`}
              />
            </div>
            <div className="help-status-info">
              <div className="help-status-headline-row">
                <span className="help-status-headline">
                  {systemStatus.status === "operational"
                    ? "All Systems Operational"
                    : "Partial Service Degradation"}
                </span>
                <button
                  type="button"
                  className="help-status-refresh-btn"
                  onClick={fetchSystemStatus}
                  title="Check live telemetry"
                >
                  ↻ Refresh
                </button>
              </div>
              <span className="help-status-sub">
                Core identity services, 2FA engines, and database clusters running with 99.98% uptime.
              </span>
            </div>
          </div>

          <div className="help-status-metrics">
            <div className="help-metric-item">
              <span className="help-metric-val">{systemStatus.latency}</span>
              <span className="help-metric-lbl">Live Latency</span>
            </div>
            <div className="help-metric-divider" />
            <div className="help-metric-item">
              <span className="help-metric-val">{systemStatus.database}</span>
              <span className="help-metric-lbl">Database</span>
            </div>
            <div className="help-metric-divider" />
            <button
              type="button"
              className="help-status-cta-btn"
              onClick={() => {
                setActiveTab("ticket");
                setTimeout(() => {
                  ticketFormRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contact Support
            </button>
          </div>
        </section>

        <div className="help-nav-tabs-wrap">
          <nav className="help-nav-tabs" aria-label="Support Hub Sections">
            <button
              type="button"
              className={`help-nav-tab-btn ${activeTab === "guides" ? "is-active" : ""}`}
              onClick={() => setActiveTab("guides")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>Guides & FAQs</span>
            </button>

            <button
              type="button"
              className={`help-nav-tab-btn ${activeTab === "ticket" ? "is-active" : ""}`}
              onClick={() => setActiveTab("ticket")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Submit Request</span>
            </button>

            <button
              type="button"
              className={`help-nav-tab-btn ${activeTab === "my-tickets" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("my-tickets");
                fetchMyTickets();
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="7" y1="16" x2="13" y2="16" />
              </svg>
              <span>My Tickets</span>
              {myTickets.length > 0 && (
                <span className="help-tab-count-badge">{myTickets.length}</span>
              )}
            </button>
          </nav>
        </div>

        {activeTab === "guides" && (
          <section className="help-faq-section">
            <div className="help-section-header">
              <div>
                <h2 className="help-section-title">Frequently Asked Questions</h2>
                <p className="help-section-subtitle">
                  Clear explanations for common account workflows, authentication, and security.
                </p>
              </div>

              <div className="help-category-pills-scroll">
                <div className="help-category-pills">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`help-category-btn ${
                        selectedCategory === cat ? "is-active" : ""
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="help-empty-state">
                <div className="help-empty-icon">🔍</div>
                <h4 className="help-empty-title">No matching guides found</h4>
                <p className="help-empty-desc">
                  We couldn't find any articles matching "{searchQuery}". Try different search terms or submit a direct ticket.
                </p>
                <div className="help-empty-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All Topics");
                    }}
                  >
                    Reset Search Filters
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab("ticket")}
                  >
                    Submit a Ticket Instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="help-accordion-list">
                {filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`help-accordion-item ${isExpanded ? "is-expanded" : ""}`}
                    >
                      <button
                        type="button"
                        className="help-accordion-trigger"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isExpanded}
                      >
                        <div className="help-accordion-left">
                          <span className="help-accordion-badge">{faq.category}</span>
                          <span className="help-accordion-question">{faq.question}</span>
                        </div>
                        <span className="help-accordion-chevron">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="help-accordion-content">
                          <p className="help-accordion-text">{faq.answer}</p>

                          <div className="help-accordion-footer">
                            {faq.linkPath && (
                              <button
                                type="button"
                                className="help-faq-action-btn"
                                onClick={() => navigate(faq.linkPath)}
                              >
                                {faq.linkText} ↗
                              </button>
                            )}

                            <div className="help-feedback-wrap">
                              <span className="help-feedback-label">Was this helpful?</span>
                              <button
                                type="button"
                                className={`help-btn-thumb ${
                                  helpfulFeedback[faq.id] === true ? "active-thumb" : ""
                                }`}
                                onClick={() => handleFeedback(faq.id, true)}
                                aria-label="Mark as helpful"
                              >
                                👍 Yes
                              </button>
                              <button
                                type="button"
                                className={`help-btn-thumb ${
                                  helpfulFeedback[faq.id] === false ? "active-thumb-down" : ""
                                }`}
                                onClick={() => handleFeedback(faq.id, false)}
                                aria-label="Mark as not helpful"
                              >
                                👎 No
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === "ticket" && (
          <section className="help-ticket-section" ref={ticketFormRef}>
            <div className="help-ticket-layout">
              <div className="help-ticket-form-card">
                <div className="help-ticket-form-header">
                  <span className="help-ticket-tag">Direct Support Ticket</span>
                  <h3 className="help-ticket-heading">Submit a Support Request</h3>
                  <p className="help-ticket-sub">
                    Our engineering and customer support team reviews all submitted requests promptly.
                  </p>
                </div>

                {submittedTicket ? (
                  <div className="help-ticket-success-box">
                    <div className="help-ticket-success-icon">✓</div>
                    <h4 className="help-success-title">Ticket Created Successfully!</h4>
                    <p className="help-success-desc">
                      Your request has been logged and assigned to our active support queue. You can track its live status anytime under the "My Tickets" tab.
                    </p>

                    <div className="help-success-details">
                      <div className="help-success-row">
                        <span className="help-success-key">Ticket Reference:</span>
                        <span className="help-success-val highlight">{submittedTicket.ticketId}</span>
                      </div>
                      <div className="help-success-row">
                        <span className="help-success-key">Category:</span>
                        <span className="help-success-val">{submittedTicket.category}</span>
                      </div>
                      <div className="help-success-row">
                        <span className="help-success-key">Priority:</span>
                        <span className={`help-priority-pill priority-${submittedTicket.priority}`}>
                          {submittedTicket.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="help-success-row">
                        <span className="help-success-key">Estimated Response:</span>
                        <span className="help-success-val">{submittedTicket.estimatedResponseTime || "Under 2 hours"}</span>
                      </div>
                    </div>

                    <div className="help-success-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setActiveTab("my-tickets");
                          fetchMyTickets();
                        }}
                      >
                        View in "My Tickets"
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSubmittedTicket(null)}
                      >
                        Submit Another Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="help-form">
                    <div className="help-form-row-duo">
                      <div className="help-form-group">
                        <label htmlFor="ticket-category" className="help-form-label">
                          Inquiry Category
                        </label>
                        <select
                          id="ticket-category"
                          className="help-form-select"
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                        >
                          <option value="Account & Security">Account & Security</option>
                          <option value="Profile & Customization">Profile & Customization</option>
                          <option value="Active Sessions & Devices">Active Sessions & Devices</option>
                          <option value="Bug Report">Bug Report</option>
                          <option value="Feature Request">Feature Request</option>
                          <option value="Other Inquiry">Other Inquiry</option>
                        </select>
                      </div>

                      <div className="help-form-group">
                        <label className="help-form-label">Priority Level</label>
                        <div className="help-priority-selector">
                          {["low", "normal", "high", "urgent"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              className={`help-priority-btn ${
                                ticketPriority === p ? `selected-${p}` : ""
                              }`}
                              onClick={() => setTicketPriority(p)}
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="help-form-group">
                      <label htmlFor="ticket-subject" className="help-form-label">
                        Subject
                      </label>
                      <input
                        id="ticket-subject"
                        type="text"
                        className="help-form-input"
                        placeholder="e.g. Question regarding email verification OTP / Banner upload issue"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        maxLength={120}
                        required
                      />
                      <span className="help-char-counter">{ticketSubject.length}/120</span>
                    </div>

                    <div className="help-form-group">
                      <label htmlFor="ticket-message" className="help-form-label">
                        Detailed Description
                      </label>
                      <textarea
                        id="ticket-message"
                        rows={5}
                        className="help-form-textarea"
                        placeholder="Please describe the issue, question, or suggestion in detail. If reporting a bug, mention the steps to reproduce it."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        maxLength={2000}
                        required
                      />
                      <span className="help-char-counter">{ticketMessage.length}/2000</span>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-full help-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="btn-spinner" /> Submitting Ticket...
                        </>
                      ) : (
                        "Submit Support Ticket"
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="help-ticket-sidebar-card">
                <div className="help-sla-badge">
                  <span className="help-sla-icon">⚡</span>
                  <span className="help-sla-text">Fast Track Support SLA</span>
                </div>

                <h4 className="help-sla-title">Support Team Availability</h4>
                <p className="help-sla-desc">
                  Logged tickets are monitored around the clock by our technical team.
                </p>

                <div className="help-sla-list">
                  <div className="help-sla-item">
                    <div className="help-sla-item-icon">⏱️</div>
                    <div>
                      <h5 className="help-sla-item-title">Standard Response Time</h5>
                      <p className="help-sla-item-desc">Under 2 hours during normal hours.</p>
                    </div>
                  </div>

                  <div className="help-sla-item">
                    <div className="help-sla-item-icon">🚨</div>
                    <div>
                      <h5 className="help-sla-item-title">Urgent Security Inquiries</h5>
                      <p className="help-sla-item-desc">Prioritized under 30 minutes.</p>
                    </div>
                  </div>

                  <div className="help-sla-item">
                    <div className="help-sla-item-icon">📧</div>
                    <div>
                      <h5 className="help-sla-item-title">Direct Support Desk</h5>
                      <p className="help-sla-item-desc">support@userhub.dev</p>
                    </div>
                  </div>

                  <div className="help-sla-item">
                    <div className="help-sla-item-icon">👤</div>
                    <div>
                      <h5 className="help-sla-item-title">Logged-in User</h5>
                      <p className="help-sla-item-desc">
                        {currentUser?.name || "User"} ({currentUser?.email || "Authenticated"})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="help-security-notice">
                  <span className="help-notice-lock">🔒</span>
                  <span>
                    All submitted tickets are securely stored and visible only to authorized UserHub staff.
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "my-tickets" && (
          <section className="help-mytickets-section">
            <div className="help-section-header">
              <div>
                <h2 className="help-section-title">My Support Tickets</h2>
                <p className="help-section-subtitle">
                  Track the progress, reference ID, and resolutions of all tickets you've submitted.
                </p>
              </div>

              <div className="help-mytickets-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={fetchMyTickets}
                  disabled={loadingTickets}
                >
                  {loadingTickets ? "Refreshing..." : "↻ Refresh Tickets"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab("ticket")}
                >
                  + New Ticket
                </button>
              </div>
            </div>

            {loadingTickets ? (
              <div className="help-loading-state">
                <div className="help-loading-spinner" />
                <p>Loading your tickets...</p>
              </div>
            ) : myTickets.length === 0 ? (
              <div className="help-empty-state">
                <div className="help-empty-icon">🎫</div>
                <h4 className="help-empty-title">No support tickets found</h4>
                <p className="help-empty-desc">
                  You haven't submitted any support requests yet. If you need assistance with an account or feature, open a ticket anytime!
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab("ticket")}
                >
                  Submit Your First Ticket
                </button>
              </div>
            ) : (
              <div className="help-tickets-grid">
                {myTickets.map((t) => (
                  <div key={t._id || t.ticketId} className="help-ticket-card">
                    <div className="help-ticket-card-header">
                      <div className="help-ticket-meta">
                        <span className="help-ticket-badge-id">{t.ticketId}</span>
                        <span className="help-ticket-badge-cat">{t.category}</span>
                      </div>
                      <div className="help-ticket-status-wrap">
                        <span className={`help-status-tag status-${t.status || "open"}`}>
                          {(t.status || "open").replace("_", " ").toUpperCase()}
                        </span>
                        <span className={`help-priority-pill priority-${t.priority || "normal"}`}>
                          {(t.priority || "normal").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <h4 className="help-ticket-subject">{t.subject}</h4>
                    <p className="help-ticket-message-preview">{t.message}</p>

                    <div className="help-ticket-card-footer">
                      <span className="help-ticket-date">
                        📅 {formatDate(t.createdAt)}
                      </span>
                      <span className="help-ticket-response-sla">
                        ⚡ {t.estimatedResponseTime || "Under 2 hours"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
