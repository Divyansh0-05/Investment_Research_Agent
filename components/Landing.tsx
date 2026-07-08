"use client";

import Logo from "@/components/Logo";

interface LandingProps {
  companyName: string;
  running: boolean;
  exampleCompanies: string[];
  error: string | null;
  onCompanyNameChange: (value: string) => void;
  onRunAgent: (name: string) => void;
}

export default function Landing({
  companyName,
  running,
  exampleCompanies,
  error,
  onCompanyNameChange,
  onRunAgent,
}: LandingProps) {
  return (
    <div className="animate-fadeUp flex flex-col items-center">
      <header className="mb-10 w-full text-center flex flex-col items-center">
        <div className="mb-6 flex items-center gap-3 bg-panel2/40 border border-line/60 rounded-full px-4 py-1.5 shadow-sm">
          <Logo />
          <div className="text-left">
            <p className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">Analyst</p>
            <p className="text-[10px] text-slate-500 font-medium">Investment Research Agent</p>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-100 mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          Analyst
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
          AI-powered investment research you can audit.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onRunAgent(companyName);
        }}
        className="w-full max-w-lg flex flex-col sm:flex-row gap-3 mb-4"
      >
        <input
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
          placeholder="Enter a company name, e.g. Zerodha"
          disabled={running}
          className="flex-1 rounded-xl bg-panel border border-line px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent2/50 disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={running || !companyName.trim()}
          className="rounded-xl bg-accent2 hover:bg-accent2/90 disabled:opacity-40 disabled:cursor-not-allowed text-ink font-semibold px-6 py-3 transition shadow-lg shadow-accent2/10"
        >
          {running ? "Researching..." : "Analyze"}
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-lg">
        <span className="text-xs text-slate-600 mr-1 self-center">Try:</span>
        {exampleCompanies.map((company) => (
          <button
            key={company}
            onClick={() => {
              onCompanyNameChange(company);
              onRunAgent(company);
            }}
            disabled={running}
            className="text-xs rounded-full border border-line px-3.5 py-1.5 text-slate-400 hover:text-slate-200 hover:border-accent2/50 bg-panel2/20 transition disabled:opacity-40"
          >
            {company}
          </button>
        ))}
      </div>

      {error && (
        <div className="card w-full max-w-lg border-pass/40 bg-pass/5 p-4 mb-8 text-sm text-red-300 text-center rounded-xl">
          {error}
        </div>
      )}

      <div className="w-full max-w-2xl">
        <WorkflowVisualization />
      </div>
    </div>
  );
}

