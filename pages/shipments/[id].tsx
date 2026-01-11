import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, Grid, Text, 
  Loader, Center, Badge, Timeline, Modal, Textarea, Alert 
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconArrowLeft, IconTruck, IconMapPin, IconPlus, IconInfoCircle } from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { notifications } from '@mantine/notifications'
import { supabase, SHIPMENT_STATUSES, isSupabaseConfigured } from '@/lib/supabase'

const shipmentSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  status: z.string().min(1, 'Status is required'),
  user_id: z.string().nullable(),
  estimated_delivery: z.date().nullable(),
})

type ShipmentFormData = z.infer<typeof shipmentSchema>

const trackingSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  description: z.string(),
  status: z.string().min(1, 'Status is required'),
})

type TrackingFormData = z.infer<typeof trackingSchema>

export default function ShipmentDetail() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()
  const [trackingModal, setTrackingModal] = useState(false)

  const supabaseConfigured = isSupabaseConfigured()

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipments').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: supabaseConfigured && !!id,
  })

  const { data: trackingUpdates } = useQuery({
    queryKey: ['tracking-updates', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_updates')
        .select('*')
        .eq('shipment_id', id)
        .order('occurrence_time', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured && !!id,
  })

  const { data: users } = useQuery({
    queryKey: ['users-select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
  })

  const trackingForm = useForm<TrackingFormData>({
    resolver: zodResolver(trackingSchema),
    defaultValues: { location: '', description: '', status: 'In Transit' },
  })

  useEffect(() => {
    if (shipment) {
      reset({
        tracking_number: shipment.tracking_number,
        origin: shipment.origin,
        destination: shipment.destination,
        status: shipment.status,
        user_id: shipment.user_id,
        estimated_delivery: shipment.estimated_delivery ? new Date(shipment.estimated_delivery) : null,
      })
    }
  }, [shipment, reset])

  const updateMutation = useMutation({
    mutationFn: async (data: ShipmentFormData) => {
      const { error } = await supabase.from('shipments').update({
        tracking_number: data.tracking_number,
        origin: data.origin,
        destination: data.destination,
        status: data.status,
        user_id: data.user_id,
        estimated_delivery: data.estimated_delivery?.toISOString() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment', id] })
      queryClient.invalidateQueries({ queryKey: ['shipments'] })
      queryClient.invalidateQueries({ queryKey: ['shipment-stats'] })
      notifications.show({ title: 'Success', message: 'Shipment updated', color: 'green' })
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Error', message: error.message || 'Failed to update shipment', color: 'red' })
    },
  })

  const addTrackingMutation = useMutation({
    mutationFn: async (data: TrackingFormData) => {
      const { error } = await supabase.from('tracking_updates').insert({
        shipment_id: id,
        location: data.location,
        description: data.description || null,
        status: data.status,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-updates', id] })
      notifications.show({ title: 'Success', message: 'Tracking update added', color: 'green' })
      setTrackingModal(false)
      trackingForm.reset()
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Error', message: error.message || 'Failed to add tracking update', color: 'red' })
    },
  })

  if (isLoading && supabaseConfigured) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  if (!supabaseConfigured) {
    return (
      <Stack gap="lg">
        <Group>
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/shipments')}>
            Back
          </Button>
          <Title order={2}>Shipment Details</Title>
        </Group>
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          To view shipment details, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.
        </Alert>
      </Stack>
    )
  }

  if (!shipment) {
    return (
      <Center h={400}>
        <Text>Shipment not found</Text>
      </Center>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'green'
      case 'In Transit': return 'orange'
      case 'Out for Delivery': return 'blue'
      case 'Cancelled': return 'red'
      case 'Pending': return 'yellow'
      default: return 'blue'
    }
  }

  return (
    <Stack gap="lg">
      <Group>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/shipments')}>
          Back
        </Button>
        <Title order={2}>Shipment Details</Title>
        <Badge size="lg" color={getStatusColor(shipment.status)}>{shipment.status}</Badge>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Edit Shipment</Title>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Tracking Number"
                      {...register('tracking_number')}
                      error={errors.tracking_number?.message}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Status"
                      data={SHIPMENT_STATUSES}
                      value={watch('status')}
                      onChange={(v) => setValue('status', v || 'Pending')}
                      error={errors.status?.message}
                      required
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Origin"
                      {...register('origin')}
                      error={errors.origin?.message}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Destination"
                      {...register('destination')}
                      error={errors.destination?.message}
                      required
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Assign to User"
                      placeholder="Select a user (optional)"
                      data={users?.map(u => ({ value: u.id, label: u.email || u.full_name || u.id })) || []}
                      value={watch('user_id')}
                      onChange={(v) => setValue('user_id', v)}
                      clearable
                      searchable
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DateTimePicker
                      label="Estimated Delivery"
                      value={watch('estimated_delivery')}
                      onChange={(v) => setValue('estimated_delivery', v)}
                      clearable
                    />
                  </Grid.Col>
                </Grid>

                <Group justify="flex-end" mt="md">
                  <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Tracking History</Title>
              <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setTrackingModal(true)}>
                Add Update
              </Button>
            </Group>
            
            {!trackingUpdates?.length ? (
              <Text c="dimmed" ta="center" py="md">No tracking updates yet</Text>
            ) : (
              <Timeline active={0} bulletSize={24} lineWidth={2}>
                {trackingUpdates?.map((update, index) => (
                  <Timeline.Item
                    key={update.id}
                    bullet={index === 0 ? <IconTruck size={12} /> : <IconMapPin size={12} />}
                    title={update.status}
                  >
                    <Text c="dimmed" size="sm">{update.location}</Text>
                    {update.description && <Text size="sm">{update.description}</Text>}
                    <Text size="xs" mt={4} c="dimmed">
                      {new Date(update.occurrence_time).toLocaleString()}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Modal opened={trackingModal} onClose={() => setTrackingModal(false)} title="Add Tracking Update">
        <form onSubmit={trackingForm.handleSubmit((data) => addTrackingMutation.mutate(data))}>
          <Stack gap="md">
            <TextInput
              label="Location"
              placeholder="City, Country"
              {...trackingForm.register('location')}
              error={trackingForm.formState.errors.location?.message}
              required
            />
            <Select
              label="Status"
              data={SHIPMENT_STATUSES}
              value={trackingForm.watch('status')}
              onChange={(v) => trackingForm.setValue('status', v || 'In Transit')}
              required
            />
            <Textarea
              label="Description"
              placeholder="Optional description..."
              {...trackingForm.register('description')}
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setTrackingModal(false)}>Cancel</Button>
              <Button type="submit" loading={addTrackingMutation.isPending}>Add Update</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
