import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { PuzzleActionsProps } from "@/types/components"

export function PuzzleActions({
    onDownload,
    onRegenerate,
    previewMode,
    onPreviewModeChange,
    showDetails,
    onShowDetailsChange,
    zoom,
    onZoomChange,
    pieceCount,
}: PuzzleActionsProps) {
    return (
        <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-4 space-y-4">
                <CardTitle>Preview ({pieceCount} piezas)</CardTitle>
                <div className="flex gap-2">
                    <Button onClick={onDownload} className="flex-1 gap-2" size="lg">
                        <Download className="w-5 h-5" />
                        Descargar SVG
                    </Button>
                    <Button onClick={onRegenerate} variant="outline" className="flex-1 gap-2" size="lg">
                        <RefreshCw className="w-5 h-5" />
                        Regenerar
                    </Button>
                </div>
                <div className="space-y-2">
                    <Label>Modo de vista previa</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={previewMode === "pieces" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPreviewModeChange("pieces")}
                            className="text-xs"
                        >
                            Solo piezas
                        </Button>
                        <Button
                            variant={previewMode === "dedication" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPreviewModeChange("dedication")}
                            className="text-xs"
                        >
                            Con dedicatoria
                        </Button>
                    </div>
                </div>
                {previewMode === "pieces" && (
                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-details" className="text-sm">
                            Mostrar detalles
                        </Label>
                        <input
                            id="show-details"
                            type="checkbox"
                            checked={showDetails}
                            onChange={(e) => onShowDetailsChange(e.target.checked)}
                            className="h-4 w-4"
                        />
                    </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Zoom: {zoom}%</Label>
                    <Slider
                        value={[zoom]}
                        onValueChange={([v]) => onZoomChange(v)}
                        min={50}
                        max={300}
                        step={10}
                        className="flex-1"
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                {/* El contenido SVG será inyectado aquí como children */}
            </CardContent>
        </Card>
    )
}
