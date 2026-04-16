import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const signout = useCallback(async () => {
        try { await authApi.signout() } catch { }
        localStorage.removeItem('accessToken')
        setUser(null)
        window.location.href = '/signin'
    }, [])

    // Listen for forced logout from axios interceptor
    useEffect(() => {
        const handler = () => {
            localStorage.removeItem('accessToken')
            setUser(null)
            window.location.href = '/signin'
            console.log("AUTH PROVIDER SIGNOUT")
        }
        window.addEventListener('user:signout', handler)
        return () => window.removeEventListener('user:signout', handler)
    }, [])

    // Restore session on mount
    useEffect(() => {
        const restore = async () => {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                setLoading(false);
                console.log("NO TOKEN")
                return
            }
            try {
                const res = await authApi.me()
                setUser(res.data.data.user)
                console.log("AUTH PROVIDER RESTORE")
                console.log("USER:", res.data.data.user)
            } catch {
                localStorage.removeItem('accessToken')
            } finally {
                setLoading(false)
            }
        }
        restore()
    }, [])


    // signin
    const signin = async (credentials) => {
        const res = await authApi.signin(credentials)
        // if (credentials.remember) {
            localStorage.setItem('accessToken', res.data.data.accessToken)
            setUser(res.data.data.user)
            console.log("TOKEN:", localStorage.getItem('accessToken'))
        // }
        return res
    }

    // signup
    const signup = async (payload) => {
        const res = await authApi.signup(payload)

        if (res?.data?.data?.accessToken) {
            localStorage.setItem('accessToken', res.data.data.accessToken)
            setUser(res.data.data.user)
        }
        return res
    }

    return (
        <AuthContext.Provider value={{ user, setUser, signin, signup, signout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    console.log("AUTH PROVIDER USEAUTH")
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}