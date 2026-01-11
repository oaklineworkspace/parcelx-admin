import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Button, Stack, Group, Grid, Text, 
  Loader, Center, Avatar, Switch, Divider, Badge, Alert 
} from '@mantine/core'
import { IconArrowLeft, IconMail, IconPhone, IconMapPin, IconUser, IconInfoCircle } from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const profileSchema = z.object({
  full_name: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().email().nullable(),
  country: z.string().nullable(),
  contact_address: z.string().nullable(),
  country_code: z.string().nullable(),
  phone_number: z.string().nullable(),
  receive_updates: z.boolean(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function UserDetail() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()

  const supabaseConfigured = isSupabaseConfigured()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: supabaseConfigured && !!id,
  })

  const { data: userShipments } = useQuery({
    queryKey: ['user-shipments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured && !!id,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        country: user.country,
        contact_address: user.contact_address,
        country_code: user.country_code,
        phone_number: user.phone_number,
        receive_updates: user.receive_updates,
      })
    }
  }, [user, reset])

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const { error } = await supabase.from('profiles').update({
        ...data,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ title: 'Success', message: 'Profile updated', color: 'green' })
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Error', message: error.message || 'Failed to update profile', color: 'red' })
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
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/users')}>
            Back
          </Button>
          <Title order={2}>User Profile</Title>
        </Group>
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          To view user details, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.
        </Alert>
      </Stack>
    )
  }

  if (!user) {
    return (
      <Center h={400}>
        <Text>User not found</Text>
      </Center>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'green'
      case 'In Transit': return 'orange'
      case 'Cancelled': return 'red'
      case 'Pending': return 'yellow'
      default: return 'blue'
    }
  }

  return (
    <Stack gap="lg">
      <Group>
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/users')}>
          Back
        </Button>
        <Title order={2}>User Profile</Title>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group mb="lg">
              <Avatar src={user.avatar_url} size="xl" radius="xl">
                {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'}
                </Text>
                <Text c="dimmed">{user.email}</Text>
                <Text size="sm" c="dimmed">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </div>
            </Group>

            <Divider my="md" />

            <Title order={4} mb="md">Edit Profile</Title>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Full Name"
                      leftSection={<IconUser size={16} />}
                      {...register('full_name')}
                      error={errors.full_name?.message}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Email"
                      leftSection={<IconMail size={16} />}
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="First Name"
                      {...register('first_name')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Last Name"
                      {...register('last_name')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Country Code"
                      placeholder="+1"
                      {...register('country_code')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <TextInput
                      label="Phone Number"
                      leftSection={<IconPhone size={16} />}
                      {...register('phone_number')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Country"
                      leftSection={<IconMapPin size={16} />}
                      {...register('country')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Contact Address"
                      {...register('contact_address')}
                    />
                  </Grid.Col>
                </Grid>

                <Switch
                  label="Receive marketing updates"
                  checked={watch('receive_updates')}
                  onChange={(e) => setValue('receive_updates', e.currentTarget.checked)}
                />

                <Group justify="flex-end" mt="md">
                  <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">User Shipments</Title>
            
            {!userShipments?.length ? (
              <Text c="dimmed" ta="center" py="md">No shipments for this user</Text>
            ) : (
              <Stack gap="xs">
                {userShipments?.map((shipment) => (
                  <Card 
                    key={shipment.id} 
                    withBorder 
                    padding="sm" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/shipments/${shipment.id}`)}
                  >
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" fw={500}>{shipment.tracking_number}</Text>
                        <Text size="xs" c="dimmed">{shipment.origin} → {shipment.destination}</Text>
                      </div>
                      <Badge size="sm" color={getStatusColor(shipment.status)}>
                        {shipment.status}
                      </Badge>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
