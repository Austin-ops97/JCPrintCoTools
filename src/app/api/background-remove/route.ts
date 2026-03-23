import { NextResponse } from "next/server";
import sharp from "sharp";

function getCornerAverage(
  pixels: Uint8Array,
  width: number,
  height: number,
  channels: number,
): { r: number; g: number; b: number } {
  const sampleSize = Math.max(8, Math.floor(Math.min(width, height) * 0.08));
  const corners = [
    { x0: 0, y0: 0 },
    { x0: width - sampleSize, y0: 0 },
    { x0: 0, y0: height - sampleSize },
    { x0: width - sampleSize, y0: height - sampleSize },
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const corner of corners) {
    for (let y = corner.y0; y < corner.y0 + sampleSize; y++) {
      for (let x = corner.x0; x < corner.x0 + sampleSize; x++) {
        const i = (y * width + x) * channels;
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count += 1;
      }
    }
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function colorDistance(r: number, g: number, b: number, br: number, bg: number, bb: number): number {
  const dr = r - br;
  const dg = g - bg;
  const db = b - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function hasBackgroundNeighbor(mask: Uint8Array, x: number, y: number, width: number, height: number): boolean {
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (ox === 0 && oy === 0) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (mask[ny * width + nx] === 1) return true;
    }
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const baseMeta = await sharp(inputBuffer).rotate().metadata();
    const originalWidth = baseMeta.width ?? 0;
    const originalHeight = baseMeta.height ?? 0;
    if (originalWidth <= 0 || originalHeight <= 0) {
      return NextResponse.json({ success: false, error: "Invalid source image." }, { status: 400 });
    }
    const maxSide = Math.max(originalWidth, originalHeight);
    const supersample = maxSide <= 900 ? 3 : maxSide <= 1800 ? 2 : 1;
    const workWidth = originalWidth * supersample;
    const workHeight = originalHeight * supersample;

    const { data, info } = await sharp(inputBuffer)
      .rotate()
      .ensureAlpha()
      .resize(workWidth, workHeight, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    const total = width * height;

    const bg = getCornerAverage(data, width, height, channels);
    const distanceMap = new Float32Array(total);

    for (let i = 0; i < total; i++) {
      const p = i * channels;
      distanceMap[i] = colorDistance(data[p], data[p + 1], data[p + 2], bg.r, bg.g, bg.b);
    }

    // Border-connected flood fill avoids eating interior whites.
    const seedThreshold = 22;
    const growThreshold = 56;
    const backgroundMask = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;

    const enqueue = (idx: number) => {
      if (backgroundMask[idx] === 1 || distanceMap[idx] > growThreshold) return;
      backgroundMask[idx] = 1;
      queue[tail++] = idx;
    };

    for (let x = 0; x < width; x++) {
      const top = x;
      const bottom = (height - 1) * width + x;
      if (distanceMap[top] <= seedThreshold) enqueue(top);
      if (distanceMap[bottom] <= seedThreshold) enqueue(bottom);
    }
    for (let y = 0; y < height; y++) {
      const left = y * width;
      const right = y * width + (width - 1);
      if (distanceMap[left] <= seedThreshold) enqueue(left);
      if (distanceMap[right] <= seedThreshold) enqueue(right);
    }

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = Math.floor(idx / width);
      if (x > 0) enqueue(idx - 1);
      if (x < width - 1) enqueue(idx + 1);
      if (y > 0) enqueue(idx - width);
      if (y < height - 1) enqueue(idx + width);
    }

    const alphaFloat = new Float32Array(total);

    // Build a soft alpha edge and decontaminate bright fringe colors.
    for (let i = 0; i < total; i++) {
      const p = i * channels;
      if (backgroundMask[i] === 1) {
        data[p + 3] = 0;
        alphaFloat[i] = 0;
        continue;
      }

      const x = i % width;
      const y = Math.floor(i / width);
      const nearEdge = hasBackgroundNeighbor(backgroundMask, x, y, width, height);
      const distance = distanceMap[i];

      let alpha = 255;
      if (nearEdge || distance < 92) {
        const t = Math.min(1, Math.max(0, (distance - 18) / (92 - 18)));
        alpha = Math.round(255 * smoothstep(t));
      }

      if (alpha < 255) {
        const a = Math.max(alpha / 255, 0.04);
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const cleanR = Math.max(0, Math.min(255, (r - bg.r * (1 - a)) / a));
        const cleanG = Math.max(0, Math.min(255, (g - bg.g * (1 - a)) / a));
        const cleanB = Math.max(0, Math.min(255, (b - bg.b * (1 - a)) / a));
        data[p] = Math.round(cleanR);
        data[p + 1] = Math.round(cleanG);
        data[p + 2] = Math.round(cleanB);
      }

      const af = clamp01(alpha / 255);
      alphaFloat[i] = af;
      data[p + 3] = Math.round(af * 255);
    }

    // Edge-only alpha smoothing then re-sharpen matte for crisp but anti-aliased lines.
    const alphaCopy = new Float32Array(alphaFloat);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (backgroundMask[idx] === 1) continue;
        if (!hasBackgroundNeighbor(backgroundMask, x, y, width, height)) continue;
        let weighted = 0;
        let weightSum = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const n = (y + oy) * width + (x + ox);
            const w = ox === 0 && oy === 0 ? 4 : ox === 0 || oy === 0 ? 2 : 1;
            weighted += alphaCopy[n] * w;
            weightSum += w;
          }
        }
        alphaFloat[idx] = weighted / weightSum;
      }
    }

    // Matte shaping: suppress tiny halos, keep crisp high-confidence foreground.
    for (let i = 0; i < total; i++) {
      let a = alphaFloat[i];
      if (a < 0.03) a = 0;
      else if (a > 0.985) a = 1;
      else {
        // Increase edge contrast while preserving anti-alias transitions.
        const t = clamp01((a - 0.06) / 0.9);
        a = smoothstep(t);
      }
      alphaFloat[i] = a;
      data[i * channels + 3] = Math.round(a * 255);
    }

    let output = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .png()
      .toBuffer();
    if (supersample > 1) {
      output = await sharp(output)
        .resize(originalWidth, originalHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
    }
    const base64 = output.toString("base64");
    const fileName = file.name.replace(/\.[^/.]+$/, "");

    return NextResponse.json({
      success: true,
      data: {
        fileName: `${fileName}-transparent.png`,
        mimeType: "image/png",
        dataUrl: `data:image/png;base64,${base64}`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not process image. Try a PNG or JPG file." },
      { status: 400 },
    );
  }
}
