import { useState } from 'react'
import { 
  Card, Title, TextInput, Button, Stack, Group, Table, Badge, 
  ActionIcon, Loader, Center, Text, Alert, Modal, Select
} from '@mantine/core'
import { 
  IconSearch, IconTrash, IconUserPlus, IconShield, IconInfoCircle, IconCheck, IconX
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import dayjs from 'dayjs'

export default function AdminsList() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminRole, setNewAdminRole] = useState('admin')

  const supabaseConfigured = isSupabaseConfigured()

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admins', search],
    queryFn: async () => {
      let query = supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { data: authUsers } = useQuery({
    queryKey: ['auth-users-for-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, first_name, last_name')
        .order('email')

      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured && addModal,
  })

  const existingAdminIds = admins?.map(a => a.user_id) || []
  const availableUsers = authUsers?.filter(u => !existingAdminIds.includes(u.id)) || []

  const addAdminMutation = useMutation({
    mutationFn: async () => {
      const selectedUser = authUsers?.find(u => u.id === selectedUserId)
      if (!selectedUser) throw new Error('Please select a user')

      const { error } = await supabase
        .from('admin_profiles')
        .insert({
          user_id: selectedUserId,
          email: selectedUser.email,
          full_name: newAdminName || selectedUser.full_name || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim(),
          role: newAdminRole,
          is_active: true,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      notifications.show({ title: 'Success', message: 'Admin added successfully', color: 'green' })
      setAddModal(false)
      setSelectedUserId('')
      setNewAdminName('')
      setNewAdminRole('admin')
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('admin_profiles')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      notifications.show({ title: 'Success', message: 'Admin status updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const deleteAdminMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      notifications.show({ title: 'Success', message: 'Admin removed', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Group gap="xs">
          <IconShield size={28} />
          <Title order={2}>Admin Management</Title>
          {admins && <Badge size="lg" variant="light">{admins.length} admins</Badge>}
        </Group>
        <Button leftSection={<IconUserPlus size={16} />} onClick={() => setAddModal(true)}>
          Add Admin
        </Button>
      </Group>

      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase environment variables to manage admins.
        </Alert>
      )}

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <TextInput
          placeholder="Search by email or name..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          mb="md"
        />

        {isLoading ? (
          <Center h={200}><Loader size="lg" /></Center>
        ) : !admins?.length ? (
          <Center h={200}>
            <Stack align="center">
              <IconShield size={48} color="gray" />
              <Text c="dimmed">No admins found</Text>
              <Button variant="light" onClick={() => setAddModal(true)}>Add First Admin</Button>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Added</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {admins.map((admin) => (
                  <Table.Tr key={admin.id}>
                    <Table.Td>
                      <Text fw={500}>{admin.email}</Text>
                    </Table.Td>
                    <Table.Td>{admin.full_name || '-'}</Table.Td>
                    <Table.Td>
                      <Badge variant="outline">{admin.role}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={admin.is_active ? 'green' : 'red'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{dayjs(admin.created_at).format('MMM D, YYYY')}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color={admin.is_active ? 'red' : 'green'}
                          onClick={() => toggleActiveMutation.mutate({ id: admin.id, is_active: !admin.is_active })}
                          title={admin.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {admin.is_active ? <IconX size={16} /> : <IconCheck size={16} />}
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => {
                            if (window.confirm(`Remove ${admin.email} from admins?`)) {
                              deleteAdminMutation.mutate(admin.id)
                            }
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal opened={addModal} onClose={() => setAddModal(false)} title="Add New Admin">
        <Stack gap="md">
          <Select
            label="Select User"
            placeholder="Choose a user to make admin"
            data={availableUsers.map(u => ({
              value: u.id,
              label: `${u.email} ${u.full_name ? `(${u.full_name})` : u.first_name ? `(${u.first_name})` : ''}`
            }))}
            value={selectedUserId}
            onChange={(v) => {
              setSelectedUserId(v || '')
              const user = authUsers?.find(u => u.id === v)
              if (user) {
                setNewAdminName(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim())
              }
            }}
            searchable
            nothingFoundMessage="No users available"
          />

          <TextInput
            label="Display Name"
            placeholder="Admin name"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
          />

          <Select
            label="Role"
            data={[
              { value: 'admin', label: 'Admin' },
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'moderator', label: 'Moderator' },
            ]}
            value={newAdminRole}
            onChange={(v) => setNewAdminRole(v || 'admin')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button 
              onClick={() => addAdminMutation.mutate()}
              loading={addAdminMutation.isPending}
              disabled={!selectedUserId}
            >
              Add Admin
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
