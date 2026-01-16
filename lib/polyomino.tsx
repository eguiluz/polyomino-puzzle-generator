export type Cell = {
    x: number
    y: number
    pieceId: number
}

export type Piece = {
    id: number
    cells: { x: number; y: number }[]
    color: string
    text?: string // Añadir texto opcional para cada pieza
    texture?: string // Tipo de textura para la pieza
}

export type TextureType =
    | "none"
    | "lines-h"
    | "lines-v"
    | "lines-diag"
    | "grid"
    | "dots"
    | "waves"
    | "circles"
    | "zigzag"
    | "cross"
    | "hexagon"

export type BaseShape = "rectangle" | "hexagon" | "circle"

// Helper function to check if a cell is inside the shape
function isCellInShape(x: number, y: number, width: number, height: number, shape: BaseShape): boolean {
    const centerX = width / 2
    const centerY = height / 2

    switch (shape) {
        case "rectangle":
            return true // Todas las celdas están dentro del rectángulo

        case "hexagon": {
            // Algoritmo para determinar si un punto está dentro de un hexágono
            const radius = Math.min(width, height) / 2
            const dx = x + 0.5 - centerX
            const dy = y + 0.5 - centerY

            // Hexágono regular inscrito
            const angle = Math.atan2(dy, dx)
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Calcular la distancia máxima permitida en ese ángulo
            const hexAngle = Math.PI / 6 // 30 grados
            const normalizedAngle = ((angle % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3)
            const maxDist = (radius * Math.cos(hexAngle)) / Math.cos(normalizedAngle - hexAngle)

            return distance <= maxDist * 0.95 // 0.95 para dar un pequeño margen
        }

        case "circle": {
            const radius = Math.min(width, height) / 2
            const dx = x + 0.5 - centerX
            const dy = y + 0.5 - centerY
            const distance = Math.sqrt(dx * dx + dy * dy)
            return distance <= radius * 0.95 // 0.95 para dar un pequeño margen
        }

        default:
            return true
    }
}

// Generate a puzzle by filling a grid with polyomino pieces
export function generatePuzzle(
    width: number,
    height: number,
    minPieceSize: number,
    maxPieceSize: number,
    seed?: number,
    intricateMode = false,
    snakiness = 0.5,
    complexity = 0.5, // nuevo parámetro de complejidad
    shape: BaseShape = "rectangle",
): Piece[] {
    const random = seededRandom(seed ?? Date.now())
    const grid: number[][] = Array(height)
        .fill(null)
        .map(() => Array(width).fill(-1))

    const pieces: Piece[] = []
    let pieceId = 0

    // Fill the grid with pieces
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] === -1 && isCellInShape(x, y, width, height, shape)) {
                const piece = growPiece(
                    grid,
                    x,
                    y,
                    pieceId,
                    minPieceSize,
                    maxPieceSize,
                    random,
                    intricateMode,
                    snakiness,
                    complexity,
                    shape,
                )
                pieces.push({
                    id: pieceId,
                    cells: piece,
                    color: getColor(pieceId),
                })
                pieceId++
            }
        }
    }

    mergeTooSmallPieces(pieces, grid, width, height, minPieceSize)

    return pieces
}

function seededRandom(seed: number) {
    return () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
    }
}

function getColor(id: number): string {
    const colors = [
        "#E8D4B8",
        "#D4C4A8",
        "#C9B896",
        "#BEA883",
        "#D9C9A5",
        "#CDB994",
        "#C2AC84",
        "#B7A074",
        "#E0D0B0",
        "#D5C5A0",
        "#CABAA0",
        "#BFAF90",
    ]
    return colors[id % colors.length]
}

const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 1, dy: 0 }, // right
    { dx: 0, dy: 1 }, // down
    { dx: -1, dy: 0 }, // left
]

