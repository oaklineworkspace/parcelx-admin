import { useState } from 'react'
import { 
  Card, Title, Table, Group, Button, Badge, TextInput, Select, 
  ActionIcon, Menu, Stack, Text, Loader, Center, Modal, Pagination, Alert 
} from '@mantine/core'
import { 
  IconPlus, IconSearch, IconDotsVertical, IconEye, 
  IconTrash, IconRefresh, IconTruck, IconCheck, IconX, IconInfoCircle 
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { supabase, SHIPMENT_STATUSES } from '../lib/supabase'

function Shipments() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const pageSize = 10

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseConfigured = !!supabaseUrl

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['shipments', search, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('shipments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
      
      if (search) {
        query = query.or(`tracking_number.ilike.%${search}%,origin.ilike.%${search}%,destination.ilike.%${search}%`)
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error, count } = await query
      if (error) throw error
      return { shipments: data || [], total: count || 0 }
    },
    enabled: supabaseConfigured,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] })
      queryClient.invalidateQueries({ queryKey: ['shipment-stats'] })
      notifications.show({ title: 'Success', message: 'Shipment deleted', color: 'green' })
      setDeleteModal(null)
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete shipment', color: 'red' })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('shipments').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] })
      queryClient.invalidateQueries({ queryKey: ['shipment-stats'] })
      notifications.show({ title: 'Success', message: 'Status updated', color: 'green' })
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to update status', color: 'red' })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'green'
      case 'In Transit': return 'orange'
      case 'Out for Delivery': return 'blue'
      case 'Cancelled': return 'red'
      case 'Pending': return 'yellow'
      case 'On Hold': return 'gray'
      case 'Returned': return 'pink'
      default: return 'blue'
    }
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Shipments</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/shipments/new')}>
          Create Shipment
        </Button>
      </Group>

      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          To manage shipments, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.
        </Alert>
      )}

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group>
            <TextInput
              placeholder="Search by tracking number, origin, or destination..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by status"
              data={SHIPMENT_STATUSES}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1) }}
              clearable
              w={180}
            />
            <ActionIcon variant="light" size="lg" onClick={() => refetch()}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>

          {isLoading ? (
            <Center py="xl"><Loader /></Center>
          ) : !data?.shipments.length ? (
            <Text c="dimmed" ta="center" py="xl">No shipments found</Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tracking Number</Table.Th>
                  <Table.Th>Origin</Table.Th>
                  <Table.Th>Destination</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Est. Delivery</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.shipments.map((shipment) => (
                  <Table.Tr key={shipment.id}>
                    <Table.Td>
                      <Text fw={500}>{shipment.tracking_number}</Text>
                    </Table.Td>
                    <Table.Td>{shipment.origin}</Table.Td>
                    <Table.Td>{shipment.destination}</Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {shipment.estimated_delivery 
                        ? new Date(shipment.estimated_delivery).toLocaleDateString() 
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="light" onClick={() => navigate(`/shipments/${shipment.id}`)}>
                          <IconEye size={16} />
                        </ActionIcon>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="light">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Change Status</Menu.Label>
                            <Menu.Item 
                              leftSection={<IconTruck size={14} />}
                              onClick={() => updateStatusMutation.mutate({ id: shipment.id, status: 'In Transit' })}
                            >
                              Mark In Transit
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={<IconCheck size={14} />}
                              onClick={() => updateStatusMutation.mutate({ id: shipment.id, status: 'Delivered' })}
                            >
                              Mark Delivered
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={<IconX size={14} />}
                              onClick={() => updateStatusMutation.mutate({ id: shipment.id, status: 'Cancelled' })}
                            >
                              Cancel
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item 
                              color="red" 
                              leftSection={<IconTrash size={14} />}
                              onClick={() => setDeleteModal(shipment.id)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {totalPages > 1 && (
            <Group justify="center">
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          )}
        </Stack>
      </Card>

      <Modal opened={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirm Delete">
        <Text mb="lg">Are you sure you want to delete this shipment? This action cannot be undone.</Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button color="red" onClick={() => deleteModal && deleteMutation.mutate(deleteModal)} loading={deleteMutation.isPending}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  )
}

export default Shipments
