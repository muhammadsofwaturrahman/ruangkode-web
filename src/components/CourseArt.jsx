// Ilustrasi sampul kartu course bertema wisuda (topi toga, buku, ijazah, medali).
// Murni hiasan, aman dipakai di Server Component maupun Client Component.

const GRADIENTS = [
  "linear-gradient(135deg, #1f1147 0%, #a91079 100%)",
  "linear-gradient(135deg, #1c1040 0%, #6d28d9 100%)",
  "linear-gradient(135deg, #3b1054 0%, #d97706 100%)",
  "linear-gradient(135deg, #2e1a47 0%, #db2777 100%)",
];

function Mortarboard() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden="true">
      <polygon points="100,14 196,52 100,90 4,52" fill="#fbbf24" />
      <path d="M44 74 v32 c0 20 112 20 112 0 v-32 l-56 22z" fill="#fde68a" />
      <rect x="176" y="54" width="4" height="54" fill="#fbbf24" />
      <path d="M170 106 h16 l-3 26 h-10z" fill="#f59e0b" />
    </svg>
  );
}

function Books() {
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" aria-hidden="true">
      <rect x="14" y="102" width="172" height="34" rx="6" fill="#f9a8d4" />
      <rect x="30" y="64" width="146" height="34" rx="6" fill="#e9d5ff" />
      <rect x="10" y="26" width="154" height="34" rx="6" fill="#fde68a" transform="rotate(-4 87 43)" />
      <rect x="30" y="114" width="140" height="4" rx="2" fill="#a91079" />
      <rect x="44" y="76" width="120" height="4" rx="2" fill="#7c3aed" />
      <rect x="26" y="38" width="110" height="4" rx="2" fill="#d97706" transform="rotate(-4 87 43)" />
    </svg>
  );
}

function Diploma() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden="true">
      <rect x="14" y="20" width="172" height="52" rx="26" fill="#fdf4ff" />
      <rect x="30" y="34" width="140" height="4" rx="2" fill="#c084fc" />
      <rect x="30" y="52" width="140" height="4" rx="2" fill="#c084fc" />
      <circle cx="100" cy="72" r="14" fill="#f59e0b" />
      <path d="M90 82 h-4 l-6 26 l16 -9 l16 9 l-6 -26 h-4z" fill="#a91079" />
    </svg>
  );
}

function Medal() {
  return (
    <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
      <path d="M52 8 h26 l16 52 h-26z" fill="#f806cc" />
      <path d="M108 8 h-26 l-16 52 h26z" fill="#a91079" />
      <circle cx="80" cy="104" r="44" fill="#fbbf24" />
      <circle cx="80" cy="104" r="34" fill="#f59e0b" />
      <path d="M80 80 l7 15 l16 2 l-12 11 l3 16 l-14 -8 l-14 8 l3 -16 l-12 -11 l16 -2z" fill="#fffbeb" />
    </svg>
  );
}

const ICONS = [Mortarboard, Books, Diploma, Medal];

export default function CourseArt({ seed = 0, className = "" }) {
  const index = Math.abs(Number(seed) || 0) % ICONS.length;
  const Icon = ICONS[index];

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden ${className}`}
      style={{ background: GRADIENTS[index] }}
    >
      <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-black/20 blur-2xl" />
      <svg viewBox="0 0 24 24" className="absolute left-[12%] top-[18%] w-4 text-white/70" fill="currentColor">
        <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" />
      </svg>
      <svg viewBox="0 0 24 24" className="absolute bottom-[18%] right-[14%] w-3 text-amber-200/80" fill="currentColor">
        <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[58%] w-[46%] drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105">
          <Icon />
        </div>
      </div>
    </div>
  );
}
