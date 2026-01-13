import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Card, Title, TextInput, Select, Button, Stack, Group, Grid, 
  Alert, Loader, Center, NumberInput, Switch, MultiSelect, Checkbox
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

export default function CreateFlight() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabaseConfigured = isSupabaseConfigured()

  const { data: airlines, isLoading: loadingAirlines } = useQuery({
    queryKey: ['airlines'],
    queryFn: async () => {
      const { data, error } = await supabase.from('airlines').select('*').eq('is_active', true).order('name')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { data: airports, isLoading: loadingAirports } = useQuery({
    queryKey: ['airports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('airports').select('*').eq('is_active', true).order('code')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      flight_number: '',
      airline_id: '',
      departure_airport_id: '',
      arrival_airport_id: '',
      departure_time: '08:00',
      arrival_time: '10:00',
      duration_minutes: 120,
      aircraft_type: '',
      base_price_economy: 100,
      base_price_premium: 250,
      base_price_business: 800,
      base_price_first: 2500,
      stops: 0,
      is_active: true,
    },
  })

  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5, 6, 7])
  const [amenities, setAmenities] = useState([])

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('flights').insert({
        ...data,
        days_of_week: daysOfWeek,
        amenities: amenities,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] })
      notifications.show({ title: 'Success', message: 'Flight created', color: 'green' })
      router.push('/flights')
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  if ((loadingAirlines || loadingAirports) && supabaseConfigured) {
    return <Center h={400}><Loader size="lg" /></Center>
  }

  return (
    <Stack gap="lg">
      <Group wrap="wrap">
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/flights')}>
          Back
        </Button>
        <Title order={2}>Add New Flight</Title>
      </Group>

      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase to create flights.
        </Alert>
      )}

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
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
                  placeholder="e.g. AA123"
                  {...register('flight_number')}
                  error={errors.flight_number?.message}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Airline"
                  placeholder="Select airline"
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
                  placeholder="Select airport"
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
                  placeholder="Select airport"
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
                  placeholder="e.g. Boeing 737-800"
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
                  placeholder="Select amenities"
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
            <Button variant="light" onClick={() => router.push('/flights')}>Cancel</Button>
            <Button 
              type="submit" 
              loading={createMutation.isPending} 
              disabled={!supabaseConfigured || daysOfWeek.length === 0}
            >
              Create Flight
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
