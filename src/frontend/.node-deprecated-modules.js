// Suppress specific Node.js deprecation warnings
// This is a targeted fix for Issue #72: punycode deprecation warnings

const originalEmitWarning = process.emitWarning;

process.emitWarning = function(warning, type, code, ctor) {
  // Suppress punycode deprecation warnings specifically
  if (code === 'DEP0040' || (warning && warning.includes('punycode'))) {
    return;
  }
  
  // Allow all other warnings to pass through
  return originalEmitWarning.call(process, warning, type, code, ctor);
};