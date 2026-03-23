// CodeMirror 6 bundle entry point
// Bundles all needed extensions into a single file for the browser
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';

// Custom dark theme to match dashboard
const dashboardTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0f1117',
    color: '#e1e4ed',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #2e3345',
  },
  '.cm-content': {
    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    padding: '8px 0',
  },
  '.cm-gutters': {
    backgroundColor: '#1a1d27',
    color: '#8b8fa3',
    border: 'none',
    borderRight: '1px solid #2e3345',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#232735',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
  '.cm-cursor': {
    borderLeftColor: '#6c5ce7',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(108, 92, 231, 0.25) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(108, 92, 231, 0.3) !important',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
}, { dark: true });

// Factory function to create editors
function createEditor(container, options = {}) {
  const {
    value = '',
    language = 'markdown',
    height = '300px',
    onChange = null,
    readOnly = false,
  } = options;

  // Pick language extension
  let langExt;
  switch (language) {
    case 'json': langExt = json(); break;
    case 'javascript': case 'js': langExt = javascript(); break;
    case 'markdown': case 'md': default: langExt = markdown(); break;
  }

  const extensions = [
    basicSetup,
    langExt,
    dashboardTheme,
    oneDark,
    keymap.of([indentWithTab]),
    EditorView.lineWrapping,
  ];

  if (readOnly) {
    extensions.push(EditorState.readOnly.of(true));
  }

  if (onChange) {
    extensions.push(EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }));
  }

  // Set height
  extensions.push(EditorView.theme({
    '&': { maxHeight: height, height: height },
    '.cm-scroller': { overflow: 'auto' },
  }));

  const state = EditorState.create({
    doc: value,
    extensions,
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (text) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text }
      });
    },
    destroy: () => view.destroy(),
  };
}

// Expose globally
window.CodeMirrorEditor = { createEditor };
