"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, RefreshCw, Grid3X3, Type, ChevronDown } from "lucide-react"
import type { BaseShape } from "@/lib/polyomino"
import { generateSVG } from "@/lib/svgGenerator"
import { getTextPosition, calculateFontSize } from "@/lib/polyomino"
import { EMOJI_CATEGORIES, ALL_KAWAII_EMOJIS } from "@/constants/emojis"
import { SYSTEM_FONTS } from "@/constants/fonts"
import { COLOR_PALETTES } from "@/lib/colorPalettes"
import { usePolyominoState } from "@/hooks/usePolyominoState"
import { usePuzzlePieces } from "@/hooks/usePuzzlePieces"
import { CollapsibleCard } from "@/components/CollapsibleCard"
import { PuzzlePreview } from "@/components/PuzzlePreview"
import { ThemeToggle } from "@/components/ThemeToggle"
import { downloadSVGFile, generatePuzzleFilename } from "@/lib/svgDownload"
import { parseTextIntoUnits } from "@/lib/textParser"
import Link from "next/link"
import { HelpCircle } from "lucide-react"

// Componentes de sección
function PuzzleParamsSection({ state }: { state: ReturnType<typeof usePolyominoState> }) {
  return (
    <CollapsibleCard
      title="Parametros de Puzzle"
      open={state.showPuzzleParams}
      onOpenChange={state.setShowPuzzleParams}
    >
      <div className="space-y-2">
        <Label>Forma del puzzle</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={state.baseShape === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => state.setBaseShape("rectangle")}
            className="text-xs"
          >
            ▭ Rectángulo
          </Button>
          <Button
            variant={state.baseShape === "hexagon" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              state.setBaseShape("hexagon")
              if (state.gridHeight !== state.gridWidth) state.setGridHeight(state.gridWidth)
            }}
            className="text-xs"
          >
            ⬡ Hexágono
          </Button>
          <Button
            variant={state.baseShape === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              state.setBaseShape("circle")
              if (state.gridHeight !== state.gridWidth) state.setGridHeight(state.gridWidth)
            }}
            className="text-xs"
          >
            ◯ Círculo
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Ancho: {state.gridWidth} celdas</Label>
          <span className="text-sm text-muted-foreground">{state.gridWidth * state.cellSize}mm</span>
        </div>
        <Slider
          value={[state.gridWidth]}
          onValueChange={([v]) => {
            state.setGridWidth(v)
            if (state.baseShape !== "rectangle") state.setGridHeight(v)
          }}
          min={5}
          max={30}
          step={1}
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className={state.baseShape !== "rectangle" ? "text-muted-foreground" : ""}>
            Alto: {state.gridHeight} celdas
          </Label>
          <span className="text-sm text-muted-foreground">{state.gridHeight * state.cellSize}mm</span>
        </div>
        <Slider
          value={[state.gridHeight]}
          onValueChange={([v]) => state.setGridHeight(v)}
          min={5}
          max={30}
          step={1}
          disabled={state.baseShape !== "rectangle"}
          className={state.baseShape !== "rectangle" ? "opacity-50" : ""}
        />
        {state.baseShape !== "rectangle" && (
          <p className="text-xs text-muted-foreground italic">
            Para {state.baseShape === "hexagon" ? "hexágonos" : "círculos"}, el tamaño se determina por el
            ancho
          </p>
        )}
      </div>
    </CollapsibleCard>
  )
}

function PieceSizeSection({ state }: { state: ReturnType<typeof usePolyominoState> }) {
  return (
    <CollapsibleCard title="Tamano de Piezas" open={state.showPieceSize} onOpenChange={state.setShowPieceSize}>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Minimo: {state.minPieceSize} celdas</Label>
          <span className="text-sm text-muted-foreground">{state.minPieceSize * state.cellSize}mm</span>
        </div>
        <Slider
          value={[state.minPieceSize]}
          onValueChange={([v]) => {
            state.setMinPieceSize(v)
            if (v > state.maxPieceSize) state.setMaxPieceSize(v)
          }}
          min={2}
          max={20}
          step={1}
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Maximo: {state.maxPieceSize} celdas</Label>
          <span className="text-sm text-muted-foreground">{state.maxPieceSize * state.cellSize}mm</span>
        </div>
        <Slider
          value={[state.maxPieceSize]}
          onValueChange={([v]) => {
            state.setMaxPieceSize(v)
            if (v < state.minPieceSize) state.setMinPieceSize(v)
          }}
          min={2}
          max={20}
          step={1}
        />
      </div>
    </CollapsibleCard>
  )
}

