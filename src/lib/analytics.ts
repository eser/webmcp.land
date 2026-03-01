/**
 * Google Analytics Event Tracking Utility
 *
 * Provides typed functions for tracking user interactions throughout the app.
 * Events are only sent if GOOGLE_ANALYTICS_ID is configured.
 */

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      action: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
};

function trackEvent({ action, category, label, value, ...rest }: GTagEvent) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
      ...rest,
    });
  }
}

// ============================================================================
// Authentication Events
// ============================================================================

export const analyticsAuth = {
  login: (method: "credentials" | "github" | "google" | "azure") => {
    trackEvent({
      action: "login",
      category: "auth",
      label: method,
    });
  },

  loginFailed: (method: "credentials" | "github" | "google" | "azure") => {
    trackEvent({
      action: "login_failed",
      category: "auth",
      label: method,
    });
  },

  register: () => {
    trackEvent({
      action: "register",
      category: "auth",
    });
  },

  registerFailed: (reason?: string) => {
    trackEvent({
      action: "register_failed",
      category: "auth",
      label: reason,
    });
  },

  logout: () => {
    trackEvent({
      action: "logout",
      category: "auth",
    });
  },

  oauthStart: (provider: string) => {
    trackEvent({
      action: "oauth_start",
      category: "auth",
      label: provider,
    });
  },
};

// ============================================================================
// Resource Events
// ============================================================================

