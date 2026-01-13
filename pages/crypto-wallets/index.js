import { useState } from 'react'
import { 
  Card, Title, TextInput, Button, Stack, Group, Table, Badge, 
  ActionIcon, Menu, Loader, Center, Text, Alert, Modal, Grid, Switch, NumberInput,
  CopyButton, Tooltip
} from '@mantine/core'
import { 
  IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash, 
  IconInfoCircle, IconCurrencyBitcoin, IconToggleLeft, IconToggleRight, IconCopy, IconCheck
} from '@tabler/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const NETWORK_TYPES = [
  { value: 'ERC20', label: 'ERC20 (Ethereum)' },
  { value: 'TRC20', label: 'TRC20 (Tron)' },
  { value: 'BEP20', label: 'BEP20 (BSC)' },
  { value: 'BTC', label: 'Bitcoin Network' },
  { value: 'SOL', label: 'Solana' },
  { value: 'POLYGON', label: 'Polygon' },
  { value: 'AVAX', label: 'Avalanche C-Chain' },
  { value: 'ARB', label: 'Arbitrum' },
  { value: 'OP', label: 'Optimism' },
  { value: 'BASE', label: 'Base' },
]

const CRYPTO_PRESETS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether USD' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'TRX', name: 'TRON' },
  { symbol: 'MATIC', name: 'Polygon' },
]

