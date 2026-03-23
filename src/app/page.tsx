"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/header";
import { Button, Card, Stat } from "@/components/ui";

type ApiState = { loading: boolean; output: string; error: string };

const initialApiState: ApiState = { loading: false, output: "", error: "" };

export default function HomePage() {
  const [backgroundName, setBackgroundName] = useState("tee-design.png");
  const [bgState, setBgState] = useState<ApiState>(initialApiState);

  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(1200);
  const [factor, setFactor] = useState<2 | 4>(2);
  const [upscaleState, setUpscaleState] = useState<ApiState>(initialApiState);

  const [sourceFormat, setSourceFormat] = useState("png");
  const [colors, setColors] = useState(6);
  const [vectorState, setVectorState] = useState<ApiState>(initialApiState);

  const [theme, setTheme] = useState("spring collection");
  const [audience, setAudience] = useState("gyms and fitness studios");
  const [socialState, setSocialState] = useState<ApiState>(initialApiState);

  const [qty, setQty] = useState(48);
  const [printColors, setPrintColors] = useState(2);
  const [garmentCost, setGarmentCost] = useState(4.5);
  const quote = useMemo(() => {
    const setupFee = 20 * printColors;
    const printFee = qty * (2.25 + printColors * 0.45);
    const garment = qty * garmentCost;
    const subtotal = setupFee + printFee + garment;
    const margin = subtotal * 0.35;
    return Math.round((subtotal + margin) * 100) / 100;
  }, [qty, printColors, garmentCost]);

  const [pixelsWide, setPixelsWide] = useState(2400);
  const [pixelsTall, setPixelsTall] = useState(3000);
  const [inchesWide, setInchesWide] = useState(12);
  const [inchesTall, setInchesTall] = useState(15);
  const dpi = useMemo(() => {
    const w = pixelsWide / inchesWide;
    const h = pixelsTall / inchesTall;
    return Math.floor(Math.min(w, h));
  }, [pixelsWide, pixelsTall, inchesWide, inchesTall]);

  const fetchTool = async (
    path: string,
    payload: object,
    setter: (value: ApiState) => void,
    formatter: (data: unknown) => string,
  ) => {
    setter({ loading: true, output: "", error: "" });
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success: boolean; data?: unknown; error?: string };
      if (!res.ok || !json.success) {
        setter({ loading: false, output: "", error: json.error ?? "Request failed" });
        return;
      }
      setter({ loading: false, output: formatter(json.data), error: "" });
    } catch {
      setter({ loading: false, output: "", error: "Network error" });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active tools" value="8" />
          <Stat label="Recommended DPI" value="300+" />
          <Stat label="Avg. Quote Turnaround" value="< 2 min" />
          <Stat label="Deployment" value="GitHub -> Vercel" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card title="Background Removal" subtitle="Transparent PNG output for product-ready assets">
            <div className="space-y-3">
              <input value={backgroundName} onChange={(e) => setBackgroundName(e.target.value)} placeholder="design.png" />
              <Button
                onClick={() =>
                  fetchTool("/api/background-remove", { imageName: backgroundName }, setBgState, (data) => JSON.stringify(data, null, 2))
                }
              >
                {bgState.loading ? "Processing..." : "Remove Background"}
              </Button>
              {bgState.error ? <p className="text-sm text-rose-300">{bgState.error}</p> : null}
              {bgState.output ? <pre className="overflow-x-auto rounded-xl bg-slate-900/70 p-3 text-xs text-slate-200">{bgState.output}</pre> : null}
            </div>
          </Card>

          <Card title="Image Upscaler (No Alterations)" subtitle="Scale by factor while preserving visual style">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} placeholder="Width" />
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} placeholder="Height" />
              <select value={factor} onChange={(e) => setFactor(Number(e.target.value) as 2 | 4)}>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
              <Button
                onClick={() =>
                  fetchTool("/api/upscale", { width, height, factor }, setUpscaleState, (data) => JSON.stringify(data, null, 2))
                }
              >
                {upscaleState.loading ? "Processing..." : "Upscale"}
              </Button>
            </div>
            {upscaleState.error ? <p className="mt-3 text-sm text-rose-300">{upscaleState.error}</p> : null}
            {upscaleState.output ? <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900/70 p-3 text-xs text-slate-200">{upscaleState.output}</pre> : null}
          </Card>

          <Card title="Vector Converter" subtitle="Convert raster designs into SVG, PDF, and EPS">
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={sourceFormat} onChange={(e) => setSourceFormat(e.target.value)}>
                <option>png</option>
                <option>jpg</option>
                <option>webp</option>
                <option>bmp</option>
              </select>
              <input type="number" value={colors} min={1} max={12} onChange={(e) => setColors(Number(e.target.value))} placeholder="Color count" />
              <Button
                onClick={() =>
                  fetchTool("/api/vectorize", { sourceFormat, colors }, setVectorState, (data) => JSON.stringify(data, null, 2))
                }
              >
                {vectorState.loading ? "Processing..." : "Convert to Vector"}
              </Button>
            </div>
            {vectorState.error ? <p className="mt-3 text-sm text-rose-300">{vectorState.error}</p> : null}
            {vectorState.output ? <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900/70 p-3 text-xs text-slate-200">{vectorState.output}</pre> : null}
          </Card>

          <Card title="Social Post Generator" subtitle="Generate polished marketing copy and hashtags">
            <div className="space-y-3">
              <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme" />
              <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience" />
              <Button
                onClick={() =>
                  fetchTool("/api/social-generate", { theme, audience }, setSocialState, (data) => JSON.stringify(data, null, 2))
                }
              >
                {socialState.loading ? "Generating..." : "Generate Post"}
              </Button>
            </div>
            {socialState.error ? <p className="mt-3 text-sm text-rose-300">{socialState.error}</p> : null}
            {socialState.output ? <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900/70 p-3 text-xs text-slate-200">{socialState.output}</pre> : null}
          </Card>

          <Card title="Quote Calculator" subtitle="Fast pricing for orders and bulk runs">
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="Quantity" />
              <input type="number" value={printColors} onChange={(e) => setPrintColors(Number(e.target.value))} placeholder="Print colors" />
              <input type="number" step="0.1" value={garmentCost} onChange={(e) => setGarmentCost(Number(e.target.value))} placeholder="Garment cost" />
            </div>
            <p className="mt-4 text-sm text-slate-300">Estimated retail quote</p>
            <p className="text-3xl font-bold text-cyan-300">${quote.toLocaleString()}</p>
          </Card>

          <Card title="Print Readiness Checker" subtitle="Verify if artwork is safe for production">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" value={pixelsWide} onChange={(e) => setPixelsWide(Number(e.target.value))} placeholder="Pixels wide" />
              <input type="number" value={pixelsTall} onChange={(e) => setPixelsTall(Number(e.target.value))} placeholder="Pixels tall" />
              <input type="number" value={inchesWide} onChange={(e) => setInchesWide(Number(e.target.value))} placeholder="Inches wide" />
              <input type="number" value={inchesTall} onChange={(e) => setInchesTall(Number(e.target.value))} placeholder="Inches tall" />
            </div>
            <div className="mt-4 rounded-xl border border-slate-700/40 bg-slate-900/60 p-3">
              <p className="text-sm text-slate-400">Calculated minimum DPI</p>
              <p className={`text-2xl font-bold ${dpi >= 300 ? "text-emerald-300" : "text-amber-300"}`}>{dpi} DPI</p>
              <p className="mt-1 text-sm text-slate-300">{dpi >= 300 ? "Print-ready" : "Needs higher resolution for best results"}</p>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