function PieceShapeSection({ state }: { state: ReturnType<typeof usePolyominoState> }) {
  return (
    <CollapsibleCard title="Forma de Piezas" open={state.showPieceShape} onOpenChange={state.setShowPieceShape}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="intricate-mode">Modo intrincado</Label>
          <p className="text-xs text-muted-foreground">Piezas que se entrelazan entre si</p>
        </div>
        <Switch id="intricate-mode" checked={state.intricateMode} onCheckedChange={state.setIntricateMode} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Serpenteo</Label>
          <span className="text-sm text-muted-foreground">
            {state.snakiness < 0.3 ? "Bloques" : state.snakiness < 0.7 ? "Mixto" : "Serpientes"}
          </span>
        </div>
        <Slider
          value={[state.snakiness * 100]}
          onValueChange={([v]) => state.setSnakiness(v / 100)}
          min={0}
          max={100}
          step={5}
        />
        <p className="text-xs text-muted-foreground">Controla si las piezas son compactas o alargadas</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Complejidad</Label>
          <span className="text-sm text-muted-foreground">
            {state.complexity < 0.3 ? "Simple" : state.complexity < 0.7 ? "Media" : "Alta"}
          </span>
        </div>
        <Slider
          value={[state.complexity * 100]}
          onValueChange={([v]) => state.setComplexity(v / 100)}
          min={0}
          max={100}
          step={5}
        />
        <p className="text-xs text-muted-foreground">Anade ramificaciones y formas en L/T/Y</p>
      </div>
    </CollapsibleCard>
  )
}

function CustomizationSection({
  state,
  addEmoji,
  onRegenerateText,
}: {
  state: ReturnType<typeof usePolyominoState>
  addEmoji: (emoji: string) => void
  onRegenerateText: () => void
}) {
  return (
    <CollapsibleCard
      title={
        <span className="flex items-center gap-2">
          <Type className="w-4 h-4" />
          Personalizacion
        </span>
      }
      open={state.showCustomization}
      onOpenChange={state.setShowCustomization}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="include-text">Incluir texto/emojis</Label>
          <p className="text-xs text-muted-foreground">Graba caracteres en las piezas</p>
        </div>
        <Switch id="include-text" checked={state.includeText} onCheckedChange={state.setIncludeText} />
      </div>
      {state.includeText && (
        <>
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Nota:</strong> El texto se exporta como elementos {'<text>'} en SVG. Si tu máquina
                láser no los acepta, abre el SVG en Inkscape (Trayecto → Objeto a trayecto) o Illustrator
                (Texto → Crear contornos) para convertirlos a paths.
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-text">Texto personalizado</Label>
            <Textarea
              id="custom-text"
              placeholder="Escribe o selecciona emojis abajo..."
              value={state.customText}
              onChange={(e) => state.setCustomText(e.target.value)}
              className="min-h-15 resize-none"
            />
            <div className="flex items-center gap-2">
              {state.customText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => state.setCustomText("")}
                  className="text-xs text-muted-foreground h-6 px-2"
                >
                  Limpiar
                </Button>
              )}
              {state.customText && (
                <span className="text-xs text-muted-foreground">
                  {parseTextIntoUnits(state.customText).length} elemento(s)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Libreria Kawaii</Label>
            <div className="flex flex-wrap gap-1">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <Button
                  key={category}
                  variant={state.selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    state.setSelectedCategory(state.selectedCategory === category ? null : category)
                  }
                  className="text-xs h-7 px-2"
                >
                  {category}
                </Button>
              ))}
            </div>

            {state.selectedCategory && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {EMOJI_CATEGORIES[state.selectedCategory as keyof typeof EMOJI_CATEGORIES].map(
                    (emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => addEmoji(emoji)}
                        className="h-8 px-2 hover:bg-primary/20 text-base"
                        title={`Anadir ${emoji}`}
                      >
                        {emoji}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Los emojis kawaii usaran 2 celdas horizontales cuando haya espacio disponible
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Distribucion</Label>
              {state.textDistribution === "random" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerateText}
                  className="h-7 px-2 text-xs gap-1"
                  title="Regenerar distribucion aleatoria"
                >
                  <RefreshCw className="w-3 h-3" />
                  Redistribuir
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={state.textDistribution === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setTextDistribution("all")}
                className="text-xs"
              >
                Todas
              </Button>
              <Button
                variant={state.textDistribution === "alternate" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setTextDistribution("alternate")}
                className="text-xs"
              >
                Alternar
              </Button>
              <Button
                variant={state.textDistribution === "random" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setTextDistribution("random")}
                className="text-xs"
              >
                Aleatorio
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {state.textDistribution === "all" && "Un elemento en cada pieza"}
              {state.textDistribution === "alternate" && "Una pieza si, una no"}
              {state.textDistribution === "random" && "Distribucion aleatoria"}
            </p>
          </div>
        </>
      )}
    </CollapsibleCard>
  )
}

