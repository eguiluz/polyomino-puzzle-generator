import { useMemo } from "react"
import { generatePuzzle, type Piece, type BaseShape } from "@/lib/polyomino"
import { parseTextIntoUnits } from "@/lib/textParser"
import { UsePuzzlePiecesParams } from "@/types/components"

// Better hash function for deterministic pseudo-random distribution
function mulberry32(seed: number): () => number {
    let s = seed | 0
    return () => {
        s = (s + 0x6d2b79f5) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function usePuzzlePieces(params: UsePuzzlePiecesParams): Piece[] {
    const basePieces = useMemo(() => {
        return generatePuzzle(
            params.gridWidth,
            params.gridHeight,
            params.minPieceSize,
            params.maxPieceSize,
            params.seed,
            params.intricateMode,
            params.snakiness,
            params.complexity,
            params.baseShape,
            params.colorPalette,
        )
    }, [
        params.gridWidth,
        params.gridHeight,
        params.minPieceSize,
        params.maxPieceSize,
        params.seed,
        params.intricateMode,
        params.snakiness,
        params.complexity,
        params.baseShape,
        params.colorPalette,
    ])

    const pieces = useMemo(() => {
        const piecesWithExtras: Piece[] = basePieces.map((piece, index) => {
            let text = ""

            if (params.includeText && params.customText) {
                const units = parseTextIntoUnits(params.customText)
                if (units.length > 0) {
                    if (params.textDistribution === "all") {
                        text = units[index % units.length]
                    } else if (params.textDistribution === "alternate") {
                        if (index % 2 === 0) {
                            const unitIndex = Math.floor(index / 2) % units.length
                            text = units[unitIndex]
                        }
                    } else if (params.textDistribution === "random") {
                        // Use deterministic pseudo-random with good distribution
                        const rng = mulberry32(params.textSeed * 49297 + index * 9301 + 1)
                        const random = rng()

                        // 70% chance of having text for better coverage
                        if (random < 0.7) {
                            const randomIndex = Math.floor(rng() * units.length)
                            text = units[randomIndex]
                        }
                    }
                }
            }

            let texture: string | undefined = undefined
            if (params.includeTextures && params.selectedTextures.length > 0) {
                if (params.textureDistribution === "all") {
                    texture = params.selectedTextures[index % params.selectedTextures.length]
                } else if (params.textureDistribution === "alternate") {
                    if (index % 2 === 0) {
                        const textureIndex = Math.floor(index / 2) % params.selectedTextures.length
                        texture = params.selectedTextures[textureIndex]
                    }
                } else if (params.textureDistribution === "random") {
                    // Use deterministic pseudo-random with good distribution
                    const rng = mulberry32(params.textureSeed * 49297 + index * 9301 + 13579)
                    const random = rng()

                    // 70% chance of having texture for better coverage
                    if (random < 0.7) {
                        const randomIndex = Math.floor(rng() * params.selectedTextures.length)
                        texture = params.selectedTextures[randomIndex]
                    }
                }
            }

            return { ...piece, text, texture }
        })

        return piecesWithExtras
    }, [
        basePieces,
        params.customText,
        params.textDistribution,
        params.includeText,
        params.textSeed,
        params.includeTextures,
        params.selectedTextures,
        params.textureDistribution,
        params.textureSeed,
    ])

    return pieces
}
