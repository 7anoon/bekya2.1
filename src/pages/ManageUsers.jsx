import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function ManageUsers() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadUsers();
  }, [profile, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      alert('حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`هل تريد تغيير صلاحية هذا المستخدم إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم عادي'}؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      alert('تم تحديث الصلاحيات بنجاح');
      loadUsers();
    } catch (err) {
      console.error('Error updating role:', err);
      alert('حدث خطأ في تحديث الصلاحيات');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع منتجاته وإشعاراته نهائياً.')) {
      return;
    }

    try {
      // استخدام الدالة لحذف المستخدم بالكامل
      const { error } = await supabase.rpc('delete_user_completely', {
        user_id_to_delete: userId
      });

      if (error) {
        // إذا الدالة مش موجودة، نحذف من profiles فقط
        if (error.message.includes('function') || error.code === '42883') {
          console.warn('Database function not found, deleting profile only');
          
          // حذف الإشعارات
          await supabase.from('notifications').delete().eq('user_id', userId);
          
          // حذف المنتجات
          await supabase.from('products').delete().eq('user_id', userId);
          
          // حذف من profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

          if (profileError) throw profileError;
          
          alert('تم حذف بيانات المستخدم من التطبيق. لحذفه نهائياً، قم بتشغيل migration-delete-user-function.sql في Supabase');
        } else {
          throw error;
        }
      } else {
        alert('تم حذف المستخدم نهائياً بنجاح');
      }

      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('حدث خطأ في حذف المستخدم: ' + err.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getUserStats = async (userId) => {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error getting user stats:', err);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={styles.loading}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة المستخدمين</h1>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{users.length}</span>
            <span style={styles.statLabel}>إجمالي المستخدمين</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{users.filter(u => u.role === 'admin').length}</span>
            <span style={styles.statLabel}>مدراء</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{users.filter(u => u.role === 'user').length}</span>
            <span style={styles.statLabel}>مستخدمين</span>
          </div>
        </div>
      </div>

      {/* البحث والفلترة */}
      <div className="card" style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.searchBox}>
            <svg style={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="ابحث بالاسم، البريد، الهاتف، أو الموقع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              className="input"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={styles.filterSelect}
            className="input"
          >
            <option value="all">كل الصلاحيات</option>
            <option value="admin">مدراء فقط</option>
            <option value="user">مستخدمين فقط</option>
          </select>
        </div>
      </div>

      {/* قائمة المستخدمين */}
      <div style={styles.usersList}>
        {filteredUsers.length === 0 ? (
          <div className="card" style={styles.empty}>
            <p>لا توجد نتائج</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="card" style={styles.userCard}>
              <div style={styles.userHeader}>
                <div style={styles.userInfo}>
                  <h3 style={styles.userName}>{user.username}</h3>
                  <span style={{
                    ...styles.roleBadge,
                    background: user.role === 'admin' ? '#6b7c59' : '#8b7355'
                  }}>
                    {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                  </span>
                </div>
              </div>

              <div style={styles.userDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>البريد الإلكتروني:</span>
                  <span style={styles.detailValue}>{user.email}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>رقم الهاتف:</span>
                  <span style={styles.detailValue}>{user.phone || 'غير متوفر'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>الموقع:</span>
                  <span style={styles.detailValue}>{user.location || 'غير متوفر'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>تاريخ التسجيل:</span>
                  <span style={styles.detailValue}>
                    {new Date(user.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>

              <div style={styles.userActions}>
                <button
                  className="btn"
                  style={{
                    background: user.role === 'admin' ? '#8b7355' : '#6b7c59',
                    color: 'white',
                    borderRadius: '20px'
                  }}
                  onClick={() => toggleUserRole(user.id, user.role)}
                  disabled={user.id === profile.id}
                >
                  {user.role === 'admin' ? 'إزالة صلاحية المدير' : 'جعله مدير'}
                </button>
                
                <button
                  className="btn"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '20px'
                  }}
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  عرض المنتجات
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => deleteUser(user.id)}
                  disabled={user.id === profile.id}
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '32px',
    color: '#000000',
    marginBottom: '24px',
    fontWeight: '600'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  statItem: {
    background: 'linear-gradient(135deg, rgba(107, 124, 89, 0.1) 0%, rgba(139, 115, 85, 0.1) 100%)',
    padding: '24px',
    borderRadius: '20px',
    textAlign: 'center',
    border: '1px solid rgba(107, 124, 89, 0.2)'
  },
  statNumber: {
    display: 'block',
    fontSize: '36px',
    fontWeight: '700',
    color: '#6b7c59',
    marginBottom: '8px'
  },
  statLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#000000',
    fontWeight: '600'
  },
  filterCard: {
    marginBottom: '32px',
    padding: '24px'
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchBox: {
    flex: '1',
    minWidth: '300px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    right: '16px',
    color: '#9ca3af',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    paddingRight: '48px'
  },
  filterSelect: {
    minWidth: '200px'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#7a7a7a'
  },
  empty: {
    textAlign: 'center',
    padding: '60px',
    color: '#7a7a7a'
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  userCard: {
    padding: '24px',
    transition: 'all 0.3s ease'
  },
  userHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(107, 124, 89, 0.1)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  userName: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#000000',
    margin: 0
  },
  roleBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500'
  },
  userDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  detailLabel: {
    fontSize: '13px',
    color: '#000000',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: '15px',
    color: '#000000',
    fontWeight: '600'
  },
  userActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    paddingTop: '16px',
    borderTop: '1px solid rgba(107, 124, 89, 0.1)'
  }
};