function TexturesSection({
  state,
  toggleTexture,
  onRegenerateTextures,
}: {
  state: ReturnType<typeof usePolyominoState>
  toggleTexture: (texture: any) => void
  onRegenerateTextures: () => void
}) {
  return (
    <CollapsibleCard title="Texturas" open={state.showTextures} onOpenChange={state.setShowTextures}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="include-textures">Incluir texturas</Label>
          <p className="text-xs text-muted-foreground">Añade patrones grabables con láser</p>
        </div>
        <Switch
          id="include-textures"
          checked={state.includeTextures}
          onCheckedChange={state.setIncludeTextures}
        />
      </div>

      {state.includeTextures && (
        <>
          <div className="space-y-2">
            <Label>Tipos de textura ({state.selectedTextures.length} seleccionadas)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={state.selectedTextures.includes("linesH") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("linesH")}
                className="text-xs"
              >
                ━━━
              </Button>
              <Button
                variant={state.selectedTextures.includes("linesV") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("linesV")}
                className="text-xs"
              >
                ┃┃┃
              </Button>
              <Button
                variant={state.selectedTextures.includes("linesDiag") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("linesDiag")}
                className="text-xs"
              >
                {"///"}
              </Button>
              <Button
                variant={state.selectedTextures.includes("grid") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("grid")}
                className="text-xs"
              >
                ╋╋╋
              </Button>
              <Button
                variant={state.selectedTextures.includes("dots") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("dots")}
                className="text-xs"
              >
                ∙∙∙
              </Button>
              <Button
                variant={state.selectedTextures.includes("waves") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("waves")}
                className="text-xs"
              >
                ∿∿∿
              </Button>
              <Button
                variant={state.selectedTextures.includes("circles") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("circles")}
                className="text-xs"
              >
                ◯◯◯
              </Button>
              <Button
                variant={state.selectedTextures.includes("zigzag") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("zigzag")}
                className="text-xs"
              >
                ⦦⦦⦦
              </Button>
              <Button
                variant={state.selectedTextures.includes("cross") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("cross")}
                className="text-xs"
              >
                ✕✕✕
              </Button>
              <Button
                variant={state.selectedTextures.includes("hexagon") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTexture("hexagon")}
                className="text-xs"
              >
                ⬡⬡⬡
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Haz clic para seleccionar/deseleccionar texturas
            </p>
          </div>
          <div className="space-y-2">
            <Label>Espaciado: {state.textureSpacing}mm</Label>
            <Slider
              value={[state.textureSpacing]}
              onValueChange={([v]) => state.setTextureSpacing(v)}
              min={1}
              max={5}
              step={0.5}
            />
          </div>
          <div className="space-y-2">
            <Label>Rotación: {state.textureRotation}°</Label>
            <Slider
              value={[state.textureRotation]}
              onValueChange={([v]) => state.setTextureRotation(v)}
              min={0}
              max={180}
              step={15}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Distribucion</Label>
              {state.textureDistribution === "random" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerateTextures}
                  className="h-7 px-2 text-xs gap-1"
                  title="Regenerar distribucion aleatoria de texturas"
                >
                  <RefreshCw className="w-3 h-3" />
                  Redistribuir
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={state.textureDistribution === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setTextureDistribution("all")}
                className="text-xs"
              >
                Todas
              </Button>
              <Button
                variant={state.textureDistribution === "alternate" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setTextureDistribution("alternate")}
                className="text-xs"
              >
                Alternar
              </Button>
              <Button
                variant={state.textureDistribution === "random" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setTextureDistribution("random")}
                className="text-xs"
              >
                Aleatorio
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {state.textureDistribution === "all" && "Textura en todas las piezas"}
              {state.textureDistribution === "alternate" && "Una pieza si, una no"}
              {state.textureDistribution === "random" && "Distribucion aleatoria"}
            </p>
          </div>
        </>
      )}
    </CollapsibleCard>
  )
}

