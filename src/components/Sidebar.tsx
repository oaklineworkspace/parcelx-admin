import { NavLink, Title, Stack, Divider, Text, Box } from '@mantine/core'
import { IconDashboard, IconPackage, IconUsers, IconTruck } from '@tabler/icons-react'
import { useLocation, useNavigate } from 'react-router-dom'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { icon: IconDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: IconPackage, label: 'Shipments', path: '/shipments' },
    { icon: IconUsers, label: 'Users', path: '/users' },
  ]

  return (
    <Box p="md">
      <Stack gap="xs">
        <Stack gap={4} mb="md">
          <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconTruck size={28} />
            ParcelX Admin
          </Title>
          <Text size="xs" c="dimmed">Logistics Management</Text>
        </Stack>
        <Divider />
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
            style={{ borderRadius: 8 }}
          />
        ))}
      </Stack>
    </Box>
  )
}

export default Sidebar
