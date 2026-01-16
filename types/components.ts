import { ReactNode } from "react"
import { Piece, BaseShape } from "@/lib/polyomino"

/**
 * Props for the CollapsibleCard component
 */
export interface CollapsibleCardProps {
    title: string | ReactNode
    open: boolean
    onOpenChange: (open: boolean) => void
    children: ReactNode
}

/**
 * Props for the PuzzleActions component
 */
export interface PuzzleActionsProps {
    onDownload: () => void
    onRegenerate: () => void
    previewMode: "pieces" | "dedication"
    onPreviewModeChange: (mode: "pieces" | "dedication") => void
    showDetails: boolean
    onShowDetailsChange: (show: boolean) => void
    zoom: number
    onZoomChange: (zoom: number) => void
    pieceCount: number
}

/**
 * Props for the PuzzlePreview component
 */
export interface PuzzlePreviewProps {
    pieces: Piece[]
    gridWidth: number
    gridHeight: number
    cellSize: number
    basePadding: number
    baseShape: BaseShape
    cornerRadius: number
    strokeWidth: number
    previewScale: number
    showColors: boolean
    includeText: boolean
    textureRotation: number
    textureSpacing: number
    previewMode: "pieces" | "dedication"
    baseText: string
    baseFontSize: number
    baseFontFamily: string
    baseTextAlign: "left" | "center" | "right"
    baseTextOffsetX: number
    baseTextOffsetY: number
}

/**
 * Parameters for the usePuzzlePieces hook
 */
export interface UsePuzzlePiecesParams {
    gridWidth: number
    gridHeight: number
    minPieceSize: number
    maxPieceSize: number
    seed: number
    intricateMode: boolean
    snakiness: number
    complexity: number
    baseShape: BaseShape
    includeText: boolean
    customText: string
    textDistribution: "all" | "alternate" | "random"
    includeTextures: boolean
    selectedTextures: string[]
    textureDistribution: "all" | "alternate" | "random"
}
