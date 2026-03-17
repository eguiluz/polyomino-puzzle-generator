import { Piece, BaseShape } from "./polyomino"
import { generateTexture } from "./textureGenerators"

type Segment = {
    x1: number
    y1: number
    x2: number
    y2: number
    dx: number
    dy: number
}

function getOutlineSegments(cells: { x: number; y: number }[]): Segment[] {
    const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`))
    const edges: Map<string, { x1: number; y1: number; x2: number; y2: number }> = new Map()

    // Collect all edges
    for (const cell of cells) {
        const { x, y } = cell

        // Top edge
        if (!cellSet.has(`${x},${y - 1}`)) {
            edges.set(`${x},${y}-top`, { x1: x, y1: y, x2: x + 1, y2: y })
        }
        // Right edge
        if (!cellSet.has(`${x + 1},${y}`)) {
            edges.set(`${x},${y}-right`, { x1: x + 1, y1: y, x2: x + 1, y2: y + 1 })
        }
        // Bottom edge
        if (!cellSet.has(`${x},${y + 1}`)) {
            edges.set(`${x},${y}-bottom`, { x1: x + 1, y1: y + 1, x2: x, y2: y + 1 })
        }
        // Left edge
        if (!cellSet.has(`${x - 1},${y}`)) {
            edges.set(`${x},${y}-left`, { x1: x, y1: y + 1, x2: x, y2: y })
        }
    }

    if (edges.size === 0) return []

    // Connect edges into a path
    const segments: Segment[] = []
    const edgeArray = Array.from(edges.values())
    const used = new Set<number>()

    let current = edgeArray[0]
    used.add(0)
    segments.push({
        ...current,
        dx: current.x2 - current.x1,
        dy: current.y2 - current.y1,
    })

    while (used.size < edgeArray.length) {
        let found = false
        for (let i = 0; i < edgeArray.length; i++) {
            if (used.has(i)) continue
            const edge = edgeArray[i]
            if (edge.x1 === current.x2 && edge.y1 === current.y2) {
                current = edge
                used.add(i)
                segments.push({
                    ...edge,
                    dx: edge.x2 - edge.x1,
                    dy: edge.y2 - edge.y1,
                })
                found = true
                break
            }
        }
        if (!found) break
    }

    return segments
}

function getCornerOffset(segment: Segment, radius: number, isStart: boolean): { x: number; y: number } {
    const { dx, dy } = segment
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return { x: 0, y: 0 }

    const nx = dx / len
    const ny = dy / len

    if (isStart) {
        return { x: nx * radius, y: ny * radius }
    } else {
        return { x: -nx * radius, y: -ny * radius }
    }
}

function getTurnDirection(current: Segment, next: Segment): number {
    // Cross product to determine turn direction
    return current.dx * next.dy - current.dy * next.dx
}

// Generate SVG path for a piece with rounded corners
export function generatePiecePath(cells: { x: number; y: number }[], cellSize: number, cornerRadius: number): string {
    if (cells.length === 0) return ""

    // Get the outline segments of the piece
    const segments = getOutlineSegments(cells)

    if (segments.length === 0) return ""

    // Build path with rounded corners
    let path = ""

    for (let i = 0; i < segments.length; i++) {
        const current = segments[i]
        const next = segments[(i + 1) % segments.length]

        const x1 = current.x1 * cellSize
        const y1 = current.y1 * cellSize
        const x2 = current.x2 * cellSize
        const y2 = current.y2 * cellSize

        if (i === 0) {
            // Move to starting point (with offset for corner)
            const startOffset = getCornerOffset(current, cornerRadius, true)
            path += `M ${x1 + startOffset.x} ${y1 + startOffset.y} `
        }

        // Line to before corner
        const endOffset = getCornerOffset(current, cornerRadius, false)
        path += `L ${x2 + endOffset.x} ${y2 + endOffset.y} `

        // Arc for corner
        const turnDirection = getTurnDirection(current, next)
        if (turnDirection !== 0) {
            const nextStartOffset = getCornerOffset(next, cornerRadius, true)
            const nextX1 = next.x1 * cellSize
            const nextY1 = next.y1 * cellSize
            const sweep = turnDirection > 0 ? 1 : 0
            path += `A ${cornerRadius} ${cornerRadius} 0 0 ${sweep} ${nextX1 + nextStartOffset.x} ${nextY1 + nextStartOffset.y} `
        }
    }

    path += "Z"
    return path
}

// Generate semicircular notch path for a segment
function generateNotchArc(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    notchRadius: number,
    cellSize: number
): string {
    // Calculate midpoint of the segment
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2

    // Determine direction (for the arc)
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)

    if (len < notchRadius * 2) return "" // Segment too short for a notch

    // Calculate the notch center position (at midpoint of edge)
    // For the inner outline (counter-clockwise), the notch should go outward (into the frame)
    const perpX = -dy / len // Perpendicular direction
    const perpY = dx / len

    // Notch start and end points on the original edge
    const notchStartX = midX - (dx / len) * notchRadius
    const notchStartY = midY - (dy / len) * notchRadius
    const notchEndX = midX + (dx / len) * notchRadius
    const notchEndY = midY + (dy / len) * notchRadius

    // The arc goes outward (perpendicular to the edge, into the frame)
    // sweep=0 for counter-clockwise arc that curves outward
    return `L ${notchStartX * cellSize} ${notchStartY * cellSize} A ${notchRadius * cellSize} ${notchRadius * cellSize} 0 0 0 ${notchEndX * cellSize} ${notchEndY * cellSize} `
}

// Find horizontal and vertical edges suitable for notches
function findNotchableEdges(cells: { x: number; y: number }[]): {
    topEdges: { x: number; y: number }[]
    bottomEdges: { x: number; y: number }[]
    leftEdges: { x: number; y: number }[]
    rightEdges: { x: number; y: number }[]
} {
    const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`))

    const topEdges: { x: number; y: number }[] = []
    const bottomEdges: { x: number; y: number }[] = []
    const leftEdges: { x: number; y: number }[] = []
    const rightEdges: { x: number; y: number }[] = []

    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const cell of cells) {
        minX = Math.min(minX, cell.x)
        maxX = Math.max(maxX, cell.x)
        minY = Math.min(minY, cell.y)
        maxY = Math.max(maxY, cell.y)
    }

    // Find edge cells on each side
    for (const cell of cells) {
        // Top edge: cell at minY that has no cell above
        if (cell.y === minY && !cellSet.has(`${cell.x},${cell.y - 1}`)) {
            topEdges.push(cell)
        }
        // Bottom edge: cell at maxY that has no cell below
        if (cell.y === maxY && !cellSet.has(`${cell.x},${cell.y + 1}`)) {
            bottomEdges.push(cell)
        }
        // Left edge: cell at minX that has no cell to the left
        if (cell.x === minX && !cellSet.has(`${cell.x - 1},${cell.y}`)) {
            leftEdges.push(cell)
        }
        // Right edge: cell at maxX that has no cell to the right
        if (cell.x === maxX && !cellSet.has(`${cell.x + 1},${cell.y}`)) {
            rightEdges.push(cell)
        }
    }

    return { topEdges, bottomEdges, leftEdges, rightEdges }
}

