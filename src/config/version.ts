/**
 * FlowFrame Unified Release Configuration
 * Single Source of Truth for all frontend version badges, headers, footers, loaders, and docs.
 *
 * To bump the application version in the future, SIMPLY CHANGE `APP_VERSION_RAW` below!
 * Everything else across the entire frontend (badges, footers, headers, docs, engine specs)
 * will update automatically from this single shared source.
 */

export const APP_VERSION_RAW = "2.1.0";
export const APP_VERSION = `v${APP_VERSION_RAW}`;
export const APP_RELEASE_NAME = "Relay Copilot";
export const APP_RELEASE_BADGE = `${APP_VERSION} Relay Copilot`;
export const APP_ENGINE_SPEC = `FlowFrame Engine ${APP_VERSION}`;
export const APP_DSL_SPEC = `FlowFrame DSL Specifications ${APP_VERSION}`;
export const APP_DSL_VERSION = APP_VERSION;
