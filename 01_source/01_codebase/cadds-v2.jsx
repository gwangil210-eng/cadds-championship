import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────── CONSTANTS ─────────── */

const VIDEOS = {
  hero: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4",
  about: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4",
  cards: [
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4",
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4",
  ],
  cta: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4",
};

const LAYERS = [
  { id: "input", label: "입력 전처리", en: "INPUT & PREPROCESSING", color: "#00E5FF", icon: "⎈", desc: "품질 게이트 · PII 게이트 · 표준 티켓 정규화" },
  { id: "ai", label: "AI 분석", en: "AI ANALYSIS", color: "#6FFF00", icon: "◈", desc: "Smart Router · Vision Agent · Logic Agent · RAG Agent" },
  { id: "policy", label: "정책통제", en: "POLICY CONTROL", color: "#FFBE0B", icon: "⬡", desc: "AUTO · REVIEW · APPROVAL · BLOCK 상태 분기" },
  { id: "hitl", label: "인간검토·감사", en: "HITL & AUDIT", color: "#FF6B6B", icon: "◉", desc: "HITL Dashboard · Evidence Ledger · Audit Log" },
  { id: "ops", label: "운영·연계", en: "OPERATIONS", color: "#C084FC", icon: "⊕", desc: "외부 시스템 통합 · 알림 · SLA 모니터링" },
];

const PRINCIPLES = [
  { icon: "◆", title: "근거 제시", en: "EVIDENCE", desc: "승인된 문서 범위 안에서만 근거와 초안을 제시합니다" },
  { icon: "◇", title: "인간 최종판단", en: "HUMAN FINAL", desc: "AI는 판단 주체가 아닌 지원 도구로만 작동합니다" },
  { icon: "⬢", title: "정책통제", en: "POLICY CTRL", desc: "고위험 사건은 자동집행 없이 검토 상태로 전환합니다" },
  { icon: "◎", title: "감사 가능성", en: "AUDITABILITY", desc: "입력부터 최종 결과까지 전 과정을 추적 구조에 저장합니다" },
];

const NAV = ["HOME", "ABOUT", "ARCH", "FLOW", "CONTACT"];

/* ─────────── HOOKS ─────────── */

function useInView(opts = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.unobserve(el); } }, { threshold: 0.15, ...opts });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function useMouseParallax(factor = 0.02) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => setPos({ x: (e.clientX - window.innerWidth / 2) * factor, y: (e.clientY - window.innerHeight / 2) * factor });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [factor]);
  return pos;
}

/* ─────────── SUB-COMPONENTS ─────────── */

function GlassCard({ children, className = "", glow = false, ...props }) {
  return (
    <div className={className} style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px) saturate(1.3)", WebkitBackdropFilter: "blur(16px) saturate(1.3)", border: "1px solid rgba(111,255,0,0.08)", boxShadow: glow ? "0 0 40px rgba(111,255,0,0.08), inset 0 1px 1px rgba(255,255,255,0.06)" : "inset 0 1px 1px rgba(255,255,255,0.06)", ...props.style }} {...props}>{children}</div>
  );
}