// Generate outline path for the entire puzzle (all pieces combined)
function generatePuzzleOutlinePath(cells: { x: number; y: number }[], cellSize: number, cornerRadius: number): string {
    if (cells.length === 0) return ""

    // Get the outline segments of all cells combined
    const segments = getOutlineSegments(cells)

    if (segments.length === 0) return ""

    // Build path with rounded corners (in counter-clockwise direction for hole)
    let path = ""

    // Reverse the segments for counter-clockwise direction
    const reversedSegments = [...segments].reverse()

    for (let i = 0; i < reversedSegments.length; i++) {
        const current = reversedSegments[i]
        const next = reversedSegments[(i + 1) % reversedSegments.length]

        // Reverse the direction of each segment
        const x1 = current.x2 * cellSize
        const y1 = current.y2 * cellSize
        const x2 = current.x1 * cellSize
        const y2 = current.y1 * cellSize

        if (i === 0) {
            // Move to starting point (with offset for corner)
            const reversedSegment = {
                ...current,
                x1: current.x2,
                y1: current.y2,
                x2: current.x1,
                y2: current.y1,
                dx: -current.dx,
                dy: -current.dy,
            }
            const startOffset = getCornerOffset(reversedSegment, cornerRadius, true)
            path += `M ${x1 + startOffset.x} ${y1 + startOffset.y} `
        }

        // Line to before corner
        const reversedSegment = {
            ...current,
            x1: current.x2,
            y1: current.y2,
            x2: current.x1,
            y2: current.y1,
            dx: -current.dx,
            dy: -current.dy,
        }
        const endOffset = getCornerOffset(reversedSegment, cornerRadius, false)
        path += `L ${x2 + endOffset.x} ${y2 + endOffset.y} `

        // Arc for corner
        const reversedNext = { ...next, x1: next.x2, y1: next.y2, x2: next.x1, y2: next.y1, dx: -next.dx, dy: -next.dy }
        const turnDirection = getTurnDirection(reversedSegment, reversedNext)
        if (turnDirection !== 0) {
            const nextStartOffset = getCornerOffset(reversedNext, cornerRadius, true)
            const nextX1 = reversedNext.x1 * cellSize
            const nextY1 = reversedNext.y1 * cellSize
            const sweep = turnDirection > 0 ? 1 : 0
            path += `A ${cornerRadius} ${cornerRadius} 0 0 ${sweep} ${nextX1 + nextStartOffset.x} ${nextY1 + nextStartOffset.y} `
        }
    }

    path += "Z"
    return path
}