// Función para fusionar piezas que son demasiado pequeñas con piezas adyacentes
function mergeTooSmallPieces(pieces: Piece[], grid: number[][], width: number, height: number, minSize: number): void {
    // Encontrar piezas que no cumplen el tamaño mínimo
    const smallPieces = pieces.filter((piece) => piece.cells.length < minSize)

    for (const smallPiece of smallPieces) {
        // Buscar piezas adyacentes
        const adjacentPieceIds = new Set<number>()

        for (const cell of smallPiece.cells) {
            for (const dir of directions) {
                const nx = cell.x + dir.dx
                const ny = cell.y + dir.dy

                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const neighborPieceId = grid[ny][nx]
                    if (neighborPieceId !== -1 && neighborPieceId !== smallPiece.id) {
                        adjacentPieceIds.add(neighborPieceId)
                    }
                }
            }
        }

        // Si hay piezas adyacentes, fusionar con la primera
        if (adjacentPieceIds.size > 0) {
            const targetPieceId = Array.from(adjacentPieceIds)[0]
            const targetPiece = pieces.find((p) => p.id === targetPieceId)

            if (targetPiece) {
                // Añadir las celdas de la pieza pequeña a la pieza objetivo
                targetPiece.cells.push(...smallPiece.cells)

                // Actualizar el grid para reflejar la fusión
                for (const cell of smallPiece.cells) {
                    grid[cell.y][cell.x] = targetPieceId
                }

                // Vaciar las celdas de la pieza pequeña (la marcaremos para eliminar después)
                smallPiece.cells = []
            }
        }
    }

    // Eliminar las piezas que fueron fusionadas (tienen 0 celdas)
    const indicesToRemove: number[] = []
    pieces.forEach((piece, index) => {
        if (piece.cells.length === 0) {
            indicesToRemove.push(index)
        }
    })

    // Eliminar en orden inverso para no afectar los índices
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
        pieces.splice(indicesToRemove[i], 1)
    }
}

function isCompactRectangle(cells: { x: number; y: number }[]): boolean {
    if (cells.length < 4) return false

    const minX = Math.min(...cells.map((c) => c.x))
    const maxX = Math.max(...cells.map((c) => c.x))
    const minY = Math.min(...cells.map((c) => c.y))
    const maxY = Math.max(...cells.map((c) => c.y))

    const boundingArea = (maxX - minX + 1) * (maxY - minY + 1)
    const fillRatio = cells.length / boundingArea

    // Si ocupa más del 70% del bounding box, es compacto
    return fillRatio > 0.7 && maxX - minX >= 1 && maxY - minY >= 1
}

