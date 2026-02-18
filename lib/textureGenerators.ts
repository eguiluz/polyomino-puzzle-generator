// Texture generation for polyomino pieces
//
// Instead of generating raw SVG path data and relying on <clipPath>, each
// generator now produces an array of line segments (Seg[]) or polylines.
// The main `generateTexture` function clips them geometrically against the
// piece polygon so the resulting SVG paths are already trimmed.

import {
    type Seg,
    type Point,
    type Polygon,
    cellsToPolygon,
    clipSegmentToPolygon,
    clipPolylineToPolygon,
    clipClosedShapeToPolygon,
    segsToPathData,
    rotatePoint,
    rotateSeg,
    pointInPolygon,
} from "./geometryClipping"

// ---------------------------------------------------------------------------
// Internal helpers – texture generators now return raw Seg[]
// ---------------------------------------------------------------------------

type RawSegGenerator = (
    x0: number,
    y0: number,
    width: number,
    height: number,
    spacing: number,
) => Seg[]

function generateLinesHSegs(x0: number, y0: number, width: number, height: number, spacing: number): Seg[] {
    const segs: Seg[] = []
    for (let y = spacing; y < height; y += spacing) {
        segs.push({ x1: x0, y1: y0 + y, x2: x0 + width, y2: y0 + y })
    }
    return segs
}

function generateLinesVSegs(x0: number, y0: number, width: number, height: number, spacing: number): Seg[] {
    const segs: Seg[] = []
    for (let x = spacing; x < width; x += spacing) {
        segs.push({ x1: x0 + x, y1: y0, x2: x0 + x, y2: y0 + height })
    }
    return segs
}

function generateLinesDiagSegs(x0: number, y0: number, width: number, height: number, spacing: number): Seg[] {
    const segs: Seg[] = []
    const diagonalSpacing = spacing * 1.414
    for (let offset = -height; offset < width + height; offset += diagonalSpacing) {
        segs.push({ x1: x0 + offset, y1: y0, x2: x0 + offset + height, y2: y0 + height })
    }
    return segs
}

function generateGridSegs(x0: number, y0: number, width: number, height: number, spacing: number): Seg[] {
    const segs: Seg[] = []
    for (let y = spacing; y < height; y += spacing) {
        segs.push({ x1: x0, y1: y0 + y, x2: x0 + width, y2: y0 + y })
    }
    for (let x = spacing; x < width; x += spacing) {
        segs.push({ x1: x0 + x, y1: y0, x2: x0 + x, y2: y0 + height })
    }
    return segs
}

function generateDotsSegs(x0: number, y0: number, width: number, height: number, spacing: number): { segs: Seg[]; centers: Point[] } {
    // Dots are small circles; we approximate each as a polygon of segments.
    const dotRadius = 0.3
    const numSides = 8
    const segs: Seg[] = []
    const centers: Point[] = []
    for (let y = spacing; y < height; y += spacing) {
        for (let x = spacing; x < width; x += spacing) {
            const cx = x0 + x
            const cy = y0 + y
            centers.push({ x: cx, y: cy })
            for (let i = 0; i < numSides; i++) {
                const a1 = (2 * Math.PI * i) / numSides
                const a2 = (2 * Math.PI * (i + 1)) / numSides
                segs.push({
                    x1: cx + dotRadius * Math.cos(a1),
                    y1: cy + dotRadius * Math.sin(a1),
                    x2: cx + dotRadius * Math.cos(a2),
                    y2: cy + dotRadius * Math.sin(a2),
                })
            }
        }
    }
    return { segs, centers }
}

/** Waves: generate as polylines (sequence of points per row). */
function generateWavesPolylines(
    x0: number,
    y0: number,
    width: number,
    height: number,
    spacing: number,
): Point[][] {
    const amplitude = spacing * 0.4
    const wavelength = spacing * 2
    const polylines: Point[][] = []
    for (let y = spacing; y < height; y += spacing * 1.5) {
        const pts: Point[] = []
        for (let x = 0; x <= width; x += wavelength / 4) {
            const phase = (x / wavelength) * Math.PI * 2
            const waveY = Math.sin(phase) * amplitude
            pts.push({ x: x0 + x, y: y0 + y + waveY })
        }
        polylines.push(pts)
    }
    return polylines
}

function generateCirclesSegs(x0: number, y0: number, width: number, height: number, spacing: number): { segs: Seg[]; centers: Point[] } {
    const circleRadius = spacing * 0.8
    const numSides = 24
    const segs: Seg[] = []
    const centers: Point[] = []
    for (let y = spacing * 1.5; y < height; y += spacing * 2) {
        for (let x = spacing * 1.5; x < width; x += spacing * 2) {
            const cx = x0 + x
            const cy = y0 + y
            centers.push({ x: cx, y: cy })
            for (let i = 0; i < numSides; i++) {
                const a1 = (2 * Math.PI * i) / numSides
                const a2 = (2 * Math.PI * (i + 1)) / numSides
                segs.push({
                    x1: cx + circleRadius * Math.cos(a1),
                    y1: cy + circleRadius * Math.sin(a1),
                    x2: cx + circleRadius * Math.cos(a2),
                    y2: cy + circleRadius * Math.sin(a2),
                })
            }
        }
    }
    return { segs, centers }
}