export default function CryptoWalletsList() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [formData, setFormData] = useState({ 
    crypto_name: '', 
    crypto_symbol: '', 
    network_type: '', 
    wallet_address: '', 
    icon_url: '',
    min_confirmations: 1,
    display_order: 0,
    is_active: true 
  })

  const supabaseConfigured = isSupabaseConfigured()

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['crypto_wallets', search],
    queryFn: async () => {
      let query = supabase.from('crypto_wallets').select('*')
      if (search) {
        query = query.or(`crypto_name.ilike.%${search}%,crypto_symbol.ilike.%${search}%,network_type.ilike.%${search}%,wallet_address.ilike.%${search}%`)
      }
      const { data, error } = await query.order('display_order').order('crypto_symbol')
      if (error) throw error
      return data || []
    },
    enabled: supabaseConfigured,
  })

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        crypto_name: data.crypto_name,
        crypto_symbol: data.crypto_symbol.toUpperCase(),
        network_type: data.network_type,
        wallet_address: data.wallet_address,
        icon_url: data.icon_url || null,
        min_confirmations: data.min_confirmations || 1,
        display_order: data.display_order || 0,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      }
      if (editingWallet) {
        const { error } = await supabase.from('crypto_wallets').update(payload).eq('id', editingWallet.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('crypto_wallets').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto_wallets'] })
      notifications.show({ title: 'Success', message: editingWallet ? 'Wallet updated' : 'Wallet created', color: 'green' })
      closeModal()
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from('crypto_wallets').update({ is_active: !is_active, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto_wallets'] })
      notifications.show({ title: 'Success', message: 'Status updated', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('crypto_wallets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto_wallets'] })
      notifications.show({ title: 'Success', message: 'Wallet deleted', color: 'green' })
    },
    onError: (error) => {
      notifications.show({ title: 'Error', message: error.message, color: 'red' })
    },
  })

  const openModal = (wallet = null) => {
    if (wallet) {
      setEditingWallet(wallet)
      setFormData({
        crypto_name: wallet.crypto_name,
        crypto_symbol: wallet.crypto_symbol,
        network_type: wallet.network_type,
        wallet_address: wallet.wallet_address,
        icon_url: wallet.icon_url || '',
        min_confirmations: wallet.min_confirmations || 1,
        display_order: wallet.display_order || 0,
        is_active: wallet.is_active,
      })
    } else {
      setEditingWallet(null)
      setFormData({ 
        crypto_name: '', 
        crypto_symbol: '', 
        network_type: '', 
        wallet_address: '', 
        icon_url: '',
        min_confirmations: 1,
        display_order: 0,
        is_active: true 
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingWallet(null)
  }

  const handlePresetSelect = (preset) => {
    setFormData(prev => ({
      ...prev,
      crypto_name: preset.name,
      crypto_symbol: preset.symbol,
    }))
  }

  const isFormValid = formData.crypto_name && formData.crypto_symbol && formData.network_type && formData.wallet_address

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Group gap="xs">
          <IconCurrencyBitcoin size={28} />
          <Title order={2}>Crypto Wallets</Title>
          {wallets && <Badge size="lg" variant="light">{wallets.length} wallets</Badge>}
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openModal()} disabled={!supabaseConfigured}>
          Add Wallet
        </Button>
      </Group>

      {!supabaseConfigured && (
        <Alert icon={<IconInfoCircle size={16} />} title="Supabase Not Configured" color="blue">
          Configure Supabase environment variables to manage crypto wallets.
        </Alert>
      )}

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group mb="md">
          <TextInput
            placeholder="Search by name, symbol, network, or address..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </Group>

        {isLoading ? (
          <Center h={200}><Loader size="lg" /></Center>
        ) : !wallets?.length ? (
          <Center h={200}>
            <Stack align="center">
              <IconCurrencyBitcoin size={48} color="gray" />
              <Text c="dimmed">No crypto wallets found</Text>
              <Button variant="light" onClick={() => openModal()}>Add First Wallet</Button>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Crypto</Table.Th>
                  <Table.Th>Network</Table.Th>
                  <Table.Th>Wallet Address</Table.Th>
                  <Table.Th>Confirmations</Table.Th>
                  <Table.Th>Order</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {wallets.map((wallet) => (
                  <Table.Tr key={wallet.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconCurrencyBitcoin size={16} />
                        <div>
                          <Text fw={500}>{wallet.crypto_symbol}</Text>
                          <Text size="xs" c="dimmed">{wallet.crypto_name}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline">{wallet.network_type}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Text size="sm" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {wallet.wallet_address.substring(0, 20)}...
                        </Text>
                        <CopyButton value={wallet.wallet_address} timeout={2000}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy address'} withArrow>
                              <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Table.Td>
                    <Table.Td>{wallet.min_confirmations}</Table.Td>
                    <Table.Td>{wallet.display_order}</Table.Td>
                    <Table.Td>
                      <Badge color={wallet.is_active ? 'green' : 'gray'}>
                        {wallet.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openModal(wallet)}>
                            Edit
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={wallet.is_active ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />}
                            onClick={() => toggleStatusMutation.mutate({ id: wallet.id, is_active: wallet.is_active })}
                          >
                            {wallet.is_active ? 'Deactivate' : 'Activate'}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item 
                            color="red" 
                            leftSection={<IconTrash size={14} />} 
                            onClick={() => {
                              if (window.confirm(`Delete ${wallet.crypto_symbol} (${wallet.network_type}) wallet?`)) {
                                deleteMutation.mutate(wallet.id)
                              }
                            }}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal opened={modalOpen} onClose={closeModal} title={editingWallet ? 'Edit Crypto Wallet' : 'Add Crypto Wallet'} size="lg">
        <Stack gap="md">
          {!editingWallet && (
            <div>
              <Text size="sm" fw={500} mb="xs">Quick Select</Text>
              <Group gap="xs" wrap="wrap">
                {CRYPTO_PRESETS.map(preset => (
                  <Button 
                    key={preset.symbol} 
                    size="xs" 
                    variant={formData.crypto_symbol === preset.symbol ? 'filled' : 'light'}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.symbol}
                  </Button>
                ))}
              </Group>
            </div>
          )}
          
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Crypto Name"
                placeholder="e.g., Bitcoin, Ethereum"
                value={formData.crypto_name}
                onChange={(e) => setFormData({ ...formData, crypto_name: e.target.value })}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Symbol"
                placeholder="e.g., BTC, ETH"
                value={formData.crypto_symbol}
                onChange={(e) => setFormData({ ...formData, crypto_symbol: e.target.value.toUpperCase() })}
                required
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Network Type"
            placeholder="Select or type network"
            value={formData.network_type}
            onChange={(e) => setFormData({ ...formData, network_type: e.target.value })}
            required
          />
          
          <Group gap="xs" wrap="wrap">
            {NETWORK_TYPES.map(net => (
              <Button 
                key={net.value} 
                size="xs" 
                variant={formData.network_type === net.value ? 'filled' : 'outline'}
                onClick={() => setFormData({ ...formData, network_type: net.value })}
              >
                {net.value}
              </Button>
            ))}
          </Group>

          <TextInput
            label="Wallet Address"
            placeholder="Enter wallet address"
            value={formData.wallet_address}
            onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
            required
          />

          <TextInput
            label="Icon URL (optional)"
            placeholder="https://..."
            value={formData.icon_url}
            onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
          />

          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Min Confirmations"
                value={formData.min_confirmations}
                onChange={(v) => setFormData({ ...formData, min_confirmations: v || 1 })}
                min={1}
                max={100}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Display Order"
                value={formData.display_order}
                onChange={(v) => setFormData({ ...formData, display_order: v || 0 })}
                min={0}
              />
            </Grid.Col>
          </Grid>

          <Switch
            label="Active"
            description="Wallet is available for payments"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.currentTarget.checked })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeModal}>Cancel</Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)} 
              loading={saveMutation.isPending}
              disabled={!isFormValid}
            >
              {editingWallet ? 'Save Changes' : 'Add Wallet'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
