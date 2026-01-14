import { useState } from 'react'
import { 
  Card, Title, TextInput, Button, Stack, Group, Table, Badge, 
  ActionIcon, Menu, Loader, Center, Text, Alert, Select, Pagination, Image, Modal
} from '@mantine/core'
import { 
  IconSearch, IconDotsVertical, IconEye, IconCheck, IconX, IconTicket,
  IconInfoCircle, IconPlane, IconUser, IconCreditCard, IconPhoto
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/router'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import dayjs from 'dayjs'

const ITEMS_PER_PAGE = 10

const STATUS_COLORS = {
  pending: 'yellow',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
}

const PAYMENT_STATUS_COLORS = {
  unpaid: 'gray',
  pending: 'yellow',
  paid: 'green',
  refunded: 'orange',
  failed: 'red',
}

export default function BookingsList() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [page, setPage] = useState(1)
  const [proofModal, setProofModal] = useState({ open: false, url: '', booking: null })

  const supabaseConfigured = isSupabaseConfigured()

  const { data: bookingsData, isLoading, error: queryError } = useQuery({
    queryKey: ['bookings', search, statusFilter, paymentFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('flight_bookings')
        .select('*', { count: 'exact' })

      if (search) {
        query = query.or(`booking_reference.ilike.%${search}%,contact_email.ilike.%${search}%,contact_phone.ilike.%${search}%`)
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      if (paymentFilter) {
        query = query.eq('payment_status', paymentFilter)
      }

      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Bookings query error:', error)
        throw error
      }
      return { bookings: data || [], total: count || 0 }
    },
    enabled: supabaseConfigured,
  })

  const bookings = bookingsData?.bookings || []
  const totalPages = Math.ceil((bookingsData?.total || 0) / ITEMS_PER_PAGE)

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('flight_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      notifications.show({ title: 'Success', message: 'Booking status updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, payment_status }) => {
      const updateData = { 
        payment_status, 
        updated_at: new Date().toISOString() 
      }
      if (payment_status === 'paid') {
        updateData.verified_at = new Date().toISOString()
      }
      const { error } = await supabase
        .from('flight_bookings')
        .update(updateData)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      notifications.show({ title: 'Success', message: 'Payment status updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const getUserName = (booking) => {
    return booking.contact_email || 'Unknown'
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Group gap="xs">
          <IconTicket size={28} />
          <Title order={2}>Flight Bookings</Title>
          {bookingsData && <Badge size="lg" variant="light">{bookingsData.total} bookings</Badge>}
        </Group>
      </Group>

      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase environment variables to manage bookings.
        </Alert>
      )}

      {queryError && (
        <Alert icon={<IconInfoCircle size={16} />} title="Query Error" color="red">
          {queryError.message}
        </Alert>
      )}

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group mb="md" wrap="wrap">
          <TextInput
            placeholder="Search by reference, email, phone..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Status"
            clearable
            data={[
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v || ''); setPage(1) }}
            w={140}
          />
          <Select
            placeholder="Payment"
            clearable
            data={[
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'refunded', label: 'Refunded' },
            ]}
            value={paymentFilter}
            onChange={(v) => { setPaymentFilter(v || ''); setPage(1) }}
            w={140}
          />
        </Group>

        {isLoading ? (
          <Center h={200}><Loader size="lg" /></Center>
        ) : !bookings.length ? (
          <Center h={200}>
            <Stack align="center">
              <IconTicket size={48} color="gray" />
              <Text c="dimmed">No bookings found</Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Table.ScrollContainer minWidth={900}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Reference</Table.Th>
                    <Table.Th>Customer</Table.Th>
                    <Table.Th>Trip</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Class</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Payment</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookings.map((booking) => (
                    <Table.Tr key={booking.id}>
                      <Table.Td>
                        <Text 
                          fw={500} 
                          c="blue" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                        >
                          {booking.booking_reference}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUser size={14} />
                          <div>
                            <Text size="sm">{getUserName(booking)}</Text>
                            <Text size="xs" c="dimmed">{booking.total_passengers} passenger(s)</Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconPlane size={14} />
                          <Badge variant="outline" size="sm">
                            {booking.trip_type === 'roundtrip' ? 'Round Trip' : 'One Way'}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{dayjs(booking.departure_date).format('MMM D, YYYY')}</Text>
                        {booking.return_date && (
                          <Text size="xs" c="dimmed">Return: {dayjs(booking.return_date).format('MMM D')}</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" size="sm">
                          {booking.cabin_class?.charAt(0).toUpperCase() + booking.cabin_class?.slice(1)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>${Number(booking.total_price).toFixed(2)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={STATUS_COLORS[booking.status] || 'gray'}>
                          {booking.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge color={PAYMENT_STATUS_COLORS[booking.payment_status] || 'gray'}>
                            {booking.payment_status}
                          </Badge>
                          {booking.payment_proof_url && (
                            <ActionIcon 
                              size="sm" 
                              variant="subtle" 
                              color="blue"
                              onClick={() => setProofModal({ open: true, url: booking.payment_proof_url, booking })}
                            >
                              <IconPhoto size={14} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEye size={14} />} onClick={() => router.push(`/bookings/${booking.id}`)}>
                              View Details
                            </Menu.Item>
                            {booking.payment_proof_url && (
                              <Menu.Item 
                                leftSection={<IconPhoto size={14} />} 
                                onClick={() => setProofModal({ open: true, url: booking.payment_proof_url, booking })}
                              >
                                View Payment Proof
                              </Menu.Item>
                            )}
                            <Menu.Divider />
                            <Menu.Label>Update Status</Menu.Label>
                            <Menu.Item 
                              leftSection={<IconCheck size={14} />} 
                              color="green"
                              onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'confirmed' })}
                              disabled={booking.status === 'confirmed'}
                            >
                              Confirm Booking
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={<IconX size={14} />} 
                              color="red"
                              onClick={() => {
                                if (window.confirm('Cancel this booking?')) {
                                  updateStatusMutation.mutate({ id: booking.id, status: 'cancelled' })
                                }
                              }}
                              disabled={booking.status === 'cancelled'}
                            >
                              Cancel Booking
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Label>Payment Status</Menu.Label>
                            <Menu.Item 
                              leftSection={<IconCreditCard size={14} />} 
                              color="green"
                              onClick={() => updatePaymentMutation.mutate({ id: booking.id, payment_status: 'paid' })}
                              disabled={booking.payment_status === 'paid'}
                            >
                              Mark as Paid
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={<IconCreditCard size={14} />} 
                              color="orange"
                              onClick={() => updatePaymentMutation.mutate({ id: booking.id, payment_status: 'pending' })}
                              disabled={booking.payment_status === 'pending'}
                            >
                              Mark Payment Pending
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

            {bookings.length > 0 && (
              <Text size="xs" c="dimmed" ta="center" mt="md">
                Showing {bookings.length} of {bookingsData?.total || 0} bookings
              </Text>
            )}
          </>
        )}
      </Card>

      <Modal 
        opened={proofModal.open} 
        onClose={() => setProofModal({ open: false, url: '', booking: null })}
        title="Payment Proof"
        size="lg"
      >
        {proofModal.booking && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Booking Reference</Text>
                <Text fw={500}>{proofModal.booking.booking_reference}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Amount</Text>
                <Text fw={500}>${Number(proofModal.booking.total_price).toFixed(2)}</Text>
              </div>
            </Group>
            {proofModal.booking.payment_crypto_name && (
              <Group>
                <div>
                  <Text size="sm" c="dimmed">Crypto</Text>
                  <Text>{proofModal.booking.payment_crypto_name} ({proofModal.booking.payment_crypto_symbol})</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Network</Text>
                  <Text>{proofModal.booking.payment_network_type}</Text>
                </div>
                {proofModal.booking.payment_amount_crypto && (
                  <div>
                    <Text size="sm" c="dimmed">Crypto Amount</Text>
                    <Text>{proofModal.booking.payment_amount_crypto}</Text>
                  </div>
                )}
              </Group>
            )}
            {proofModal.booking.payment_submitted_at && (
              <Text size="sm" c="dimmed">
                Submitted: {dayjs(proofModal.booking.payment_submitted_at).format('MMM D, YYYY h:mm A')}
              </Text>
            )}
            <Image
              src={proofModal.url}
              alt="Payment Proof"
              radius="md"
              fit="contain"
              mah={500}
            />
            <Group justify="flex-end">
              <Button 
                color="red" 
                variant="light"
                onClick={() => {
                  updatePaymentMutation.mutate({ id: proofModal.booking.id, payment_status: 'failed' })
                  setProofModal({ open: false, url: '', booking: null })
                }}
              >
                Reject Payment
              </Button>
              <Button 
                color="green"
                onClick={() => {
                  updatePaymentMutation.mutate({ id: proofModal.booking.id, payment_status: 'paid' })
                  updateStatusMutation.mutate({ id: proofModal.booking.id, status: 'confirmed' })
                  setProofModal({ open: false, url: '', booking: null })
                }}
              >
                Approve Payment
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