/** Zigzag: generate as polylines. */
function generateZigzagPolylines(
    x0: number,
    y0: number,
    width: number,
    height: number,
    spacing: number,
): Point[][] {
    const zigHeight = spacing * 0.6
    const polylines: Point[][] = []
    for (let y = spacing; y < height; y += spacing * 1.5) {
        const pts: Point[] = [{ x: x0, y: y0 + y }]
        for (let x = 0; x <= width; x += spacing) {
            const zOffset = Math.floor(x / spacing) % 2 === 0 ? zigHeight : -zigHeight
            pts.push({ x: x0 + x, y: y0 + y + zOffset })
        }
        polylines.push(pts)
    }
    return polylines
}

function generateCrossSegs(x0: number, y0: number, width: number, height: number, spacing: number): Seg[] {
    const crossSize = spacing * 0.6
    const segs: Seg[] = []
    for (let y = spacing * 1.5; y < height; y += spacing * 2) {
        for (let x = spacing * 1.5; x < width; x += spacing * 2) {
            segs.push({ x1: x0 + x - crossSize, y1: y0 + y - crossSize, x2: x0 + x + crossSize, y2: y0 + y + crossSize })
            segs.push({ x1: x0 + x + crossSize, y1: y0 + y - crossSize, x2: x0 + x - crossSize, y2: y0 + y + crossSize })
        }
    }
    return segs
}

