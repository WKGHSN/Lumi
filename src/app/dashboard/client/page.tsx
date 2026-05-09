'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, LogOut, Plus, ChevronRight, Phone, Mail, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useBookingsStore } from '@/store/bookingsstore';
import { formatDate, formatPrice, getStatusLabel, getStatusBadgeClass, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Booking } from '@/types';

type TabType = 'upcoming' | 'past' | 'profile';

export default function ClientDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const allBookings = useBookingsStore(s => s.bookings);
  const cancelBooking = useBookingsStore(s => s.cancelBooking);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  // SSR safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-h-screen bg-lumi-milk" />;

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const userBookings = allBookings.filter(b => b.clientId === user.id);
  const today = new Date().toISOString().split('T')[0];
  const upcoming = userBookings.filter(b => b.date >= today && b.status !== 'cancelled').sort((a, b) => a.date.localeCompare(b.date));
  const past = userBookings.filter(b => b.date < today || b.status === 'completed' || b.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date));

  const handleCancel = (id: string) => {
    cancelBooking(id);
    toast.success('Запис скасовано');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'upcoming', label: 'Майбутні записи', icon: Calendar },
    { id: 'past', label: 'Історія', icon: Clock },
    { id: 'profile', label: 'Профіль', icon: User },
  ];

  return (
    <div className="bg-lumi-milk min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-lumi-border">
        <div className="page-container py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lumi-blush to-lumi-rose flex items-center justify-center text-white text-xl font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h1 className="font-serif font-medium text-lumi-text text-xl">Привіт, {user.name.split(' ')[0]}!</h1>
                <p className="text-lumi-muted text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/booking" className="btn-primary">
                <Plus className="w-4 h-4" /> Новий запис
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-lumi-muted">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Всього записів', value: userBookings.length, icon: Calendar, color: 'text-blue-500 bg-blue-50' },
            { label: 'Майбутніх', value: upcoming.length, icon: Clock, color: 'text-amber-500 bg-amber-50' },
            { label: 'Завершено', value: userBookings.filter(b => b.status === 'completed').length, icon: Star, color: 'text-emerald-500 bg-emerald-50' },
            { label: 'Скасовано', value: userBookings.filter(b => b.status === 'cancelled').length, icon: ChevronRight, color: 'text-red-400 bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-soft p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-lumi-text">{stat.value}</p>
                <p className="text-xs text-lumi-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-soft p-4">
              <nav className="flex flex-col gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn('sidebar-nav-item text-left w-full', activeTab === tab.id && 'active')}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'upcoming' && upcoming.length > 0 && (
                      <span className="ml-auto text-xs bg-lumi-rose text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {upcoming.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'upcoming' && (
              <div>
                <h2 className="font-serif font-medium text-lumi-text text-xl mb-4">Майбутні записи</h2>
                {upcoming.length === 0 ? (
                  <EmptyState
                    message="У вас немає майбутніх записів"
                    action={<Link href="/booking" className="btn-primary">Записатись <Plus className="w-4 h-4" /></Link>}
                  />
                ) : (
                  <div className="space-y-3">
                    {upcoming.map(b => (
                      <BookingCard key={b.id} booking={b} onCancel={handleCancel} showCancel />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <div>
                <h2 className="font-serif font-medium text-lumi-text text-xl mb-4">Історія записів</h2>
                {past.length === 0 ? (
                  <EmptyState message="Ваша історія записів порожня" />
                ) : (
                  <div className="space-y-3">
                    {past.map(b => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <ProfileTab user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel, showCancel }: { booking: Booking; onCancel?: (id: string) => void; showCancel?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-medium text-lumi-text">{booking.serviceName}</h3>
            <span className={getStatusBadgeClass(booking.status)}>
              {getStatusLabel(booking.status)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p className="text-lumi-muted flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {booking.masterName}
            </p>
            <p className="text-lumi-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(booking.date)}
            </p>
            <p className="text-lumi-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {booking.time}
            </p>
            <p className="font-semibold text-lumi-text">{formatPrice(booking.price)}</p>
          </div>
        </div>
        {showCancel && onCancel && (booking.status === 'pending' || booking.status === 'confirmed') && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-red-400 hover:text-red-600 text-xs border border-red-200 hover:border-red-400 rounded-xl px-3 py-1.5 transition-colors flex-shrink-0"
          >
            Скасувати
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-10 text-center">
      <p className="text-3xl mb-3">📅</p>
      <p className="text-lumi-muted mb-4">{message}</p>
      {action}
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState('+38 (096) 123-45-67');

  return (
    <div>
      <h2 className="font-serif font-medium text-lumi-text text-xl mb-4">Мій профіль</h2>
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-lumi-border">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lumi-blush to-lumi-rose flex items-center justify-center text-white text-2xl font-semibold">
            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="font-medium text-lumi-text">{user.name}</h3>
            <p className="text-sm text-lumi-muted capitalize">
              {user.role === 'client' ? 'Клієнт' : user.role === 'admin' ? 'Адміністратор' : 'Майстер'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-lumi-muted block mb-1.5">Ім'я та прізвище</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-lumi-muted block mb-1.5">Email</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-lumi-muted block mb-1.5">Телефон</label>
            <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        <button
          onClick={() => toast.success('Профіль оновлено!')}
          className="btn-primary mt-6"
        >
          Зберегти зміни
        </button>
      </div>
    </div>
  );
}