function LaserParamsSection({ state }: { state: ReturnType<typeof usePolyominoState> }) {
  return (
    <CollapsibleCard title="Parametros Laser" open={state.showLaserParams} onOpenChange={state.setShowLaserParams}>
      <div className="space-y-2">
        <Label>Tamano de celda: {state.cellSize}mm</Label>
        <Slider
          value={[state.cellSize]}
          onValueChange={([v]) => state.setCellSize(v)}
          min={5}
          max={20}
          step={1}
        />
      </div>
      <div className="space-y-2">
        <Label>Radio de esquina: {state.cornerRadius}mm</Label>
        <Slider
          value={[state.cornerRadius * 10]}
          onValueChange={([v]) => state.setCornerRadius(v / 10)}
          min={0}
          max={30}
          step={1}
        />
      </div>
      <div className="space-y-2">
        <Label>Grosor de linea: {state.strokeWidth}mm</Label>
        <Slider
          value={[state.strokeWidth * 1000]}
          onValueChange={([v]) => state.setStrokeWidth(v / 1000)}
          min={5}
          max={500}
          step={5}
        />
      </div>
      <div className="space-y-2">
        <Label>Margen con base: {state.baseMargin}mm</Label>
        <Slider
          value={[state.baseMargin]}
          onValueChange={([v]) => state.setBaseMargin(v)}
          min={5}
          max={50}
          step={1}
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>
            Borde de base: {state.basePadding} {state.basePadding === 1 ? "celda" : "celdas"}
          </Label>
          <span className="text-sm text-muted-foreground">
            {state.basePadding * state.cellSize}mm por lado
          </span>
        </div>
        <Slider
          value={[state.basePadding]}
          onValueChange={([v]) => state.setBasePadding(v)}
          min={0}
          max={5}
          step={1}
        />
      </div>
    </CollapsibleCard>
  )
}

