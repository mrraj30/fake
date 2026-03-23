/* src/composables/LoadSVG.ts */
const parser = new DOMParser();

/**
 * Parses a raw SVG string into an SVGSVGElement.
 * @param rawSvg - The SVG content as a string.
 */
export const parseSVG = (rawSvg: string): SVGSVGElement => {
    const svgDoc = parser.parseFromString(rawSvg, "image/svg+xml");
    const errorNode = svgDoc.querySelector('parsererror');
    if (errorNode) throw new Error("Failed to parse SVG string");
    
    return svgDoc.documentElement as unknown as SVGSVGElement;
};
