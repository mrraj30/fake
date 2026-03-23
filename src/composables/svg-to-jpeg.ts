/**
 * @file src/composables/svg-to-jpeg.ts
 * @description Utility to convert SVG elements to high-resolution (300 DPI) JPEG images 
 * with support for standard paper sizes (A4, A5, A6), custom margins, and vertical alignment.
 */

import { ref } from 'vue';

export type PaperSize = "auto" | "a4" | "a5" | "a6";
export type VerticalAlign = "top" | "middle" | "bottom";

const PAPER_DIMENSIONS: Record<Exclude<PaperSize, "auto">, { w: number; h: number }> = {
    a4: { w: 2480, h: 3508 },
    a5: { w: 1748, h: 2480 },
    a6: { w: 1240, h: 1748 },
};

export function useSvgToJpeg() {
    const isExporting = ref(false);
    const error = ref<string | null>(null);

    const exportSvg = async (
        containerId: string,
        paperSize: PaperSize = "auto",
        quality: number = 0.9,
        margin: number = 50, // Margin in pixels
        align: VerticalAlign = "top"
    ) => {
        isExporting.value = true;
        error.value = null;

        try {
            const container = document.getElementById(containerId);
            const svg = container?.querySelector("svg");

            if (!svg) throw new Error(`SVG not found in #${containerId}`);

            // 1. Setup Canvas Dimensions
            const svgW = svg.clientWidth || 200;
            const svgH = svg.clientHeight || 200;
            const targetW = paperSize === "auto" ? svgW + (margin * 2) : PAPER_DIMENSIONS[paperSize].w;
            const targetH = paperSize === "auto" ? svgH + (margin * 2) : PAPER_DIMENSIONS[paperSize].h;

            // 2. Prepare Image
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("Failed to render SVG to Image"));
                img.src = url;
            });

            await loadPromise;

            // 3. Render to Canvas
            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");

            if (!ctx) throw new Error("Canvas context failed");

            // White background for JPEG
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, targetW, targetH);

            // 4. Scaling Logic with Margins
            const drawableW = targetW - (margin * 2);
            const drawableH = targetH - (margin * 2);

            const scale = Math.min(drawableW / svgW, drawableH / svgH);
            const finalW = svgW * scale;
            const finalH = svgH * scale;

            // Center horizontally
            const x = (targetW - finalW) / 2;

            // Calculate vertical position based on align prop
            let y: number;
            if (align === "top") {
                y = margin;
            } else if (align === "bottom") {
                y = targetH - margin - finalH;
            } else { // "middle"
                y = (targetH - finalH) / 2;
            }

            ctx.drawImage(img, x, y, finalW, finalH);

            // 5. Download
            const link = document.createElement("a");
            link.download = `export-${paperSize}-${Date.now()}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", quality);
            link.click();

            URL.revokeObjectURL(url);
        } catch (e) {
            error.value = e instanceof Error ? e.message : "Unknown error";
            console.error("[useSvgToJpeg]", e);
        } finally {
            isExporting.value = false;
        }
    };

    return {
        exportSvg,
        isExporting,
        error
    };
}
