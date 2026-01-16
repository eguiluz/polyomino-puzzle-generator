/**
 * Utility functions for calculating base shape coordinates
 */

export interface Point {
    x: number
    y: number
}

/**
 * Calculates hexagon points for a flat-top orientation
 */
export function calculateHexagonPoints(centerX: number, centerY: number, radius: number): Point[] {
    const points: Point[] = []
    // Flat-top orientation: lados horizontales arriba y abajo
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        })
    }
    return points
}

/**
 * Formats points array for SVG polygon
 */
export function formatPointsForSVG(points: Point[]): string {
    return points.map((p) => `${p.x},${p.y}`).join(" ")
}

/**
 * Calculates base shape dimensions
 */
export function calculateBaseDimensions(gridWidth: number, gridHeight: number, cellSize: number, basePadding: number) {
    return {
        baseWidth: (gridWidth + basePadding * 2) * cellSize,
        baseHeight: (gridHeight + basePadding * 2) * cellSize,
        baseCenterX: (gridWidth * cellSize) / 2,
        baseCenterY: (gridHeight * cellSize) / 2,
    }
}
