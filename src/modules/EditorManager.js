export class EditorManager {
    constructor() {
        this.editor = null;
        this.monaco = null;
        this.contentChangeCallback = null;
        this.cursorPositionCallback = null;
    }

    async init() {
        try {
            // Import Monaco Editor
            const monaco = await import('monaco-editor');
            this.monaco = monaco;

            // Configure Monaco for OpenSCAD
            this.setupOpenSCADLanguage();

            // Create editor instance
            const container = document.getElementById('editor-container');
            this.editor = monaco.editor.create(container, {
                value: '',
                language: 'openscad',
                theme: 'vs',
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                minimap: { enabled: true },
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderWhitespace: 'selection',
                contextmenu: true,
                mouseWheelZoom: true,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                guides: {
                    bracketPairs: true,
                    indentation: true
                }
            });

            // Set up event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            // Fallback to textarea
            this.createFallbackEditor();
        }
    }

    setupOpenSCADLanguage() {
        // Register OpenSCAD language
        this.monaco.languages.register({ id: 'openscad' });

        // Define OpenSCAD syntax highlighting
        this.monaco.languages.setMonarchTokensProvider('openscad', {
            tokenizer: {
                root: [
                    // Comments
                    [/\/\/.*$/, 'comment'],
                    [/\/\*/, 'comment', '@comment'],
                    
                    // Keywords
                    [/\b(module|function|if|else|for|intersection_for|union|difference|intersection|hull|minkowski|render|surface|projection|linear_extrude|rotate_extrude|import|include|use)\b/, 'keyword'],
                    
                    // Built-in functions
                    [/\b(cube|sphere|cylinder|polyhedron|square|circle|polygon|text|translate|rotate|scale|resize|mirror|multmatrix|color|offset|children|echo|assert|len|concat|lookup|str|chr|search|version|version_num|norm|cross|sin|cos|tan|asin|acos|atan|atan2|floor|ceil|round|abs|sign|sqrt|exp|ln|log|pow|min|max|rands|parent_module)\b/, 'type'],
                    
                    // Numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/\d+/, 'number'],
                    
                    // Strings
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string'],
                    
                    // Operators
                    [/[=<>!]=?/, 'operator'],
                    [/[+\-*\/&|^~<>]/, 'operator'],
                    
                    // Delimiters
                    [/[{}()\[\]]/, '@brackets'],
                    [/[;,.]/, 'delimiter'],
                    
                    // Variables
                    [/[a-zA-Z_]\w*/, 'identifier']
                ],
                
                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],
                
                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, 'string', '@pop']
                ]
            }
        });

        // Configure language features
        this.monaco.languages.setLanguageConfiguration('openscad', {
            comments: {
                lineComment: '//',
                blockComment: ['/*', '*/']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' }
            ],
            folding: {
                markers: {
                    start: new RegExp('^\\s*//\\s*#region\\b'),
                    end: new RegExp('^\\s*//\\s*#endregion\\b')
                }
            }
        });
    }

    setupEventListeners() {
        if (!this.editor) return;

        // Content change
        this.editor.onDidChangeModelContent(() => {
            if (this.contentChangeCallback) {
                this.contentChangeCallback(this.getContent());
            }
        });

        // Cursor position change
        this.editor.onDidChangeCursorPosition((e) => {
            if (this.cursorPositionCallback) {
                this.cursorPositionCallback(e.position);
            }
        });

        // Focus events
        this.editor.onDidFocusEditorWidget(() => {
            document.body.classList.add('editor-focused');
        });

        this.editor.onDidBlurEditorWidget(() => {
            document.body.classList.remove('editor-focused');
        });
    }

    createFallbackEditor() {
        const container = document.getElementById('editor-container');
        const textarea = document.createElement('textarea');
        textarea.className = 'fallback-editor';
        textarea.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            resize: none;
            font-family: var(--font-mono);
            font-size: 14px;
            padding: 1rem;
            background: var(--background);
            color: var(--text-primary);
        `;
        
        container.appendChild(textarea);
        this.editor = {
            getValue: () => textarea.value,
            setValue: (value) => { textarea.value = value; },
            getModel: () => ({ getLineCount: () => textarea.value.split('\n').length }),
            layout: () => {},
            focus: () => textarea.focus()
        };

        // Set up basic event listeners for fallback
        textarea.addEventListener('input', () => {
            if (this.contentChangeCallback) {
                this.contentChangeCallback(textarea.value);
            }
        });
    }

    getContent() {
        return this.editor ? this.editor.getValue() : '';
    }

    setContent(content) {
        if (this.editor) {
            this.editor.setValue(content);
        }
    }

    setTheme(theme) {
        if (this.monaco && this.editor) {
            this.monaco.editor.setTheme(theme);
        }
    }

    resize() {
        if (this.editor && this.editor.layout) {
            this.editor.layout();
        }
    }

    focus() {
        if (this.editor && this.editor.focus) {
            this.editor.focus();
        }
    }

    onContentChange(callback) {
        this.contentChangeCallback = callback;
    }

    onCursorPositionChange(callback) {
        this.cursorPositionCallback = callback;
    }
}