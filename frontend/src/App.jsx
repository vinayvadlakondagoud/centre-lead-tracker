import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/LeadsList';
import LeadDetail from './pages/LeadDetail';
import LeadForm from './pages/LeadForm';
import ArchivedLeads from './pages/ArchivedLeads';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>Centre Lead Tracker</h2>
          </div>
          <ul className="nav-links">
            <li><NavLink to="/" end>Dashboard</NavLink></li>
            <li><NavLink to="/leads">Leads</NavLink></li>
            <li><NavLink to="/leads/new">New Lead</NavLink></li>
            <li><NavLink to="/archived">Archived</NavLink></li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsList />} />
            <Route path="/leads/new" element={<LeadForm />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/leads/:id/edit" element={<LeadForm />} />
            <Route path="/archived" element={<ArchivedLeads />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
