import { AppShell, Group, Text, Stack, NavLink, Divider, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconDashboard, IconPackage, IconUsers, IconTruckDelivery, IconPlane, IconBuilding, IconMapPin } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()
  const [opened, { toggle, close }] = useDisclosure()

  const navItems = [
    { href: '/', label: 'Dashboard', icon: IconDashboard },
    { href: '/shipments', label: 'Shipments', icon: IconPackage },
    { href: '/users', label: 'Users', icon: IconUsers },
  ]

  const flightNavItems = [
    { href: '/flights', label: 'Flights', icon: IconPlane },
    { href: '/airlines', label: 'Airlines', icon: IconBuilding },
    { href: '/airports', label: 'Airports', icon: IconMapPin },
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
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group gap="xs">
            <IconTruckDelivery size={28} color="var(--mantine-color-blue-6)" />
            <div>
              <Text fw={700} size="lg">ParcelX Admin</Text>
              <Text size="xs" c="dimmed" visibleFrom="xs">Logistics Management</Text>
            </div>
          </Group>
        </Group>
      </AppShell.Header>
      
      <AppShell.Navbar p="md">
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
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
}
