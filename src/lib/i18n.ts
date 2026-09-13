"use client";
// ponytail: lightweight client-side i18n. No next-intl, no middleware, no server config.
// UI strings only (button labels, hints). Editor content (headlines) was already multi-locale via Supabase.
//
// Locale detection priority:
// 1. localStorage("shotshot:locale") if set
// 2. navigator.language
// 3. "en" fallback

import * as React from "react";

export type Locale = "en" | "ko" | "ja" | "zh" | "es" | "de" | "fr";

const STORAGE_KEY = "shotshot:locale";

type Dict = Record<string, string>;

const EN: Dict = {
  "editor.title": "Editor",
  "editor.screens": "Screens",
  "editor.appName": "App name",
  "editor.export": "Export bundle",
  "editor.signedIn": "Signed in",
  "editor.signIn": "Sign in",
  "editor.aiCaptions": "AI captions",
  "editor.translateAll": "Translate all",
  "editor.landing": "Landing",
  "editor.uploadToStore": "Upload to store",
  "editor.tip": "Tip",
  "editor.preview.scale": "Scale",
  "editor.preview.inverted": "Inverted",
  "editor.caption.placeholder": "Your headline\nlives here.",
  "editor.caption.verify": "Verify caption appears in screenshot",
  "editor.layout.hero": "Hero",
  "editor.layout.device-bottom": "Device bottom",
  "editor.layout.device-top": "Device top",
  "editor.layout.two-devices": "Two devices",
  "editor.layout.no-device": "No device",
  "editor.layout.split-landscape": "Split landscape",
  "editor.layout.feature-graphic": "Feature graphic",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.duplicate": "Duplicate",
  "common.add": "Add",
  "common.connected": "Connected",
  "common.isolated": "Isolated",
  "common.loading": "Loading…",
  "landing.title": "App Store screenshots that don't get rejected.",
  "landing.subtitle": "Drag, drop, AI-caption, OCR-verify, export every size. Free forever for indie devs.",
  "landing.cta": "Open editor — it's free",
  "admin.title": "Shotshot admin",
  "admin.mrr": "MRR",
  "admin.arr": "ARR",
  "admin.pro": "Pro",
  "admin.lifetime": "Lifetime",
  "admin.users": "Total users",
  "admin.recent": "Recent payments",
};

const KO: Dict = {
  "editor.title": "에디터",
  "editor.screens": "화면",
  "editor.appName": "앱 이름",
  "editor.export": "번들 내보내기",
  "editor.signedIn": "로그인됨",
  "editor.signIn": "로그인",
  "editor.aiCaptions": "AI 캡션",
  "editor.translateAll": "일괄 번역",
  "editor.landing": "랜딩",
  "editor.uploadToStore": "스토어 업로드",
  "editor.tip": "팁",
  "editor.preview.scale": "크기",
  "editor.preview.inverted": "다크",
  "editor.caption.placeholder": "헤드라인을\n여기에.",
  "editor.caption.verify": "캡션이 스크린샷에 있는지 확인",
  "editor.layout.hero": "히어로",
  "editor.layout.device-bottom": "하단 디바이스",
  "editor.layout.device-top": "상단 디바이스",
  "editor.layout.two-devices": "디바이스 2개",
  "editor.layout.no-device": "디바이스 없음",
  "editor.layout.split-landscape": "좌우 분할",
  "editor.layout.feature-graphic": "Feature Graphic",
  "common.save": "저장",
  "common.cancel": "취소",
  "common.delete": "삭제",
  "common.duplicate": "복제",
  "common.add": "추가",
  "common.connected": "연결됨",
  "common.isolated": "분리됨",
  "common.loading": "로딩 중…",
  "landing.title": "앱 리젝 방지 스크린샷 메이커.",
  "landing.subtitle": "드래그, 드롭, AI 캡션, OCR 검증, 모든 사이즈. 인디 개발자 영원히 무료.",
  "landing.cta": "에디터 열기 — 무료",
  "admin.title": "Shotshot 관리자",
  "admin.mrr": "월 매출",
  "admin.arr": "연 매출",
  "admin.pro": "Pro",
  "admin.lifetime": "평생",
  "admin.users": "총 사용자",
  "admin.recent": "최근 결제",
};

const JA: Dict = {
  "editor.title": "エディター",
  "editor.screens": "画面",
  "editor.appName": "アプリ名",
  "editor.export": "バンドル書き出し",
  "editor.signedIn": "ログイン中",
  "editor.signIn": "ログイン",
  "editor.aiCaptions": "AI キャプション",
  "editor.translateAll": "一括翻訳",
  "editor.landing": "ランディング",
  "editor.uploadToStore": "ストアにアップロード",
  "editor.tip": "チップ",
  "editor.preview.scale": "スケール",
  "editor.preview.inverted": "ダーク",
  "editor.caption.placeholder": "見出しを\nここに。",
  "editor.caption.verify": "キャプションがスクリーンショットにあるか確認",
  "editor.layout.hero": "ヒーロー",
  "editor.layout.device-bottom": "下部デバイス",
  "editor.layout.device-top": "上部デバイス",
  "editor.layout.two-devices": "デバイス2つ",
  "editor.layout.no-device": "デバイスなし",
  "editor.layout.split-landscape": "左右分割",
  "editor.layout.feature-graphic": "フィーチャーグラフィック",
  "common.save": "保存",
  "common.cancel": "キャンセル",
  "common.delete": "削除",
  "common.duplicate": "複製",
  "common.add": "追加",
  "common.connected": "接続",
  "common.isolated": "分離",
  "common.loading": "読み込み中…",
  "landing.title": "リジェクトされないアプリ用スクリーンショット。",
  "landing.subtitle": "ドラッグ、ドロップ、AIキャプション、OCR検証、すべてのサイズ。個人開発者は永久無料。",
  "landing.cta": "エディターを開く — 無料",
  "admin.title": "Shotshot 管理",
  "admin.mrr": "MRR",
  "admin.arr": "ARR",
  "admin.pro": "Pro",
  "admin.lifetime": "永久",
  "admin.users": "総ユーザー",
  "admin.recent": "最近の支払い",
};