function calculatePerimeter(cells: { x: number; y: number }[]): number {
    const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`))
    let perimeter = 0

    for (const cell of cells) {
        for (const dir of directions) {
            if (!cellSet.has(`${cell.x + dir.dx},${cell.y + dir.dy}`)) {
                perimeter++
            }
        }
    }

    return perimeter
}

function growPiece(
    grid: number[][],
    startX: number,
    startY: number,
    pieceId: number,
    minSize: number,
    maxSize: number,
    random: () => number,
    intricateMode = false,
    snakiness = 0.5,
    complexity = 0.5,
    shape: BaseShape = "rectangle",
): { x: number; y: number }[] {
    const height = grid.length
    const width = grid[0].length
    const targetSize = Math.floor(random() * (maxSize - minSize + 1)) + minSize

    const cells: { x: number; y: number }[] = [{ x: startX, y: startY }]
    grid[startY][startX] = pieceId

    let lastDirection = directions[Math.floor(random() * 4)]
    const growthHistory: { dx: number; dy: number }[] = []

    while (cells.length < targetSize) {
        const candidates: { x: number; y: number; score: number }[] = []
        const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`))

        let expansionCells: { x: number; y: number }[]

        if (complexity > 0.6 || intricateMode) {
            // Alta complejidad: expandir desde múltiples puntos, incluyendo celdas internas
            // para crear ramificaciones
            const tipCells = cells.filter((cell) => {
                let neighborCount = 0
                for (const dir of directions) {
                    if (cellSet.has(`${cell.x + dir.dx},${cell.y + dir.dy}`)) {
                        neighborCount++
                    }
                }
                return neighborCount <= 2 // Puntas y codos
            })

            // Añadir algunas celdas aleatorias para crear ramificaciones
            const randomCells = cells.filter(() => random() < complexity * 0.3)
            expansionCells = [...new Set([...tipCells, ...randomCells])]

            if (expansionCells.length === 0) expansionCells = cells.slice(-3)
        } else if (snakiness > 0.5) {
            // Modo serpiente: solo expandir desde las puntas
            const tipCells = cells.filter((cell) => {
                let neighborCount = 0
                for (const dir of directions) {
                    if (cellSet.has(`${cell.x + dir.dx},${cell.y + dir.dy}`)) {
                        neighborCount++
                    }
                }
                return neighborCount <= 1
            })
            expansionCells = tipCells.length > 0 ? tipCells : cells.slice(-2)
        } else {
            expansionCells = cells
        }

        for (const cell of expansionCells) {
            for (const dir of directions) {
                const nx = cell.x + dir.dx
                const ny = cell.y + dir.dy

                if (
                    nx >= 0 &&
                    nx < width &&
                    ny >= 0 &&
                    ny < height &&
                    grid[ny][nx] === -1 &&
                    isCellInShape(nx, ny, width, height, shape) &&
                    !candidates.some((c) => c.x === nx && c.y === ny)
                ) {
                    let score = random() * 0.2

                    let adjacentOwn = 0
                    let adjacentOther = 0
                    for (const d of directions) {
                        const ax = nx + d.dx
                        const ay = ny + d.dy
                        if (ax >= 0 && ax < width && ay >= 0 && ay < height) {
                            if (grid[ay][ax] === pieceId) {
                                adjacentOwn++
                            } else if (grid[ay][ax] !== -1) {
                                adjacentOther++
                            }
                        }
                    }

                    score -= adjacentOwn * (snakiness + complexity) * 1.5

                    // Bonus por continuidad direccional
                    if (dir.dx === lastDirection.dx && dir.dy === lastDirection.dy) {
                        score += snakiness * 0.6
                    }

                    if (complexity > 0.4) {
                        const oppositeDir =
                            growthHistory.length > 0 &&
                            (dir.dx !== growthHistory[growthHistory.length - 1]?.dx ||
                                dir.dy !== growthHistory[growthHistory.length - 1]?.dy)
                        if (oppositeDir && random() < complexity) {
                            score += complexity * 0.8
                        }
                    }

                    let wouldCreateBlock = false
                    const blockPatterns = [
                        // 2x2 blocks
                        [
                            { dx: 0, dy: -1 },
                            { dx: 1, dy: -1 },
                            { dx: 1, dy: 0 },
                        ],
                        [
                            { dx: 1, dy: 0 },
                            { dx: 1, dy: 1 },
                            { dx: 0, dy: 1 },
                        ],
                        [
                            { dx: 0, dy: 1 },
                            { dx: -1, dy: 1 },
                            { dx: -1, dy: 0 },
                        ],
                        [
                            { dx: -1, dy: 0 },
                            { dx: -1, dy: -1 },
                            { dx: 0, dy: -1 },
                        ],
                        // 3x2 horizontal
                        [
                            { dx: 1, dy: 0 },
                            { dx: 2, dy: 0 },
                            { dx: 0, dy: 1 },
                            { dx: 1, dy: 1 },
                            { dx: 2, dy: 1 },
                        ],
                        [
                            { dx: -1, dy: 0 },
                            { dx: -2, dy: 0 },
                            { dx: 0, dy: 1 },
                            { dx: -1, dy: 1 },
                            { dx: -2, dy: 1 },
                        ],
                        // 2x3 vertical
                        [
                            { dx: 0, dy: 1 },
                            { dx: 0, dy: 2 },
                            { dx: 1, dy: 0 },
                            { dx: 1, dy: 1 },
                            { dx: 1, dy: 2 },
                        ],
                        [
                            { dx: 0, dy: -1 },
                            { dx: 0, dy: -2 },
                            { dx: 1, dy: 0 },
                            { dx: 1, dy: -1 },
                            { dx: 1, dy: -2 },
                        ],
                    ]

                    for (const pattern of blockPatterns.slice(0, 4)) {
                        // Solo 2x2 siempre
                        let patternFilled = 0
                        for (const offset of pattern) {
                            const cx = nx + offset.dx
                            const cy = ny + offset.dy
                            if (cellSet.has(`${cx},${cy}`)) {
                                patternFilled++
                            }
                        }
                        if (patternFilled >= 3) {
                            wouldCreateBlock = true
                            break
                        }
                    }

                    if (complexity > 0.5 && !wouldCreateBlock) {
                        for (const pattern of blockPatterns.slice(4)) {
                            let patternFilled = 0
                            for (const offset of pattern) {
                                const cx = nx + offset.dx
                                const cy = ny + offset.dy
                                if (cellSet.has(`${cx},${cy}`)) {
                                    patternFilled++
                                }
                            }
                            if (patternFilled >= pattern.length - 1) {
                                wouldCreateBlock = true
                                break
                            }
                        }
                    }

                    if (wouldCreateBlock) {
                        score -= (snakiness + complexity) * 2.0
                    }

                    if (complexity > 0.3) {
                        const testCells = [...cells, { x: nx, y: ny }]
                        const newPerimeter = calculatePerimeter(testCells)
                        const oldPerimeter = calculatePerimeter(cells)
                        if (newPerimeter > oldPerimeter) {
                            score += complexity * 0.4
                        }
                    }

                    // Bonus para interlocking con otras piezas
                    if (intricateMode || complexity > 0.5) {
                        score += adjacentOther * 0.4
                    }

                    if (cells.length > 3) {
                        const testCells = [...cells, { x: nx, y: ny }]
                        if (isCompactRectangle(testCells)) {
                            score -= complexity * 1.5
                        }
                    }

                    candidates.push({ x: nx, y: ny, score })
                }
            }
        }

        // Si no hay candidatos y aún no alcanzamos el tamaño mínimo,
        // intentar buscar candidatos sin restricciones estrictas
        if (candidates.length === 0) {
            if (cells.length >= minSize) {
                break // Solo salir si ya alcanzamos el mínimo
            }

            // Buscar cualquier celda adyacente disponible sin filtros de score
            for (const cell of cells) {
                for (const dir of directions) {
                    const nx = cell.x + dir.dx
                    const ny = cell.y + dir.dy
                    if (
                        nx >= 0 &&
                        nx < width &&
                        ny >= 0 &&
                        ny < height &&
                        grid[ny][nx] === -1 &&
                        isCellInShape(nx, ny, width, height, shape) &&
                        !candidates.some((c) => c.x === nx && c.y === ny)
                    ) {
                        candidates.push({ x: nx, y: ny, score: 0 })
                    }
                }
            }

            if (candidates.length === 0) break // Si aún así no hay candidatos, salir
        }

        candidates.sort((a, b) => b.score - a.score)

        let chosen: { x: number; y: number }
        if (complexity > 0.7 || intricateMode) {
            // Muy selectivo: casi siempre el mejor
            const topCount = Math.max(1, Math.floor(candidates.length * 0.2))
            chosen = candidates[Math.floor(random() * topCount)]
        } else if (snakiness > 0.5) {
            const topCount = Math.min(2, candidates.length)
            chosen = candidates[Math.floor(random() * topCount)]
        } else {
            const topCount = Math.min(4, candidates.length)
            chosen = candidates[Math.floor(random() * topCount)]
        }

        // Update direction tracking
        const lastCell = cells[cells.length - 1]
        const newDir = {
            dx: Math.sign(chosen.x - lastCell.x),
            dy: Math.sign(chosen.y - lastCell.y),
        }

        if (newDir.dx !== 0 || newDir.dy !== 0) {
            lastDirection = newDir
            growthHistory.push(newDir)
            if (growthHistory.length > 5) growthHistory.shift()
        }

        cells.push(chosen)
        grid[chosen.y][chosen.x] = pieceId
    }

    return cells
}

