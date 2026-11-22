import React from "react";
import { KeyRound, Settings, Users } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { SubPageId } from "../../types/gport";
import { GPortEmblem } from "../GPortLogo";
import { Button, Card, EmptyState, PageHeader } from "../ui";
import { APP_VERSION, breadcrumbOf } from "./pages";

/** System status strip at the bottom of the app. */
export const StatusBar: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="h-8 shrink-0 bg-white border-t border-line px-4 flex items-center gap-4 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-success-dot" aria-hidden="true" />
        {t("Connected TOS · SCADA · meters: normal", "Kết nối TOS · SCADA · Công tơ: bình thường")}
      </span>
      <span className="hidden sm:inline">
        {t("Mode", "Chế độ")}: <span className="text-ink font-medium">{t("Recommendation", "Khuyến nghị")}</span>
      </span>
      <span className="ml-auto">G-Port v{APP_VERSION}</span>
    </footer>
  );
};

/** Frame for pages that are not built yet. */
export const PlaceholderPage: React.FC<{ page: SubPageId; onBack: () => void }> = ({ page, onBack }) => {
  const { t } = useLanguage();
  const crumbs = breadcrumbOf(page, t);
  const Icon = page === "USERS" ? Users : Settings;
  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={crumbs} title={crumbs[crumbs.length - 1]} description={t("This area is part of the next release.", "Khu vực này thuộc phiên bản tiếp theo.")} />
      <Card>
        <EmptyState
          icon={Icon}
          title={t("Coming soon", "Sắp ra mắt")}
          description={
            page === "USERS"
              ? t("User accounts, roles and permissions per module will be managed here.", "Tài khoản, vai trò và phân quyền theo từng module sẽ được quản lý tại đây.")
              : t("Terminal parameters, tariffs, thresholds and integrations will be configured here.", "Tham số cảng, biểu giá, ngưỡng và kết nối hệ thống sẽ được cấu hình tại đây.")
          }
          action={<Button onClick={onBack}>{t("Back to overview", "Về trang tổng quan")}</Button>}
        />
      </Card>
    </div>
  );
};

/** Simple demo sign-in (mock SSO). */
export const LoginScreen: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const { t, toggleLang, lang } = useLanguage();
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-line rounded-card p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <GPortEmblem className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-semibold text-ink">G-Port</h1>
            <p className="text-sm text-muted">{t("Green port energy & carbon platform", "Nền tảng năng lượng & carbon cho cảng xanh")}</p>
          </div>
          <span className="inline-flex items-center h-6 px-2 rounded-full bg-warning-soft text-warning text-xs font-medium">{t("Demo environment", "Môi trường demo")}</span>
        </div>
        <Button variant="primary" icon={KeyRound} className="w-full" onClick={onSignIn}>
          {t("Sign in with SSO", "Đăng nhập bằng SSO")}
        </Button>
        <p className="text-xs text-muted text-center">{t("Simulated single sign-on – no credentials are sent.", "SSO giả lập – không gửi thông tin đăng nhập.")}</p>
      </div>
      <button type="button" onClick={toggleLang} className="mt-4 text-xs text-muted hover:text-ink cursor-pointer">
        {lang === "VN" ? "English" : "Tiếng Việt"}
      </button>
    </div>
  );
};
