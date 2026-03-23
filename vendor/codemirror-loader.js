// CodeMirror Auto-Loader for Claude Code Dashboard
// Include after codemirror.js — automatically upgrades textareas and code blocks
// Usage: Add class "cm-editor" to any textarea, or call upgradeTextarea(el, options)

(function() {
  if (!window.CodeMirrorEditor) {
    console.warn('[CodeMirror Loader] codemirror.js not loaded');
    return;
  }

  const editors = new Map(); // element id → editor instance

  // Detect language from content or class
  function detectLang(el) {
    const cls = el.className || '';
    const id = el.id || '';
    if (cls.includes('lang-json') || id.includes('json') || id.includes('Json')) return 'json';
    if (cls.includes('lang-js') || id.includes('Script') || id.includes('script')) return 'javascript';
    return 'markdown';
  }

  // Upgrade a textarea to CodeMirror
  window.upgradeTextarea = function(textarea, options = {}) {
    if (!textarea || editors.has(textarea.id)) return editors.get(textarea.id);

    const lang = options.language || detectLang(textarea);
    const height = options.height || (textarea.rows ? (textarea.rows * 22 + 20) + 'px' : '250px');
    const readOnly = textarea.readOnly || textarea.disabled || options.readOnly || false;

    // Create container
    const container = document.createElement('div');
    container.className = 'cm-container';
    container.style.cssText = 'border-radius: 8px; overflow: hidden;';
    textarea.parentNode.insertBefore(container, textarea);
    textarea.style.display = 'none';

    const editor = window.CodeMirrorEditor.createEditor(container, {
      value: textarea.value || '',
      language: lang,
      height: height,
      readOnly: readOnly,
      onChange: function(value) {
        textarea.value = value;
        // Fire input event so existing handlers work
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      },
    });

    if (textarea.id) editors.set(textarea.id, editor);
    return editor;
  };

  // Upgrade a pre/code block to read-only CodeMirror
  window.upgradeCodeBlock = function(element, options = {}) {
    if (!element) return null;
    const text = element.textContent || '';
    const lang = options.language || detectLang(element);

    const container = document.createElement('div');
    container.className = 'cm-container cm-readonly';
    container.style.cssText = 'border-radius: 8px; overflow: hidden; margin: 8px 0;';
    element.parentNode.insertBefore(container, element);
    element.style.display = 'none';

    return window.CodeMirrorEditor.createEditor(container, {
      value: text,
      language: lang,
      height: options.height || 'auto',
      readOnly: true,
    });
  };

  // Get editor instance by textarea id
  window.getEditor = function(id) {
    return editors.get(id);
  };

  // Auto-upgrade: find all textareas with class "cm-editor" and upgrade them
  function autoUpgrade() {
    document.querySelectorAll('textarea.cm-editor').forEach(ta => {
      upgradeTextarea(ta);
    });
  }

  // Run auto-upgrade when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoUpgrade);
  } else {
    autoUpgrade();
  }

  // Also observe for dynamically added textareas
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'TEXTAREA' && node.classList.contains('cm-editor')) {
          setTimeout(() => upgradeTextarea(node), 50);
        }
        // Check children too
        node.querySelectorAll && node.querySelectorAll('textarea.cm-editor').forEach(ta => {
          setTimeout(() => upgradeTextarea(ta), 50);
        });
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
