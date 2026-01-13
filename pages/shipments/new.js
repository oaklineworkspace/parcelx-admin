import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, 
  Grid, Alert, Loader, Center, NumberInput, Textarea, Checkbox, Switch
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconArrowLeft, IconInfoCircle, IconUser, IconPackage, IconTruck, IconWorld, IconBox } from '@tabler/icons-react'
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
  sender_address: z.string().nullable(),
  sender_city: z.string().nullable(),
  sender_state: z.string().nullable(),
  sender_postal_code: z.string().nullable(),
  sender_country: z.string().nullable(),
  receiver_name: z.string().nullable(),
  receiver_phone: z.string().nullable(),
  receiver_email: z.string().email().nullable().or(z.literal('')),
  receiver_address: z.string().nullable(),
  receiver_city: z.string().nullable(),
  receiver_state: z.string().nullable(),
  receiver_postal_code: z.string().nullable(),
  receiver_country: z.string().nullable(),
  weight: z.number().nullable(),
  dimensions: z.string().nullable(),
  package_type: z.string().nullable(),
  shipping_method: z.string().nullable(),
  service_level: z.string().nullable(),
  notes: z.string().nullable(),
  special_instructions: z.string().nullable(),
  declared_value: z.number().nullable(),
  is_fragile: z.boolean(),
  requires_signature: z.boolean(),
  item_name: z.string().nullable(),
  item_quantity: z.number().nullable(),
  item_category: z.string().nullable(),
  contents_description: z.string().nullable(),
  customs_value: z.number().nullable(),
  customs_currency: z.string().nullable(),
  hs_code: z.string().nullable(),
  country_of_origin: z.string().nullable(),
  is_gift: z.boolean(),
  insurance_value: z.number().nullable(),
  insurance_type: z.string().nullable(),
})

