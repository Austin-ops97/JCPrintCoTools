"use client";

import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/header";
import { Button, Card, Stat } from "@/components/ui";

type ImageToolResult = {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  upscaledWidth?: number;
  upscaledHeight?: number;
  colorCount?: number;
};

type ApiState = {
  loading: boolean;
  error: string;
  result: ImageToolResult | null;
};

const initialApiState: ApiState = { loading: false, error: "", result: null };

export default function HomePage() {
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [bgState, setBgState] = useState<ApiState>(initialApiState);

  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [factor, setFactor] = useState<2 | 4>(2);
  const [upscaleState, setUpscaleState] = useState<ApiState>(initialApiState);

  const [vectorFile, setVectorFile] = useState<File | null>(null);
  const [colors, setColors] = useState(6);
  const [vectorState, setVectorState] = useState<ApiState>(initialApiState);

  const [grayscaleFile, setGrayscaleFile] = useState<File | null>(null);
  const [grayscaleState, setGrayscaleState] = useState<ApiState>(initialApiState);

  const [colorFile, setColorFile] = useState<File | null>(null);
  const [pickedHex, setPickedHex] = useState<string>("");
  const [pickedPoint, setPickedPoint] = useState<{ x: number; y: number } | null>(null);
  const [pickedColors, setPickedColors] = useState<string[]>([]);
  const colorCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const runImageTool = async (
    path: string,
    payload: FormData,
    setter: (value: ApiState) => void,
  ) => {
    setter({ loading: true, result: null, error: "" });
    try {
      const res = await fetch(path, {
        method: "POST",
        body: payload,
      });
      const json = (await res.json()) as { success: boolean; data?: ImageToolResult; error?: string };
      if (!res.ok || !json.success) {
        setter({ loading: false, result: null, error: json.error ?? "Request failed" });
        return;
      }
      setter({ loading: false, result: json.data ?? null, error: "" });
    } catch {
      setter({ loading: false, result: null, error: "Network error" });
    }
  };

  const backgroundPreview = useMemo(
    () => (backgroundFile ? URL.createObjectURL(backgroundFile) : ""),
    [backgroundFile],
  );
  const upscalePreview = useMemo(
    () => (upscaleFile ? URL.createObjectURL(upscaleFile) : ""),
    [upscaleFile],
  );
  const vectorPreview = useMemo(() => (vectorFile ? URL.createObjectURL(vectorFile) : ""), [vectorFile]);
  const grayscalePreview = useMemo(
    () => (grayscaleFile ? URL.createObjectURL(grayscaleFile) : ""),
    [grayscaleFile],
  );
  const colorPreview = useMemo(() => (colorFile ? URL.createObjectURL(colorFile) : ""), [colorFile]);

  useEffect(() => {
    return () => {
      if (backgroundPreview) {
        URL.revokeObjectURL(backgroundPreview);
      }
    };
  }, [backgroundPreview]);

  useEffect(() => {
    return () => {
      if (upscalePreview) {
        URL.revokeObjectURL(upscalePreview);
      }
    };
  }, [upscalePreview]);

  useEffect(() => {
    return () => {
      if (vectorPreview) {
        URL.revokeObjectURL(vectorPreview);
      }
    };
  }, [vectorPreview]);

  useEffect(() => {
    return () => {
      if (grayscalePreview) {
        URL.revokeObjectURL(grayscalePreview);
      }
    };
  }, [grayscalePreview]);

  useEffect(() => {
    return () => {
      if (colorPreview) {
        URL.revokeObjectURL(colorPreview);
      }
    };
  }, [colorPreview]);

  useEffect(() => {
    if (!colorPreview || !colorCanvasRef.current) {
      return;
    }
    const canvas = colorCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, img.width, img.height);
    };
    img.src = colorPreview;
  }, [colorPreview]);

  const handleColorPick = (event: MouseEvent<HTMLImageElement>) => {
    if (!colorCanvasRef.current) return;
    const canvas = colorCanvasRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
    const ctx = canvas.getContext("2d");
    if (!ctx || x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const toHex = (value: number) => value.toString(16).padStart(2, "0");
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    setPickedHex(hex);
    setPickedPoint({ x, y });
    setPickedColors((current) => [hex, ...current.filter((c) => c !== hex)].slice(0, 6));
  };

  const downloadLabel = (result: ImageToolResult | null) => (result ? `Download ${result.fileName}` : "Download");
  const previewClassName = "h-40 w-full rounded-lg border border-white/15 object-contain bg-black p-2 sm:h-48";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-10">
        <section className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active tools" value="7" />
          <Stat label="Recommended DPI" value="300+" />
          <Stat label="Media workflow" value="Upload > Process > Download" />
          <Stat label="Deployment" value="GitHub -> Vercel" />
        </section>

        <section className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <Card title="Background Removal" subtitle="Upload an image and export transparent PNG">
            <div className="space-y-3">
              <input type="file" accept="image/*" onChange={(e) => setBackgroundFile(e.target.files?.[0] ?? null)} />
              <Button
                onClick={() => {
                  if (!backgroundFile) {
                    setBgState({ loading: false, result: null, error: "Please upload an image first." });
                    return;
                  }
                  const formData = new FormData();
                  formData.append("file", backgroundFile);
                  void runImageTool("/api/background-remove", formData, setBgState);
                }}
              >
                {bgState.loading ? "Processing..." : "Remove Background"}
              </Button>
              {bgState.error ? <p className="text-sm text-red-300">{bgState.error}</p> : null}
              <p className="text-xs text-neutral-400">
                Improved matte: adaptive background sampling, soft alpha ramp, anti-fringe edge cleanup.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {backgroundPreview ? <img src={backgroundPreview} alt="Original upload" className={previewClassName} /> : null}
                {bgState.result ? <img src={bgState.result.dataUrl} alt="Background removed result" className={previewClassName} /> : null}
              </div>
              {bgState.result ? (
                <a className="inline-block text-sm underline" href={bgState.result.dataUrl} download={bgState.result.fileName}>
                  {downloadLabel(bgState.result)}
                </a>
              ) : null}
            </div>
          </Card>

          <Card title="Image Upscaler" subtitle="Upload image, upscale 2x/4x, then download">
            <div className="grid gap-3">
              <input type="file" accept="image/*" onChange={(e) => setUpscaleFile(e.target.files?.[0] ?? null)} />
              <select value={factor} onChange={(e) => setFactor(Number(e.target.value) as 2 | 4)}>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
              <Button
                onClick={() => {
                  if (!upscaleFile) {
                    setUpscaleState({ loading: false, result: null, error: "Please upload an image first." });
                    return;
                  }
                  const formData = new FormData();
                  formData.append("file", upscaleFile);
                  formData.append("factor", String(factor));
                  void runImageTool("/api/upscale", formData, setUpscaleState);
                }}
              >
                {upscaleState.loading ? "Processing..." : "Upscale"}
              </Button>
            </div>
            {upscaleState.error ? <p className="mt-3 text-sm text-red-300">{upscaleState.error}</p> : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {upscalePreview ? <img src={upscalePreview} alt="Original upload" className={previewClassName} /> : null}
              {upscaleState.result ? <img src={upscaleState.result.dataUrl} alt="Upscaled result" className={previewClassName} /> : null}
            </div>
            {upscaleState.result ? (
              <div className="mt-2 space-y-1 text-sm text-neutral-300">
                <p>
                  Output: {upscaleState.result.upscaledWidth} x {upscaleState.result.upscaledHeight}
                </p>
                <a className="inline-block underline" href={upscaleState.result.dataUrl} download={upscaleState.result.fileName}>
                  {downloadLabel(upscaleState.result)}
                </a>
              </div>
            ) : null}
          </Card>

          <Card title="Vector Converter" subtitle="Lossless SVG wrapper keeps source quality unchanged">
            <div className="grid gap-3">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/bmp" onChange={(e) => setVectorFile(e.target.files?.[0] ?? null)} />
              <input type="number" value={colors} min={1} max={12} onChange={(e) => setColors(Number(e.target.value))} placeholder="Color count" />
              <Button
                onClick={() => {
                  if (!vectorFile) {
                    setVectorState({ loading: false, result: null, error: "Please upload an image first." });
                    return;
                  }
                  const formData = new FormData();
                  formData.append("file", vectorFile);
                  formData.append("colors", String(colors));
                  void runImageTool("/api/vectorize", formData, setVectorState);
                }}
              >
                {vectorState.loading ? "Processing..." : "Convert to Vector"}
              </Button>
            </div>
            {vectorState.error ? <p className="mt-3 text-sm text-red-300">{vectorState.error}</p> : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {vectorPreview ? <img src={vectorPreview} alt="Original upload" className={previewClassName} /> : null}
              {vectorState.result ? <img src={vectorState.result.dataUrl} alt="Vector result preview" className="h-40 w-full rounded-lg border border-white/15 object-contain bg-white p-2 sm:h-48" /> : null}
            </div>
            {vectorState.result ? (
              <div className="mt-2 space-y-1 text-sm text-neutral-300">
                <p>Color count target: {vectorState.result.colorCount}</p>
                <a className="inline-block underline" href={vectorState.result.dataUrl} download={vectorState.result.fileName}>
                  {downloadLabel(vectorState.result)}
                </a>
              </div>
            ) : null}
          </Card>

          <Card title="Grayscale Logo" subtitle="Remove all color and export clean grayscale PNG">
            <div className="grid gap-3">
              <input type="file" accept="image/*" onChange={(e) => setGrayscaleFile(e.target.files?.[0] ?? null)} />
              <Button
                onClick={() => {
                  if (!grayscaleFile) {
                    setGrayscaleState({ loading: false, result: null, error: "Please upload an image first." });
                    return;
                  }
                  const formData = new FormData();
                  formData.append("file", grayscaleFile);
                  void runImageTool("/api/grayscale", formData, setGrayscaleState);
                }}
              >
                {grayscaleState.loading ? "Processing..." : "Convert to Grayscale"}
              </Button>
            </div>
            {grayscaleState.error ? <p className="mt-3 text-sm text-red-300">{grayscaleState.error}</p> : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {grayscalePreview ? <img src={grayscalePreview} alt="Original upload" className={previewClassName} /> : null}
              {grayscaleState.result ? <img src={grayscaleState.result.dataUrl} alt="Grayscale result" className={previewClassName} /> : null}
            </div>
            {grayscaleState.result ? (
              <a className="mt-2 inline-block text-sm underline" href={grayscaleState.result.dataUrl} download={grayscaleState.result.fileName}>
                {downloadLabel(grayscaleState.result)}
              </a>
            ) : null}
          </Card>

          <Card title="HEX Color Extractor" subtitle="Upload an image and click any pixel to get exact HEX">
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setColorFile(e.target.files?.[0] ?? null);
                  setPickedHex("");
                  setPickedPoint(null);
                }}
              />
              <canvas ref={colorCanvasRef} className="hidden" />
              {colorPreview ? (
                <img
                  src={colorPreview}
                  alt="Color picker source"
                  onClick={handleColorPick}
                  className="h-48 w-full rounded-lg border border-white/15 object-contain bg-black p-2 sm:h-56"
                />
              ) : null}
              <p className="text-xs text-neutral-400">Tap/click the image to sample a precise color.</p>
            </div>
            {pickedHex ? (
              <div className="mt-3 space-y-2 text-sm text-neutral-200">
                <p>
                  Selected: <span className="font-semibold text-white">{pickedHex}</span>
                  {pickedPoint ? ` at (${pickedPoint.x}, ${pickedPoint.y})` : ""}
                </p>
                <div className="h-8 w-24 rounded border border-white/20" style={{ backgroundColor: pickedHex }} />
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => {
                    void navigator.clipboard.writeText(pickedHex);
                  }}
                >
                  Copy HEX code
                </button>
                <div className="flex flex-wrap gap-2 pt-1">
                  {pickedColors.map((hex) => (
                    <span
                      key={hex}
                      className="rounded border border-white/20 px-2 py-1 text-xs"
                      style={{ backgroundColor: `${hex}22` }}
                    >
                      {hex}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <Card title="Quote Calculator" subtitle="Fast pricing for orders and bulk runs">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">Quantity</span>
                <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="Example: 48 shirts" />
                <span className="block text-xs text-neutral-500">How many total shirts are in the order.</span>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">Print Colors</span>
                <input type="number" min={1} value={printColors} onChange={(e) => setPrintColors(Number(e.target.value))} placeholder="Example: 2 colors" />
                <span className="block text-xs text-neutral-500">Number of ink colors in the artwork.</span>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">Garment Cost</span>
                <input type="number" min={0} step="0.1" value={garmentCost} onChange={(e) => setGarmentCost(Number(e.target.value))} placeholder="Example: 4.50" />
                <span className="block text-xs text-neutral-500">Your blank shirt cost per piece in USD.</span>
              </label>
            </div>
            <p className="mt-4 text-sm text-neutral-300">Estimated customer quote (includes margin)</p>
            <p className="text-3xl font-bold text-white">${quote.toLocaleString()}</p>
          </Card>

          <Card title="Print Readiness Checker" subtitle="Verify if artwork is safe for production">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" value={pixelsWide} onChange={(e) => setPixelsWide(Number(e.target.value))} placeholder="Pixels wide" />
              <input type="number" value={pixelsTall} onChange={(e) => setPixelsTall(Number(e.target.value))} placeholder="Pixels tall" />
              <input type="number" value={inchesWide} onChange={(e) => setInchesWide(Number(e.target.value))} placeholder="Inches wide" />
              <input type="number" value={inchesTall} onChange={(e) => setInchesTall(Number(e.target.value))} placeholder="Inches tall" />
            </div>
            <div className="mt-4 rounded-xl border border-white/15 bg-black p-3">
              <p className="text-sm text-neutral-400">Calculated minimum DPI</p>
              <p className="text-2xl font-bold text-white">{dpi} DPI</p>
              <p className="mt-1 text-sm text-neutral-300">{dpi >= 300 ? "Print-ready" : "Needs higher resolution for best results"}</p>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
