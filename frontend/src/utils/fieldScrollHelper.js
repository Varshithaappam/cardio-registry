/**
 * Field Scroll and Focus Utility
 * Smoothly scrolls the viewport to target form input field, places focus,
 * and flashes an attention-grabbing red outline ring.
 */

export function scrollToAndHighlightField(targetField) {
  if (!targetField) return false;

  // Normalize target field string
  const fieldKey = String(targetField).trim().toLowerCase();
  const hyphenated = fieldKey.replace(/_/g, '-');

  // Common aliases for registry and patient form fields
  const aliases = [];
  if (fieldKey === 'mr_no' || fieldKey === 'mrno') {
    aliases.push('reg-mr-no', 'mr_no', 'mr-no');
  } else if (fieldKey === 'uhid') {
    aliases.push('reg-uhid', 'uhid');
  } else if (fieldKey === 'abha_number' || fieldKey === 'abha') {
    aliases.push('reg-abha', 'abha_number', 'abha');
  } else if (fieldKey === 'ip_no' || fieldKey === 'ipno') {
    aliases.push('ip_no', 'ip-no');
  } else if (fieldKey === 'acs_no' || fieldKey === 'acsno') {
    aliases.push('acs_no', 'acs-no');
  } else if (fieldKey === 'visit_id' || fieldKey === 'visitid') {
    aliases.push('visit_id', 'visit-id');
  }

  // Build list of DOM selectors
  const selectors = [
    `#${targetField}`,
    `#${fieldKey}`,
    `#${hyphenated}`,
    `#reg-${hyphenated}`,
    `#reg-${fieldKey}`,
    ...aliases.map(a => `#${a}`),
    `[name="${targetField}"]`,
    `[name="${fieldKey}"]`,
    `[name="${hyphenated}"]`,
    ...aliases.map(a => `[name="${a}"]`),
    `[data-field="${targetField}"]`,
    `[data-field="${fieldKey}"]`,
    `[data-field="${hyphenated}"]`,
    ...aliases.map(a => `[data-field="${a}"]`),
    `#field_${fieldKey}`,
    `#input_${fieldKey}`,
    `[id*="${fieldKey}"]`,
    `[id*="${hyphenated}"]`
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

  if (!element) {
    console.warn(`[fieldScrollHelper] Field element not found for key: ${targetField}`);
    return false;
  }

  // 1. Scroll any inner scrollable ancestor container (e.g. modal scroll wrapper)
  let parent = element.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY || style.overflow;
    if (['auto', 'scroll'].includes(overflowY)) {
      const parentRect = parent.getBoundingClientRect();
      const elRect = element.getBoundingClientRect();
      const targetScrollTop = parent.scrollTop + (elRect.top - parentRect.top) - (parent.clientHeight / 2) + (element.clientHeight / 2);
      parent.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
    parent = parent.parentElement;
  }

  // 2. Smoothly scroll window viewport to center of element
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });

  try {
    const rect = element.getBoundingClientRect();
    const windowTarget = window.pageYOffset + rect.top - (window.innerHeight / 2) + (rect.height / 2);
    window.scrollTo({
      top: Math.max(0, windowTarget),
      behavior: 'smooth'
    });
  } catch {
    // Window scroll optional fallback
  }

  // 3. Delayed focus so browser does not interrupt smooth scroll animation
  setTimeout(() => {
    try {
      element.focus({ preventScroll: true });
    } catch {
      // Focus optional
    }
  }, 220);

  // 4. Attention-grabbing red border/ring flash effect
  const originalTransition = element.style.transition;
  const originalBoxShadow = element.style.boxShadow;
  const originalBorderColor = element.style.borderColor;

  element.style.transition = 'all 0.25s ease-in-out';
  element.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.4)';
  element.style.borderColor = '#ef4444';

  let flashCount = 0;
  const interval = setInterval(() => {
    flashCount++;
    if (flashCount % 2 === 1) {
      element.style.boxShadow = '0 0 0 6px rgba(239, 68, 68, 0.85), 0 0 25px rgba(239, 68, 68, 0.6)';
    } else {
      element.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.4), 0 0 10px rgba(239, 68, 68, 0.2)';
    }

    if (flashCount >= 6) {
      clearInterval(interval);
      setTimeout(() => {
        element.style.transition = originalTransition || '';
        element.style.boxShadow = originalBoxShadow || '';
        element.style.borderColor = originalBorderColor || '';
      }, 600);
    }
  }, 300);

  return true;
}

export default scrollToAndHighlightField;
