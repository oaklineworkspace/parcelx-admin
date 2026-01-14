import { useState, useEffect } from 'react'
import { Card, TextInput, PasswordInput, Button, Stack, Title, Text, Center, Alert, Loader } from '@mantine/core'
import { IconLock, IconAlertCircle, IconMail } from '@tabler/icons-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function AdminAuth({ children }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [adminUser, setAdminUser] = useState(null)

  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAuth()
    }
  }, [])

  const checkAuth = async () => {
    if (!supabaseConfigured) {
      setIsLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const isAdmin = await checkAdminProfile(session.user.id)
        if (isAdmin) {
          setIsAuthenticated(true)
          setAdminUser(session.user)
        } else {
          await supabase.auth.signOut()
          setError('This account does not have admin access.')
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
    }
    setIsLoading(false)
  }

  const checkAdminProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return false
      }
      return true
    } catch (err) {
      console.error('Admin check error:', err)
      return false
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!supabaseConfigured) {
      setError('Supabase is not configured. Please set up environment variables.')
      setIsSubmitting(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setIsSubmitting(false)
        return
      }

      if (data.user) {
        const isAdmin = await checkAdminProfile(data.user.id)
        if (isAdmin) {
          setIsAuthenticated(true)
          setAdminUser(data.user)
        } else {
          await supabase.auth.signOut()
          setError('This account does not have admin access. Please contact the system administrator.')
        }
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.')
    }
    setIsSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setAdminUser(null)
    setEmail('')
    setPassword('')
  }

  if (isLoading) {
    return (
      <Center style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Loader size="lg" />
      </Center>
    )
  }

  if (isAuthenticated) {
    return (
      <AdminContext.Provider value={{ adminUser, handleLogout }}>
        {children}
      </AdminContext.Provider>
    )
  }

  return (
    <Center style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <Card shadow="md" padding="xl" radius="md" withBorder style={{ width: '100%', maxWidth: 400 }}>
        <form onSubmit={handleLogin}>
          <Stack gap="md" align="center">
            <IconLock size={48} color="var(--mantine-color-blue-6)" />
            <Title order={2} ta="center">Admin Login</Title>
            <Text c="dimmed" ta="center" size="sm">
              Sign in with your admin account
            </Text>

            {!supabaseConfigured && (
              <Alert icon={<IconAlertCircle size={16} />} color="orange" w="100%">
                Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
              </Alert>
            )}

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" w="100%">
                {error}
              </Alert>
            )}

            <TextInput
              type="email"
              placeholder="Email address"
              leftSection={<IconMail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              w="100%"
              size="md"
              required
              disabled={!supabaseConfigured}
            />

            <PasswordInput
              placeholder="Password"
              leftSection={<IconLock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              w="100%"
              size="md"
              required
              disabled={!supabaseConfigured}
            />

            <Button 
              type="submit" 
              fullWidth 
              size="md" 
              loading={isSubmitting}
              disabled={!supabaseConfigured}
            >
              Sign In
            </Button>
          </Stack>
        </form>
      </Card>
    </Center>
  )
}

import { createContext, useContext } from 'react'

export const AdminContext = createContext({ adminUser: null, handleLogout: () => {} })

export function useAdmin() {
  return useContext(AdminContext)
}
