import { useState, useEffect } from 'react'
import { X, Folder, File, ChevronRight, Home, HardDrive, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProjectBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (path: string, name: string) => void
}

interface FolderItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
}

const API_URL = 'http://localhost:8001'

export default function ProjectBrowser({ isOpen, onClose, onSelectProject }: ProjectBrowserProps) {
  const [drives, setDrives] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [items, setItems] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadDrives()
    }
  }, [isOpen])

  const loadDrives = async () => {
    try {
      const response = await fetch(`${API_URL}/browse/drives`)
      const data = await response.json()
      setDrives(data.drives)
    } catch (error) {
      console.error('Failed to load drives:', error)
      toast.error('Failed to load drives')
    }
  }

  const browseFolder = async (path: string | null = null) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/browse/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      const data = await response.json()

      setCurrentPath(data.path)
      setParentPath(data.parent)
      setItems(data.items)
    } catch (error) {
      console.error('Failed to browse folder:', error)
      toast.error('Failed to browse folder')
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: FolderItem) => {
    if (item.type === 'directory') {
      browseFolder(item.path)
    }
  }

  const handleSelectProject = () => {
    if (currentPath) {
      const pathParts = currentPath.split(/[/\\]/)
      const folderName = pathParts[pathParts.length - 1]
      onSelectProject(currentPath, folderName)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400" />
            Browse Projects
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Path navigation */}
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Home className="w-4 h-4" />
            <span className="truncate">{currentPath || 'Select a location'}</span>
          </div>

          {parentPath && (
            <button
              onClick={() => browseFolder(parentPath)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Go Up
            </button>
          )}
        </div>

        {/* Drives/Quick Access */}
        {!currentPath && (
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-400">Quick Access</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {drives.map((drive) => (
                <button
                  key={drive}
                  onClick={() => browseFolder(drive)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">{drive}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Folder contents */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No folders found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    item.type === 'directory'
                      ? 'hover:bg-gray-700/50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {item.type === 'directory' ? (
                    <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className="text-sm truncate flex-1">{item.name}</span>
                  {item.type === 'directory' && (
                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-900/50">
          <div className="text-sm text-gray-400">
            {currentPath ? `Selected: ${currentPath}` : 'No folder selected'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectProject}
              disabled={!currentPath}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open Project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
