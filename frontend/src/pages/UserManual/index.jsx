import Sidebar from "@/components/Sidebar";
import { isMobile } from "react-device-detect";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import renderMarkdown from "@/utils/chat/markdown";
import paths from "@/utils/paths";
import { USER_MANUAL_MARKDOWN } from "./content";

export default function UserManual() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      {!isMobile && <Sidebar />}
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-8"
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-lg leading-6 font-bold text-white">User Manual</p>
            <Link
              to={paths.home()}
              className="text-sm text-theme-text-secondary hover:text-white underline"
            >
              Back to workspaces
            </Link>
          </div>
          <div
            className="text-white text-sm leading-6 user-manual-content [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:mt-4 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_table]:w-full [&_table]:text-left [&_table]:mb-4 [&_th]:border-b [&_th]:border-white/20 [&_th]:py-2 [&_td]:border-b [&_td]:border-white/10 [&_td]:py-2 [&_td]:pr-3 [&_code]:text-xs [&_a]:underline"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(renderMarkdown(USER_MANUAL_MARKDOWN)),
            }}
          />
        </div>
      </div>
    </div>
  );
}
