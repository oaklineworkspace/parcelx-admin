import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, Grid, Text, 
  Loader, Center, Badge, Timeline, Modal, Textarea, Alert, NumberInput,
  Image, SimpleGrid, ActionIcon, FileButton, Progress, Box, Switch
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconArrowLeft, IconTruck, IconMapPin, IconPlus, IconInfoCircle, IconUser, IconPackage, IconPhoto, IconTrash, IconUpload, IconWorld, IconBox } from '@tabler/icons-react'
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
  estimated_delivery: z.any().nullable(),
  sender_name: z.string().nullable(),
  sender_phone: z.string().nullable(),
  sender_email: z.string().email().nullable().or(z.literal('')).or(z.literal(null)),
  sender_address: z.string().nullable(),
  sender_city: z.string().nullable(),
  sender_state: z.string().nullable(),
  sender_postal_code: z.string().nullable(),
  sender_country: z.string().nullable(),
  receiver_name: z.string().nullable(),
  receiver_phone: z.string().nullable(),
  receiver_email: z.string().email().nullable().or(z.literal('')).or(z.literal(null)),
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

const trackingSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  description: z.string(),
  status: z.string().min(1, 'Status is required'),
})

const PACKAGE_TYPES = ['Standard', 'Fragile', 'Perishable', 'Hazardous', 'Documents', 'Electronics', 'Clothing', 'Other']
const SHIPPING_METHODS = ['Standard', 'Express', 'Overnight', 'Economy', 'Priority', 'Freight']
const SERVICE_LEVELS = ['standard', 'express', 'priority', 'economy', 'same_day', 'next_day']
const ITEM_CATEGORIES = ['Electronics', 'Clothing', 'Documents', 'Food', 'Furniture', 'Medical', 'Cosmetics', 'Jewelry', 'Art', 'Sports', 'Toys', 'Books', 'Other']
const INSURANCE_TYPES = ['None', 'Basic', 'Standard', 'Premium', 'Full Coverage']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']

