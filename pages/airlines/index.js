import { useState } from 'react'
import { 
  Card, Title, TextInput, Button, Stack, Group, Table, Badge, 
  ActionIcon, Menu, Loader, Center, Text, Alert, Modal, Grid, Switch, Image
} from '@mantine/core'
import { 
  IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, 
  IconInfoCircle, IconBuilding, IconToggleLeft, IconToggleRight
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function AirlinesList() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAirline, setEditingAirline] = useState(null)
  const [formData, setFormData] = useState({ code: '', name: '', country: '', logo_url: '', is_active: true })

  const supabaseConfigured = isSupabaseConfigured()

  const { data: airlines, isLoading } = useQuery({
    queryKey: ['airlines', search],
    queryFn: async () => {
      let query = supabase.from('airlines').select('*')
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
      }
      const { data, error } = await query.order('code')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingAirline) {
        const { error } = await supabase.from('airlines').update({
          code: data.code,
          name: data.name,
          country: data.country,
          logo_url: data.logo_url || null,
          is_active: data.is_active,
        }).eq('id', editingAirline.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('airlines').insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airlines'] })
      notifications.show({ title: 'Success', message: editingAirline ? 'Airline updated' : 'Airline created', color: 'green' })
      closeModal()
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from('airlines').update({ is_active: !is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airlines'] })
      notifications.show({ title: 'Success', message: 'Status updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('airlines').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airlines'] })
      notifications.show({ title: 'Success', message: 'Airline deleted', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const openModal = (airline = null) => {
    if (airline) {
      setEditingAirline(airline)
      setFormData({
        code: airline.code,
        name: airline.name,
        country: airline.country || '',
        logo_url: airline.logo_url || '',
        is_active: airline.is_active,
      })
    } else {
      setEditingAirline(null)
      setFormData({ code: '', name: '', country: '', logo_url: '', is_active: true })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingAirline(null)
    setFormData({ code: '', name: '', country: '', logo_url: '', is_active: true })
  }

  if (!supabaseConfigured) {
    return (
      <Stack gap="lg">
        <Title order={2}>Airlines</Title>
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase to manage airlines.
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Title order={2}>Airlines</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openModal()}>
          Add Airline
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <TextInput
          placeholder="Search airlines..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          mb="md"
        />

        {isLoading ? (
          <Center h={200}><Loader /></Center>
        ) : airlines?.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No airlines found</Text>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Logo</Table.Th>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Country</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {airlines?.map((airline) => (
                  <Table.Tr key={airline.id}>
                    <Table.Td>
                      {airline.logo_url ? (
                        <Image src={airline.logo_url} alt={airline.name} w={40} h={40} fit="contain" />
                      ) : (
                        <IconBuilding size={24} color="gray" />
                      )}
                    </Table.Td>
                    <Table.Td><Text fw={600}>{airline.code}</Text></Table.Td>
                    <Table.Td>{airline.name}</Table.Td>
                    <Table.Td>{airline.country || '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={airline.is_active ? 'green' : 'gray'}>
                        {airline.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openModal(airline)}>
                            Edit
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={airline.is_active ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />}
                            onClick={() => toggleStatusMutation.mutate({ id: airline.id, is_active: airline.is_active })}
                          >
                            {airline.is_active ? 'Deactivate' : 'Activate'}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item 
                            color="red" 
                            leftSection={<IconTrash size={14} />} 
                            onClick={() => {
                              if (window.confirm(`Delete airline ${airline.code} - ${airline.name}? This may fail if flights use this airline.`)) {
                                deleteMutation.mutate(airline.id)
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

      <Modal opened={modalOpen} onClose={closeModal} title={editingAirline ? 'Edit Airline' : 'Add Airline'}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={4}>
              <TextInput
                label="Code"
                placeholder="AA"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={3}
                required
              />
            </Grid.Col>
            <Grid.Col span={8}>
              <TextInput
                label="Name"
                placeholder="American Airlines"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid.Col>
          </Grid>
          <TextInput
            label="Country"
            placeholder="United States"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
          <TextInput
            label="Logo URL"
            placeholder="https://..."
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
          />
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
              disabled={!formData.code || !formData.name}
            >
              {editingAirline ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
