import { useMemo } from "react"
import { generatePuzzle, type Piece, type BaseShape } from "@/lib/polyomino"
import { parseTextIntoUnits } from "@/lib/textParser"
import { UsePuzzlePiecesParams } from "@/types/components"

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
                        // Use deterministic pseudo-random based on piece index
                        // Simple but effective hash-based random
                        const hash = (params.seed * 9301 + index * 49297) % 233280
                        const random = hash / 233280

                        // 70% chance of having text for better coverage
                        if (random < 0.7) {
                            const randomIndex = Math.floor((hash * 7919) % units.length)
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
                    // Use deterministic pseudo-random based on piece index
                    // Simple but effective hash-based random
                    const hash = (params.seed * 9301 + index * 49297 + 13579) % 233280
                    const random = hash / 233280

                    // 70% chance of having texture for better coverage
                    if (random < 0.7) {
                        const randomIndex = Math.floor((hash * 7919) % params.selectedTextures.length)
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
        params.includeTextures,
        params.selectedTextures,
        params.textureDistribution,
        params.seed,
    ])

    return pieces
}
