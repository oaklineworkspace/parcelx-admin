import { useState } from 'react'
import { 
  Card, Title, TextInput, Button, Stack, Group, Table, Badge, 
  ActionIcon, Menu, Loader, Center, Text, Alert, Pagination, Select, Grid
} from '@mantine/core'
import { 
  IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, 
  IconInfoCircle, IconPlane, IconClock, IconFilter, IconEye,
  IconToggleLeft, IconToggleRight, IconCopy
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured, CABIN_CLASSES } from '@/lib/supabase'

export default function FlightsList() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [airlineFilter, setAirlineFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const supabaseConfigured = isSupabaseConfigured()

  const { data: airlines } = useQuery({
    queryKey: ['airlines-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('airlines')
        .select('id, code, name')
        .order('name')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { data: airports } = useQuery({
    queryKey: ['airports-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('airports')
        .select('id, code, name, city')
        .order('code')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { data: flightsData, isLoading } = useQuery({
    queryKey: ['flights', search, airlineFilter, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('flights')
        .select(`
          *,
          airline:airlines(id, code, name),
          departure:airports!flights_departure_airport_id_fkey(id, code, name, city),
          arrival:airports!flights_arrival_airport_id_fkey(id, code, name, city)
        `, { count: 'exact' })

      if (search) {
        query = query.or(`flight_number.ilike.%${search}%`)
      }
      if (airlineFilter) {
        query = query.eq('airline_id', airlineFilter)
      }
      if (statusFilter === 'active') {
        query = query.eq('is_active', true)
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count, error } = await query
        .order('flight_number')
        .range(from, to)

      if (error) throw error
      return { flights: data || [], total: count || 0 }
    },
    enabled: supabaseConfigured,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('flights')
        .update({ is_active: !is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      notifications.show({ title: 'Success', message: 'Flight status updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('flights').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      notifications.show({ title: 'Success', message: 'Flight deleted', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (flight) => {
      const newFlight = {
        flight_number: `${flight.flight_number}-COPY`,
        airline_id: flight.airline_id,
        departure_airport_id: flight.departure_airport_id,
        arrival_airport_id: flight.arrival_airport_id,
        departure_time: flight.departure_time,
        arrival_time: flight.arrival_time,
        duration_minutes: flight.duration_minutes,
        aircraft_type: flight.aircraft_type,
        base_price_economy: flight.base_price_economy,
        base_price_premium: flight.base_price_premium,
        base_price_business: flight.base_price_business,
        base_price_first: flight.base_price_first,
        stops: flight.stops,
        stop_airports: flight.stop_airports,
        days_of_week: flight.days_of_week,
        is_active: false,
        amenities: flight.amenities,
      }
      const { error } = await supabase.from('flights').insert(newFlight)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      notifications.show({ title: 'Success', message: 'Flight duplicated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const flights = flightsData?.flights || []
  const totalPages = Math.ceil((flightsData?.total || 0) / pageSize)

  const formatTime = (time) => {
    if (!time) return '-'
    return time.substring(0, 5)
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '-'
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  if (!supabaseConfigured) {
    return (
      <Stack gap="lg">
        <Group justify="space-between" wrap="wrap">
          <Title order={2}>Flights</Title>
        </Group>
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase to manage flights.
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Title order={2}>Flights</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => router.push('/flights/new')}>
          Add Flight
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Grid mb="md">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              placeholder="Search flight number..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              placeholder="Filter by airline"
              leftSection={<IconFilter size={16} />}
              data={airlines?.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` })) || []}
              value={airlineFilter}
              onChange={(v) => { setAirlineFilter(v || ''); setPage(1) }}
              clearable
              searchable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              placeholder="Filter by status"
              leftSection={<IconFilter size={16} />}
              data={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v || ''); setPage(1) }}
              clearable
            />
          </Grid.Col>
        </Grid>

        {isLoading ? (
          <Center h={200}><Loader /></Center>
        ) : flights.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No flights found</Text>
        ) : (
          <>
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Flight</Table.Th>
                    <Table.Th>Airline</Table.Th>
                    <Table.Th>Route</Table.Th>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th>Economy Price</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {flights.map((flight) => (
                    <Table.Tr key={flight.id}>
                      <Table.Td>
                        <Group gap="xs">
                          <IconPlane size={16} />
                          <Text 
                            fw={500} 
                            style={{ cursor: 'pointer' }} 
                            c="blue"
                            onClick={() => router.push(`/flights/${flight.id}`)}
                          >
                            {flight.flight_number}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{flight.airline?.code || '-'}</Text>
                        <Text size="xs" c="dimmed">{flight.airline?.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{flight.departure?.code} → {flight.arrival?.code}</Text>
                        <Text size="xs" c="dimmed">{flight.departure?.city} to {flight.arrival?.city}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconClock size={14} />
                          <Text size="sm">{formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>{formatDuration(flight.duration_minutes)}</Table.Td>
                      <Table.Td>${flight.base_price_economy}</Table.Td>
                      <Table.Td>
                        <Badge color={flight.is_active ? 'green' : 'gray'}>
                          {flight.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => router.push(`/flights/${flight.id}`)}>
                              View Details
                            </Menu.Item>
                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => router.push(`/flights/${flight.id}`)}>
                              Edit Flight
                            </Menu.Item>
                            <Menu.Item leftSection={<IconCopy size={14} />} onClick={() => duplicateMutation.mutate(flight)}>
                              Duplicate
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={flight.is_active ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />}
                              onClick={() => toggleStatusMutation.mutate({ id: flight.id, is_active: flight.is_active })}
                            >
                              {flight.is_active ? 'Deactivate' : 'Activate'}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item 
                              color="red" 
                              leftSection={<IconTrash size={14} />} 
                              onClick={() => {
                                if (window.confirm(`Delete flight ${flight.flight_number}?`)) {
                                  deleteMutation.mutate(flight.id)
                                }
                              }}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination value={page} onChange={setPage} total={totalPages} />
              </Group>
            )}
            
            {flights.length > 0 && (
              <Text size="xs" c="dimmed" ta="center" mt="md">
                Showing {flights.length} of {flightsData?.total || 0} flights
              </Text>
            )}
          </>
        )}
      </Card>
    </Stack>
  )
}