function VideoBackground({ src, overlay = 0.55 }) {
  return (
    <>
      <video autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
        <source src={src} type="video/mp4" />
      </video>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(1,8,40,${overlay}) 0%, rgba(1,8,40,${overlay + 0.15}) 100%)` }} />
    </>
  );
}

function AnimatedText({ children, delay = 0, visible, direction = "up" }) {
  const transforms = { up: "translateY(50px)", left: "translateX(-50px)", right: "translateX(50px)", scale: "scale(0.92)" };
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : transforms[direction], transition: `all 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s` }}>
      {children}
    </div>
  );
}

function MarqueeStrip({ text, speed = 30 }) {
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", borderTop: "1px solid rgba(111,255,0,0.06)", borderBottom: "1px solid rgba(111,255,0,0.06)", padding: "12px 0" }}>
      <div style={{ display: "inline-block", animation: `marqueeScroll ${speed}s linear infinite` }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: "rgba(239,244,255,0.12)", textTransform: "uppercase" }}>
          {text}&nbsp;&nbsp;&nbsp;{text}&nbsp;&nbsp;&nbsp;
        </span>
      </div>
    </div>
  );
}

/* ─────────── SECTIONS ─────────── */

function HeroSection() {
  const [ref, vis] = useInView();
  const mouse = useMouseParallax(0.015);
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section ref={ref} id="home" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", borderRadius: "0 0 32px 32px" }}>
      <VideoBackground src={VIDEOS.hero} overlay={0.6} />
      {/* Grid overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(111,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(111,255,0,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Nav */}
        <header style={{ maxWidth: 1400, width: "100%", margin: "0 auto", padding: "24px 24px 0" }}>
          <GlassCard style={{ borderRadius: 999, padding: "10px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>CADDS</span>
            <div style={{ display: "flex", gap: 28 }}>
              {NAV.map((n) => (
                <a key={n} href={`#${n.toLowerCase()}`} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: "rgba(239,244,255,0.6)", textDecoration: "none", transition: "color 0.3s" }} onMouseEnter={(e) => (e.target.style.color = "#6FFF00")} onMouseLeave={(e) => (e.target.style.color = "rgba(239,244,255,0.6)")}>
                  {n}
                </a>
              ))}
            </div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6FFF00" }}>{time}</span>
          </GlassCard>
        </header>

        {/* Hero content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 80px", transform: `translate(${mouse.x}px, ${mouse.y}px)` }}>
          <div style={{ maxWidth: 1400, width: "100%", textAlign: "center" }}>
            <AnimatedText visible={vis} delay={0.1}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", color: "rgba(239,244,255,0.4)", marginBottom: 24, textTransform: "uppercase" }}>
                Controlled AI Decision Support System
              </div>
            </AnimatedText>
            <AnimatedText visible={vis} delay={0.25}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(36px, 8vw, 120px)", lineHeight: 1.0, letterSpacing: "-0.03em", margin: 0 }}>
                BUILDING<br />
                <span style={{ fontStyle: "italic", fontFamily: "'Instrument Serif', serif", fontWeight: 400, background: "linear-gradient(90deg, #6FFF00, #00E5FF, #6FFF00)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s linear infinite" }}>TRUST</span>
                {" "}IN AI
              </h1>
            </AnimatedText>
            <AnimatedText visible={vis} delay={0.5}>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: "rgba(239,244,255,0.5)", maxWidth: 540, margin: "32px auto 0", lineHeight: 1.8, letterSpacing: "0.02em" }}>
                공공 민원 처리의 병목을 줄이기 위한<br />통제형 AI 의사결정지원시스템
              </p>
            </AnimatedText>
            <AnimatedText visible={vis} delay={0.7}>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 40 }}>
                <GlassCard glow style={{ borderRadius: 999, padding: "12px 32px", cursor: "pointer", transition: "all 0.3s" }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: "#6FFF00" }}>EXPLORE →</span>
                </GlassCard>
                <GlassCard style={{ borderRadius: 999, padding: "12px 32px", cursor: "pointer" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(239,244,255,0.6)" }}>DOCUMENTATION</span>
                </GlassCard>
              </div>
            </AnimatedText>
          </div>
        </div>

        {/* Bottom ticker */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <MarqueeStrip text="RAG ◈ POLICY CONTROL ◈ HITL ◈ AUDIT TRAIL ◈ EVIDENCE-BASED ◈ DBSCAN ◈ TRANSPARENCY ◈ ACCOUNTABILITY ◈ PII PROTECTION ◈ GOVERNANCE" />
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const [ref, vis] = useInView();
  return (
    <section ref={ref} id="about" style={{ position: "relative", padding: "120px 24px", overflow: "hidden" }}>
      <VideoBackground src={VIDEOS.about} overlay={0.75} />
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          {/* Left */}
          <div>
            <AnimatedText visible={vis} delay={0.1} direction="left">
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", color: "#6FFF00", marginBottom: 16 }}>DEFINITION</div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 56px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                WHAT IS
                <br />
                <span style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic", color: "#6FFF00" }}>CADDS</span>?
              </h2>
            </AnimatedText>
            <AnimatedText visible={vis} delay={0.3} direction="left">
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, lineHeight: 2, color: "rgba(239,244,255,0.6)", marginTop: 28 }}>
                CADDS는 생성형 AI를 직접 판단 주체로 두지 않고, 근거 기반 검색·위험평가·정책통제·인간검토·감사로그를 결합하여 공공 및 기관 환경의 판단 과정을 지원하도록 설계된 통제형 AI 의사결정지원시스템입니다.
              </p>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, lineHeight: 2, color: "rgba(239,244,255,0.4)", marginTop: 16 }}>
                AI는 승인된 문서 범위 안에서 근거와 초안을 제시하며, 최종 판단은 인간이 수행합니다. 판단 결과보다 감사 가능성을 우선하는 운영 원칙을 따릅니다.
              </p>
            </AnimatedText>
          </div>
          {/* Right: 4 principles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {PRINCIPLES.map((p, i) => (
              <AnimatedText key={p.en} visible={vis} delay={0.2 + i * 0.12} direction="right">
                <GlassCard glow style={{ borderRadius: 16, padding: 24, minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.4s", cursor: "default" }}>
                  <div>
                    <div style={{ fontSize: 28, color: "#6FFF00", marginBottom: 12 }}>{p.icon}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: "rgba(239,244,255,0.3)" }}>{p.en}</div>
                  </div>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, lineHeight: 1.7, color: "rgba(239,244,255,0.5)", marginTop: 12 }}>{p.desc}</p>
                </GlassCard>
              </AnimatedText>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const [ref, vis] = useInView();
  const [active, setActive] = useState(null);

  return (
    <section ref={ref} id="arch" style={{ padding: "120px 24px", background: "linear-gradient(180deg, #010828 0%, #0a1438 50%, #010828 100%)", position: "relative" }}>
      {/* Subtle grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(111,255,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(111,255,0,0.025) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto" }}>
        <AnimatedText visible={vis} delay={0.1}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 52px)", letterSpacing: "-0.02em" }}>
              CORE
            </h2>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(28px, 4vw, 52px)", color: "#6FFF00" }}>Architecture</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(239,244,255,0.3)", letterSpacing: "0.15em", marginLeft: "auto" }}>5-LAYER SYSTEM</span>
          </div>
        </AnimatedText>

        {/* 5-Layer stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {LAYERS.map((layer, i) => (
            <AnimatedText key={layer.id} visible={vis} delay={0.15 + i * 0.1}>
              <div
                onClick={() => setActive(active === i ? null : i)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr 2fr auto",
                  gap: 20,
                  alignItems: "center",
                  padding: active === i ? "28px 28px" : "20px 28px",
                  borderRadius: 16,
                  border: `1px solid ${active === i ? layer.color + "40" : "rgba(111,255,0,0.06)"}`,
                  background: active === i ? `linear-gradient(135deg, ${layer.color}08, ${layer.color}03)` : "rgba(255,255,255,0.01)",
                  backdropFilter: "blur(8px)",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                  transform: active === i ? "scale(1.01)" : "scale(1)",
                }}
              >
                <div style={{ fontSize: 24, color: layer.color, textAlign: "center", transition: "transform 0.4s", transform: active === i ? "scale(1.3) rotate(15deg)" : "none" }}>{layer.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 2 }}>{layer.label}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: layer.color, opacity: 0.7 }}>{layer.en}</div>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(239,244,255,0.45)", lineHeight: 1.6, maxHeight: active === i ? 200 : 20, overflow: "hidden", transition: "max-height 0.5s" }}>
                  {layer.desc}
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${layer.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: layer.color, transition: "transform 0.3s", transform: active === i ? "rotate(45deg)" : "none" }}>+</div>
              </div>
            </AnimatedText>
          ))}
        </div>

        {/* Connecting flow line */}
        <AnimatedText visible={vis} delay={0.8}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 48, fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(239,244,255,0.3)" }}>
            {LAYERS.map((l, i) => (
              <span key={l.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: l.color, fontWeight: 700 }}>{l.label}</span>
                {i < LAYERS.length - 1 && <span style={{ color: "rgba(111,255,0,0.3)" }}>→</span>}
              </span>
            ))}
          </div>
        </AnimatedText>
      </div>
    </section>
  );
}