function LaserColorsSection({ state }: { state: ReturnType<typeof usePolyominoState> }) {
  return (
    <CollapsibleCard title="Colores Láser" open={state.showLaserColors} onOpenChange={state.setShowLaserColors}>
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="cut-color" className="text-sm">
              Corte (piezas, base)
            </Label>
            <input
              id="cut-color"
              type="color"
              value={state.cutColor}
              onChange={(e) => state.setCutColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-input"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="engrave-color" className="text-sm">
              Grabado (texturas)
            </Label>
            <input
              id="engrave-color"
              type="color"
              value={state.engraveColor}
              onChange={(e) => state.setEngraveColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-input"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="raster-color" className="text-sm">
              Raster (texto/emojis)
            </Label>
            <input
              id="raster-color"
              type="color"
              value={state.rasterColor}
              onChange={(e) => state.setRasterColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-input"
            />
          </div>
        </div>
      </div>
    </CollapsibleCard>
  )
}

function BaseCustomizationSection({ state }: { state: ReturnType<typeof usePolyominoState> }) {
  return (
    <CollapsibleCard
      title="Personalización de Base"
      open={state.showBaseCustomization}
      onOpenChange={state.setShowBaseCustomization}
    >
      <div className="space-y-2">
        <Label htmlFor="base-text">Texto en la base</Label>
        <Textarea
          id="base-text"
          placeholder="Escribe un texto para grabar en la base..."
          value={state.baseText}
          onChange={(e) => state.setBaseText(e.target.value)}
          className="min-h-15 resize-none"
        />
        {state.baseText && (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Nota:</strong> El texto se exporta como {'<text>'} SVG. Si tu máquina láser no lo
                acepta, conviértelo a paths en Inkscape (Trayecto → Objeto a trayecto) o Illustrator
                (Texto → Crear contornos).
              </span>
            </p>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Tipo de letra</Label>
        <Select value={state.baseFontFamily} onValueChange={state.setBaseFontFamily}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una fuente" />
          </SelectTrigger>
          <SelectContent>
            {SYSTEM_FONTS.map((font) => (
              <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.fallback }}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tamaño del texto: {state.baseFontSize}mm</Label>
        <Slider
          value={[state.baseFontSize]}
          onValueChange={([v]) => state.setBaseFontSize(v)}
          min={2}
          max={20}
          step={0.5}
        />
      </div>
      <div className="space-y-2">
        <Label>Alineación</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={state.baseTextAlign === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => state.setBaseTextAlign("left")}
            className="text-xs"
          >
            ← Izquierda
          </Button>
          <Button
            variant={state.baseTextAlign === "center" ? "default" : "outline"}
            size="sm"
            onClick={() => state.setBaseTextAlign("center")}
            className="text-xs"
          >
            ↔ Centro
          </Button>
          <Button
            variant={state.baseTextAlign === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => state.setBaseTextAlign("right")}
            className="text-xs"
          >
            Derecha →
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>
          Posición horizontal: {state.baseTextOffsetX > 0 ? "+" : ""}
          {state.baseTextOffsetX}mm
        </Label>
        <Slider
          value={[state.baseTextOffsetX]}
          onValueChange={([v]) => state.setBaseTextOffsetX(v)}
          min={-50}
          max={50}
          step={0.5}
        />
      </div>
      <div className="space-y-2">
        <Label>
          Posición vertical: {state.baseTextOffsetY > 0 ? "+" : ""}
          {state.baseTextOffsetY}mm
        </Label>
        <Slider
          value={[state.baseTextOffsetY]}
          onValueChange={([v]) => state.setBaseTextOffsetY(v)}
          min={-50}
          max={50}
          step={0.5}
        />
      </div>
    </CollapsibleCard>
  )
}

function ViewSection({ state }: { state: ReturnType<typeof usePolyominoState> }) {
  return (
    <CollapsibleCard title="Vista" open={state.showView} onOpenChange={state.setShowView}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="show-colors">Mostrar colores</Label>
          <p className="text-xs text-muted-foreground">Visualiza las piezas con colores</p>
        </div>
        <Switch id="show-colors" checked={state.showColors} onCheckedChange={state.setShowColors} />
      </div>
      {state.showColors && (
        <div className="space-y-2">
          <Label htmlFor="color-palette">Paleta de colores</Label>
          <Select value={state.colorPalette} onValueChange={state.setColorPalette}>
            <SelectTrigger id="color-palette">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_PALETTES.map((palette) => (
                <SelectItem key={palette.id} value={palette.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {palette.colors.slice(0, 6).map((color, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span>{palette.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label>Semilla: {state.seed}</Label>
        <Slider
          value={[state.seed % 1000]}
          onValueChange={([v]) => state.setSeed(v)}
          min={0}
          max={999}
          step={1}
        />
      </div>
    </CollapsibleCard>
  )
}

function ActionButtons({ regenerate, downloadSVG }: { regenerate: () => void; downloadSVG: () => void }) {
  return (
    <div className="flex gap-3">
      <Button onClick={regenerate} variant="outline" className="flex-1 bg-transparent">
        <RefreshCw className="w-4 h-4 mr-2" />
        Regenerar
      </Button>
      <Button onClick={downloadSVG} className="flex-1">
        <Download className="w-4 h-4 mr-2" />
        Descargar SVG
      </Button>
    </div>
  )
}

function PreviewCard({
  state,
  pieces,
  previewScale,
}: {
  state: ReturnType<typeof usePolyominoState>
  pieces: any[]
  previewScale: number
}) {
  return (
    <Card className="order-2 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Vista Previa</CardTitle>
          {state.baseText && (
            <div className="flex gap-1">
              <Button
                variant={state.previewMode === "pieces" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setPreviewMode("pieces")}
                className="text-xs h-7"
              >
                Piezas
              </Button>
              <Button
                variant={state.previewMode === "dedication" ? "default" : "outline"}
                size="sm"
                onClick={() => state.setPreviewMode("dedication")}
                className="text-xs h-7"
              >
                Dedicatoria
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Zoom: {state.zoom}%</Label>
          <Slider
            value={[state.zoom]}
            onValueChange={([v]) => state.setZoom(v)}
            min={50}
            max={300}
            step={10}
            className="flex-1"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <PuzzlePreview
          pieces={pieces}
          gridWidth={state.gridWidth}
          gridHeight={state.gridHeight}
          cellSize={state.cellSize}
          basePadding={state.basePadding}
          baseShape={state.baseShape}
          cornerRadius={state.cornerRadius}
          strokeWidth={state.strokeWidth}
          previewScale={previewScale}
          showColors={state.showColors}
          includeText={state.includeText}
          textureRotation={state.textureRotation}
          textureSpacing={state.textureSpacing}
          previewMode={state.previewMode}
          baseText={state.baseText}
          baseFontSize={state.baseFontSize}
          baseFontFamily={state.baseFontFamily}
          baseTextAlign={state.baseTextAlign}
          baseTextOffsetX={state.baseTextOffsetX}
          baseTextOffsetY={state.baseTextOffsetY}
        />
        <div className="mt-4 space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            {pieces.length} piezas | {state.gridWidth * state.cellSize}mm x{" "}
            {state.gridHeight * state.cellSize}mm
          </div>
          <Collapsible open={state.showDetails} onOpenChange={state.setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs">
                <ChevronDown
                  className={`h-4 w-4 mr-2 transition-transform ${state.showDetails ? "rotate-180" : ""}`}
                />
                {state.showDetails ? "Ocultar detalles" : "Ver detalles"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="text-xs text-muted-foreground px-4 pt-2">
                <div className="font-semibold mb-2">Dimensiones:</div>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between py-0.5">
                    <span>Puzzle:</span>
                    <span className="font-mono">
                      {state.gridWidth * state.cellSize}mm x {state.gridHeight * state.cellSize}mm
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Marco:</span>
                    <span className="font-mono">
                      {(state.gridWidth + state.basePadding * 2) * state.cellSize}mm x{" "}
                      {(state.gridHeight + state.basePadding * 2) * state.cellSize}mm
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Base:</span>
                    <span className="font-mono">
                      {(state.gridWidth + state.basePadding * 2) * state.cellSize}mm x{" "}
                      {(state.gridHeight + state.basePadding * 2) * state.cellSize}mm
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-t pt-1 mt-1">
                    <span className="font-semibold">Lienzo total:</span>
                    <span className="font-mono font-semibold">
                      {(state.gridWidth + state.basePadding * 2) * state.cellSize * 2 +
                        state.baseMargin}
                      mm x{" "}
                      {Math.max(
                        state.gridHeight * state.cellSize,
                        (state.gridHeight + state.basePadding * 2) * state.cellSize,
                      )}
                      mm
                    </span>
                  </div>
                </div>
                <div className="font-semibold mb-1">Distribución por tamaño:</div>
                {(() => {
                  const sizeCount = pieces.reduce(
                    (acc, piece) => {
                      const size = piece.cells.length
                      acc[size] = (acc[size] || 0) + 1
                      return acc
                    },
                    {} as Record<number, number>,
                  )

                  return (Object.entries(sizeCount) as [string, number][])
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([size, count]) => (
                      <div key={size} className="flex justify-between py-0.5">
                        <span>
                          {size} {Number(size) === 1 ? "celda" : "celdas"}:
                        </span>
                        <span className="font-mono">
                          {count} {count === 1 ? "pieza" : "piezas"}
                        </span>
                      </div>
                    ))
                })()}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  )
}

export function PolyominoPuzzleGenerator() {
  const state = usePolyominoState()

  const addEmoji = (emoji: string) => {
    state.setCustomText((prev) => prev + emoji)
  }

  const toggleTexture = (
    texture:
      | "linesH"
      | "linesV"
      | "linesDiag"
      | "grid"
      | "dots"
      | "waves"
      | "circles"
      | "zigzag"
      | "cross"
      | "hexagon",
  ) => {
    state.setSelectedTextures((prev) => {
      if (prev.includes(texture)) {
        return prev.filter((t) => t !== texture)
      } else {
        return [...prev, texture]
      }
    })
  }

  const pieces = usePuzzlePieces({
    gridWidth: state.gridWidth,
    gridHeight: state.gridHeight,
    minPieceSize: state.minPieceSize,
    maxPieceSize: state.maxPieceSize,
    seed: state.seed,
    intricateMode: state.intricateMode,
    snakiness: state.snakiness,
    complexity: state.complexity,
    baseShape: state.baseShape,
    colorPalette: state.colorPalette,
    includeText: state.includeText,
    customText: state.customText,
    textDistribution: state.textDistribution,
    textSeed: state.textSeed,
    includeTextures: state.includeTextures,
    selectedTextures: state.selectedTextures,
    textureDistribution: state.textureDistribution,
    textureSeed: state.textureSeed,
  })

  const regenerateTextDistribution = useCallback(() => {
    state.setTextSeed(Date.now())
  }, [state])

  const regenerateTextureDistribution = useCallback(() => {
    state.setTextureSeed(Date.now())
  }, [state])

  const regenerate = useCallback(() => {
    state.setSeed(Date.now())
  }, [state])

  const downloadSVG = useCallback(() => {
    const svgContent = generateSVG(
      pieces,
      state.gridWidth,
      state.gridHeight,
      state.cellSize,
      state.cornerRadius,
      state.strokeWidth,
      false,
      state.includeText,
      state.baseMargin,
      state.basePadding,
      state.textureSpacing,
      state.textureRotation,
      state.baseText,
      state.baseFontFamily,
      state.baseFontSize,
      state.cutColor,
      state.engraveColor,
      state.rasterColor,
      state.baseShape,
      state.baseTextOffsetX,
      state.baseTextOffsetY,
      state.baseTextAlign,
      getTextPosition,
      calculateFontSize,
    )

    const filename = generatePuzzleFilename(state.gridWidth, state.gridHeight)
    downloadSVGFile(svgContent, filename)
  }, [
    pieces,
    state.gridWidth,
    state.gridHeight,
    state.cellSize,
    state.cornerRadius,
    state.strokeWidth,
    state.includeText,
    state.baseMargin,
    state.basePadding,
    state.textureSpacing,
    state.textureRotation,
    state.baseText,
    state.baseFontFamily,
    state.baseFontSize,
    state.cutColor,
    state.engraveColor,
    state.rasterColor,
    state.baseShape,
    state.baseTextOffsetX,
    state.baseTextOffsetY,
    state.baseTextAlign,
  ])

  const previewScale = (400 / Math.max(state.gridWidth, state.gridHeight) / state.cellSize) * (state.zoom / 100)

  return (
    <div className="h-screen flex flex-col max-w-7xl mx-auto p-4">
      <div className="text-center space-y-2 pb-4">
        <div className="flex items-center justify-center gap-3 relative">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Grid3X3 className="w-8 h-8" />
            Generador de Puzzles Poliominos
          </h1>
          <div className="absolute right-0 flex items-center gap-2">
            <Link href="/ayuda">
              <Button variant="ghost" size="sm" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Ayuda
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-4 flex-1 min-h-0">
        <div className="order-1 space-y-4 h-full overflow-y-auto pr-2">
          <PuzzleParamsSection state={state} />
          <PieceSizeSection state={state} />
          <PieceShapeSection state={state} />
          <CustomizationSection state={state} addEmoji={addEmoji} onRegenerateText={regenerateTextDistribution} />
          <TexturesSection state={state} toggleTexture={toggleTexture} onRegenerateTextures={regenerateTextureDistribution} />
          <LaserParamsSection state={state} />
          <LaserColorsSection state={state} />
          <BaseCustomizationSection state={state} />
          <ViewSection state={state} />
          <ActionButtons regenerate={regenerate} downloadSVG={downloadSVG} />
        </div>

        <PreviewCard state={state} pieces={pieces} previewScale={previewScale} />
      </div>
    </div>
  )
}
