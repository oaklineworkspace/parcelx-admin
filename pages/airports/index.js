import { useState } from 'react'
import { 
  Card, Title, TextInput, Button, Stack, Group, Table, Badge, 
  ActionIcon, Menu, Loader, Center, Text, Alert, Modal, Grid, Switch, NumberInput
} from '@mantine/core'
import { 
  IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, 
  IconInfoCircle, IconMapPin, IconToggleLeft, IconToggleRight
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function AirportsList() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAirport, setEditingAirport] = useState(null)
  const [formData, setFormData] = useState({ 
    code: '', name: '', city: '', country: '', country_code: '', 
    timezone: '', latitude: null, longitude: null, is_active: true 
  })

  const supabaseConfigured = isSupabaseConfigured()

  const { data: airports, isLoading } = useQuery({
    queryKey: ['airports', search],
    queryFn: async () => {
      let query = supabase.from('airports').select('*')
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,city.ilike.%${search}%`)
      }
      const { data, error } = await query.order('code')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        code: data.code,
        name: data.name,
        city: data.city,
        country: data.country,
        country_code: data.country_code || null,
        timezone: data.timezone || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        is_active: data.is_active,
      }
      if (editingAirport) {
        const { error } = await supabase.from('airports').update(payload).eq('id', editingAirport.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('airports').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airports'] })
      notifications.show({ title: 'Success', message: editingAirport ? 'Airport updated' : 'Airport created', color: 'green' })
      closeModal()
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from('airports').update({ is_active: !is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airports'] })
      notifications.show({ title: 'Success', message: 'Status updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('airports').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airports'] })
      notifications.show({ title: 'Success', message: 'Airport deleted', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const openModal = (airport = null) => {
    if (airport) {
      setEditingAirport(airport)
      setFormData({
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        country_code: airport.country_code || '',
        timezone: airport.timezone || '',
        latitude: airport.latitude,
        longitude: airport.longitude,
        is_active: airport.is_active,
      })
    } else {
      setEditingAirport(null)
      setFormData({ 
        code: '', name: '', city: '', country: '', country_code: '', 
        timezone: '', latitude: null, longitude: null, is_active: true 
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingAirport(null)
    setFormData({ 
      code: '', name: '', city: '', country: '', country_code: '', 
      timezone: '', latitude: null, longitude: null, is_active: true 
    })
  }

  if (!supabaseConfigured) {
    return (
      <Stack gap="lg">
        <Title order={2}>Airports</Title>
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase to manage airports.
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Title order={2}>Airports</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openModal()}>
          Add Airport
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <TextInput
          placeholder="Search airports..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          mb="md"
        />

        {isLoading ? (
          <Center h={200}><Loader /></Center>
        ) : airports?.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No airports found</Text>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>City</Table.Th>
                  <Table.Th>Country</Table.Th>
                  <Table.Th>Timezone</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {airports?.map((airport) => (
                  <Table.Tr key={airport.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconMapPin size={16} />
                        <Text fw={600}>{airport.code}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{airport.name}</Table.Td>
                    <Table.Td>{airport.city}</Table.Td>
                    <Table.Td>{airport.country}</Table.Td>
                    <Table.Td><Text size="sm">{airport.timezone || '-'}</Text></Table.Td>
                    <Table.Td>
                      <Badge color={airport.is_active ? 'green' : 'gray'}>
                        {airport.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openModal(airport)}>
                            Edit
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={airport.is_active ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />}
                            onClick={() => toggleStatusMutation.mutate({ id: airport.id, is_active: airport.is_active })}
                          >
                            {airport.is_active ? 'Deactivate' : 'Activate'}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item 
                            color="red" 
                            leftSection={<IconTrash size={14} />} 
                            onClick={() => {
                              if (window.confirm(`Delete airport ${airport.code}? This may fail if flights use this airport.`)) {
                                deleteMutation.mutate(airport.id)
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
        )}
      </Card>

      <Modal opened={modalOpen} onClose={closeModal} title={editingAirport ? 'Edit Airport' : 'Add Airport'} size="lg">
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Code"
                placeholder="JFK"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={4}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 9 }}>
              <TextInput
                label="Name"
                placeholder="John F. Kennedy International Airport"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="City"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Country"
                placeholder="United States"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Country Code"
                placeholder="US"
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                maxLength={2}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <TextInput
                label="Timezone"
                placeholder="America/New_York"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Latitude"
                placeholder="40.6413"
                value={formData.latitude}
                onChange={(v) => setFormData({ ...formData, latitude: v })}
                decimalScale={6}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Longitude"
                placeholder="-73.7781"
                value={formData.longitude}
                onChange={(v) => setFormData({ ...formData, longitude: v })}
                decimalScale={6}
              />
            </Grid.Col>
          </Grid>
          <Switch
            label="Active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.currentTarget.checked })}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeModal}>Cancel</Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)} 
              loading={saveMutation.isPending}
              disabled={!formData.code || !formData.name || !formData.city || !formData.country}
            >
              {editingAirport ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
