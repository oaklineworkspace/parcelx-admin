import { useState } from 'react'
import { 
  Card, Title, Button, Stack, Group, Badge, Loader, Center, Text, Alert, 
  Grid, Table, Image, Textarea, Modal, Divider
} from '@mantine/core'
import { 
  IconArrowLeft, IconInfoCircle, IconTicket, IconPlane, IconUser, 
  IconCreditCard, IconPhoto, IconCheck, IconX, IconCalendar, IconPhone, IconMail
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/router'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import dayjs from 'dayjs'

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

export default function BookingDetail() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()
  const supabaseConfigured = isSupabaseConfigured()
  const [proofModal, setProofModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const { data: booking, isLoading, error: bookingError } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flight_bookings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: supabaseConfigured && !!id,
  })

  const { data: passengers } = useQuery({
    queryKey: ['booking-passengers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flight_passengers')
        .select('*')
        .eq('booking_id', id)
        .order('created_at')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured && !!id,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const { error } = await supabase
        .from('flight_bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      notifications.show({ title: 'Success', message: 'Booking updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const getUserName = () => {
    return booking?.contact_email || 'Unknown'
  }

  if (isLoading && supabaseConfigured) {
    return <Center h={400}><Loader size="lg" /></Center>
  }

  if (!supabaseConfigured) {
    return (
      <Stack gap="lg">
        <Group wrap="wrap">
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/bookings')}>
            Back
          </Button>
          <Title order={2}>Booking Details</Title>
        </Group>
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase to view booking details.
        </Alert>
      </Stack>
    )
  }

  if (!booking) {
    return (
      <Stack gap="lg">
        <Group wrap="wrap">
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/bookings')}>
            Back
          </Button>
          <Title order={2}>Booking Not Found</Title>
        </Group>
        {bookingError && (
          <Alert icon={<IconInfoCircle size={16} />} title="Error" color="red">
            {bookingError.message}
          </Alert>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Group gap="xs">
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/bookings')}>
            Back
          </Button>
          <IconTicket size={28} />
          <Title order={2}>{booking.booking_reference}</Title>
          <Badge color={STATUS_COLORS[booking.status] || 'gray'} size="lg">
            {booking.status}
          </Badge>
          <Badge color={PAYMENT_STATUS_COLORS[booking.payment_status] || 'gray'} size="lg">
            {booking.payment_status}
          </Badge>
        </Group>
        <Group>
          {booking.status !== 'confirmed' && (
            <Button 
              color="green" 
              leftSection={<IconCheck size={16} />}
              onClick={() => updateMutation.mutate({ status: 'confirmed' })}
              loading={updateMutation.isPending}
            >
              Confirm Booking
            </Button>
          )}
          {booking.status !== 'cancelled' && (
            <Button 
              color="red" 
              variant="light"
              leftSection={<IconX size={16} />}
              onClick={() => {
                if (window.confirm('Cancel this booking?')) {
                  updateMutation.mutate({ status: 'cancelled' })
                }
              }}
              loading={updateMutation.isPending}
            >
              Cancel Booking
            </Button>
          )}
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <IconPlane size={20} />
                <Title order={4}>Booking Details</Title>
              </Group>
              
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text c="dimmed">Trip Type</Text>
                  <Badge variant="light">{booking.trip_type === 'roundtrip' ? 'Round Trip' : 'One Way'}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Departure Date</Text>
                  <Text fw={500}>{dayjs(booking.departure_date).format('ddd, MMM D, YYYY')}</Text>
                </Group>
                {booking.return_date && (
                  <Group justify="space-between">
                    <Text c="dimmed">Return Date</Text>
                    <Text fw={500}>{dayjs(booking.return_date).format('ddd, MMM D, YYYY')}</Text>
                  </Group>
                )}
                <Group justify="space-between">
                  <Text c="dimmed">Cabin Class</Text>
                  <Badge variant="outline">{booking.cabin_class}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Total Passengers</Text>
                  <Text fw={500}>{booking.total_passengers}</Text>
                </Group>
                {booking.outbound_flight_id && (
                  <Group justify="space-between">
                    <Text c="dimmed">Outbound Flight ID</Text>
                    <Text size="sm" ff="monospace">{booking.outbound_flight_id}</Text>
                  </Group>
                )}
                {booking.return_flight_id && (
                  <Group justify="space-between">
                    <Text c="dimmed">Return Flight ID</Text>
                    <Text size="sm" ff="monospace">{booking.return_flight_id}</Text>
                  </Group>
                )}
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <IconUser size={20} />
                <Title order={4}>Passengers ({passengers?.length || 0})</Title>
              </Group>

              {passengers && passengers.length > 0 ? (
                <Table.ScrollContainer minWidth={600}>
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>DOB</Table.Th>
                        <Table.Th>Passport</Table.Th>
                        <Table.Th>Contact</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {passengers.map((passenger, idx) => (
                        <Table.Tr key={passenger.id}>
                          <Table.Td>
                            <Text fw={500}>
                              {passenger.title} {passenger.first_name} {passenger.last_name}
                            </Text>
                            <Text size="xs" c="dimmed">{passenger.nationality}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="outline" size="sm">
                              {passenger.passenger_type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {passenger.date_of_birth ? dayjs(passenger.date_of_birth).format('MMM D, YYYY') : '-'}
                          </Table.Td>
                          <Table.Td>
                            {passenger.passport_number && (
                              <>
                                <Text size="sm">{passenger.passport_number}</Text>
                                {passenger.passport_expiry && (
                                  <Text size="xs" c="dimmed">Exp: {dayjs(passenger.passport_expiry).format('MMM YYYY')}</Text>
                                )}
                              </>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {passenger.email && <Text size="xs">{passenger.email}</Text>}
                            {passenger.phone && <Text size="xs" c="dimmed">{passenger.phone}</Text>}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              ) : (
                <Text c="dimmed" ta="center" py="md">No passenger details available</Text>
              )}
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">Customer Info</Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <IconUser size={16} />
                  <Text>{getUserName()}</Text>
                </Group>
                {booking.contact_email && (
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text size="sm">{booking.contact_email}</Text>
                  </Group>
                )}
                {booking.contact_phone && (
                  <Group gap="xs">
                    <IconPhone size={16} />
                    <Text size="sm">{booking.contact_phone}</Text>
                  </Group>
                )}
                <Divider my="xs" />
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Trip Type</Text>
                  <Badge variant="outline">{booking.trip_type}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Cabin Class</Text>
                  <Badge variant="outline">{booking.cabin_class}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Passengers</Text>
                  <Text>{booking.total_passengers}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Created</Text>
                  <Text size="sm">{dayjs(booking.created_at).format('MMM D, YYYY')}</Text>
                </Group>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <IconCreditCard size={20} />
                <Title order={4}>Payment Details</Title>
              </Group>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Subtotal</Text>
                  <Text>${(Number(booking.total_price) - Number(booking.taxes_fees || 0)).toFixed(2)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Taxes & Fees</Text>
                  <Text>${Number(booking.taxes_fees || 0).toFixed(2)}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={500}>Total</Text>
                  <Text size="lg" fw={700}>${Number(booking.total_price).toFixed(2)}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Payment Status</Text>
                  <Badge color={PAYMENT_STATUS_COLORS[booking.payment_status] || 'gray'}>
                    {booking.payment_status}
                  </Badge>
                </Group>

                {booking.payment_crypto_name && (
                  <>
                    <Divider />
                    <Text size="sm" fw={500}>Crypto Payment</Text>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Currency</Text>
                      <Text>{booking.payment_crypto_name} ({booking.payment_crypto_symbol})</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Network</Text>
                      <Text>{booking.payment_network_type}</Text>
                    </Group>
                    {booking.payment_amount_crypto && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Amount</Text>
                        <Text>{booking.payment_amount_crypto} {booking.payment_crypto_symbol}</Text>
                      </Group>
                    )}
                  </>
                )}

                <Divider my="xs" />
                <Text size="sm" fw={500}>Payment Proof</Text>
                {booking.payment_proof_url ? (
                  <Button 
                    variant="filled"
                    color="blue"
                    size="md"
                    leftSection={<IconPhoto size={18} />}
                    onClick={() => setProofModal(true)}
                    fullWidth
                  >
                    View Payment Proof
                  </Button>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="xs">
                    No payment proof uploaded yet
                  </Text>
                )}

                {booking.verified_at && (
                  <Text size="xs" c="dimmed" ta="center">
                    Verified: {dayjs(booking.verified_at).format('MMM D, YYYY h:mm A')}
                  </Text>
                )}

                <Divider my="xs" />
                
                <Group grow>
                  <Button 
                    color="green" 
                    size="sm"
                    onClick={() => updateMutation.mutate({ payment_status: 'paid', verified_at: new Date().toISOString() })}
                    disabled={booking.payment_status === 'paid'}
                  >
                    Mark Paid
                  </Button>
                  <Button 
                    color="red" 
                    variant="light"
                    size="sm"
                    onClick={() => updateMutation.mutate({ payment_status: 'failed' })}
                    disabled={booking.payment_status === 'failed'}
                  >
                    Reject
                  </Button>
                </Group>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">Admin Notes</Title>
              <Textarea
                placeholder="Add notes about this booking..."
                value={adminNotes || booking.admin_notes || ''}
                onChange={(e) => setAdminNotes(e.target.value)}
                minRows={3}
                mb="sm"
              />
              <Button 
                fullWidth 
                variant="light"
                onClick={() => updateMutation.mutate({ admin_notes: adminNotes })}
                loading={updateMutation.isPending}
              >
                Save Notes
              </Button>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      <Modal 
        opened={proofModal} 
        onClose={() => setProofModal(false)}
        title="Payment Proof"
        size="lg"
      >
        <Stack gap="md">
          {booking.payment_submitted_at && (
            <Text size="sm" c="dimmed">
              Submitted: {dayjs(booking.payment_submitted_at).format('MMM D, YYYY h:mm A')}
            </Text>
          )}
          <Image
            src={booking.payment_proof_url}
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
                updateMutation.mutate({ payment_status: 'failed' })
                setProofModal(false)
              }}
            >
              Reject Payment
            </Button>
            <Button 
              color="green"
              onClick={() => {
                updateMutation.mutate({ payment_status: 'paid', status: 'confirmed', verified_at: new Date().toISOString() })
                setProofModal(false)
              }}
            >
              Approve Payment
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
