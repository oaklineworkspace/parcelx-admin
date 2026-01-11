import { Card, Grid, Title, Text, Group, Stack, Badge, RingProgress, Center, Alert } from '@mantine/core'
import { IconPackage, IconUsers, IconTruck, IconCheck, IconClock, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

function Dashboard() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseConfigured = !!supabaseUrl

  const { data: shipmentStats } = useQuery({
    queryKey: ['shipment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipments').select('status')
      if (error) throw error
      
      return {
        total: data?.length || 0,
        pending: data?.filter(s => s.status === 'Pending').length || 0,
        inTransit: data?.filter(s => s.status === 'In Transit').length || 0,
        delivered: data?.filter(s => s.status === 'Delivered').length || 0,
        cancelled: data?.filter(s => s.status === 'Cancelled').length || 0,
      }
    },
    enabled: supabaseConfigured,
  })

  const { data: userCount } = useQuery({
    queryKey: ['user-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      if (error) throw error
      return count || 0
    },
    enabled: supabaseConfigured,
  })

  const { data: recentShipments } = useQuery({
    queryKey: ['recent-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: supabaseConfigured,
  })

  const stats = shipmentStats || { total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0 }
  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0

  return (
    <Stack gap="lg">
      <Title order={2}>Dashboard</Title>
      
      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          To connect to your database, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.
        </Alert>
      )}
      
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Shipments</Text>
                <Text size="xl" fw={700}>{stats.total}</Text>
              </div>
              <IconPackage size={40} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>In Transit</Text>
                <Text size="xl" fw={700}>{stats.inTransit}</Text>
              </div>
              <IconTruck size={40} color="var(--mantine-color-orange-6)" />
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Delivered</Text>
                <Text size="xl" fw={700}>{stats.delivered}</Text>
              </div>
              <IconCheck size={40} color="var(--mantine-color-green-6)" />
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Users</Text>
                <Text size="xl" fw={700}>{userCount || 0}</Text>
              </div>
              <IconUsers size={40} color="var(--mantine-color-violet-6)" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Delivery Performance</Title>
            <Center>
              <RingProgress
                size={180}
                thickness={16}
                sections={[{ value: deliveryRate, color: 'green' }]}
                label={
                  <Center>
                    <Stack gap={0} align="center">
                      <Text size="xl" fw={700}>{deliveryRate}%</Text>
                      <Text size="xs" c="dimmed">Delivery Rate</Text>
                    </Stack>
                  </Center>
                }
              />
            </Center>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Recent Shipments</Title>
            <Stack gap="xs">
              {(!recentShipments || recentShipments.length === 0) && (
                <Text c="dimmed" ta="center" py="md">No shipments yet</Text>
              )}
              {recentShipments?.map((shipment) => (
                <Card key={shipment.id} withBorder padding="sm">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{shipment.tracking_number}</Text>
                      <Text size="sm" c="dimmed">{shipment.origin} → {shipment.destination}</Text>
                    </div>
                    <Badge 
                      color={
                        shipment.status === 'Delivered' ? 'green' :
                        shipment.status === 'In Transit' ? 'orange' :
                        shipment.status === 'Cancelled' ? 'red' :
                        shipment.status === 'Pending' ? 'yellow' : 'blue'
                      }
                    >
                      {shipment.status}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={4} mb="md">Status Overview</Title>
        <Group gap="xl">
          <Group gap="xs">
            <IconClock size={20} color="var(--mantine-color-yellow-6)" />
            <Text size="sm">Pending: {stats.pending}</Text>
          </Group>
          <Group gap="xs">
            <IconTruck size={20} color="var(--mantine-color-orange-6)" />
            <Text size="sm">In Transit: {stats.inTransit}</Text>
          </Group>
          <Group gap="xs">
            <IconCheck size={20} color="var(--mantine-color-green-6)" />
            <Text size="sm">Delivered: {stats.delivered}</Text>
          </Group>
          <Group gap="xs">
            <IconAlertCircle size={20} color="var(--mantine-color-red-6)" />
            <Text size="sm">Cancelled: {stats.cancelled}</Text>
          </Group>
        </Group>
      </Card>
    </Stack>
  )
}

export default Dashboard