const ZH: Dict = {
  "editor.title": "编辑器",
  "editor.screens": "屏幕",
  "editor.appName": "应用名称",
  "editor.export": "导出包",
  "editor.signedIn": "已登录",
  "editor.signIn": "登录",
  "editor.aiCaptions": "AI 标题",
  "editor.translateAll": "批量翻译",
  "editor.landing": "落地页",
  "editor.uploadToStore": "上传到商店",
  "editor.tip": "打赏",
  "editor.preview.scale": "缩放",
  "editor.preview.inverted": "深色",
  "editor.caption.placeholder": "标题\n在这里。",
  "editor.caption.verify": "验证标题是否出现在截图中",
  "editor.layout.hero": "主视觉",
  "editor.layout.device-bottom": "底部设备",
  "editor.layout.device-top": "顶部设备",
  "editor.layout.two-devices": "双设备",
  "editor.layout.no-device": "无设备",
  "editor.layout.split-landscape": "左右分屏",
  "editor.layout.feature-graphic": "功能图",
  "common.save": "保存",
  "common.cancel": "取消",
  "common.delete": "删除",
  "common.duplicate": "复制",
  "common.add": "添加",
  "common.connected": "连接",
  "common.isolated": "分离",
  "common.loading": "加载中…",
  "landing.title": "不会拒绝的 App Store 截图工具。",
  "landing.subtitle": "拖放、AI 标题、OCR 验证、所有尺寸。个人开发者永久免费。",
  "landing.cta": "打开编辑器 — 免费",
  "admin.title": "Shotshot 管理",
  "admin.mrr": "月收入",
  "admin.arr": "年收入",
  "admin.pro": "Pro",
  "admin.lifetime": "终身",
  "admin.users": "总用户",
  "admin.recent": "最近付款",
};

const ES: Dict = {
  "landing.title": "Capturas para App Store que no son rechazadas.",
  "landing.subtitle": "Arrastra, suelta, subtítulos con IA, verificación OCR, todos los tamaños. Gratis para siempre para devs indie.",
  "landing.cta": "Abrir editor — gratis",
  "admin.mrr": "MRR",
  "admin.arr": "ARR",
  "admin.pro": "Pro",
  "admin.lifetime": "Vitalicio",
  "admin.users": "Usuarios",
  "admin.recent": "Pagos recientes",
};

const DE: Dict = {
  "landing.title": "App Store Screenshots, die nicht abgelehnt werden.",
  "landing.subtitle": "Drag & Drop, KI-Untertitel, OCR-Prüfung, alle Größen. Für immer kostenlos für Indie-Devs.",
  "landing.cta": "Editor öffnen — kostenlos",
  "admin.mrr": "MRR",
  "admin.arr": "ARR",
  "admin.pro": "Pro",
  "admin.lifetime": "Lifetime",
  "admin.users": "Nutzer",
  "admin.recent": "Letzte Zahlungen",
};

const FR: Dict = {
  "landing.title": "Captures App Store qui ne sont pas refusées.",
  "landing.subtitle": "Glissez, déposez, sous-titres IA, vérification OCR, toutes les tailles. Gratuit pour toujours pour les devs indie.",
  "landing.cta": "Ouvrir l'éditeur — gratuit",
  "admin.mrr": "MRR",
  "admin.arr": "ARR",
  "admin.pro": "Pro",
  "admin.lifetime": "À vie",
  "admin.users": "Utilisateurs",
  "admin.recent": "Paiements récents",
};

const DICTS: Record<Locale, Dict> = { en: EN, ko: KO, ja: JA, zh: ZH, es: ES, de: DE, fr: FR };
export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in DICTS) return stored as Locale;
  const nav = navigator.language.split("-")[0] as Locale;
  if (nav in DICTS) return nav;
  return "en";
}

export function setLocale(l: Locale) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, l);
}

export function translate(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] || DICTS.en[key] || key;
}

export function useI18n() {
  const [locale, setL] = React.useState<Locale>("en");
  React.useEffect(() => {
    setL(detectLocale());
  }, []);
  const t = React.useCallback(
    (key: string) => translate(locale, key),
    [locale],
  );
  const change = React.useCallback((l: Locale) => {
    setLocale(l);
    setL(l);
  }, []);
  return { locale, t, change, locales: LOCALES };
}