export const analyticsResource = {
  view: (resourceId: string, resourceTitle?: string) => {
    trackEvent({
      action: "view_resource",
      category: "resource",
      label: resourceTitle,
      resource_id: resourceId,
    });
  },

  register: (resourceType: string) => {
    trackEvent({
      action: "register_resource",
      category: "resource",
      label: resourceType,
    });
  },

  edit: (resourceId: string) => {
    trackEvent({
      action: "edit_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  delete: (resourceId: string) => {
    trackEvent({
      action: "delete_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  copy: (resourceId?: string) => {
    trackEvent({
      action: "copy_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  upvote: (resourceId: string) => {
    trackEvent({
      action: "upvote_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  removeUpvote: (resourceId: string) => {
    trackEvent({
      action: "remove_upvote",
      category: "resource",
      resource_id: resourceId,
    });
  },

  report: (resourceId: string, reason: string) => {
    trackEvent({
      action: "report_resource",
      category: "resource",
      label: reason,
      resource_id: resourceId,
    });
  },

  share: (resourceId: string | undefined, platform: "twitter" | "hackernews" | "copy_link") => {
    trackEvent({
      action: "share_resource",
      category: "resource",
      label: platform,
      resource_id: resourceId,
    });
  },

  addVersion: (resourceId: string) => {
    trackEvent({
      action: "add_version",
      category: "resource",
      resource_id: resourceId,
    });
  },

  compareVersions: (resourceId: string) => {
    trackEvent({
      action: "compare_versions",
      category: "resource",
      resource_id: resourceId,
    });
  },

  changeRequest: (resourceId: string, action: "create" | "approve" | "dismiss" | "reopen") => {
    trackEvent({
      action: `change_request_${action}`,
      category: "resource",
      resource_id: resourceId,
    });
  },

  pin: (resourceId: string) => {
    trackEvent({
      action: "pin_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  unpin: (resourceId: string) => {
    trackEvent({
      action: "unpin_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  feature: (resourceId: string) => {
    trackEvent({
      action: "feature_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  unfeature: (resourceId: string) => {
    trackEvent({
      action: "unfeature_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  discover: (resourceId: string) => {
    trackEvent({
      action: "discover_resource",
      category: "resource",
      resource_id: resourceId,
    });
  },

  healthCheck: (resourceId: string, status: string) => {
    trackEvent({
      action: "health_check",
      category: "resource",
      label: status,
      resource_id: resourceId,
    });
  },

  run: (resourceId: string | undefined, platformName: string) => {
    trackEvent({
      action: "run_resource",
      category: "resource",
      label: platformName,
      resource_id: resourceId,
    });
  },

  fillVariables: (resourceId?: string) => {
    trackEvent({
      action: "fill_variables",
      category: "resource",
      resource_id: resourceId,
    });
  },
};

// ============================================================================
// Search & Filter Events
// ============================================================================

export const analyticsSearch = {
  search: (query: string, aiEnabled?: boolean) => {
    trackEvent({
      action: "search",
      category: "search",
      label: query,
      ai_search: aiEnabled,
    });
  },

  filter: (filterType: string, value: string) => {
    trackEvent({
      action: "filter",
      category: "search",
      label: `${filterType}:${value}`,
    });
  },

  clearFilters: () => {
    trackEvent({
      action: "clear_filters",
      category: "search",
    });
  },

  sort: (sortBy: string) => {
    trackEvent({
      action: "sort",
      category: "search",
      label: sortBy,
    });
  },

  aiSearchToggle: (enabled: boolean) => {
    trackEvent({
      action: "ai_search_toggle",
      category: "search",
      label: enabled ? "enabled" : "disabled",
    });
  },
};

// ============================================================================
// Navigation Events
// ============================================================================

export const analyticsNav = {
  clickNavLink: (destination: string) => {
    trackEvent({
      action: "nav_click",
      category: "navigation",
      label: destination,
    });
  },

  viewPage: (pageName: string) => {
    trackEvent({
      action: "page_view",
      category: "navigation",
      label: pageName,
    });
  },

  clickLogo: () => {
    trackEvent({
      action: "logo_click",
      category: "navigation",
    });
  },

  openMobileMenu: () => {
    trackEvent({
      action: "mobile_menu_open",
      category: "navigation",
    });
  },

  closeMobileMenu: () => {
    trackEvent({
      action: "mobile_menu_close",
      category: "navigation",
    });
  },
};

// ============================================================================
// User Profile Events
// ============================================================================

export const analyticsProfile = {
  viewProfile: (username: string, isSelf: boolean) => {
    trackEvent({
      action: "view_profile",
      category: "profile",
      label: username,
      is_self: isSelf,
    });
  },

  follow: (username: string) => {
    trackEvent({
      action: "follow_user",
      category: "profile",
      label: username,
    });
  },

  unfollow: (username: string) => {
    trackEvent({
      action: "unfollow_user",
      category: "profile",
      label: username,
    });
  },

  updateProfile: () => {
    trackEvent({
      action: "update_profile",
      category: "profile",
    });
  },

  updateAvatar: () => {
    trackEvent({
      action: "update_avatar",
      category: "profile",
    });
  },
};

// ============================================================================
// Category Events
// ============================================================================

export const analyticsCategory = {
  view: (categorySlug: string) => {
    trackEvent({
      action: "view_category",
      category: "category",
      label: categorySlug,
    });
  },

  subscribe: (categoryId: string, categoryName: string) => {
    trackEvent({
      action: "subscribe_category",
      category: "category",
      label: categoryName,
      category_id: categoryId,
    });
  },

  unsubscribe: (categoryId: string, categoryName: string) => {
    trackEvent({
      action: "unsubscribe_category",
      category: "category",
      label: categoryName,
      category_id: categoryId,
    });
  },
};

// ============================================================================
// Tag Events
// ============================================================================

export const analyticsTag = {
  view: (tagSlug: string) => {
    trackEvent({
      action: "view_tag",
      category: "tag",
      label: tagSlug,
    });
  },

  click: (tagSlug: string, source?: string) => {
    trackEvent({
      action: "click_tag",
      category: "tag",
      label: tagSlug,
      source,
    });
  },
};

// ============================================================================
// Settings Events
// ============================================================================

export const analyticsSettings = {
  changeTheme: (theme: string) => {
    trackEvent({
      action: "change_theme",
      category: "settings",
      label: theme,
    });
  },

  changeLanguage: (language: string) => {
    trackEvent({
      action: "change_language",
      category: "settings",
      label: language,
    });
  },

  updateNotifications: (enabled: boolean) => {
    trackEvent({
      action: "update_notifications",
      category: "settings",
      label: enabled ? "enabled" : "disabled",
    });
  },

  deleteAccount: () => {
    trackEvent({
      action: "delete_account",
      category: "settings",
    });
  },
};

// ============================================================================
// Hero/Homepage Events
// ============================================================================

export const analyticsHero = {
  submitSearch: (searchText: string) => {
    trackEvent({
      action: "hero_submit_search",
      category: "homepage",
      label: searchText.substring(0, 100),
    });
  },

  clickAnimatedResource: () => {
    trackEvent({
      action: "hero_click_animated",
      category: "homepage",
    });
  },

  focusInput: () => {
    trackEvent({
      action: "hero_focus_input",
      category: "homepage",
    });
  },
};

// ============================================================================
// Sponsor Events
// ============================================================================

export const analyticsSponsor = {
  click: (sponsorName: string, sponsorUrl: string) => {
    trackEvent({
      action: "sponsor_click",
      category: "sponsor",
      label: sponsorName,
      sponsor_url: sponsorUrl,
    });
  },

  becomeSponsorClick: () => {
    trackEvent({
      action: "become_sponsor_click",
      category: "sponsor",
    });
  },

  builtWithClick: (toolName: string) => {
    trackEvent({
      action: "built_with_click",
      category: "sponsor",
      label: toolName,
    });
  },
};

// ============================================================================
// MCP Events
// ============================================================================

export const analyticsMcp = {
  openPopup: () => {
    trackEvent({
      action: "mcp_popup_open",
      category: "mcp",
    });
  },

  copyCommand: (commandType: string) => {
    trackEvent({
      action: "mcp_copy_command",
      category: "mcp",
      label: commandType,
    });
  },
};

// ============================================================================
// Engagement Events
// ============================================================================

export const analyticsEngagement = {
  scrollDepth: (percentage: number) => {
    trackEvent({
      action: "scroll_depth",
      category: "engagement",
      value: percentage,
    });
  },

  timeOnPage: (seconds: number, pageName: string) => {
    trackEvent({
      action: "time_on_page",
      category: "engagement",
      label: pageName,
      value: seconds,
    });
  },

  clickExternalLink: (url: string) => {
    trackEvent({
      action: "external_link_click",
      category: "engagement",
      label: url,
    });
  },
};

// ============================================================================
// Comment Events
// ============================================================================

export const analyticsComment = {
  post: (resourceId: string, isReply: boolean) => {
    trackEvent({
      action: isReply ? "post_reply" : "post_comment",
      category: "comment",
      resource_id: resourceId,
    });
  },
};

// ============================================================================
// Collection Events
// ============================================================================

export const analyticsCollection = {
  add: (resourceId: string) => {
    trackEvent({
      action: "add_to_collection",
      category: "collection",
      resource_id: resourceId,
    });
  },

  remove: (resourceId: string) => {
    trackEvent({
      action: "remove_from_collection",
      category: "collection",
      resource_id: resourceId,
    });
  },
};

// ============================================================================
// Translation Events
// ============================================================================

export const analyticsTranslate = {
  translate: (targetLanguage: string) => {
    trackEvent({
      action: "translate_resource",
      category: "translate",
      label: targetLanguage,
    });
  },
};

// ============================================================================
// External Link Events
// ============================================================================

export const analyticsExternal = {
  clickChromeExtension: () => {
    trackEvent({
      action: "chrome_extension_click",
      category: "external",
    });
  },

  clickFooterLink: (linkName: string) => {
    trackEvent({
      action: "footer_link_click",
      category: "external",
      label: linkName,
    });
  },
};

// ============================================================================
// Admin Events
// ============================================================================

export const analyticsAdmin = {
  viewDashboard: () => {
    trackEvent({
      action: "view_admin_dashboard",
      category: "admin",
    });
  },

  manageUsers: (action: "ban" | "unban" | "promote" | "demote") => {
    trackEvent({
      action: `user_${action}`,
      category: "admin",
    });
  },

  manageResources: (action: "feature" | "unfeature" | "delete" | "approve" | "reject") => {
    trackEvent({
      action: `resource_${action}`,
      category: "admin",
    });
  },

  importResources: (count: number) => {
    trackEvent({
      action: "import_resources",
      category: "admin",
      value: count,
    });
  },
};