function WorkflowVisualization() {
  // Define continuous paths from top to bottom
  const paths = {
    left: "M 270 60 L 270 95 C 270 125, 95 120, 95 155 L 95 195 C 95 230, 270 220, 270 255 L 270 635",
    middle: "M 270 60 L 270 635",
    right: "M 270 60 L 270 95 C 270 125, 445 120, 445 155 L 445 195 C 445 230, 270 220, 270 255 L 270 635",
  };

  // Glow filter and linear gradient colors matching accent, accent2, and invest
  return (
    <section className="card overflow-hidden p-6 sm:p-8 border border-line/60 bg-panel/30 shadow-2xl relative w-full rounded-2xl flex flex-col items-center">
      <div className="absolute top-4 left-6 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Live System Graph</span>
      </div>

      <svg
        viewBox="0 0 540 680"
        role="img"
        aria-label="Animated AI Agent pipeline visualization showing news, financials, competitive parallel research and deep reasoning stages"
        className="h-auto w-full max-w-lg mt-6"
      >
        <defs>
          {/* Drop shadow / glow effect */}
          <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core pathway line gradient */}
          <linearGradient id="pathGradient" x1="0" y1="60" x2="0" y2="635" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.8" />   {/* accent (teal) */}
            <stop offset="35%" stopColor="#818CF8" stopOpacity="0.8" />  {/* accent2 (indigo) */}
            <stop offset="80%" stopColor="#818CF8" stopOpacity="0.8" />  {/* accent2 (indigo) */}
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.8" /> {/* invest (green) */}
          </linearGradient>
        </defs>

        {/* 1. Connecting pathways */}
        <g fill="none" stroke="url(#pathGradient)" strokeWidth="1.5" strokeLinecap="round">
          {/* Background paths at lower opacity */}
          <path d={paths.left} opacity="0.15" />
          <path d={paths.middle} opacity="0.15" />
          <path d={paths.right} opacity="0.15" strokeDasharray="3 3" />
        </g>

        {/* 2. Animated particles flowing down */}
        <g filter="url(#particleGlow)">
          {/* Left path particles */}
          <circle r="3" className="fill-accent" opacity="0.95">
            <animateMotion dur="5.5s" repeatCount="indefinite" path={paths.left} begin="0s" />
          </circle>
          <circle r="3" className="fill-accent2" opacity="0.95">
            <animateMotion dur="5.5s" repeatCount="indefinite" path={paths.left} begin="2.75s" />
          </circle>

          {/* Middle path particles */}
          <circle r="3.2" className="fill-accent" opacity="0.95">
            <animateMotion dur="5s" repeatCount="indefinite" path={paths.middle} begin="1s" />
          </circle>
          <circle r="3.2" className="fill-accent2" opacity="0.95">
            <animateMotion dur="5s" repeatCount="indefinite" path={paths.middle} begin="3.5s" />
          </circle>

          {/* Right path particles */}
          <circle r="3" className="fill-accent2" opacity="0.95">
            <animateMotion dur="6s" repeatCount="indefinite" path={paths.right} begin="0.5s" />
          </circle>
          <circle r="3" className="fill-accent" opacity="0.95">
            <animateMotion dur="6s" repeatCount="indefinite" path={paths.right} begin="3.5s" />
          </circle>
        </g>

        {/* 3. Node blocks */}
        {/* Node 1: Company Input */}
        <g>
          <rect x="180" y="20" width="180" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="200" cy="40" r="3.5" className="fill-accent" />
          <text x="215" y="36" className="fill-slate-200 font-sans text-[13px] font-semibold">Company Input</text>
          <text x="215" y="49" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Target Entity</text>
        </g>

        {/* Parallel Node: News Research */}
        <g>
          <rect x="22" y="155" width="146" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="42" cy="175" r="3.5" className="fill-accent" />
          <text x="56" y="171" className="fill-slate-200 font-sans text-[13px] font-semibold">News Research</text>
          <text x="56" y="184" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Market Sentiment</text>
        </g>

        {/* Parallel Node: Financial Analysis */}
        <g>
          <rect x="197" y="155" width="146" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="217" cy="175" r="3.5" className="fill-accent2" />
          <text x="231" y="171" className="fill-slate-200 font-sans text-[13px] font-semibold">Financial Analysis</text>
          <text x="231" y="184" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">SEC Filings & Ratios</text>
        </g>

        {/* Parallel Node: Competitive Analysis */}
        <g>
          <rect x="372" y="155" width="146" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="392" cy="175" r="3.5" className="fill-accent" />
          <text x="406" y="171" className="fill-slate-200 font-sans text-[13px] font-semibold">Competitor Anal.</text>
          <text x="406" y="184" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Peer Benchmarking</text>
        </g>

        {/* Node 3: Structured Extraction */}
        <g>
          <rect x="170" y="290" width="200" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="190" cy="310" r="3.5" className="fill-accent2" />
          <text x="204" y="306" className="fill-slate-200 font-sans text-[13px] font-semibold">Structured Extraction</text>
          <text x="204" y="319" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Gemini JSON Schema</text>
        </g>

        {/* Node 4: AI Scoring */}
        <g>
          <rect x="170" y="365" width="200" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="190" cy="385" r="3.5" className="fill-accent" />
          <text x="204" y="381" className="fill-slate-200 font-sans text-[13px] font-semibold">AI Scoring</text>
          <text x="204" y="394" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Quantitative Eval</text>
        </g>

        {/* Node 5: AI Reviewer */}
        <g>
          <rect x="170" y="440" width="200" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="190" cy="460" r="3.5" className="fill-accent2" />
          <text x="204" y="456" className="fill-slate-200 font-sans text-[13px] font-semibold">AI Reviewer Node</text>
          <text x="204" y="469" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Bounded Revision Loop</text>
        </g>

        {/* Node 6: Investment Decision */}
        <g>
          <rect x="170" y="515" width="200" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="190" cy="535" r="3.5" className="fill-watch animate-pulse" />
          <text x="204" y="531" className="fill-slate-200 font-sans text-[13px] font-semibold">Investment Decision</text>
          <text x="204" y="544" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Invest / Watch / Pass</text>
        </g>

        {/* Node 7: Final Report */}
        <g>
          <rect x="170" y="590" width="200" height="40" rx="8" className="fill-[#0c1219] stroke-line" strokeWidth="1" />
          <circle cx="190" cy="610" r="3.5" className="fill-invest" />
          <text x="204" y="606" className="fill-slate-200 font-sans text-[13px] font-semibold">Final Report</text>
          <text x="204" y="619" className="fill-slate-500 font-mono text-[10px] uppercase tracking-wider font-semibold">Comprehensive Dossier</text>
        </g>
      </svg>
    </section>
  );
}
