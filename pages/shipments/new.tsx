import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, 
  Grid, Alert, Loader, Center 
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { notifications } from '@mantine/notifications'
import { supabase, SHIPMENT_STATUSES, isSupabaseConfigured } from '@/lib/supabase'

const shipmentSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  status: z.string().min(1, 'Status is required'),
  user_id: z.string().nullable(),
  estimated_delivery: z.string().nullable(),
})

type ShipmentFormData = z.infer<typeof shipmentSchema>

export default function CreateShipment() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const supabaseConfigured = isSupabaseConfigured()

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users-select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      tracking_number: `PKX-${Date.now().toString(36).toUpperCase()}`,
      origin: '',
      destination: '',
      status: 'Pending',
      user_id: null,
      estimated_delivery: null,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: ShipmentFormData) => {
      const { error } = await supabase.from('shipments').insert({
        tracking_number: data.tracking_number,
        origin: data.origin,
        destination: data.destination,
        status: data.status,
        user_id: data.user_id,
        estimated_delivery: data.estimated_delivery || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] })
      queryClient.invalidateQueries({ queryKey: ['shipment-stats'] })
      notifications.show({ title: 'Success', message: 'Shipment created', color: 'green' })
      router.push('/shipments')
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Error', message: error.message || 'Failed to create shipment', color: 'red' })
    },
  })

  if (loadingUsers && supabaseConfigured) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  return (
    <Stack gap="lg">
      <Group>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/shipments')}>
          Back
        </Button>
        <Title order={2}>Create Shipment</Title>
      </Group>

      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          To create shipments, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.
        </Alert>
      )}

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Tracking Number"
                  placeholder="PKX-XXXXXX"
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
                  placeholder="City, Country"
                  {...register('origin')}
                  error={errors.origin?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Destination"
                  placeholder="City, Country"
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
                  placeholder="Select date and time"
                  value={watch('estimated_delivery')}
                  onChange={(v) => setValue('estimated_delivery', v)}
                  clearable
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={() => router.push('/shipments')}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending} disabled={!supabaseConfigured}>
                Create Shipment
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  )
}
