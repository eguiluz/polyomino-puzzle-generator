import { useState } from "react"
import type { BaseShape } from "@/lib/polyomino"

export type TextureType =
    | "linesH"
    | "linesV"
    | "linesDiag"
    | "grid"
    | "dots"
    | "waves"
    | "circles"
    | "zigzag"
    | "cross"
    | "hexagon"

export function usePolyominoState() {
    // Parámetros del puzzle
    const [gridWidth, setGridWidth] = useState(12)
    const [gridHeight, setGridHeight] = useState(12)
    const [minPieceSize, setMinPieceSize] = useState(4)
    const [maxPieceSize, setMaxPieceSize] = useState(8)
    const [seed, setSeed] = useState(() => Date.now())
    const [baseShape, setBaseShape] = useState<BaseShape>("rectangle")
    const [colorPalette, setColorPalette] = useState("wood")

    // Forma de las piezas
    const [intricateMode, setIntricateMode] = useState(false)
    const [snakiness, setSnakiness] = useState(0.5)
    const [complexity, setComplexity] = useState(0.5)

    // Personalización de piezas
    const [includeText, setIncludeText] = useState(false)
    const [customText, setCustomText] = useState("")
    const [textDistribution, setTextDistribution] = useState<"all" | "alternate" | "random">("random")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Texturas
    const [includeTextures, setIncludeTextures] = useState(false)
    const [selectedTextures, setSelectedTextures] = useState<TextureType[]>([])
    const [textureSpacing, setTextureSpacing] = useState(2)
    const [textureRotation, setTextureRotation] = useState(0)
    const [textureDistribution, setTextureDistribution] = useState<"all" | "alternate" | "random">("random")

    // Parámetros de corte láser
    const [cellSize, setCellSize] = useState(10)
    const [cornerRadius, setCornerRadius] = useState(1.5)
    const [strokeWidth, setStrokeWidth] = useState(0.2)
    const [baseMargin, setBaseMargin] = useState(20)
    const [basePadding, setBasePadding] = useState(1)

    // Colores para láser
    const [showColors, setShowColors] = useState(false)
    const [cutColor, setCutColor] = useState("#FF0000")
    const [engraveColor, setEngraveColor] = useState("#0000FF")
    const [rasterColor, setRasterColor] = useState("#000000")

    // Personalización de base
    const [baseText, setBaseText] = useState("")
    const [baseFontFamily, setBaseFontFamily] = useState<string>("Arial")
    const [baseFontSize, setBaseFontSize] = useState(5)
    const [baseTextAlign, setBaseTextAlign] = useState<"left" | "center" | "right">("center")
    const [baseTextOffsetX, setBaseTextOffsetX] = useState(0)
    const [baseTextOffsetY, setBaseTextOffsetY] = useState(0)

    // Vista
    const [previewMode, setPreviewMode] = useState<"pieces" | "dedication">("pieces")
    const [zoom, setZoom] = useState(100)
    const [showDetails, setShowDetails] = useState(false)

    // Estados de secciones colapsables
    const [showPuzzleParams, setShowPuzzleParams] = useState(true)
    const [showPieceSize, setShowPieceSize] = useState(true)
    const [showPieceShape, setShowPieceShape] = useState(true)
    const [showCustomization, setShowCustomization] = useState(false)
    const [showTextures, setShowTextures] = useState(false)
    const [showLaserParams, setShowLaserParams] = useState(false)
    const [showLaserColors, setShowLaserColors] = useState(false)
    const [showBaseCustomization, setShowBaseCustomization] = useState(false)
    const [showView, setShowView] = useState(false)

    return {
        // Parámetros del puzzle
        gridWidth,
        setGridWidth,
        gridHeight,
        setGridHeight,
        minPieceSize,
        setMinPieceSize,
        maxPieceSize,
        setMaxPieceSize,
        seed,
        setSeed,
        baseShape,
        setBaseShape,
        colorPalette,
        setColorPalette,

        // Forma de las piezas
        intricateMode,
        setIntricateMode,
        snakiness,
        setSnakiness,
        complexity,
        setComplexity,

        // Personalización de piezas
        includeText,
        setIncludeText,
        customText,
        setCustomText,
        textDistribution,
        setTextDistribution,
        selectedCategory,
        setSelectedCategory,

        // Texturas
        includeTextures,
        setIncludeTextures,
        selectedTextures,
        setSelectedTextures,
        textureSpacing,
        setTextureSpacing,
        textureRotation,
        setTextureRotation,
        textureDistribution,
        setTextureDistribution,

        // Parámetros de corte láser
        cellSize,
        setCellSize,
        cornerRadius,
        setCornerRadius,
        strokeWidth,
        setStrokeWidth,
        baseMargin,
        setBaseMargin,
        basePadding,
        setBasePadding,

        // Colores para láser
        showColors,
        setShowColors,
        cutColor,
        setCutColor,
        engraveColor,
        setEngraveColor,
        rasterColor,
        setRasterColor,

        // Personalización de base
        baseText,
        setBaseText,
        baseFontFamily,
        setBaseFontFamily,
        baseFontSize,
        setBaseFontSize,
        baseTextAlign,
        setBaseTextAlign,
        baseTextOffsetX,
        setBaseTextOffsetX,
        baseTextOffsetY,
        setBaseTextOffsetY,

        // Vista
        previewMode,
        setPreviewMode,
        zoom,
        setZoom,
        showDetails,
        setShowDetails,

        // Estados de secciones colapsables
        showPuzzleParams,
        setShowPuzzleParams,
        showPieceSize,
        setShowPieceSize,
        showPieceShape,
        setShowPieceShape,
        showCustomization,
        setShowCustomization,
        showTextures,
        setShowTextures,
        showLaserParams,
        setShowLaserParams,
        showLaserColors,
        setShowLaserColors,
        showBaseCustomization,
        setShowBaseCustomization,
        showView,
        setShowView,
    }
}