// Generate outline path with finger notches for easy piece removal
function generatePuzzleOutlinePathWithNotches(
    cells: { x: number; y: number }[],
    cellSize: number,
    cornerRadius: number,
    notchRadius: number
): string {
    if (cells.length === 0) return ""

    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const cell of cells) {
        minX = Math.min(minX, cell.x)
        maxX = Math.max(maxX, cell.x + 1)
        minY = Math.min(minY, cell.y)
        maxY = Math.max(maxY, cell.y + 1)
    }

    // Calculate notch positions at the center of each edge
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2

    // Generate base outline path first (without notches)
    const basePath = generatePuzzleOutlinePath(cells, cellSize, cornerRadius)
    
    // Now we need to add the notches as separate arcs that cut into the frame
    // For simplicity, we'll generate the notches by creating a new path that includes them
    
    // The notches need to be placed at these positions (in grid units, then scaled):
    // Top: (midX, minY) - semicircle going up (into the frame)
    // Bottom: (midX, maxY) - semicircle going down (into the frame)
    // Left: (minX, midY) - semicircle going left (into the frame)
    // Right: (maxX, midY) - semicircle going right (into the frame)
    
    // Since the puzzle outline path is complex with rounded corners,
    // we'll generate a simpler approach: create the notches as indentations
    // at fixed positions along the bounding edges
    
    const notchRadiusUnits = notchRadius / cellSize
    
    // Build a new path that includes notches at the bounding box edges
    // We trace counter-clockwise starting from top-right corner
    
    // First, use the standard outline but we need to inject notches
    // A simpler approach: generate 4 semicircle paths and combine with the outline
    
    // Actually, let's use a different approach - generate the outline path manually
    // with notches embedded at the correct positions
    
    const segments = getOutlineSegments(cells)
    if (segments.length === 0) return ""
    
    // Track which edges have had a notch added (only one per side)
    const notchAdded = { top: false, bottom: false, left: false, right: false }
    
    let path = ""
    const reversedSegments = [...segments].reverse()

    for (let i = 0; i < reversedSegments.length; i++) {
        const current = reversedSegments[i]
        const next = reversedSegments[(i + 1) % reversedSegments.length]

        const x1 = current.x2
        const y1 = current.y2
        const x2 = current.x1
        const y2 = current.y1

        const reversedSegment = {
            ...current,
            x1: current.x2,
            y1: current.y2,
            x2: current.x1,
            y2: current.y1,
            dx: -current.dx,
            dy: -current.dy,
        }

        if (i === 0) {
            const startOffset = getCornerOffset(reversedSegment, cornerRadius, true)
            path += `M ${x1 * cellSize + startOffset.x} ${y1 * cellSize + startOffset.y} `
        }

        // Check if this segment is on the bounding edge and contains the midpoint
        const isHorizontal = Math.abs(y1 - y2) < 0.001
        const isVertical = Math.abs(x1 - x2) < 0.001
        let hasNotch = false
        let notchSweep = 0
        let notchCenterX = 0
        let notchCenterY = 0

        if (isHorizontal) {
            const segMinX = Math.min(x1, x2)
            const segMaxX = Math.max(x1, x2)
            
            // Top edge
            if (!notchAdded.top && Math.abs(y1 - minY) < 0.001 && segMinX <= midX && segMaxX >= midX) {
                hasNotch = true
                notchAdded.top = true
                notchCenterX = midX
                notchCenterY = minY
                notchSweep = 1 // curves upward (outward)
            }
            // Bottom edge
            else if (!notchAdded.bottom && Math.abs(y1 - maxY) < 0.001 && segMinX <= midX && segMaxX >= midX) {
                hasNotch = true
                notchAdded.bottom = true
                notchCenterX = midX
                notchCenterY = maxY
                notchSweep = 0 // curves downward (outward)
            }
        } else if (isVertical) {
            const segMinY = Math.min(y1, y2)
            const segMaxY = Math.max(y1, y2)
            
            // Left edge
            if (!notchAdded.left && Math.abs(x1 - minX) < 0.001 && segMinY <= midY && segMaxY >= midY) {
                hasNotch = true
                notchAdded.left = true
                notchCenterX = minX
                notchCenterY = midY
                notchSweep = 0 // curves leftward (outward)
            }
            // Right edge
            else if (!notchAdded.right && Math.abs(x1 - maxX) < 0.001 && segMinY <= midY && segMaxY >= midY) {
                hasNotch = true
                notchAdded.right = true
                notchCenterX = maxX
                notchCenterY = midY
                notchSweep = 1 // curves rightward (outward)
            }
        }

        if (hasNotch && notchRadius > 0) {
            // For horizontal segments, notch start/end are offset in X
            // For vertical segments, notch start/end are offset in Y
            if (isHorizontal) {
                const notchStartX = notchCenterX - notchRadiusUnits
                const notchEndX = notchCenterX + notchRadiusUnits
                
                // Draw line from current position to notch start
                path += `L ${notchStartX * cellSize} ${notchCenterY * cellSize} `
                // Draw the semicircle notch
                path += `A ${notchRadius} ${notchRadius} 0 0 ${notchSweep} ${notchEndX * cellSize} ${notchCenterY * cellSize} `
            } else {
                const notchStartY = notchCenterY - notchRadiusUnits
                const notchEndY = notchCenterY + notchRadiusUnits
                
                // Draw line from current position to notch start
                path += `L ${notchCenterX * cellSize} ${notchStartY * cellSize} `
                // Draw the semicircle notch
                path += `A ${notchRadius} ${notchRadius} 0 0 ${notchSweep} ${notchCenterX * cellSize} ${notchEndY * cellSize} `
            }
            
            // Continue to end of segment with corner offset
            const endOffset = getCornerOffset(reversedSegment, cornerRadius, false)
            path += `L ${x2 * cellSize + endOffset.x} ${y2 * cellSize + endOffset.y} `
        } else {
            // No notch, just draw line
            const endOffset = getCornerOffset(reversedSegment, cornerRadius, false)
            path += `L ${x2 * cellSize + endOffset.x} ${y2 * cellSize + endOffset.y} `
        }

        // Arc for corner
        const reversedNext = { ...next, x1: next.x2, y1: next.y2, x2: next.x1, y2: next.y1, dx: -next.dx, dy: -next.dy }
        const turnDirection = getTurnDirection(reversedSegment, reversedNext)
        if (turnDirection !== 0) {
            const nextStartOffset = getCornerOffset(reversedNext, cornerRadius, true)
            const nextX1 = reversedNext.x1 * cellSize
            const nextY1 = reversedNext.y1 * cellSize
            const sweep = turnDirection > 0 ? 1 : 0
            path += `A ${cornerRadius} ${cornerRadius} 0 0 ${sweep} ${nextX1 + nextStartOffset.x} ${nextY1 + nextStartOffset.y} `
        }
    }

    path += "Z"
    return path
}

