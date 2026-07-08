export default function Logo() {
  return (
    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel2">
      <svg
        viewBox="0 0 36 36"
        role="img"
        aria-label="Analyst logo"
        className="h-6 w-6"
        fill="none"
      >
        <path
          d="M8 27L17.5 8.5L28 27"
          className="stroke-accent"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 22H23"
          className="stroke-accent2"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M21.5 10.5L27.5 10.5"
          className="stroke-accent2"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
