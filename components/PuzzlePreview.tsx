import type { Piece, BaseShape } from "@/lib/polyomino"
import { getTextPosition, calculateFontSize } from "@/lib/polyomino"
import { generatePiecePath } from "@/lib/svgGenerator"
import { generateTexture } from "@/lib/textureGenerators"
import { calculateBaseDimensions, calculateHexagonPoints, formatPointsForSVG } from "@/lib/baseShapes"
import { PuzzlePreviewProps } from "@/types/components"

export function PuzzlePreview({
    pieces,
    gridWidth,
    gridHeight,
    cellSize,
    basePadding,
    baseShape,
    cornerRadius,
    strokeWidth,
    previewScale,
    showColors,
    includeText,
    textureRotation,
    textureSpacing,
    previewMode,
    baseText,
    baseFontSize,
    baseFontFamily,
    baseTextAlign,
    baseTextOffsetX,
    baseTextOffsetY,
}: PuzzlePreviewProps) {
    const { baseWidth, baseHeight, baseCenterX, baseCenterY } = calculateBaseDimensions(
        gridWidth,
        gridHeight,
        cellSize,
        basePadding,
    )

    const renderRectangleBase = () => (
        <rect
            x={-basePadding * cellSize}
            y={-basePadding * cellSize}
            width={baseWidth}
            height={baseHeight}
            fill="#e8e8e8"
            fillOpacity="0.3"
            rx={cornerRadius}
            stroke="#999"
            strokeWidth={strokeWidth}
            strokeDasharray="2,2"
        />
    )

    const renderHexagonBase = () => {
        const radius = Math.min(baseWidth, baseHeight) / 2
        const hexPoints = calculateHexagonPoints(baseCenterX, baseCenterY, radius)
        const points = formatPointsForSVG(hexPoints)
        return (
            <polygon
                points={points}
                fill="#e8e8e8"
                fillOpacity="0.3"
                stroke="#999"
                strokeWidth={strokeWidth}
                strokeDasharray="2,2"
            />
        )
    }

    const renderCircleBase = () => {
        const radius = Math.min(baseWidth, baseHeight) / 2
        return (
            <circle
                cx={baseCenterX}
                cy={baseCenterY}
                r={radius}
                fill="#e8e8e8"
                fillOpacity="0.3"
                stroke="#999"
                strokeWidth={strokeWidth}
                strokeDasharray="2,2"
            />
        )
    }

    const renderBase = () => {
        switch (baseShape) {
            case "rectangle":
                return renderRectangleBase()
            case "hexagon":
                return renderHexagonBase()
            case "circle":
                return renderCircleBase()
            default:
                return null
        }
    }

    const calculateTextPosition = () => {
        const lines = baseText.split("\n")
        const lineHeight = baseFontSize * 1.2
        const totalTextHeight = (lines.length - 1) * lineHeight + baseFontSize
        // La base en el preview está desplazada por el padding, por lo que su centro real es:
        const baseCenterY = -basePadding * cellSize + baseHeight / 2
        const startY = baseCenterY - totalTextHeight / 2 + baseFontSize * 0.8 + baseTextOffsetY

        let textX: number
        let textAnchor: "start" | "middle" | "end"

        switch (baseTextAlign) {
            case "left":
                textX = basePadding * cellSize + baseTextOffsetX
                textAnchor = "start"
                break
            case "right":
                textX = (gridWidth + basePadding) * cellSize + baseTextOffsetX
                textAnchor = "end"
                break
            case "center":
            default:
                textX = (gridWidth * cellSize) / 2 + baseTextOffsetX
                textAnchor = "middle"
                break
        }

        return { lines, lineHeight, startY, textX, textAnchor, totalTextHeight }
    }

    const renderBaseText = () => {
        if (!baseText || previewMode !== "dedication") return null

        const { lines, lineHeight, startY, textX, textAnchor, totalTextHeight } = calculateTextPosition()

        return (
            <text
                x={textX}
                y={startY}
                fontSize={baseFontSize}
                textAnchor={textAnchor}
                fill="#000"
                fontFamily={baseFontFamily}
                fontWeight="bold"
            >
                {lines.map((line: string, index: number) => (
                    <tspan key={index} x={textX} dy={index === 0 ? 0 : lineHeight}>
                        {line}
                    </tspan>
                ))}
            </text>
        )
    }

    const renderPieceTexture = (piece: Piece) => {
        if (!piece.texture) return null

        const texturePattern = generateTexture(piece.cells, cellSize, piece.texture, textureSpacing, textureRotation)
        if (!texturePattern) return null

        return (
            <path
                d={texturePattern}
                stroke="#333"
                strokeWidth={strokeWidth * 0.5}
                fill="none"
            />
        )
    }

    const renderPieceText = (piece: Piece, textPos: ReturnType<typeof getTextPosition>, fontSize: number) => {
        if (!includeText || !piece.text) return null

        const baseWidth =
            textPos.canUseDouble && piece.text.length <= 2 ? textPos.width * 0.7 : fontSize * piece.text.length * 0.6

        const backgroundColor = showColors
            ? piece.color
            : document.documentElement.classList.contains("dark")
                ? "#5252524d"
                : "#e8e8e84d"

        return (
            <>
                <rect
                    x={textPos.x - baseWidth / 2}
                    y={textPos.y - fontSize / 2 - fontSize * 0.1}
                    width={baseWidth}
                    height={fontSize * 1.2}
                    fill={backgroundColor}
                    rx={2}
                />
                <text
                    x={textPos.x}
                    y={textPos.y}
                    fontSize={fontSize}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#333"
                    fontFamily="Arial, sans-serif"
                    fontWeight="bold"
                >
                    {piece.text}
                </text>
            </>
        )
    }

    const renderPieces = () => {
        if (previewMode !== "pieces") return null

        return (
            <>
                {pieces.map((piece) => {
                    const textPos = getTextPosition(piece.cells, cellSize)
                    const fontSize = piece.text
                        ? calculateFontSize(piece.text, cellSize, textPos.width)
                        : cellSize * 0.5

                    return (
                        <g key={piece.id}>
                            <path
                                d={generatePiecePath(piece.cells, cellSize, cornerRadius)}
                                fill={showColors ? piece.color : "none"}
                                stroke="#333"
                                strokeWidth={strokeWidth}
                            />
                            {renderPieceTexture(piece)}
                            {renderPieceText(piece, textPos, fontSize)}
                        </g>
                    )
                })}
            </>
        )
    }

    return (
        <div className="flex-1 bg-muted/30 rounded-lg overflow-auto relative">
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <svg
                    viewBox={`${-basePadding * cellSize} ${-basePadding * cellSize} ${(gridWidth + basePadding * 2) * cellSize} ${(gridHeight + basePadding * 2) * cellSize}`}
                    className="drop-shadow-md"
                    style={{
                        width: `${(gridWidth + basePadding * 2) * cellSize * previewScale}px`,
                        height: `${(gridHeight + basePadding * 2) * cellSize * previewScale}px`,
                    }}
                >
                    {renderBase()}
                    {renderBaseText()}
                    {renderPieces()}
                </svg>
            </div>
        </div>
    )
}
