/**
 * STRIDE INTELLIGENCE ENGINE v2.1 — public API.
 *
 * Core engine (universal, app-agnostic):
 *   recommendShoeForToday, assessLifecycle, calculateLoadState,
 *   evidenceForShoe, learnPreferences, detectPainPatterns (engine),
 *   recommendReplacements, deriveShoePersonalities, adaptShoe/adaptCatalog
 *
 * App bridge (drop-in for the old intelligence layer):
 *   getShoeOfTheDay, getRotationAnalysis, getReadinessScores,
 *   generateAllHealthReports, detectPainPatterns (bridge shapes)
 */
export * from './types';
export * from './math';
export * from './adapter';
export * from './engines/load';
export * from './engines/lifecycle';
export * from './engines/personalization';
export * from './engines/mechanics';
export * from './engines/recommendation';
export * from './engines/replacement';
export * from './engines/personality';
export { detectPainPatterns as detectEnginePainPatterns } from './engines/painPatterns';
