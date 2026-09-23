/**
 * Field Scroll and Focus Utility
 * Smoothly scrolls the viewport to target form input field, places focus,
 * and flashes an attention-grabbing red outline ring.
 */

export function scrollToAndHighlightField(targetField) {
  if (!targetField) return false;

  // Normalize target field string
  const fieldKey = String(targetField).trim().toLowerCase();

  // Possible DOM identifiers to look for
  const selectors = [
    `#${targetField}`,
    `#${fieldKey}`,
    `[name="${targetField}"]`,
    `[name="${fieldKey}"]`,
    `[data-field="${targetField}"]`,
    `[data-field="${fieldKey}"]`,
    `#field_${fieldKey}`,
    `#input_${fieldKey}`,
    `[id*="${fieldKey}"]`
  ];

  let element = null;
  for (const selector of selectors) {
    try {
      element = document.querySelector(selector);
      if (element) break;
    } catch {
      // Continue search on selector syntax mismatch
    }
  }

  if (!element) return false;

  // 1. Smooth scroll to center of element
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });

  // 2. Focus input element
  try {
    element.focus({ preventScroll: true });
  } catch {
    // Focus optional if element isn't directly focusable container
  }

  // 3. Flashing red border highlight effect
  const originalTransition = element.style.transition;
  const originalBoxShadow = element.style.boxShadow;
  const originalBorderColor = element.style.borderColor;

  element.style.transition = 'all 0.3s ease-in-out';
  element.style.boxShadow = '0 0 0 4px rgba(244, 63, 94, 0.5), 0 0 15px rgba(244, 63, 94, 0.3)';
  element.style.borderColor = '#f43f5e';

  // Pulse effect timer
  let flashCount = 0;
  const interval = setInterval(() => {
    flashCount++;
    if (flashCount % 2 === 1) {
      element.style.boxShadow = '0 0 0 6px rgba(244, 63, 94, 0.8), 0 0 20px rgba(244, 63, 94, 0.5)';
    } else {
      element.style.boxShadow = '0 0 0 3px rgba(244, 63, 94, 0.4), 0 0 10px rgba(244, 63, 94, 0.2)';
    }

    if (flashCount >= 6) {
      clearInterval(interval);
      setTimeout(() => {
        element.style.transition = originalTransition || '';
        element.style.boxShadow = originalBoxShadow || '';
        element.style.borderColor = originalBorderColor || '';
      }, 500);
    }
  }, 350);

  return true;
}

export default scrollToAndHighlightField;
