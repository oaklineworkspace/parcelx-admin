import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, 
  Grid, Alert, Loader, Center, NumberInput, Textarea, Divider, Text
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconArrowLeft, IconInfoCircle, IconUser, IconPackage, IconTruck } from '@tabler/icons-react'
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
  estimated_delivery: z.any().nullable(),
  sender_name: z.string().nullable(),
  sender_phone: z.string().nullable(),
  sender_email: z.string().email().nullable().or(z.literal('')),
  receiver_name: z.string().nullable(),
  receiver_phone: z.string().nullable(),
  receiver_email: z.string().email().nullable().or(z.literal('')),
  weight: z.number().nullable(),
  dimensions: z.string().nullable(),
  package_type: z.string().nullable(),
  shipping_method: z.string().nullable(),
  notes: z.string().nullable(),
  declared_value: z.number().nullable(),
})

const PACKAGE_TYPES = ['Standard', 'Fragile', 'Perishable', 'Hazardous', 'Documents', 'Electronics', 'Clothing', 'Other']
const SHIPPING_METHODS = ['Standard', 'Express', 'Overnight', 'Economy', 'Priority', 'Freight']

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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      tracking_number: `PKX-${Date.now().toString(36).toUpperCase()}`,
      origin: '',
      destination: '',
      status: 'Pending',
      user_id: null,
      estimated_delivery: null,
      sender_name: '',
      sender_phone: '',
      sender_email: '',
      receiver_name: '',
      receiver_phone: '',
      receiver_email: '',
      weight: null,
      dimensions: '',
      package_type: 'Standard',
      shipping_method: 'Standard',
      notes: '',
      declared_value: null,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('shipments').insert({
        tracking_number: data.tracking_number,
        origin: data.origin,
        destination: data.destination,
        status: data.status,
        user_id: data.user_id || null,
        estimated_delivery: data.estimated_delivery || null,
        sender_name: data.sender_name || null,
        sender_phone: data.sender_phone || null,
        sender_email: data.sender_email || null,
        receiver_name: data.receiver_name || null,
        receiver_phone: data.receiver_phone || null,
        receiver_email: data.receiver_email || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        package_type: data.package_type || null,
        shipping_method: data.shipping_method || null,
        notes: data.notes || null,
        declared_value: data.declared_value || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] })
      queryClient.invalidateQueries({ queryKey: ['shipment-stats'] })
      notifications.show({ title: 'Success', message: 'Shipment created', color: 'green' })
      router.push('/shipments')
    },
    onError: (error) => {
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
      <Group wrap="wrap">
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

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <Stack gap="lg">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconTruck size={20} />
              <Title order={4}>Shipment Details</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Tracking Number"
                  placeholder="PKX-XXXXXX"
                  {...register('tracking_number')}
                  error={errors.tracking_number?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Status"
                  data={SHIPMENT_STATUSES}
                  value={watch('status')}
                  onChange={(v) => setValue('status', v || 'Pending')}
                  error={errors.status?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Origin"
                  placeholder="City, Country"
                  {...register('origin')}
                  error={errors.origin?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Destination"
                  placeholder="City, Country"
                  {...register('destination')}
                  error={errors.destination?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
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
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateTimePicker
                  label="Estimated Delivery"
                  placeholder="Select date and time"
                  value={watch('estimated_delivery')}
                  onChange={(v) => setValue('estimated_delivery', v)}
                  clearable
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconUser size={20} />
              <Title order={4}>Sender Information</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Sender Name"
                  placeholder="Full name"
                  {...register('sender_name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Sender Phone"
                  placeholder="+1 234 567 8900"
                  {...register('sender_phone')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput
                  label="Sender Email"
                  placeholder="sender@email.com"
                  {...register('sender_email')}
                  error={errors.sender_email?.message}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconUser size={20} />
              <Title order={4}>Receiver Information</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Receiver Name"
                  placeholder="Full name"
                  {...register('receiver_name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Receiver Phone"
                  placeholder="+1 234 567 8900"
                  {...register('receiver_phone')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput
                  label="Receiver Email"
                  placeholder="receiver@email.com"
                  {...register('receiver_email')}
                  error={errors.receiver_email?.message}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconPackage size={20} />
              <Title order={4}>Package Details</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Package Type"
                  data={PACKAGE_TYPES}
                  value={watch('package_type')}
                  onChange={(v) => setValue('package_type', v)}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Shipping Method"
                  data={SHIPPING_METHODS}
                  value={watch('shipping_method')}
                  onChange={(v) => setValue('shipping_method', v)}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Weight (kg)"
                  placeholder="0.00"
                  value={watch('weight')}
                  onChange={(v) => setValue('weight', v)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Dimensions"
                  placeholder="L x W x H cm"
                  {...register('dimensions')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Declared Value ($)"
                  placeholder="0.00"
                  value={watch('declared_value')}
                  onChange={(v) => setValue('declared_value', v)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Notes"
                  placeholder="Additional notes or special instructions..."
                  {...register('notes')}
                  minRows={3}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => router.push('/shipments')}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending} disabled={!supabaseConfigured}>
              Create Shipment
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