function FlowSection() {
  const [ref, vis] = useInView();
  return (
    <section ref={ref} id="flow" style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto" }}>
        <AnimatedText visible={vis} delay={0.1}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", color: "#FFBE0B", marginBottom: 16 }}>USE CASE</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(24px, 3.5vw, 44px)", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 56 }}>
            공공 민원 통합 처리<br />
            <span style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic", color: "rgba(239,244,255,0.4)" }}>Processing Flow</span>
          </h2>
        </AnimatedText>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {VIDEOS.cards.map((src, i) => {
            const items = [
              { title: "5-LAYER ARCHITECTURE", sub: "입력 → 분석 → 정책 → 검토 → 운영", tag: "CORE", val: "입력 전처리 → AI 분석 → 정책통제 → HITL → 감사" },
              { title: "SECURITY & GOVERNANCE", sub: "PII 보호 및 근거 기반 응답", tag: "SAFEGUARDS", val: "민감정보 마스킹 / 자동집행 금지 / 감사 가능성" },
              { title: "COMPLAINT PROCESSING", sub: "공공 민원 통합 처리", tag: "APPLICATION", val: "중복 민원 병합 / 근거 기반 회신 / 사건 중심 처리" },
            ];
            return (
              <AnimatedText key={i} visible={vis} delay={0.2 + i * 0.15} direction="up">
                <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(111,255,0,0.06)", background: "rgba(255,255,255,0.01)", backdropFilter: "blur(8px)", transition: "transform 0.4s, box-shadow 0.4s", cursor: "default" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(111,255,0,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden" }}>
                    <video autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                      <source src={src} type="video/mp4" />
                    </video>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(1,8,40,0.9) 0%, transparent 60%)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{items[i].title}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(239,244,255,0.5)" }}>{items[i].sub}</div>
                    </div>
                  </div>
                  <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(111,255,0,0.06)" }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#6FFF00", marginBottom: 6 }}>{items[i].tag}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(239,244,255,0.4)", lineHeight: 1.6 }}>{items[i].val}</div>
                  </div>
                </div>
              </AnimatedText>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DataSection() {
  const [ref, vis] = useInView();
  const fields = ["ticket_id", "cluster_id", "source_channel", "text", "geo", "image_quality", "pii_flag", "issue_type", "severity_score", "route", "sla_h", "status"];
  const api = [
    { method: "POST", path: "/api/requests", desc: "민원 접수" },
    { method: "POST", path: "/api/analyze", desc: "AI 분석 실행" },
    { method: "POST", path: "/api/reviews", desc: "검토 반영" },
    { method: "GET", path: "/api/request/{id}", desc: "상세 조회" },
    { method: "GET", path: "/api/audit/{id}", desc: "감사 조회" },
  ];

  return (
    <section ref={ref} style={{ padding: "120px 24px", background: "linear-gradient(180deg, #010828, #060e2a, #010828)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <AnimatedText visible={vis} delay={0.1}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", color: "#00E5FF", marginBottom: 16 }}>DATA & API</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(24px, 3.5vw, 44px)", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 56 }}>
            단일 증거 사슬<br />
            <span style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic", color: "rgba(239,244,255,0.4)" }}>Evidence Chain</span>
          </h2>
        </AnimatedText>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Ticket Schema */}
          <AnimatedText visible={vis} delay={0.2} direction="left">
            <GlassCard style={{ borderRadius: 20, padding: 28 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>표준 티켓 구조</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {fields.map((f, i) => (
                  <span key={f} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(111,255,0,0.12)", color: i < 3 ? "#6FFF00" : "rgba(239,244,255,0.5)", background: i < 3 ? "rgba(111,255,0,0.06)" : "transparent", transition: "all 0.3s" }}>{f}</span>
                ))}
              </div>
            </GlassCard>
          </AnimatedText>

          {/* API Endpoints */}
          <AnimatedText visible={vis} delay={0.3} direction="right">
            <GlassCard style={{ borderRadius: 20, padding: 28 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>핵심 API</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {api.map((a) => (
                  <div key={a.path} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, padding: "4px 8px", borderRadius: 4, background: a.method === "POST" ? "rgba(111,255,0,0.12)" : "rgba(0,229,255,0.12)", color: a.method === "POST" ? "#6FFF00" : "#00E5FF", fontWeight: 700 }}>{a.method}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(239,244,255,0.7)", flex: 1 }}>{a.path}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(239,244,255,0.35)" }}>{a.desc}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </AnimatedText>
        </div>

        {/* Flow arrow */}
        <AnimatedText visible={vis} delay={0.5}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 40, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
            {["POST /requests", "POST /analyze", "POST /reviews", "GET /audit"].map((s, i) => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(111,255,0,0.1)", color: "rgba(239,244,255,0.5)" }}>{s}</span>
                {i < 3 && <span style={{ color: "#6FFF00" }}>→</span>}
              </span>
            ))}
          </div>
        </AnimatedText>
      </div>
    </section>
  );
}

function CTASection() {
  const [ref, vis] = useInView();
  return (
    <section ref={ref} id="contact" style={{ position: "relative", minHeight: "70vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
      <VideoBackground src={VIDEOS.cta} overlay={0.5} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1400, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <AnimatedText visible={vis} delay={0.1}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", color: "#6FFF00", marginBottom: 24 }}>CONCLUSION</div>
        </AnimatedText>
        <AnimatedText visible={vis} delay={0.3}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(32px, 6vw, 80px)", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            SAFE AI FOR<br />
            <span style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: "italic", background: "linear-gradient(90deg, #6FFF00, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PUBLIC</span>
            {" "}GOVERNANCE.
          </h2>
        </AnimatedText>
        <AnimatedText visible={vis} delay={0.5}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: "rgba(239,244,255,0.45)", maxWidth: 500, margin: "32px auto 0", lineHeight: 1.9 }}>
            CADDS는 공공기관이 보다 안전하고 설명 가능한 방식으로<br />AI를 사용할 수 있도록 설계된 통제형 AI 의사결정지원시스템입니다.
          </p>
        </AnimatedText>
        <AnimatedText visible={vis} delay={0.7}>
          <GlassCard glow style={{ display: "inline-block", borderRadius: 999, padding: "14px 40px", marginTop: 40, cursor: "pointer" }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#6FFF00", letterSpacing: "0.05em" }}>GET IN TOUCH →</span>
          </GlassCard>
        </AnimatedText>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(111,255,0,0.06)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>CADDS</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(239,244,255,0.25)" }}>© 2026 Controlled AI Decision Support System</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(239,244,255,0.3)", cursor: "pointer" }}>GITHUB</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(239,244,255,0.3)", cursor: "pointer" }}>DOCS</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────── MAIN APP ─────────── */

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#010828", color: "#EFF4FF", fontFamily: "'Space Mono', monospace", overflowX: "hidden" }}>
      {/* Scan-line overlay */}
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(111,255,0,0.012) 2px, rgba(111,255,0,0.012) 4px)", pointerEvents: "none", zIndex: 9999 }} />
      {/* Noise texture */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 9998 }} />

      {/* Font preload */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(111,255,0,0.3); color: #EFF4FF; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #010828; }
        ::-webkit-scrollbar-thumb { background: #6FFF00; border-radius: 3px; }
      `}</style>

      <HeroSection />
      <MarqueeStrip text="CONTROLLED AI ◈ DECISION SUPPORT ◈ PUBLIC SECTOR ◈ EVIDENCE-BASED ◈ HUMAN-IN-THE-LOOP ◈ AUDIT TRAIL ◈ POLICY ENGINE ◈ RAG PIPELINE ◈ PII PROTECTION" />
      <AboutSection />
      <ArchitectureSection />
      <FlowSection />
      <DataSection />
      <CTASection />
      <Footer />
    </div>
  );
}
