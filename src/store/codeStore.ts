import { create } from 'zustand'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface Project {
  name: string
  path: string
  created: number
}

interface CodeStore {
  projects: Project[]
  currentProject: string | null
  fileTree: FileNode | null
  openFiles: Map<string, string>
  currentFile: string | null
  expandedFolders: Set<string>

  // Actions
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: string | null) => void
  setFileTree: (tree: FileNode | null) => void
  setOpenFiles: (files: Map<string, string>) => void
  addOpenFile: (path: string, content: string) => void
  updateFileContent: (path: string, content: string) => void
  closeFile: (path: string) => void
  setCurrentFile: (path: string | null) => void
  toggleFolder: (path: string) => void
  refreshFileTree: () => Promise<void>
  clearAll: () => void
}

export const useCodeStore = create<CodeStore>((set, get) => ({
  projects: [],
  currentProject: null,
  fileTree: null,
  openFiles: new Map(),
  currentFile: null,
  expandedFolders: new Set(),

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project }),

  setFileTree: (tree) => set({ fileTree: tree }),

  setOpenFiles: (files) => set({ openFiles: files }),

  addOpenFile: (path, content) => {
    const { openFiles } = get()
    const newFiles = new Map(openFiles)
    newFiles.set(path, content)
    set({ openFiles: newFiles, currentFile: path })
  },

  updateFileContent: (path, content) => {
    const { openFiles } = get()
    const newFiles = new Map(openFiles)
    newFiles.set(path, content)
    set({ openFiles: newFiles })
  },

  closeFile: (path) => {
    const { openFiles, currentFile } = get()
    const newFiles = new Map(openFiles)
    newFiles.delete(path)

    let newCurrentFile = currentFile
    if (currentFile === path) {
      const remainingFiles = Array.from(newFiles.keys())
      newCurrentFile = remainingFiles.length > 0 ? remainingFiles[0] : null
    }

    set({ openFiles: newFiles, currentFile: newCurrentFile })
  },

  setCurrentFile: (path) => set({ currentFile: path }),

  toggleFolder: (path) => {
    const { expandedFolders } = get()
    const newFolders = new Set(expandedFolders)
    if (newFolders.has(path)) {
      newFolders.delete(path)
    } else {
      newFolders.add(path)
    }
    set({ expandedFolders: newFolders })
  },

  refreshFileTree: async () => {
    const { currentProject } = get()
    if (!currentProject) {
      console.warn('⚠️ Cannot refresh file tree: no current project')
      return
    }

    try {
      console.log('🔄 Refreshing file tree for project:', currentProject)
      const response = await fetch(`http://localhost:8001/files/tree?project=${encodeURIComponent(currentProject)}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('✅ File tree refreshed successfully:', data)
      set({ fileTree: data })
    } catch (error) {
      console.error('❌ Failed to refresh file tree:', error)
    }
  },

  clearAll: () => set({
    projects: [],
    currentProject: null,
    fileTree: null,
    openFiles: new Map(),
    currentFile: null,
    expandedFolders: new Set(),
  }),
}))
