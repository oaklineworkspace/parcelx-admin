import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, Grid, 
  Alert, Loader, Center, NumberInput, Switch, MultiSelect, Checkbox, Badge, Text
} from '@mantine/core'
import { IconArrowLeft, IconInfoCircle, IconPlane, IconClock, IconCurrencyDollar } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured, DAYS_OF_WEEK, AMENITIES_OPTIONS } from '@/lib/supabase'

const flightSchema = z.object({
  flight_number: z.string().min(1, 'Flight number is required'),
  airline_id: z.string().min(1, 'Airline is required'),
  departure_airport_id: z.string().min(1, 'Departure airport is required'),
  arrival_airport_id: z.string().min(1, 'Arrival airport is required'),
  departure_time: z.string().min(1, 'Departure time is required'),
  arrival_time: z.string().min(1, 'Arrival time is required'),
  duration_minutes: z.number().min(1, 'Duration is required'),
  aircraft_type: z.string().nullable(),
  base_price_economy: z.number().min(0),
  base_price_premium: z.number().min(0),
  base_price_business: z.number().min(0),
  base_price_first: z.number().min(0),
  stops: z.number().min(0),
  is_active: z.boolean(),
})

export default function FlightDetail() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()
  const supabaseConfigured = isSupabaseConfigured()
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5, 6, 7])
  const [amenities, setAmenities] = useState([])

  const { data: flight, isLoading } = useQuery({
    queryKey: ['flight', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flights')
        .select(`
          *,
          airline:airlines(id, code, name),
          departure:airports!flights_departure_airport_id_fkey(id, code, name, city),
          arrival:airports!flights_arrival_airport_id_fkey(id, code, name, city)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: supabaseConfigured && !!id,
  })

  const { data: airlines } = useQuery({
    queryKey: ['airlines'],
    queryFn: async () => {
      const { data, error } = await supabase.from('airlines').select('*').order('name')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { data: airports } = useQuery({
    queryKey: ['airports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('airports').select('*').order('code')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(flightSchema),
  })

  useEffect(() => {
    if (flight) {
      reset({
        flight_number: flight.flight_number,
        airline_id: flight.airline_id,
        departure_airport_id: flight.departure_airport_id,
        arrival_airport_id: flight.arrival_airport_id,
        departure_time: flight.departure_time?.substring(0, 5) || '08:00',
        arrival_time: flight.arrival_time?.substring(0, 5) || '10:00',
        duration_minutes: flight.duration_minutes || 120,
        aircraft_type: flight.aircraft_type || '',
        base_price_economy: flight.base_price_economy || 100,
        base_price_premium: flight.base_price_premium || 250,
        base_price_business: flight.base_price_business || 800,
        base_price_first: flight.base_price_first || 2500,
        stops: flight.stops || 0,
        is_active: flight.is_active ?? true,
      })
      setDaysOfWeek(flight.days_of_week || [1, 2, 3, 4, 5, 6, 7])
      setAmenities(flight.amenities || [])
    }
  }, [flight, reset])

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('flights').update({
        ...data,
        days_of_week: daysOfWeek,
        amenities: amenities,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight', id] })
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      notifications.show({ title: 'Success', message: 'Flight updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  if (isLoading && supabaseConfigured) {
    return <Center h={400}><Loader size="lg" /></Center>
  }

  if (!supabaseConfigured) {
    return (
      <Stack gap="lg">
        <Group wrap="wrap">
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/flights')}>
            Back
          </Button>
          <Title order={2}>Flight Details</Title>
        </Group>
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase to view flight details.
        </Alert>
      </Stack>
    )
  }

  if (!flight) {
    return <Center h={400}><Text>Flight not found</Text></Center>
  }

  return (
    <Stack gap="lg">
      <Group wrap="wrap">
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/flights')}>
          Back
        </Button>
        <Title order={2}>Flight Details</Title>
        <Badge size="lg" color={flight.is_active ? 'green' : 'gray'}>
          {flight.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </Group>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
        <Stack gap="lg">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconPlane size={20} />
              <Title order={4}>Flight Information</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Flight Number"
                  {...register('flight_number')}
                  error={errors.flight_number?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Airline"
                  data={airlines?.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` })) || []}
                  value={watch('airline_id')}
                  onChange={(v) => setValue('airline_id', v || '')}
                  error={errors.airline_id?.message}
                  searchable
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Departure Airport"
                  data={airports?.map(a => ({ value: a.id, label: `${a.code} - ${a.name} (${a.city})` })) || []}
                  value={watch('departure_airport_id')}
                  onChange={(v) => setValue('departure_airport_id', v || '')}
                  error={errors.departure_airport_id?.message}
                  searchable
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Arrival Airport"
                  data={airports?.map(a => ({ value: a.id, label: `${a.code} - ${a.name} (${a.city})` })) || []}
                  value={watch('arrival_airport_id')}
                  onChange={(v) => setValue('arrival_airport_id', v || '')}
                  error={errors.arrival_airport_id?.message}
                  searchable
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Aircraft Type"
                  {...register('aircraft_type')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Stops"
                  value={watch('stops')}
                  onChange={(v) => setValue('stops', v || 0)}
                  min={0}
                  max={5}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconClock size={20} />
              <Title order={4}>Schedule</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Departure Time"
                  placeholder="08:00"
                  {...register('departure_time')}
                  error={errors.departure_time?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Arrival Time"
                  placeholder="10:00"
                  {...register('arrival_time')}
                  error={errors.arrival_time?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Duration (minutes)"
                  value={watch('duration_minutes')}
                  onChange={(v) => setValue('duration_minutes', v || 0)}
                  min={1}
                  required
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Checkbox.Group
                  label="Operating Days"
                  value={daysOfWeek.map(String)}
                  onChange={(values) => setDaysOfWeek(values.map(Number))}
                >
                  <Group mt="xs">
                    {DAYS_OF_WEEK.map(day => (
                      <Checkbox key={day.value} value={String(day.value)} label={day.label.substring(0, 3)} />
                    ))}
                  </Group>
                </Checkbox.Group>
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <IconCurrencyDollar size={20} />
              <Title order={4}>Pricing</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Economy ($)"
                  value={watch('base_price_economy')}
                  onChange={(v) => setValue('base_price_economy', v || 0)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Premium Economy ($)"
                  value={watch('base_price_premium')}
                  onChange={(v) => setValue('base_price_premium', v || 0)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="Business ($)"
                  value={watch('base_price_business')}
                  onChange={(v) => setValue('base_price_business', v || 0)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <NumberInput
                  label="First Class ($)"
                  value={watch('base_price_first')}
                  onChange={(v) => setValue('base_price_first', v || 0)}
                  min={0}
                  decimalScale={2}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Amenities & Status</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 8 }}>
                <MultiSelect
                  label="Amenities"
                  data={AMENITIES_OPTIONS}
                  value={amenities}
                  onChange={setAmenities}
                  clearable
                  searchable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Switch
                  label="Active Flight"
                  description="Flight available for booking"
                  checked={watch('is_active')}
                  onChange={(e) => setValue('is_active', e.currentTarget.checked)}
                  mt="md"
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Group justify="flex-end">
            <Button 
              type="submit" 
              loading={updateMutation.isPending}
              disabled={daysOfWeek.length === 0}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
