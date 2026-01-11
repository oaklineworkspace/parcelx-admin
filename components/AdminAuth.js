import { useState, useEffect } from 'react'
import { Card, TextInput, Button, Stack, Title, Text, Center, Alert } from '@mantine/core'
import { IconLock, IconAlertCircle } from '@tabler/icons-react'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
const SESSION_KEY = 'parcelx_admin_authenticated'

export default function AdminAuth({ children }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem(SESSION_KEY)
    if (sessionAuth === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return children
  }

  return (
    <Center style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <Card shadow="md" padding="xl" radius="md" withBorder style={{ width: '100%', maxWidth: 400 }}>
        <form onSubmit={handleLogin}>
          <Stack gap="md" align="center">
            <IconLock size={48} color="var(--mantine-color-blue-6)" />
            <Title order={2} ta="center">Admin Access</Title>
            <Text c="dimmed" ta="center" size="sm">
              Enter the admin password to access the dashboard
            </Text>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" w="100%">
                {error}
              </Alert>
            )}

            <TextInput
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              w="100%"
              size="md"
            />

            <Button type="submit" fullWidth size="md">
              Login
            </Button>
          </Stack>
        </form>
      </Card>
    </Center>
  )
}
