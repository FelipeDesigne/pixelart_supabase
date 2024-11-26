import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Overview from './Overview';
import NewRequest from './NewRequest';
import Profile from './Profile';
import Settings from './Settings';

export default function UserDashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/new-request" element={<NewRequest />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}