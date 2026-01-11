import { AppShell, Group, Text, Stack, NavLink, Divider } from '@mantine/core'
import { IconDashboard, IconPackage, IconUsers, IconTruckDelivery } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()

  const navItems = [
    { href: '/', label: 'Dashboard', icon: IconDashboard },
    { href: '/shipments', label: 'Shipments', icon: IconPackage },
    { href: '/users', label: 'Users', icon: IconUsers },
  ]

  return (
    <AppShell
      navbar={{ width: 280, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Group gap="xs" mb="md">
            <IconTruckDelivery size={28} color="var(--mantine-color-blue-6)" />
            <div>
              <Text fw={700} size="lg">ParcelX Admin</Text>
              <Text size="xs" c="dimmed">Logistics Management</Text>
            </div>
          </Group>
          
          <Divider mb="md" />
          
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={router.pathname === item.href || 
                (item.href !== '/' && router.pathname.startsWith(item.href))}
            />
          ))}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
}