export function getPieceCenter(cells: { x: number; y: number }[], cellSize: number): { x: number; y: number } {
    const minX = Math.min(...cells.map((c) => c.x))
    const maxX = Math.max(...cells.map((c) => c.x))
    const minY = Math.min(...cells.map((c) => c.y))
    const maxY = Math.max(...cells.map((c) => c.y))

    return {
        x: ((minX + maxX) / 2 + 0.5) * cellSize,
        y: ((minY + maxY) / 2 + 0.5) * cellSize,
    }
}

export function getTopLeftCell(cells: { x: number; y: number }[], cellSize: number): { x: number; y: number } {
    // Encontrar la celda con menor Y, y entre esas, la de menor X
    const minY = Math.min(...cells.map((c) => c.y))
    const topRowCells = cells.filter((c) => c.y === minY)
    const minX = Math.min(...topRowCells.map((c) => c.x))

    // Retornar el centro de esa celda
    return {
        x: (minX + 0.5) * cellSize,
        y: (minY + 0.5) * cellSize,
    }
}

export function getTextPosition(
    cells: { x: number; y: number }[],
    cellSize: number,
): { x: number; y: number; width: number; canUseDouble: boolean } {
    // Encontrar la celda con menor Y, y entre esas, la de menor X
    const minY = Math.min(...cells.map((c) => c.y))
    const topRowCells = cells.filter((c) => c.y === minY)
    const sortedTopRow = topRowCells.sort((a, b) => a.x - b.x)
    const leftMostCell = sortedTopRow[0]

    // Verificar si hay una celda adyacente a la derecha en la misma fila
    const hasRightNeighbor = cells.some((c) => c.x === leftMostCell.x + 1 && c.y === leftMostCell.y)

    if (hasRightNeighbor) {
        // Usar dos celdas: centrar entre las dos
        return {
            x: (leftMostCell.x + 1) * cellSize, // Centro entre las dos celdas
            y: (leftMostCell.y + 0.5) * cellSize,
            width: cellSize * 2,
            canUseDouble: true,
        }
    } else {
        // Solo una celda disponible
        return {
            x: (leftMostCell.x + 0.5) * cellSize,
            y: (leftMostCell.y + 0.5) * cellSize,
            width: cellSize,
            canUseDouble: false,
        }
    }
}

export function getTextSize(cells: { x: number; y: number }[], cellSize: number): number {
    return cellSize * 0.5
}

export function calculateFontSize(text: string, cellSize: number, availableWidth: number): number {
    const baseSize = availableWidth * 0.8
    const textLength = text.length

    // Limitar la altura máxima al tamaño de una celda (con un pequeño margen)
    const maxHeight = cellSize * 0.8

    let calculatedSize: number
    if (textLength > 10) {
        calculatedSize = baseSize * 0.15
    } else if (textLength > 8) {
        calculatedSize = baseSize * 0.2
    } else if (textLength > 6) {
        calculatedSize = baseSize * 0.25
    } else if (textLength > 4) {
        calculatedSize = baseSize * 0.35
    } else if (textLength > 2) {
        calculatedSize = baseSize * 0.5
    } else {
        calculatedSize = baseSize * 0.7
    }

    // Asegurar que no exceda la altura máxima de una celda
    return Math.min(calculatedSize, maxHeight)
}
