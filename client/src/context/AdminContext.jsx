import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_BASE_URL as API_BASE } from '../utils/apiConfig'

const AdminContext = createContext(null)

const TOKEN_KEY = 'portfolio_admin_token'

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [adminToken, setAdminToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  })
  const [isEditMode, setIsEditMode] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('portfolio_edit_mode') === 'true' : false
  })
  const [contentVersion, setContentVersion] = useState(0)

  // Modal states for in-place editing
  const [projectModalState, setProjectModalState] = useState({ isOpen: false, project: null })
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [eventModalState, setEventModalState] = useState({ isOpen: false, event: null })
  const [goalModalState, setGoalModalState] = useState({ isOpen: false, goal: null })

  const triggerRefresh = useCallback(() => {
    setContentVersion(v => v + 1)
  }, [])

  // Helper authenticated fetch wrapper
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
    }

    if (adminToken) {
      headers['x-admin-token'] = adminToken
      headers['Authorization'] = `Bearer ${adminToken}`
    }

    const mergedOptions = {
      ...options,
      headers,
      credentials: 'include',
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
    return fetch(fullUrl, mergedOptions)
  }, [adminToken])

  // Check existing session on mount or when token changes
  const checkSession = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/admin/auth/session')
      if (res.ok) {
        const json = await res.json()
        if (json.authenticated) {
          setIsAdmin(true)
          setAdminUser(json.user)
          return true
        }
      }
    } catch {
      // not authenticated or network error
    }

    // If session check failed and we had a token, it might be expired
    setIsAdmin(false)
    setAdminUser(null)
    return false
  }, [authFetch])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Login failed')
    }

    if (json.sessionToken) {
      localStorage.setItem(TOKEN_KEY, json.sessionToken)
      setAdminToken(json.sessionToken)
    }

    setIsAdmin(true)
    setAdminUser(json.user)
    setIsEditMode(true)
    localStorage.setItem('portfolio_edit_mode', 'true')
    triggerRefresh()
    return json
  }

  const logout = async () => {
    try {
      await authFetch('/api/v1/admin/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('portfolio_edit_mode')
    setAdminToken(null)
    setIsAdmin(false)
    setAdminUser(null)
    setIsEditMode(false)
    triggerRefresh()
  }

  const toggleEditMode = () => {
    setIsEditMode(prev => {
      const next = !prev
      localStorage.setItem('portfolio_edit_mode', String(next))
      return next
    })
  }

  // Modal triggers
  const openCreateProject = () => setProjectModalState({ isOpen: true, project: null })
  const openEditProject = (project) => setProjectModalState({ isOpen: true, project })
  const closeProjectModal = () => setProjectModalState({ isOpen: false, project: null })

  const openEditAbout = () => setIsAboutModalOpen(true)
  const closeAboutModal = () => setIsAboutModalOpen(false)

  const openCreateEvent = () => setEventModalState({ isOpen: true, event: null })
  const openEditEvent = (event) => setEventModalState({ isOpen: true, event })
  const closeEventModal = () => setEventModalState({ isOpen: false, event: null })

  const openCreateGoal = () => setGoalModalState({ isOpen: true, goal: null })
  const openEditGoal = (goal) => setGoalModalState({ isOpen: true, goal })
  const closeGoalModal = () => setGoalModalState({ isOpen: false, goal: null })

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminUser,
        adminToken,
        isEditMode,
        contentVersion,
        authFetch,
        login,
        logout,
        toggleEditMode,
        triggerRefresh,
        // Modals
        projectModalState,
        openCreateProject,
        openEditProject,
        closeProjectModal,
        isAboutModalOpen,
        openEditAbout,
        closeAboutModal,
        eventModalState,
        openCreateEvent,
        openEditEvent,
        closeEventModal,
        goalModalState,
        openCreateGoal,
        openEditGoal,
        closeGoalModal,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return ctx
}