// Generate complete SVG content for laser cutting
export function generateSVG(
    pieces: Piece[],
    width: number,
    height: number,
    cellSize: number,
    cornerRadius: number,
    strokeWidth: number,
    showColors: boolean,
    includeText = false,
    margin = 20,
    basePadding = 1,
    textureSpacing = 2,
    textureRotation = 0,
    baseText = "",
    baseFontFamily = "Arial",
    baseFontSize = 5,
    cutColor = "#FF0000",
    engraveColor = "#0000FF",
    rasterColor = "#000000",
    baseShape: BaseShape = "rectangle",
    baseTextOffsetX = 0,
    baseTextOffsetY = 0,
    baseTextAlign: "left" | "center" | "right" = "center",
    getTextPosition: (
        cells: { x: number; y: number }[],
        cellSize: number,
    ) => { x: number; y: number; width: number; canUseDouble: boolean },
    calculateFontSize: (text: string, cellSize: number, availableWidth: number) => number,
    fingerNotches = true,
    notchRadius = 3,
): string {
    const svgWidth = width * cellSize
    const svgHeight = height * cellSize
    const baseWidth = (width + basePadding * 2) * cellSize
    const baseHeight = (height + basePadding * 2) * cellSize
    const paddingSize = basePadding * cellSize

    let paths = ""
    let texts = ""
    let textures = ""

    // Generar el marco/borde (diferencia entre base y puzzle) si hay padding
    let framePath = ""
    if (basePadding > 0) {
        let outerPath = ""

        // Forma exterior (tamaño de la base con padding) - en coordenadas relativas al transform
        // El grupo tiene translate(paddingSize, paddingSize), así que las coordenadas son relativas a (-paddingSize, -paddingSize)
        switch (baseShape) {
            case "rectangle":
                outerPath = `M ${cornerRadius - paddingSize} ${-paddingSize}
          L ${svgWidth + paddingSize - cornerRadius} ${-paddingSize}
          A ${cornerRadius} ${cornerRadius} 0 0 1 ${svgWidth + paddingSize} ${-paddingSize + cornerRadius}
          L ${svgWidth + paddingSize} ${svgHeight + paddingSize - cornerRadius}
          A ${cornerRadius} ${cornerRadius} 0 0 1 ${svgWidth + paddingSize - cornerRadius} ${svgHeight + paddingSize}
          L ${cornerRadius - paddingSize} ${svgHeight + paddingSize}
          A ${cornerRadius} ${cornerRadius} 0 0 1 ${-paddingSize} ${svgHeight + paddingSize - cornerRadius}
          L ${-paddingSize} ${-paddingSize + cornerRadius}
          A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius - paddingSize} ${-paddingSize}
          Z`
                break

            case "hexagon": {
                // Centro en coordenadas del grupo (después del translate)
                const outerCenterX = svgWidth / 2
                const outerCenterY = svgHeight / 2
                // Radio del hexágono exterior (toda la base incluyendo padding)
                const outerRadius = Math.min(baseWidth, baseHeight) / 2
                const hexPoints: { x: number; y: number }[] = []

                // Flat-top orientation: lados horizontales arriba y abajo
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i
                    hexPoints.push({
                        x: outerCenterX + outerRadius * Math.cos(angle),
                        y: outerCenterY + outerRadius * Math.sin(angle),
                    })
                }

                outerPath = `M ${hexPoints[0].x} ${hexPoints[0].y}`
                for (let i = 1; i < hexPoints.length; i++) {
                    outerPath += ` L ${hexPoints[i].x} ${hexPoints[i].y}`
                }
                outerPath += ` Z`
                break
            }

            case "circle": {
                // Centro en coordenadas del grupo (después del translate)
                const outerCenterX = svgWidth / 2
                const outerCenterY = svgHeight / 2
                // Radio del círculo exterior (toda la base incluyendo padding)
                const outerRadius = Math.min(baseWidth, baseHeight) / 2
                outerPath = `M ${outerCenterX + outerRadius} ${outerCenterY}
          A ${outerRadius} ${outerRadius} 0 0 1 ${outerCenterX - outerRadius} ${outerCenterY}
          A ${outerRadius} ${outerRadius} 0 0 1 ${outerCenterX + outerRadius} ${outerCenterY}
          Z`
                break
            }
        }

        // Forma interior: contorno del puzzle (borde exterior de todas las piezas)
        // Obtener todas las celdas del puzzle y generar el contorno unificado
        const allCells: { x: number; y: number }[] = []
        for (const piece of pieces) {
            allCells.push(...piece.cells)
        }

        // Generar el path del contorno exterior del puzzle completo
        // Si fingerNotches está activado, usar la versión con muescas
        const puzzleOutlinePath = fingerNotches && notchRadius > 0
            ? generatePuzzleOutlinePathWithNotches(allCells, cellSize, cornerRadius, notchRadius)
            : generatePuzzleOutlinePath(allCells, cellSize, cornerRadius)

        framePath = `  <!-- Marco/borde de la base -->\n  <g transform="translate(${paddingSize}, ${paddingSize})">\n    <path d="${outerPath} ${puzzleOutlinePath}" fill="none" stroke="${cutColor}" stroke-width="${strokeWidth}" fill-rule="evenodd" />\n  </g>\n`
    }

    // Generar las piezas del puzzle - con desplazamiento si hay padding
    const puzzleOffset = basePadding > 0 ? `transform="translate(${paddingSize}, ${paddingSize})" ` : ""
    for (const piece of pieces) {
        const d = generatePiecePath(piece.cells, cellSize, cornerRadius)
        const fill = showColors ? piece.color : "none"
        paths += `  <path ${puzzleOffset}d="${d}" fill="${fill}" stroke="${cutColor}" stroke-width="${strokeWidth}" />\n`

        // Generar textura clipped geométricamente (sin clipPath)
        if (piece.texture && piece.texture !== "none") {
            const offsetCells = basePadding > 0
                ? piece.cells.map(c => ({ x: c.x + basePadding, y: c.y + basePadding }))
                : piece.cells

            const texturePattern = generateTexture(offsetCells, cellSize, piece.texture, textureSpacing, textureRotation)
            if (texturePattern) {
                // Path ya recortado geométricamente – no necesita clipPath ni transform
                textures += `  <path d="${texturePattern}" stroke="${engraveColor}" stroke-width="${strokeWidth * 0.5}" fill="none" />\n`
            }
        }

        if (includeText && piece.text) {
            const pos = getTextPosition(piece.cells, cellSize)
            const fontSize = calculateFontSize(piece.text, cellSize, pos.width)
            // Si el texto tiene 1-2 caracteres y puede usar dos celdas, usar un ancho más generoso
            const rectWidth =
                pos.canUseDouble && piece.text.length <= 2
                    ? pos.width * 0.7 // Usar el 70% del ancho disponible (2 celdas)
                    : fontSize * piece.text.length * 0.6 // Cálculo normal
            const rectHeight = fontSize * 1.2
            const textTransform = basePadding > 0 ? `transform="translate(${paddingSize}, ${paddingSize})" ` : ""
            texts += `  <rect ${textTransform}x="${pos.x - rectWidth / 2}" y="${pos.y - rectHeight / 2}" width="${rectWidth}" height="${rectHeight}" fill="#FFFFFF" rx="2" />\n`
            texts += `  <text ${textTransform}x="${pos.x}" y="${pos.y}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" fill="${rasterColor}" font-family="Arial, sans-serif" font-weight="bold">${piece.text}</text>\n`
        }
    }

    // Borde exterior del puzzle
    const borderPath = `M ${cornerRadius} 0
    L ${svgWidth - cornerRadius} 0
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${svgWidth} ${cornerRadius}
    L ${svgWidth} ${svgHeight - cornerRadius}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${svgWidth - cornerRadius} ${svgHeight}
    L ${cornerRadius} ${svgHeight}
    A ${cornerRadius} ${cornerRadius} 0 0 1 0 ${svgHeight - cornerRadius}
    L 0 ${cornerRadius}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} 0
    Z`

    // Base - diferentes formas según la selección
    const baseX = baseWidth + margin
    const baseY = 0 // La base empieza en Y=0
    let basePath = ""

    switch (baseShape) {
        case "rectangle":
            basePath = `M ${baseX + cornerRadius} ${baseY}
        L ${baseX + baseWidth - cornerRadius} ${baseY}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${baseX + baseWidth} ${baseY + cornerRadius}
        L ${baseX + baseWidth} ${baseY + baseHeight - cornerRadius}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${baseX + baseWidth - cornerRadius} ${baseY + baseHeight}
        L ${baseX + cornerRadius} ${baseY + baseHeight}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${baseX} ${baseY + baseHeight - cornerRadius}
        L ${baseX} ${baseY + cornerRadius}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${baseX + cornerRadius} ${baseY}
        Z`
            break

        case "hexagon": {
            const centerX = baseX + baseWidth / 2
            const centerY = baseY + baseHeight / 2
            const radius = Math.min(baseWidth, baseHeight) / 2
            const hexPoints: { x: number; y: number }[] = []

            // Flat-top orientation: lados horizontales arriba y abajo
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i
                hexPoints.push({
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle),
                })
            }

            basePath = `M ${hexPoints[0].x} ${hexPoints[0].y}`
            for (let i = 1; i < hexPoints.length; i++) {
                basePath += ` L ${hexPoints[i].x} ${hexPoints[i].y}`
            }
            basePath += ` Z`
            break
        }

        case "circle": {
            const centerX = baseX + baseWidth / 2
            const centerY = baseY + baseHeight / 2
            const radius = Math.min(baseWidth, baseHeight) / 2
            basePath = `M ${centerX + radius} ${centerY}
        A ${radius} ${radius} 0 0 1 ${centerX - radius} ${centerY}
        A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
        Z`
            break
        }
    }

    const totalWidth = baseWidth * 2 + margin

    const totalHeight = Math.max(svgHeight, baseHeight)

    // Texto en el centro de la base
    let baseTextElement = ""
    if (baseText) {
        // Calcular posición X según alineación
        let baseTextX: number
        let textAnchor: "start" | "middle" | "end"

        if (baseTextAlign === "left") {
            baseTextX = baseX + baseTextOffsetX + margin
            textAnchor = "start"
        } else if (baseTextAlign === "right") {
            baseTextX = baseX + baseWidth + baseTextOffsetX + margin
            textAnchor = "end"
        } else {
            baseTextX = baseX + baseWidth / 2 + baseTextOffsetX + margin
            textAnchor = "middle"
        }

        // Mapeo de fuentes para SVG - si no está en el mapa, usar el nombre directo con fallback a sans-serif
        const fontFamilyMap: Record<string, string> = {
            Arial: "Arial, sans-serif",
            Helvetica: "Helvetica, Arial, sans-serif",
            "Times New Roman": "Times New Roman, Times, serif",
            Georgia: "Georgia, serif",
            "Courier New": "Courier New, Courier, monospace",
            Verdana: "Verdana, Geneva, sans-serif",
            "Trebuchet MS": "Trebuchet MS, Helvetica, sans-serif",
            "Comic Sans MS": "Comic Sans MS, cursive, sans-serif",
            Impact: "Impact, Charcoal, sans-serif",
            Palatino: "Palatino Linotype, Book Antiqua, Palatino, serif",
            Garamond: "Garamond, serif",
            Bookman: "Bookman, serif",
            "Avant Garde": "Avant Garde, sans-serif",
            "Brush Script MT": "Brush Script MT, cursive",
            "Lucida Console": "Lucida Console, Monaco, monospace",
            Monaco: "Monaco, Courier New, monospace",
            Consolas: "Consolas, Monaco, monospace",
            Cambria: "Cambria, Georgia, serif",
            Calibri: "Calibri, Arial, sans-serif",
            Futura: "Futura, Trebuchet MS, sans-serif",
        }
        const fontFamily = fontFamilyMap[baseFontFamily] || `${baseFontFamily}, sans-serif`

        // Dividir el texto por saltos de línea
        const lines = baseText.split("\n")
        const lineHeight = baseFontSize * 1.2
        const totalTextHeight = (lines.length - 1) * lineHeight + baseFontSize
        // Calcular Y para el elemento text: centro vertical del bloque de texto
        const textY = baseY + baseHeight / 2 - totalTextHeight / 2 + baseFontSize * 0.8 + baseTextOffsetY

        // Crear tspan para cada línea
        const tspanElements = lines
            .map((line, index) => {
                if (index === 0) {
                    return `<tspan x="${baseTextX}">${line}</tspan>`
                } else {
                    return `<tspan x="${baseTextX}" dy="${lineHeight}">${line}</tspan>`
                }
            })
            .join("\n    ")

        baseTextElement = `  <!-- Texto en el centro de la base -->
  <text x="${baseTextX}" y="${textY}" font-size="${baseFontSize}" text-anchor="${textAnchor}" fill="${rasterColor}" font-family="${fontFamily}" font-weight="bold">
    ${tspanElements}
  </text>
`
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <!-- Texturas y textos -->
${textures}${texts}${baseTextElement}
  <!-- Líneas de corte: Puzzle con piezas y marco -->
${framePath}${paths}
  <!-- Base -->
  <path d="${basePath}" fill="none" stroke="${cutColor}" stroke-width="${strokeWidth}" />
</svg>`
}
