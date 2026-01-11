import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Shipments from './pages/Shipments'
import ShipmentDetail from './pages/ShipmentDetail'
import CreateShipment from './pages/CreateShipment'
import Users from './pages/Users'
import UserDetail from './pages/UserDetail'

function App() {
  return (
    <AppShell
      navbar={{ width: 280, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/shipments/new" element={<CreateShipment />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetail />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
