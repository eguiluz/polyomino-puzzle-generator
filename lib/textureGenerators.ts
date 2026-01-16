// Texture generation for polyomino pieces

type TextureGenerator = (x0: number, y0: number, width: number, height: number, spacing: number) => string

function generateLinesH(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    for (let y = spacing; y < height; y += spacing) {
        paths += `M ${x0} ${y0 + y} L ${x0 + width} ${y0 + y} `
    }
    return paths
}

function generateLinesV(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    for (let x = spacing; x < width; x += spacing) {
        paths += `M ${x0 + x} ${y0} L ${x0 + x} ${y0 + height} `
    }
    return paths
}

function generateLinesDiag(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    const diagonalSpacing = spacing * 1.414
    for (let offset = -height; offset < width + height; offset += diagonalSpacing) {
        paths += `M ${x0 + offset} ${y0} L ${x0 + offset + height} ${y0 + height} `
    }
    return paths
}

function generateGrid(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    for (let y = spacing; y < height; y += spacing) {
        paths += `M ${x0} ${y0 + y} L ${x0 + width} ${y0 + y} `
    }
    for (let x = spacing; x < width; x += spacing) {
        paths += `M ${x0 + x} ${y0} L ${x0 + x} ${y0 + height} `
    }
    return paths
}

function generateDots(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    const dotRadius = 0.3
    for (let y = spacing; y < height; y += spacing) {
        for (let x = spacing; x < width; x += spacing) {
            paths += `M ${x0 + x + dotRadius} ${y0 + y} A ${dotRadius} ${dotRadius} 0 0 1 ${x0 + x - dotRadius} ${y0 + y} A ${dotRadius} ${dotRadius} 0 0 1 ${x0 + x + dotRadius} ${y0 + y} `
        }
    }
    return paths
}

function generateWaves(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    const amplitude = spacing * 0.4
    const wavelength = spacing * 2
    for (let y = spacing; y < height; y += spacing * 1.5) {
        let wavePath = `M ${x0} ${y0 + y} `
        for (let x = 0; x <= width; x += wavelength / 4) {
            const phase = (x / wavelength) * Math.PI * 2
            const waveY = Math.sin(phase) * amplitude
            wavePath += `L ${x0 + x} ${y0 + y + waveY} `
        }
        paths += wavePath
    }
    return paths
}

function generateCircles(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    const circleRadius = spacing * 0.8
    for (let y = spacing * 1.5; y < height; y += spacing * 2) {
        for (let x = spacing * 1.5; x < width; x += spacing * 2) {
            paths += `M ${x0 + x + circleRadius} ${y0 + y} A ${circleRadius} ${circleRadius} 0 0 1 ${x0 + x - circleRadius} ${y0 + y} A ${circleRadius} ${circleRadius} 0 0 1 ${x0 + x + circleRadius} ${y0 + y} `
        }
    }
    return paths
}

function generateZigzag(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    const zigHeight = spacing * 0.6
    for (let y = spacing; y < height; y += spacing * 1.5) {
        let zigPath = `M ${x0} ${y0 + y} `
        for (let x = 0; x <= width; x += spacing) {
            const zOffset = Math.floor(x / spacing) % 2 === 0 ? zigHeight : -zigHeight
            zigPath += `L ${x0 + x} ${y0 + y + zOffset} `
        }
        paths += zigPath
    }
    return paths
}

function generateCross(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    const crossSize = spacing * 0.6
    for (let y = spacing * 1.5; y < height; y += spacing * 2) {
        for (let x = spacing * 1.5; x < width; x += spacing * 2) {
            paths += `M ${x0 + x - crossSize} ${y0 + y - crossSize} L ${x0 + x + crossSize} ${y0 + y + crossSize} `
            paths += `M ${x0 + x + crossSize} ${y0 + y - crossSize} L ${x0 + x - crossSize} ${y0 + y + crossSize} `
        }
    }
    return paths
}

function generateHexagon(x0: number, y0: number, width: number, height: number, spacing: number): string {
    let paths = ""
    const hexRadius = spacing * 0.8
    const hexHeight = hexRadius * Math.sqrt(3)
    const hexSpacingX = hexRadius * 1.5
    const hexSpacingY = hexHeight

    for (let row = 0; row * hexSpacingY < height + hexSpacingY; row++) {
        for (let col = 0; col * hexSpacingX < width + hexSpacingX; col++) {
            const cx = x0 + col * hexSpacingX + spacing
            const cy = y0 + row * hexSpacingY + spacing + (col % 2 === 1 ? hexSpacingY / 2 : 0)

            let hexPath = `M ${cx + hexRadius} ${cy} `
            for (let i = 1; i <= 6; i++) {
                const angle = (Math.PI / 3) * i
                const hx = cx + hexRadius * Math.cos(angle)
                const hy = cy + hexRadius * Math.sin(angle)
                hexPath += `L ${hx} ${hy} `
            }
            hexPath += `Z `
            paths += hexPath
        }
    }
    return paths
}

const textureGenerators: Record<string, TextureGenerator> = {
    linesH: generateLinesH,
    linesV: generateLinesV,
    linesDiag: generateLinesDiag,
    grid: generateGrid,
    dots: generateDots,
    waves: generateWaves,
    circles: generateCircles,
    zigzag: generateZigzag,
    cross: generateCross,
    hexagon: generateHexagon,
}

/**
 * Generate SVG path data for a texture pattern within a piece's bounding box.
 * The texture is expanded to cover the piece even when rotated.
 */
export function generateTexture(
    cells: { x: number; y: number }[],
    cellSize: number,
    textureType: string,
    spacing: number,
): string {
    const minX = Math.min(...cells.map((c) => c.x))
    const maxX = Math.max(...cells.map((c) => c.x))
    const minY = Math.min(...cells.map((c) => c.y))
    const maxY = Math.max(...cells.map((c) => c.y))

    const baseWidth = (maxX - minX + 1) * cellSize
    const baseHeight = (maxY - minY + 1) * cellSize

    // Expandir el área de textura para que cubra la pieza cuando rote
    const diagonal = Math.sqrt(baseWidth * baseWidth + baseHeight * baseHeight)
    const expansion = (diagonal - Math.min(baseWidth, baseHeight)) / 2

    const x0 = minX * cellSize - expansion
    const y0 = minY * cellSize - expansion
    const width = baseWidth + expansion * 2
    const height = baseHeight + expansion * 2

    const generator = textureGenerators[textureType]
    if (!generator) {
        return ""
    }

    return generator(x0, y0, width, height, spacing)
}
