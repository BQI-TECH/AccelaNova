import { Navigate } from "react-router-dom";
import paths from "@/utils/paths";

export default function GeneralEmbeddingPreference() {
  return (
    <Navigate to={`${paths.settings.llmPreference()}#embedding`} replace />
  );
}
