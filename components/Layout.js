import { AppShell, Group, Text, Stack, NavLink, Divider, Burger, Button } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconDashboard, IconPackage, IconUsers, IconTruckDelivery, IconPlane, IconBuilding, IconMapPin, IconCurrencyBitcoin, IconTicket, IconLogout, IconShield } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAdmin } from './AdminAuth'

export default function Layout({ children }) {
  const router = useRouter()
  const [opened, { toggle, close }] = useDisclosure()
  const { adminUser, handleLogout } = useAdmin()

  const navItems = [
    { href: '/', label: 'Dashboard', icon: IconDashboard },
    { href: '/shipments', label: 'Shipments', icon: IconPackage },
    { href: '/users', label: 'Users', icon: IconUsers },
  ]

  const flightNavItems = [
    { href: '/flights', label: 'Flights', icon: IconPlane },
    { href: '/bookings', label: 'Bookings', icon: IconTicket },
    { href: '/airlines', label: 'Airlines', icon: IconBuilding },
    { href: '/airports', label: 'Airports', icon: IconMapPin },
  ]

  const settingsNavItems = [
    { href: '/crypto-wallets', label: 'Crypto Wallets', icon: IconCurrencyBitcoin },
    { href: '/admins', label: 'Admin Users', icon: IconShield },
  ]

  const handleNavClick = () => {
    close()
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ 
        width: 280, 
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <IconTruckDelivery size={28} color="var(--mantine-color-blue-6)" />
              <div>
                <Text fw={700} size="lg">ParcelX Admin</Text>
                <Text size="xs" c="dimmed" visibleFrom="xs">Logistics Management</Text>
              </div>
            </Group>
          </Group>
          <Group>
            {adminUser && (
              <>
                <Text size="sm" c="dimmed" visibleFrom="sm">{adminUser.email}</Text>
                <Button 
                  variant="subtle" 
                  size="compact-sm" 
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>
      
      <AppShell.Navbar p="md" style={{ overflowY: 'auto' }}>
        <Stack gap="xs">
          <Group gap="xs" mb="md" visibleFrom="sm">
            <IconTruckDelivery size={28} color="var(--mantine-color-blue-6)" />
            <div>
              <Text fw={700} size="lg">ParcelX Admin</Text>
              <Text size="xs" c="dimmed">Logistics Management</Text>
            </div>
          </Group>
          
          <Divider mb="md" visibleFrom="sm" />
          
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>Shipments</Text>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={router.pathname === item.href || 
                (item.href !== '/' && router.pathname.startsWith(item.href))}
              onClick={handleNavClick}
            />
          ))}
          
          <Divider my="md" />
          
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>Flight Management</Text>
          {flightNavItems.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={router.pathname === item.href || 
                (item.href !== '/' && router.pathname.startsWith(item.href))}
              onClick={handleNavClick}
            />
          ))}
          
          <Divider my="md" />
          
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>Settings</Text>
          {settingsNavItems.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={router.pathname === item.href || 
                (item.href !== '/' && router.pathname.startsWith(item.href))}
              onClick={handleNavClick}
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
