// Silhuet dekoratif bertema wisuda (Graduation): topi toga, beruang, buku, ijazah, bunga, bintang.
// Murni hiasan latar: transparan tipis, tidak bisa diklik, disembunyikan dari pembaca layar dan saat cetak.

function Bear() {
  return (
    <svg viewBox="0 0 200 180" className="h-full w-full" fill="currentColor">
      <circle cx="48" cy="44" r="28" />
      <circle cx="152" cy="44" r="28" />
      <ellipse cx="100" cy="102" rx="82" ry="70" />
      <circle cx="48" cy="44" r="13" fill="var(--color-paper)" />
      <circle cx="152" cy="44" r="13" fill="var(--color-paper)" />
      <ellipse cx="66" cy="94" rx="19" ry="13" fill="var(--color-paper)" />
      <ellipse cx="134" cy="94" rx="19" ry="13" fill="var(--color-paper)" />
      <path d="M44 84 L86 80 L86 92 L44 96z" />
      <path d="M156 84 L114 80 L114 92 L156 96z" />
      <ellipse cx="100" cy="132" rx="34" ry="26" fill="var(--color-paper)" />
      <ellipse cx="100" cy="120" rx="12" ry="8" />
    </svg>
  );
}

function Mortarboard() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full" fill="currentColor">
      <polygon points="100,12 196,50 100,88 4,50" />
      <path d="M44 72 v32 c0 20 112 20 112 0 v-32 l-56 22z" />
      <rect x="176" y="52" width="4" height="52" />
      <path d="M170 104 h16 l-3 24 h-10z" />
    </svg>
  );
}

function Books() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" fill="currentColor">
      <rect x="14" y="102" width="172" height="34" rx="4" />
      <rect x="30" y="64" width="146" height="34" rx="4" />
      <rect x="10" y="26" width="154" height="34" rx="4" transform="rotate(-4 87 43)" />
      <rect x="30" y="112" width="140" height="4" fill="var(--color-paper)" />
      <rect x="44" y="74" width="120" height="4" fill="var(--color-paper)" />
      <rect x="26" y="36" width="110" height="4" fill="var(--color-paper)" transform="rotate(-4 87 43)" />
    </svg>
  );
}

function Diploma() {
  return (
    <svg viewBox="0 0 200 80" className="h-full w-full" fill="currentColor">
      <rect x="14" y="16" width="172" height="40" rx="20" />
      <rect x="24" y="24" width="152" height="3" fill="var(--color-paper)" />
      <rect x="24" y="45" width="152" height="3" fill="var(--color-paper)" />
      <path d="M92 52 h16 l8 24 l-16 -8 l-16 8z" />
    </svg>
  );
}

function Flower() {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="currentColor">
      {petals.map((deg) => (
        <ellipse key={deg} cx="50" cy="22" rx="11" ry="17" transform={`rotate(${deg} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="12" fill="var(--color-paper)" />
      <circle cx="50" cy="50" r="6" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
      <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" />
    </svg>
  );
}

const STARS = [
  { pos: "left-[12%] top-[18%] w-6", tone: "text-pine" },
  { pos: "left-[88%] top-[38%] w-8", tone: "text-ochre" },
  { pos: "left-[6%] top-[70%] w-5", tone: "text-ochre" },
  { pos: "left-[70%] top-[12%] w-5", tone: "text-pine" },
  { pos: "left-[94%] top-[80%] w-6", tone: "text-pine" },
  { pos: "left-[30%] top-[90%] w-7", tone: "text-ochre" },
  { pos: "left-[52%] top-[6%] w-4", tone: "text-ochre" },
  { pos: "left-[22%] top-[48%] w-4", tone: "text-pine" },
];

export default function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="decor pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden"
    >
      <div className="absolute -left-10 bottom-6 w-56 -rotate-6 text-pine md:-left-12 md:w-96">
        <Bear />
      </div>
      <div className="absolute right-[3%] top-24 w-36 rotate-12 text-ochre md:w-56">
        <Mortarboard />
      </div>
      <div className="absolute -right-8 bottom-12 w-44 -rotate-3 text-pine md:w-64">
        <Books />
      </div>
      <div className="absolute -left-8 top-[40%] hidden w-44 -rotate-[18deg] text-ochre md:block lg:w-48">
        <Diploma />
      </div>
      <div className="absolute right-[10%] top-[52%] hidden w-28 text-pine md:block lg:w-36">
        <Flower />
      </div>
      {STARS.map((s) => (
        <div key={s.pos} className={`absolute ${s.pos} ${s.tone}`}>
          <Sparkle />
        </div>
      ))}
    </div>
  );
}