function generateHexagonSegs(x0: number, y0: number, width: number, height: number, spacing: number): { segs: Seg[]; centers: Point[] } {
    const hexRadius = spacing * 0.8
    const hexHeight = hexRadius * Math.sqrt(3)
    const hexSpacingX = hexRadius * 1.5
    const hexSpacingY = hexHeight
    const segs: Seg[] = []
    const centers: Point[] = []

    for (let row = 0; row * hexSpacingY < height + hexSpacingY; row++) {
        for (let col = 0; col * hexSpacingX < width + hexSpacingX; col++) {
            const cx = x0 + col * hexSpacingX + spacing
            const cy = y0 + row * hexSpacingY + spacing + (col % 2 === 1 ? hexSpacingY / 2 : 0)
            centers.push({ x: cx, y: cy })
            for (let i = 0; i < 6; i++) {
                const a1 = (Math.PI / 3) * i
                const a2 = (Math.PI / 3) * (i + 1)
                segs.push({
                    x1: cx + hexRadius * Math.cos(a1),
                    y1: cy + hexRadius * Math.sin(a1),
                    x2: cx + hexRadius * Math.cos(a2),
                    y2: cy + hexRadius * Math.sin(a2),
                })
            }
        }
    }

    return { segs, centers }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate SVG path data for a texture pattern clipped to the piece polygon.
 *
 * The texture is expanded to cover the piece even when rotated, then each
 * element is geometrically intersected with the piece boundary.  The result
 * contains *only* the geometry that falls inside – no <clipPath> needed.
 *
 * @param cells        - Piece cells in grid coordinates.
 * @param cellSize     - Size of each cell in SVG units.
 * @param textureType  - Texture identifier (e.g. "linesH", "grid", etc.).
 * @param spacing      - Texture spacing parameter.
 * @param textureRotation - Rotation angle in degrees for the texture.
 * @returns SVG path data string (already clipped), or empty string.
 */
export function generateTexture(
    cells: { x: number; y: number }[],
    cellSize: number,
    textureType: string,
    spacing: number,
    textureRotation: number = 0,
): string {
    if (cells.length === 0) return ""

    // Build the clipping polygon from the piece cells.
    const polygon = cellsToPolygon(cells, cellSize)
    if (polygon.length < 3) return ""

    // Bounding box of the piece (in SVG units).
    const minX = Math.min(...cells.map((c) => c.x))
    const maxX = Math.max(...cells.map((c) => c.x))
    const minY = Math.min(...cells.map((c) => c.y))
    const maxY = Math.max(...cells.map((c) => c.y))

    const baseWidth = (maxX - minX + 1) * cellSize
    const baseHeight = (maxY - minY + 1) * cellSize

    // Expand area so rotated textures still cover the piece.
    const diagonal = Math.sqrt(baseWidth * baseWidth + baseHeight * baseHeight)
    const expansion = (diagonal - Math.min(baseWidth, baseHeight)) / 2

    const x0 = minX * cellSize - expansion
    const y0 = minY * cellSize - expansion
    const width = baseWidth + expansion * 2
    const height = baseHeight + expansion * 2

    // Center of the piece for rotation.
    const centerX = ((minX + maxX) / 2 + 0.5) * cellSize
    const centerY = ((minY + maxY) / 2 + 0.5) * cellSize
    const center: Point = { x: centerX, y: centerY }

    // Helper: rotate a segment, then clip against the polygon.
    const rotateAndClip = (seg: Seg): Seg[] => {
        const rotated = textureRotation !== 0 ? rotateSeg(seg, center, textureRotation) : seg
        return clipSegmentToPolygon(rotated, polygon)
    }

    let clippedSegs: Seg[] = []

    switch (textureType) {
        case "linesH": {
            const segs = generateLinesHSegs(x0, y0, width, height, spacing)
            for (const seg of segs) clippedSegs.push(...rotateAndClip(seg))
            break
        }
        case "linesV": {
            const segs = generateLinesVSegs(x0, y0, width, height, spacing)
            for (const seg of segs) clippedSegs.push(...rotateAndClip(seg))
            break
        }
        case "linesDiag": {
            const segs = generateLinesDiagSegs(x0, y0, width, height, spacing)
            for (const seg of segs) clippedSegs.push(...rotateAndClip(seg))
            break
        }
        case "grid": {
            const segs = generateGridSegs(x0, y0, width, height, spacing)
            for (const seg of segs) clippedSegs.push(...rotateAndClip(seg))
            break
        }
        case "dots": {
            const { segs, centers } = generateDotsSegs(x0, y0, width, height, spacing)
            // For dots: only include dots whose center (after rotation) is inside the polygon.
            const numSides = 8
            for (let i = 0; i < centers.length; i++) {
                const rc = textureRotation !== 0 ? rotatePoint(centers[i], center, textureRotation) : centers[i]
                if (pointInPolygon(rc, polygon)) {
                    // Include all segments of this dot
                    const dotSegs = segs.slice(i * numSides, (i + 1) * numSides)
                    for (const seg of dotSegs) {
                        const rotated = textureRotation !== 0 ? rotateSeg(seg, center, textureRotation) : seg
                        clippedSegs.push(rotated)
                    }
                }
            }
            break
        }
        case "waves": {
            const polylines = generateWavesPolylines(x0, y0, width, height, spacing)
            for (const pts of polylines) {
                // Rotate each point, then clip the polyline.
                const rotatedPts = textureRotation !== 0
                    ? pts.map((p) => rotatePoint(p, center, textureRotation))
                    : pts
                clippedSegs.push(...clipPolylineToPolygon(rotatedPts, polygon))
            }
            break
        }
        case "circles": {
            const { segs, centers } = generateCirclesSegs(x0, y0, width, height, spacing)
            const numSides = 24
            for (let i = 0; i < centers.length; i++) {
                const rc = textureRotation !== 0 ? rotatePoint(centers[i], center, textureRotation) : centers[i]
                if (pointInPolygon(rc, polygon)) {
                    const circSegs = segs.slice(i * numSides, (i + 1) * numSides)
                    for (const seg of circSegs) {
                        const rotated = textureRotation !== 0 ? rotateSeg(seg, center, textureRotation) : seg
                        clippedSegs.push(rotated)
                    }
                } else {
                    // Center outside – still clip individual segments so partial circles near edges work.
                    const circSegs = segs.slice(i * numSides, (i + 1) * numSides)
                    for (const seg of circSegs) {
                        clippedSegs.push(...rotateAndClip(seg))
                    }
                }
            }
            break
        }
        case "zigzag": {
            const polylines = generateZigzagPolylines(x0, y0, width, height, spacing)
            for (const pts of polylines) {
                const rotatedPts = textureRotation !== 0
                    ? pts.map((p) => rotatePoint(p, center, textureRotation))
                    : pts
                clippedSegs.push(...clipPolylineToPolygon(rotatedPts, polygon))
            }
            break
        }
        case "cross": {
            const segs = generateCrossSegs(x0, y0, width, height, spacing)
            for (const seg of segs) clippedSegs.push(...rotateAndClip(seg))
            break
        }
        case "hexagon": {
            const { segs, centers } = generateHexagonSegs(x0, y0, width, height, spacing)
            const numSides = 6
            for (let i = 0; i < centers.length; i++) {
                const rc = textureRotation !== 0 ? rotatePoint(centers[i], center, textureRotation) : centers[i]
                if (pointInPolygon(rc, polygon)) {
                    const hexSegs = segs.slice(i * numSides, (i + 1) * numSides)
                    for (const seg of hexSegs) {
                        const rotated = textureRotation !== 0 ? rotateSeg(seg, center, textureRotation) : seg
                        clippedSegs.push(rotated)
                    }
                } else {
                    // Partial hexagons at edges
                    const hexSegs = segs.slice(i * numSides, (i + 1) * numSides)
                    for (const seg of hexSegs) {
                        clippedSegs.push(...rotateAndClip(seg))
                    }
                }
            }
            break
        }
        default:
            return ""
    }

    return segsToPathData(clippedSegs)
}