const PACKAGE_TYPES = ['Standard', 'Fragile', 'Perishable', 'Hazardous', 'Documents', 'Electronics', 'Clothing', 'Other']
const SHIPPING_METHODS = ['Standard', 'Express', 'Overnight', 'Economy', 'Priority', 'Freight']
const SERVICE_LEVELS = ['standard', 'express', 'priority', 'economy', 'same_day', 'next_day']
const ITEM_CATEGORIES = ['Electronics', 'Clothing', 'Documents', 'Food', 'Furniture', 'Medical', 'Cosmetics', 'Jewelry', 'Art', 'Sports', 'Toys', 'Books', 'Other']
const INSURANCE_TYPES = ['None', 'Basic', 'Standard', 'Premium', 'Full Coverage']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']

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
      sender_address: '',
      sender_city: '',
      sender_state: '',
      sender_postal_code: '',
      sender_country: '',
      receiver_name: '',
      receiver_phone: '',
      receiver_email: '',
      receiver_address: '',
      receiver_city: '',
      receiver_state: '',
      receiver_postal_code: '',
      receiver_country: '',
      weight: null,
      dimensions: '',
      package_type: 'Standard',
      shipping_method: 'Standard',
      service_level: 'standard',
      notes: '',
      special_instructions: '',
      declared_value: null,
      is_fragile: false,
      requires_signature: false,
      item_name: '',
      item_quantity: 1,
      item_category: '',
      contents_description: '',
      customs_value: null,
      customs_currency: 'USD',
      hs_code: '',
      country_of_origin: '',
      is_gift: false,
      insurance_value: null,
      insurance_type: 'None',
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
        sender_address: data.sender_address || null,
        sender_city: data.sender_city || null,
        sender_state: data.sender_state || null,
        sender_postal_code: data.sender_postal_code || null,
        sender_country: data.sender_country || null,
        receiver_name: data.receiver_name || null,
        receiver_phone: data.receiver_phone || null,
        receiver_email: data.receiver_email || null,
        receiver_address: data.receiver_address || null,
        receiver_city: data.receiver_city || null,
        receiver_state: data.receiver_state || null,
        receiver_postal_code: data.receiver_postal_code || null,
        receiver_country: data.receiver_country || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        package_type: data.package_type || null,
        shipping_method: data.shipping_method || null,
        service_level: data.service_level || null,
        notes: data.notes || null,
        special_instructions: data.special_instructions || null,
        declared_value: data.declared_value || null,
        is_fragile: data.is_fragile || false,
        requires_signature: data.requires_signature || false,
        item_name: data.item_name || null,
        item_quantity: data.item_quantity || 1,
        item_category: data.item_category || null,
        contents_description: data.contents_description || null,
        customs_value: data.customs_value || null,
        customs_currency: data.customs_currency || 'USD',
        hs_code: data.hs_code || null,
        country_of_origin: data.country_of_origin || null,
        is_gift: data.is_gift || false,
        insurance_value: data.insurance_value || null,
        insurance_type: data.insurance_type || null,
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
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Service Level"
                  data={SERVICE_LEVELS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') }))}
                  value={watch('service_level')}
                  onChange={(v) => setValue('service_level', v)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Shipping Method"
                  data={SHIPPING_METHODS}
                  value={watch('shipping_method')}
                  onChange={(v) => setValue('shipping_method', v)}
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
                <TextInput label="Sender Name" placeholder="Full name" {...register('sender_name')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Sender Phone" placeholder="+1 234 567 8900" {...register('sender_phone')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Sender Email" placeholder="sender@email.com" {...register('sender_email')} error={errors.sender_email?.message} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Address" placeholder="Street address" {...register('sender_address')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="City" placeholder="City" {...register('sender_city')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="State/Province" placeholder="State" {...register('sender_state')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Postal Code" placeholder="12345" {...register('sender_postal_code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Country" placeholder="Country" {...register('sender_country')} />
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
                <TextInput label="Receiver Name" placeholder="Full name" {...register('receiver_name')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Receiver Phone" placeholder="+1 234 567 8900" {...register('receiver_phone')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Receiver Email" placeholder="receiver@email.com" {...register('receiver_email')} error={errors.receiver_email?.message} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Address" placeholder="Street address" {...register('receiver_address')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="City" placeholder="City" {...register('receiver_city')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="State/Province" placeholder="State" {...register('receiver_state')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Postal Code" placeholder="12345" {...register('receiver_postal_code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Country" placeholder="Country" {...register('receiver_country')} />
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconBox size={20} />
              <Title order={4}>Item Details</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Item Name" placeholder="What's being shipped" {...register('item_name')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <NumberInput
                  label="Quantity"
                  value={watch('item_quantity')}
                  onChange={(v) => setValue('item_quantity', v)}
                  min={1}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <Select
                  label="Category"
                  data={ITEM_CATEGORIES}
                  value={watch('item_category')}
                  onChange={(v) => setValue('item_category', v)}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <Textarea
                  label="Contents Description"
                  placeholder="Detailed description of package contents..."
                  {...register('contents_description')}
                  minRows={2}
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
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Weight (kg)"
                  placeholder="0.00"
                  value={watch('weight')}
                  onChange={(v) => setValue('weight', v)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Dimensions" placeholder="L x W x H cm" {...register('dimensions')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Declared Value ($)"
                  placeholder="0.00"
                  value={watch('declared_value')}
                  onChange={(v) => setValue('declared_value', v)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch
                  label="Fragile Package"
                  checked={watch('is_fragile')}
                  onChange={(e) => setValue('is_fragile', e.currentTarget.checked)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch
                  label="Requires Signature"
                  checked={watch('requires_signature')}
                  onChange={(e) => setValue('requires_signature', e.currentTarget.checked)}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Special Instructions"
                  placeholder="Handle with care, keep upright, etc..."
                  {...register('special_instructions')}
                  minRows={2}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconWorld size={20} />
              <Title order={4}>Customs & Insurance</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Customs Value"
                  placeholder="0.00"
                  value={watch('customs_value')}
                  onChange={(v) => setValue('customs_value', v)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Currency"
                  data={CURRENCIES}
                  value={watch('customs_currency')}
                  onChange={(v) => setValue('customs_currency', v)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput label="HS Code" placeholder="0000.00.00" {...register('hs_code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Country of Origin" placeholder="Country where item was made" {...register('country_of_origin')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch
                  label="This is a Gift"
                  checked={watch('is_gift')}
                  onChange={(e) => setValue('is_gift', e.currentTarget.checked)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Insurance Type"
                  data={INSURANCE_TYPES}
                  value={watch('insurance_type')}
                  onChange={(v) => setValue('insurance_type', v)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Insurance Value ($)"
                  placeholder="0.00"
                  value={watch('insurance_value')}
                  onChange={(v) => setValue('insurance_value', v)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Additional Notes"
                  placeholder="Any other information..."
                  {...register('notes')}
                  minRows={2}
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
