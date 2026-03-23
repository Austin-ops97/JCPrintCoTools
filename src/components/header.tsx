export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/15 bg-black/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Production Suite</p>
          <h1 className="text-lg font-semibold text-white sm:text-xl">JC Print Co Tools</h1>
        </div>
        <span className="rounded-full border border-white/30 bg-white/5 px-3 py-1 text-xs text-white">Vercel Ready</span>
      </div>
    </header>
  );
}
