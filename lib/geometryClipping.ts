/**
 * Geometry clipping utilities for polyomino pieces.
 *
 * Instead of relying on SVG <clipPath> (which CorelDRAW / laser cutters
 * interpret as "power clip" and often ignore), we compute the actual
 * geometric intersection so the SVG only contains paths that are already
 * trimmed to the piece boundary.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Point = { x: number; y: number }

/** A closed polygon represented as an ordered list of vertices. */
export type Polygon = Point[]

/** A single line segment. */
export type Seg = { x1: number; y1: number; x2: number; y2: number }

// ---------------------------------------------------------------------------
// Build a polygon from piece cells
// ---------------------------------------------------------------------------

/**
 * Convert piece cells to an ordered polygon (list of vertices walking the
 * outer boundary counter-clockwise).  Each cell occupies [x*cs, (x+1)*cs] x
 * [y*cs, (y+1)*cs] where cs = cellSize.
 *
 * The algorithm:
 *  1. Collect every outer edge (shared with no neighbour).
 *  2. Chain the edges into a single closed loop by matching endpoints.
 */
export function cellsToPolygon(
  cells: { x: number; y: number }[],
  cellSize: number,
): Polygon {
  const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`))

  // Collect directed outer edges.
  // We go clockwise around each cell so that the *outside* edges, when
  // chained, form a clockwise polygon (standard SVG winding).
  type Edge = { x1: number; y1: number; x2: number; y2: number }
  const edges: Edge[] = []

  for (const { x, y } of cells) {
    // Top
    if (!cellSet.has(`${x},${y - 1}`)) {
      edges.push({ x1: x * cellSize, y1: y * cellSize, x2: (x + 1) * cellSize, y2: y * cellSize })
    }
    // Right
    if (!cellSet.has(`${x + 1},${y}`)) {
      edges.push({ x1: (x + 1) * cellSize, y1: y * cellSize, x2: (x + 1) * cellSize, y2: (y + 1) * cellSize })
    }
    // Bottom
    if (!cellSet.has(`${x},${y + 1}`)) {
      edges.push({ x1: (x + 1) * cellSize, y1: (y + 1) * cellSize, x2: x * cellSize, y2: (y + 1) * cellSize })
    }
    // Left
    if (!cellSet.has(`${x - 1},${y}`)) {
      edges.push({ x1: x * cellSize, y1: (y + 1) * cellSize, x2: x * cellSize, y2: y * cellSize })
    }
  }

  if (edges.length === 0) return []

  // Chain edges by matching end-point to start-point.
  const vertices: Point[] = [{ x: edges[0].x1, y: edges[0].y1 }]
  const used = new Set<number>([0])
  let cur = edges[0]

  while (used.size < edges.length) {
    let found = false
    for (let i = 0; i < edges.length; i++) {
      if (used.has(i)) continue
      const e = edges[i]
      if (Math.abs(e.x1 - cur.x2) < 1e-9 && Math.abs(e.y1 - cur.y2) < 1e-9) {
        // Check if we should collapse collinear edges (same direction)
        const lastV = vertices[vertices.length - 1]
        const dx1 = cur.x2 - lastV.x
        const dy1 = cur.y2 - lastV.y
        const dx2 = e.x2 - cur.x2
        const dy2 = e.y2 - cur.y2
        // Collinear if cross product ≈ 0
        if (Math.abs(dx1 * dy2 - dy1 * dx2) < 1e-9) {
          // Skip the intermediate vertex – extend the current segment
        } else {
          vertices.push({ x: cur.x2, y: cur.y2 })
        }
        cur = e
        used.add(i)
        found = true
        break
      }
    }
    if (!found) break
  }

  // Don't push the very last vertex if it equals the first (it's a closed loop)
  if (
    vertices.length > 0 &&
    (Math.abs(cur.x2 - vertices[0].x) > 1e-9 || Math.abs(cur.y2 - vertices[0].y) > 1e-9)
  ) {
    vertices.push({ x: cur.x2, y: cur.y2 })
  }

  return vertices
}

// ---------------------------------------------------------------------------
// Point-in-polygon (ray casting)
// ---------------------------------------------------------------------------

export function pointInPolygon(p: Point, polygon: Polygon): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// ---------------------------------------------------------------------------
// Clip a line segment to a convex OR concave polygon
// ---------------------------------------------------------------------------

/**
 * Clip segment `seg` against `polygon`, returning 0-N sub-segments that lie
 * inside the polygon.
 *
 * Works for *any* simple polygon (convex or concave) by computing all
 * intersection parameters *t* along the segment, sorting them, and testing
 * the midpoint of each interval with point-in-polygon.
 */
export function clipSegmentToPolygon(seg: Seg, polygon: Polygon): Seg[] {
  const dx = seg.x2 - seg.x1
  const dy = seg.y2 - seg.y1

  // Collect all t-values where the segment crosses a polygon edge.
  const tValues: number[] = [0, 1]

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const ex = polygon[i].x - polygon[j].x
    const ey = polygon[i].y - polygon[j].y

    const denom = dx * ey - dy * ex
    if (Math.abs(denom) < 1e-12) continue // parallel

    const t = ((polygon[j].x - seg.x1) * ey - (polygon[j].y - seg.y1) * ex) / denom
    const u = ((polygon[j].x - seg.x1) * dy - (polygon[j].y - seg.y1) * dx) / denom

    if (t > -1e-9 && t < 1 + 1e-9 && u > -1e-9 && u < 1 + 1e-9) {
      tValues.push(Math.max(0, Math.min(1, t)))
    }
  }

  tValues.sort((a, b) => a - b)

  // Deduplicate
  const unique: number[] = [tValues[0]]
  for (let i = 1; i < tValues.length; i++) {
    if (tValues[i] - unique[unique.length - 1] > 1e-9) {
      unique.push(tValues[i])
    }
  }

  const result: Seg[] = []
  for (let i = 0; i < unique.length - 1; i++) {
    const tMid = (unique[i] + unique[i + 1]) / 2
    const mx = seg.x1 + dx * tMid
    const my = seg.y1 + dy * tMid
    if (pointInPolygon({ x: mx, y: my }, polygon)) {
      result.push({
        x1: seg.x1 + dx * unique[i],
        y1: seg.y1 + dy * unique[i],
        x2: seg.x1 + dx * unique[i + 1],
        y2: seg.y1 + dy * unique[i + 1],
      })
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Helpers to convert clipped segments back to SVG path data
// ---------------------------------------------------------------------------

export function segsToPathData(segs: Seg[]): string {
  return segs.map((s) => `M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`).join(" ")
}

// ---------------------------------------------------------------------------
// Clip a polyline (sequence of connected points) to a polygon
// ---------------------------------------------------------------------------

/**
 * Takes an array of points forming a polyline and clips each consecutive
 * segment against the polygon, returning clipped SVG path data.
 */
export function clipPolylineToPolygon(
  points: Point[],
  polygon: Polygon,
): Seg[] {
  const result: Seg[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const seg: Seg = {
      x1: points[i].x,
      y1: points[i].y,
      x2: points[i + 1].x,
      y2: points[i + 1].y,
    }
    result.push(...clipSegmentToPolygon(seg, polygon))
  }
  return result
}

// ---------------------------------------------------------------------------
// Clip a closed shape (circle, hexagon) represented as line segments
// ---------------------------------------------------------------------------

/**
 * Given a list of segments forming a closed shape, clip every segment
 * against the polygon.
 */
export function clipClosedShapeToPolygon(
  shapeSegs: Seg[],
  polygon: Polygon,
): Seg[] {
  const result: Seg[] = []
  for (const seg of shapeSegs) {
    result.push(...clipSegmentToPolygon(seg, polygon))
  }
  return result
}

// ---------------------------------------------------------------------------
// Apply rotation to a point around a center
// ---------------------------------------------------------------------------

export function rotatePoint(p: Point, center: Point, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - center.x
  const dy = p.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

export function rotateSeg(seg: Seg, center: Point, angleDeg: number): Seg {
  const p1 = rotatePoint({ x: seg.x1, y: seg.y1 }, center, angleDeg)
  const p2 = rotatePoint({ x: seg.x2, y: seg.y2 }, center, angleDeg)
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
}