export default function ShipmentDetail() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()
  const [trackingModal, setTrackingModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageModal, setImageModal] = useState(null)
  const resetRef = useRef(null)

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

  const { data: shipmentImages, refetch: refetchImages } = useQuery({
    queryKey: ['shipment-images', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_images')
        .select('*')
        .eq('shipment_id', id)
        .order('uploaded_at', { ascending: false })
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

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(shipmentSchema),
  })

  const trackingForm = useForm({
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
        sender_name: shipment.sender_name || '',
        sender_phone: shipment.sender_phone || '',
        sender_email: shipment.sender_email || '',
        sender_address: shipment.sender_address || '',
        sender_city: shipment.sender_city || '',
        sender_state: shipment.sender_state || '',
        sender_postal_code: shipment.sender_postal_code || '',
        sender_country: shipment.sender_country || '',
        receiver_name: shipment.receiver_name || '',
        receiver_phone: shipment.receiver_phone || '',
        receiver_email: shipment.receiver_email || '',
        receiver_address: shipment.receiver_address || '',
        receiver_city: shipment.receiver_city || '',
        receiver_state: shipment.receiver_state || '',
        receiver_postal_code: shipment.receiver_postal_code || '',
        receiver_country: shipment.receiver_country || '',
        weight: shipment.weight || null,
        dimensions: shipment.dimensions || '',
        package_type: shipment.package_type || 'Standard',
        shipping_method: shipment.shipping_method || 'Standard',
        service_level: shipment.service_level || 'standard',
        notes: shipment.notes || '',
        special_instructions: shipment.special_instructions || '',
        declared_value: shipment.declared_value || null,
        is_fragile: shipment.is_fragile || false,
        requires_signature: shipment.requires_signature || false,
        item_name: shipment.item_name || '',
        item_quantity: shipment.item_quantity || 1,
        item_category: shipment.item_category || '',
        contents_description: shipment.contents_description || '',
        customs_value: shipment.customs_value || null,
        customs_currency: shipment.customs_currency || 'USD',
        hs_code: shipment.hs_code || '',
        country_of_origin: shipment.country_of_origin || '',
        is_gift: shipment.is_gift || false,
        insurance_value: shipment.insurance_value || null,
        insurance_type: shipment.insurance_type || 'None',
      })
    }
  }, [shipment, reset])

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('shipments').update({
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
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message || 'Failed to update shipment', color: 'red' })
    },
  })

  const addTrackingMutation = useMutation({
    mutationFn: async (data) => {
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
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message || 'Failed to add tracking update', color: 'red' })
    },
  })

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = files.length
      let uploaded = 0

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('shipment-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('shipment-images')
          .getPublicUrl(fileName)

        const { error: dbError } = await supabase
          .from('shipment_images')
          .insert({
            shipment_id: id,
            image_url: urlData.publicUrl,
            caption: file.name,
          })

        if (dbError) throw dbError

        uploaded++
        setUploadProgress((uploaded / totalFiles) * 100)
      }

      notifications.show({ title: 'Success', message: `${totalFiles} image(s) uploaded`, color: 'green' })
      refetchImages()
      if (resetRef.current) resetRef.current()
    } catch (error) {
      notifications.show({ title: 'Error', message: error.message || 'Failed to upload images', color: 'red' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId) => {
      const image = shipmentImages?.find(img => img.id === imageId)
      if (image) {
        const urlParts = image.image_url.split('/shipment-images/')
        if (urlParts[1]) {
          await supabase.storage.from('shipment-images').remove([urlParts[1]])
        }
      }
      const { error } = await supabase.from('shipment_images').delete().eq('id', imageId)
      if (error) throw error
    },
    onSuccess: () => {
      refetchImages()
      notifications.show({ title: 'Success', message: 'Image deleted', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message || 'Failed to delete image', color: 'red' })
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
        <Group wrap="wrap">
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

  const getStatusColor = (status) => {
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
      <Group wrap="wrap">
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/shipments')}>
          Back
        </Button>
        <Title order={2}>Shipment Details</Title>
        <Badge size="lg" color={getStatusColor(shipment.status)}>{shipment.status}</Badge>
      </Group>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
        <Stack gap="lg">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconTruck size={20} />
              <Title order={4}>Shipment Details</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Tracking Number" {...register('tracking_number')} error={errors.tracking_number?.message} required />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select label="Status" data={SHIPMENT_STATUSES} value={watch('status')} onChange={(v) => setValue('status', v || 'Pending')} required />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Origin" {...register('origin')} error={errors.origin?.message} required />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Destination" {...register('destination')} error={errors.destination?.message} required />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select label="Assign to User" placeholder="Select a user" data={users?.map(u => ({ value: u.id, label: u.email || u.full_name || u.id })) || []} value={watch('user_id')} onChange={(v) => setValue('user_id', v)} clearable searchable />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateTimePicker label="Estimated Delivery" value={watch('estimated_delivery')} onChange={(v) => setValue('estimated_delivery', v)} clearable />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select label="Service Level" data={SERVICE_LEVELS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') }))} value={watch('service_level')} onChange={(v) => setValue('service_level', v)} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select label="Shipping Method" data={SHIPPING_METHODS} value={watch('shipping_method')} onChange={(v) => setValue('shipping_method', v)} />
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
                <TextInput label="Sender Name" {...register('sender_name')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Sender Phone" {...register('sender_phone')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Sender Email" {...register('sender_email')} error={errors.sender_email?.message} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Address" {...register('sender_address')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="City" {...register('sender_city')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="State/Province" {...register('sender_state')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Postal Code" {...register('sender_postal_code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Country" {...register('sender_country')} />
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
                <TextInput label="Receiver Name" {...register('receiver_name')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Receiver Phone" {...register('receiver_phone')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Receiver Email" {...register('receiver_email')} error={errors.receiver_email?.message} />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <TextInput label="Address" {...register('receiver_address')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="City" {...register('receiver_city')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="State/Province" {...register('receiver_state')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Postal Code" {...register('receiver_postal_code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Country" {...register('receiver_country')} />
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
                <TextInput label="Item Name" {...register('item_name')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <NumberInput label="Quantity" value={watch('item_quantity')} onChange={(v) => setValue('item_quantity', v)} min={1} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <Select label="Category" data={ITEM_CATEGORIES} value={watch('item_category')} onChange={(v) => setValue('item_category', v)} clearable />
              </Grid.Col>
              <Grid.Col span={{ base: 12 }}>
                <Textarea label="Contents Description" {...register('contents_description')} minRows={2} />
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
                <Select label="Package Type" data={PACKAGE_TYPES} value={watch('package_type')} onChange={(v) => setValue('package_type', v)} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput label="Weight (kg)" value={watch('weight')} onChange={(v) => setValue('weight', v)} min={0} decimalScale={2} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Dimensions" placeholder="L x W x H cm" {...register('dimensions')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput label="Declared Value ($)" value={watch('declared_value')} onChange={(v) => setValue('declared_value', v)} min={0} decimalScale={2} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch label="Fragile Package" checked={watch('is_fragile')} onChange={(e) => setValue('is_fragile', e.currentTarget.checked)} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch label="Requires Signature" checked={watch('requires_signature')} onChange={(e) => setValue('requires_signature', e.currentTarget.checked)} />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea label="Special Instructions" {...register('special_instructions')} minRows={2} />
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
                <NumberInput label="Customs Value" value={watch('customs_value')} onChange={(v) => setValue('customs_value', v)} min={0} decimalScale={2} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select label="Currency" data={CURRENCIES} value={watch('customs_currency')} onChange={(v) => setValue('customs_currency', v)} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput label="HS Code" {...register('hs_code')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Country of Origin" {...register('country_of_origin')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch label="This is a Gift" checked={watch('is_gift')} onChange={(e) => setValue('is_gift', e.currentTarget.checked)} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select label="Insurance Type" data={INSURANCE_TYPES} value={watch('insurance_type')} onChange={(v) => setValue('insurance_type', v)} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput label="Insurance Value ($)" value={watch('insurance_value')} onChange={(v) => setValue('insurance_value', v)} min={0} decimalScale={2} />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea label="Additional Notes" {...register('notes')} minRows={2} />
              </Grid.Col>
            </Grid>
          </Card>

          <Group justify="flex-end">
            <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
          </Group>
        </Stack>
      </form>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group gap="xs">
            <IconPhoto size={20} />
            <Title order={4}>Parcel Photos</Title>
          </Group>
          <FileButton resetRef={resetRef} onChange={handleImageUpload} accept="image/*" multiple disabled={uploading}>
            {(props) => (
              <Button size="xs" leftSection={<IconUpload size={14} />} loading={uploading} {...props}>
                Upload Photos
              </Button>
            )}
          </FileButton>
        </Group>

        {uploading && (
          <Box mb="md">
            <Text size="sm" mb={4}>Uploading...</Text>
            <Progress value={uploadProgress} animated />
          </Box>
        )}
        
        {!shipmentImages?.length ? (
          <Text c="dimmed" ta="center" py="xl">
            No photos uploaded yet. Upload photos of the parcel to document its condition.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            {shipmentImages.map((image) => (
              <Box key={image.id} pos="relative">
                <Image src={image.image_url} alt={image.caption || 'Parcel photo'} radius="md" h={150} fit="cover" style={{ cursor: 'pointer' }} onClick={() => setImageModal(image)} />
                <ActionIcon color="red" variant="filled" size="sm" pos="absolute" top={5} right={5} onClick={() => deleteImageMutation.mutate(image.id)} loading={deleteImageMutation.isPending}>
                  <IconTrash size={12} />
                </ActionIcon>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap">
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
              <Timeline.Item key={update.id} bullet={index === 0 ? <IconTruck size={12} /> : <IconMapPin size={12} />} title={update.status}>
                <Text c="dimmed" size="sm">{update.location}</Text>
                {update.description && <Text size="sm">{update.description}</Text>}
                <Text size="xs" mt={4} c="dimmed">{new Date(update.occurrence_time).toLocaleString()}</Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>

      <Modal opened={trackingModal} onClose={() => setTrackingModal(false)} title="Add Tracking Update">
        <form onSubmit={trackingForm.handleSubmit((data) => addTrackingMutation.mutate(data))}>
          <Stack gap="md">
            <TextInput label="Location" placeholder="City, Country" {...trackingForm.register('location')} error={trackingForm.formState.errors.location?.message} required />
            <Select label="Status" data={SHIPMENT_STATUSES} value={trackingForm.watch('status')} onChange={(v) => trackingForm.setValue('status', v || 'In Transit')} required />
            <Textarea label="Description" placeholder="Optional description..." {...trackingForm.register('description')} />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setTrackingModal(false)}>Cancel</Button>
              <Button type="submit" loading={addTrackingMutation.isPending}>Add Update</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={!!imageModal} onClose={() => setImageModal(null)} title={imageModal?.caption || 'Parcel Photo'} size="lg">
        {imageModal && <Image src={imageModal.image_url} alt={imageModal.caption || 'Parcel photo'} radius="md" fit="contain" />}
      </Modal>
    </Stack>
  )
}
