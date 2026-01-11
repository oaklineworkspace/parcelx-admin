import { useState } from 'react'
import { 
  Card, Title, Table, Group, Badge, TextInput, 
  ActionIcon, Menu, Stack, Text, Loader, Center, Modal, 
  Pagination, Avatar, Tooltip, Alert, Button 
} from '@mantine/core'
import { 
  IconSearch, IconDotsVertical, IconEye, IconTrash, 
  IconRefresh, IconMail, IconPhone, IconMapPin, IconInfoCircle 
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function Users() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const pageSize = 10

  const supabaseConfigured = isSupabaseConfigured()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', search, page],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
      
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
      }
      
      const { data, error, count } = await query
      if (error) throw error
      return { users: data || [], total: count || 0 }
    },
    enabled: supabaseConfigured,
  })

  const { data: userShipmentCounts } = useQuery({
    queryKey: ['user-shipment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipments').select('user_id')
      if (error) throw error
      
      const counts: Record<string, number> = {}
      data?.forEach(s => {
        if (s.user_id) {
          counts[s.user_id] = (counts[s.user_id] || 0) + 1
        }
      })
      return counts
    },
    enabled: supabaseConfigured,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-count'] })
      notifications.show({ title: 'Success', message: 'User profile deleted', color: 'green' })
      setDeleteModal(null)
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete user profile', color: 'red' })
    },
  })

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Users</Title>
        <Text c="dimmed">{data?.total || 0} total users</Text>
      </Group>

      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          To manage users, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.
        </Alert>
      )}

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group>
            <TextInput
              placeholder="Search by name or email..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              style={{ flex: 1 }}
            />
            <ActionIcon variant="light" size="lg" onClick={() => refetch()}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>

          {isLoading ? (
            <Center py="xl"><Loader /></Center>
          ) : !data?.users.length ? (
            <Text c="dimmed" ta="center" py="xl">No users found</Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Country</Table.Th>
                  <Table.Th>Shipments</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar src={user.avatar_url} radius="xl" size="sm">
                          {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </Avatar>
                        <div>
                          <Text fw={500} size="sm">
                            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconMail size={14} color="gray" />
                        <Text size="sm">{user.email || '-'}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {user.phone_number ? (
                        <Group gap="xs">
                          <IconPhone size={14} color="gray" />
                          <Text size="sm">{user.country_code || ''}{user.phone_number}</Text>
                        </Group>
                      ) : '-'}
                    </Table.Td>
                    <Table.Td>
                      {user.country ? (
                        <Group gap="xs">
                          <IconMapPin size={14} color="gray" />
                          <Text size="sm">{user.country}</Text>
                        </Group>
                      ) : '-'}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {userShipmentCounts?.[user.id] || 0}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="View Details">
                          <ActionIcon variant="light" onClick={() => router.push(`/users/${user.id}`)}>
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="light">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item 
                              leftSection={<IconEye size={14} />}
                              onClick={() => router.push(`/users/${user.id}`)}
                            >
                              View Details
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item 
                              color="red" 
                              leftSection={<IconTrash size={14} />}
                              onClick={() => setDeleteModal(user.id)}
                            >
                              Delete Profile
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
        <Text mb="lg">Are you sure you want to delete this user profile? This will not delete the auth user.</Text>
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
