import { useEffect, useCallback, useRef } from 'react'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean // Command on Mac
  description: string
  handler: () => void
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement
    const isInputField = activeElement?.tagName === 'INPUT' ||
                         activeElement?.tagName === 'TEXTAREA' ||
                         activeElement?.getAttribute('contenteditable') === 'true'

    for (const shortcut of shortcutsRef.current) {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey
      const matchesShift = shortcut.shift === undefined || shortcut.shift === event.shiftKey
      const matchesAlt = shortcut.alt === undefined || shortcut.alt === event.altKey
      const matchesMeta = shortcut.meta === undefined || shortcut.meta === event.metaKey

      // Check if Ctrl/Cmd is pressed (for cross-platform compatibility)
      const cmdOrCtrl = event.ctrlKey || event.metaKey

      // For shortcuts with ctrl/meta, check either
      const matchesModifier = shortcut.ctrl || shortcut.meta
        ? cmdOrCtrl && matchesShift && matchesAlt
        : matchesCtrl && matchesShift && matchesAlt && matchesMeta

      if (matchesKey && matchesModifier) {
        // Don't trigger shortcuts in input fields unless explicitly allowed
        if (isInputField && shortcut.key !== 'Escape' && !cmdOrCtrl) {
          continue
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }

        shortcut.handler()
        break
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Utility to format shortcut for display
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'handler' | 'description'>): string {
  const parts: string[] = []

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  // Format special keys
  const keyMap: Record<string, string> = {
    'Enter': '↵',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    ' ': 'Space',
    '/': '/'
  }

  const displayKey = keyMap[shortcut.key] || shortcut.key.toUpperCase()
  parts.push(displayKey)

  return parts.join(isMac ? '' : '+')
}
