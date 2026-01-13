import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, Grid, Text, 
  Loader, Center, Badge, Timeline, Modal, Textarea, Alert, NumberInput,
  Image, SimpleGrid, ActionIcon, FileButton, Progress, Box
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconArrowLeft, IconTruck, IconMapPin, IconPlus, IconInfoCircle, IconUser, IconPackage, IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react'
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
  receiver_name: z.string().nullable(),
  receiver_phone: z.string().nullable(),
  receiver_email: z.string().email().nullable().or(z.literal('')).or(z.literal(null)),
  weight: z.number().nullable(),
  dimensions: z.string().nullable(),
  package_type: z.string().nullable(),
  shipping_method: z.string().nullable(),
  notes: z.string().nullable(),
  declared_value: z.number().nullable(),
})

const trackingSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  description: z.string(),
  status: z.string().min(1, 'Status is required'),
})

const PACKAGE_TYPES = ['Standard', 'Fragile', 'Perishable', 'Hazardous', 'Documents', 'Electronics', 'Clothing', 'Other']
const SHIPPING_METHODS = ['Standard', 'Express', 'Overnight', 'Economy', 'Priority', 'Freight']

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
        receiver_name: shipment.receiver_name || '',
        receiver_phone: shipment.receiver_phone || '',
        receiver_email: shipment.receiver_email || '',
        weight: shipment.weight || null,
        dimensions: shipment.dimensions || '',
        package_type: shipment.package_type || 'Standard',
        shipping_method: shipment.shipping_method || 'Standard',
        notes: shipment.notes || '',
        declared_value: shipment.declared_value || null,
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
        receiver_name: data.receiver_name || null,
        receiver_phone: data.receiver_phone || null,
        receiver_email: data.receiver_email || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        package_type: data.package_type || null,
        shipping_method: data.shipping_method || null,
        notes: data.notes || null,
        declared_value: data.declared_value || null,
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
                <TextInput
                  label="Tracking Number"
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
                  {...register('origin')}
                  error={errors.origin?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Destination"
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
          <FileButton
            resetRef={resetRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            disabled={uploading}
          >
            {(props) => (
              <Button 
                size="xs" 
                leftSection={<IconUpload size={14} />} 
                loading={uploading}
                {...props}
              >
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
                <Image
                  src={image.image_url}
                  alt={image.caption || 'Parcel photo'}
                  radius="md"
                  h={150}
                  fit="cover"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setImageModal(image)}
                />
                <ActionIcon
                  color="red"
                  variant="filled"
                  size="sm"
                  pos="absolute"
                  top={5}
                  right={5}
                  onClick={() => deleteImageMutation.mutate(image.id)}
                  loading={deleteImageMutation.isPending}
                >
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

      <Modal 
        opened={!!imageModal} 
        onClose={() => setImageModal(null)} 
        title={imageModal?.caption || 'Parcel Photo'}
        size="lg"
      >
        {imageModal && (
          <Image
            src={imageModal.image_url}
            alt={imageModal.caption || 'Parcel photo'}
            radius="md"
            fit="contain"
          />
        )}
      </Modal>
    </Stack>
  )
}
