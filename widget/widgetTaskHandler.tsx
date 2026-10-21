import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { computeWidgetSummary } from "@/lib/widgetSummary";
import { renderDecompteWidget, WIDGET_NAME } from "@/widget/DecompteWidget";
import { readWidgetData } from "@/widget/readWidgetData";

/**
 * Appelé par Android (en tâche de fond, app fermée ou non) quand le widget est ajouté, redimensionné
 * ou à rafraîchir. Les appuis ouvrent l'app via un lien (`OPEN_URI`) : rien d'autre à traiter ici.
 */
export async function widgetTaskHandler({
	widgetInfo,
	widgetAction,
	renderWidget,
}: WidgetTaskHandlerProps) {
	if (widgetInfo.widgetName !== WIDGET_NAME) return;
	if (widgetAction === "WIDGET_DELETED" || widgetAction === "WIDGET_CLICK") return;
	renderWidget(renderDecompteWidget(computeWidgetSummary(await readWidgetData())));
}
