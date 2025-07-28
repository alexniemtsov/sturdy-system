import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bold, Italic, Underline } from "lucide-react"

interface TextEditorProps {
    className?: string
    defaultValue?: string
    onChange?: (content: string) => void
    placeholder?: string
}

const TextEditor = React.forwardRef<HTMLDivElement, TextEditorProps>(
    ({ className, defaultValue = "", onChange, placeholder = "Start typing..." }) => {
        const editorRef = React.useRef<HTMLDivElement>(null)
        const [content, setContent] = React.useState(defaultValue)

        const handleInput = React.useCallback(() => {
            if (editorRef.current) {
                const newContent = editorRef.current.innerHTML
                setContent(newContent)
                onChange?.(newContent)
            }
        }, [onChange])

        const executeCommand = React.useCallback((command: string, value?: string) => {
            document.execCommand(command, false, value)
            editorRef.current?.focus()
            handleInput()
        }, [handleInput])

        const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault()
                        executeCommand('bold')
                        break
                    case 'i':
                        e.preventDefault()
                        executeCommand('italic')
                        break
                    case 'u':
                        e.preventDefault()
                        executeCommand('underline')
                        break
                }
            }

            if (e.key === 'Enter') {
                e.preventDefault()
                executeCommand('insertHTML', '<div><br></div>')
            }
        }, [executeCommand])

        React.useEffect(() => {
            if (editorRef.current && defaultValue !== content) {
                editorRef.current.innerHTML = defaultValue
                setContent(defaultValue)
            }
        }, [defaultValue, content])

        return (
            <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
                <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => executeCommand('bold')}
                        className="h-8 w-8 p-0"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => executeCommand('italic')}
                        className="h-8 w-8 p-0"
                    > <Italic className="h-4 w-4" /> </Button> <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => executeCommand('underline')}
                        className="h-8 w-8 p-0"
                    >
                        <Underline className="h-4 w-4" />
                    </Button>
                </div>

                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "min-h-[300px] p-4 focus:outline-none",
                        "prose prose-sm max-w-none",
                        "[&_strong]:font-bold [&_em]:italic [&_u]:underline",
                        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
                    )}
                    data-placeholder={placeholder}
                    style={{ lineHeight: '1.6' }}
                />
            </div>
        )
    }
)

TextEditor.displayName = "TextEditor"

export { TextEditor }
