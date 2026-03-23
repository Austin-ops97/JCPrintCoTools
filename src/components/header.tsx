export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Production Suite</p>
          <h1 className="text-lg font-semibold text-slate-100 sm:text-xl">JC Print Co Tools</h1>
        </div>
        <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Vercel Ready</span>
      </div>
    </header>
  );
}
