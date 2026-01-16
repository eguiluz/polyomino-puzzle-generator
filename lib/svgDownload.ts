/**
 * Utility functions for downloading SVG files
 */

/**
 * Downloads an SVG string as a file
 */
export function downloadSVGFile(svgContent: string, filename: string): void {
    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Generates a filename for a polyomino puzzle SVG
 */
export function generatePuzzleFilename(width: number, height: number): string {
    return `polyomino-puzzle-${width}x${height}.svg`
}
