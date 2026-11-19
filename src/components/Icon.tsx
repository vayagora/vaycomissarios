// Ícones Lucide (stroke 2px, 24×24), só os usados no portal.
const PATHS: Record<string, string[]> = {
  home: ["M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  award: ["M15.5 13 17 22l-5-3-5 3 1.5-9", "M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"],
  ticket: ["M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z", "M13 5v2M13 17v2M13 11v2"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6M16 13H8M16 17H8"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"],
  chart: ["M3 3v18h18", "M18 17V9M13 17V5M8 17v-3"],
  back: ["m15 18-6-6 6-6"],
  x: ["M18 6 6 18M6 6l12 12"],
  check: ["M20 6 9 17l-5-5"],
  gift: ["M20 12v10H4V12M2 7h20v5H2zM12 22V7", "M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"],
  trash: ["M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M10 11v6M14 11v6"],
  external: ["M15 3h6v6M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"],
  lounge: ["M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2"],
  bag: ["M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 20v2M14 20v2"],
  priority: ["M13 2 3 14h9l-1 8 10-12h-9z"],
  upgrade: ["m5 12 7-7 7 7M12 19V5"],
  seat: ["M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5M3 11h18v4H3zM5 15v5M19 15v5"],
  support: ["M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"],
  points: ["M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  star: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"],
};

export type IconKey = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconKey | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(PATHS[name] ?? PATHS.star).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
