import { useAuth } from '../context/AuthContext'
import { Badge, Card, SectionTitle } from '../components/UI'

const Stat = ({ label, value, accent }) => (
  <Card className="flex-1">
    <div className="text-[11px] text-[var(--color-muted)] font-[var(--font-mono)] tracking-widest uppercase mb-2.5">{label}</div>
    <div className={`text-3xl font-extrabold tracking-tight ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>
      {value}
    </div>
  </Card>
)

const Row = ({ label, value }) => (
  <div className="flex items-start gap-4">
    <span className="min-w-[120px] text-[11px] text-[var(--color-muted)] font-[var(--font-mono)] tracking-wider uppercase pt-px shrink-0">
      {label}
    </span>
    <span className="text-[13px] text-[var(--color-text)] font-[var(--font-mono)] break-all">{value}</span>
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const joined = new Date(user?.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <Badge variant={user?.role}>{user?.role}</Badge>
        </div>
        <p className="text-[var(--color-muted)] font-[var(--font-mono)] text-[12px]">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <Stat label="Account Status" value={user?.is_active ? 'Active' : 'Inactive'} accent />
        <Stat label="Email Verified" value={user?.is_verified ? 'Yes' : 'No'} />
        <Stat label="Role" value={user?.role?.toUpperCase()} />
      </div>

      {/* Account details */}
      <Card className="mb-6">
        <SectionTitle>Account Details</SectionTitle>
        <div className="flex flex-col gap-3.5">
          <Row label="User ID"     value={user?.id} />
          <Row label="Name"       value={user?.name} />
          <Row label="Email"       value={user?.email} />
          <Row label="Member Since" value={joined} />
        </div>
      </Card>

      {/* Token info */}
      <Card>
        <SectionTitle>Token Info</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {[
            ['Access Token TTL',  '15 minutes'],
            ['Refresh Token TTL', '7 days'],
            ['Token Strategy',    'Rotating refresh tokens'],
            ['Storage',           'Access: localStorage · Refresh: httpOnly cookie'],
          ].map(([label, val]) => (
            <div key={label} className="flex gap-4">
              <span className="min-w-[180px] text-[11px] text-[var(--color-muted)] font-[var(--font-mono)] tracking-wider uppercase shrink-0">
                {label}
              </span>
              <span className="text-[12px] text-[var(--color-accent)] font-[var(--font-mono)]">{val}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}