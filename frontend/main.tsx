import React, { useState, createContext, useContext, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Building2, MapPin, Key, ShoppingBag, TrendingUp, DollarSign, Package, Menu as MenuIcon, LogOut, Monitor, Smartphone } from 'lucide-react';

// ===== TYPES (matching backend schemas) =====
interface User {
  id: number;
  fullname: string;
  email: string;
}

interface Organization {
  organization_id: number;
  name: string;
  role: string;
  status: string;
  created_at?: string;
}

interface Location {
  location_id: number;
  name: string;
  address: string;
  timezone: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface Device {
  device_id: number;
  device_name: string;
  device_status: string;
  device_type: string;
  location_id: number;
  registered_at?: string;
  last_active_at?: string;
  pairing_code?: string;
}

interface RevenueData {
  date: string;
  total_revenue: number;
}

// ===== API CLIENT =====
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async signup(fullname: string, email: string, password: string) {
    const response = await this.request('/user/signup', {
      method: 'POST',
      body: JSON.stringify({ fullname, email, password }),
    });
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  }

  async getMe() {
    return await this.request('/user/me');
  }

  // Organization endpoints
  async getMyOrganizations() {
    return await this.request('/organization/my');
  }

  async createOrganization(name: string) {
    return await this.request('/organization/create', {
      method: 'POST',
      body: JSON.stringify({ name, address: '' }),
    });
  }

  async getOrganization(orgId: number) {
    return await this.request(`/organization/${orgId}`);
  }

  async getOrganizationLocations(orgId: number) {
    return await this.request(`/organization/${orgId}/locations`);
  }

  async addLocation(orgId: number, name: string, address: string, timezone: string = 'UTC') {
    return await this.request(`/organization/${orgId}/add_location`, {
      method: 'POST',
      body: JSON.stringify({ name, address, timezone }),
    });
  }

  async setLocationLicense(orgId: number, locationId: number, licenseKey: string) {
    return await this.request(`/organization/${orgId}/${locationId}`, {
      method: 'POST',
      body: JSON.stringify(licenseKey),
    });
  }

  // Menu endpoints
  async getMenu(locationId: number) {
    return await this.request(`/menu/${locationId}`);
  }

  async createProduct(locationId: number, name: string, description: string, price: number) {
    return await this.request('/menu/', {
      method: 'POST',
      body: JSON.stringify({ location_id: locationId, name, description, price }),
    });
  }

  async updateProduct(productId: number, locationId: number, name: string, description: string, price: number) {
    return await this.request(`/menu/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ location_id: locationId, name, description, price }),
    });
  }

  async deleteProduct(productId: number) {
    return await this.request(`/menu/${productId}`, {
      method: 'DELETE',
    });
  }

  // Device endpoints
  async listDevices() {
    return await this.request('/devices/');
  }

  async registerDevice(locationId: number, deviceName: string, deviceType: string) {
    return await this.request('/devices/register', {
      method: 'POST',
      body: JSON.stringify({ location_id: locationId, device_name: deviceName, device_type: deviceType }),
    });
  }

  async pairDevice(pairingCode: string, hardwareId: string) {
    return await this.request('/devices/pair', {
      method: 'POST',
      body: JSON.stringify({ pairing_code: pairingCode, hardware_id: hardwareId }),
    });
  }

  // Management endpoints
  async getTodaysRevenue() {
    return await this.request('/management/revenue/today');
  }
}

const api = new ApiClient();

// ===== AUTH CONTEXT =====
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullname: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ===== AUTH PROVIDER =====
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        api.setToken(storedToken);
        try {
          const userData = await api.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          api.clearToken();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (result.error) {
      throw new Error(result.error);
    }
    api.setToken(result.access_token);
    setToken(result.access_token);
    const userData = await api.getMe();
    setUser(userData);
  };

  const signup = async (fullname: string, email: string, password: string) => {
    const result = await api.signup(fullname, email, password);
    if (result.error) {
      throw new Error(result.error);
    }
    api.setToken(result.access_token);
    setToken(result.access_token);
    const userData = await api.getMe();
    setUser(userData);
  };

  const logout = () => {
    api.clearToken();
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// ===== UI COMPONENTS =====
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

// ===== LOGIN PAGE =====
const LoginPage: React.FC<{ onSwitchToSignup: () => void }> = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant POS</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToSignup}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </Card>
    </div>
  );
};

// ===== SIGNUP PAGE =====
const SignupPage: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await signup(fullname, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join Restaurant POS today</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <Input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Already have an account? Sign in
          </button>
        </div>
      </Card>
    </div>
  );
};

// ===== ORGANIZATIONS PAGE =====
const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [locations, setLocations] = useState<Record<number, Location[]>>({});
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationTimezone, setNewLocationTimezone] = useState('UTC');
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('POS');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const orgsData = await api.getMyOrganizations();
      setOrganizations(orgsData.organizations || []);
      
      const locationsMap: Record<number, Location[]> = {};
      for (const org of orgsData.organizations || []) {
        const locsData = await api.getOrganizationLocations(org.organization_id);
        locationsMap[org.organization_id] = locsData.locations || [];
      }
      setLocations(locationsMap);

      const devicesData = await api.listDevices();
      setDevices(devicesData.devices || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    try {
      await api.createOrganization(newOrgName);
      setNewOrgName('');
      setShowOrgModal(false);
      loadData();
    } catch (error) {
      alert('Failed to create organization');
    }
  };

  const handleCreateLocation = async () => {
    if (!selectedOrg || !newLocationName.trim() || !newLocationAddress.trim()) return;
    try {
      await api.addLocation(selectedOrg, newLocationName, newLocationAddress, newLocationTimezone);
      setNewLocationName('');
      setNewLocationAddress('');
      setNewLocationTimezone('UTC');
      setShowLocationModal(false);
      loadData();
    } catch (error) {
      alert('Failed to create location');
    }
  };

  const handleSetLicense = async () => {
    if (!selectedOrg || !selectedLocation || !newLicenseKey.trim()) return;
    try {
      await api.setLocationLicense(selectedOrg, selectedLocation, newLicenseKey);
      setNewLicenseKey('');
      setShowLicenseModal(false);
      alert('License added successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to add license');
    }
  };

  const handleRegisterDevice = async () => {
    if (!selectedLocation || !newDeviceName.trim()) return;
    try {
      const result = await api.registerDevice(selectedLocation, newDeviceName, newDeviceType);
      setNewDeviceName('');
      setNewDeviceType('POS');
      setShowDeviceModal(false);
      alert(`Device registered! Pairing code: ${result.pairing_code}`);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to register device');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Organizations & Locations</h1>
        <Button onClick={() => setShowOrgModal(true)}>
          <Plus size={20} className="mr-2" />
          New Organization
        </Button>
      </div>

      <div className="grid gap-6">
        {organizations.map(org => (
          <Card key={org.organization_id}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={24} />
                    {org.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Role: {org.role} • Status: {org.status}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <MapPin size={18} />
                    Locations ({locations[org.organization_id]?.length || 0})
                  </h3>
                  <button
                    onClick={() => { setSelectedOrg(org.organization_id); setShowLocationModal(true); }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus size={18} className="inline mr-1" />
                    Add Location
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {locations[org.organization_id]?.map(loc => (
                    <div key={loc.location_id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">{loc.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{loc.address}</div>
                          <div className="text-xs text-gray-500 mt-1">Timezone: {loc.timezone}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setSelectedOrg(org.organization_id);
                            setSelectedLocation(loc.location_id);
                            setShowLicenseModal(true);
                          }}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                        >
                          <Key size={12} className="inline mr-1" />
                          Add License
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLocation(loc.location_id);
                            setShowDeviceModal(true);
                          }}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          <Monitor size={12} className="inline mr-1" />
                          Register Device
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {devices.filter(d => locations[org.organization_id]?.some(l => l.location_id === d.location_id)).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Monitor size={18} />
                    Devices
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {devices.filter(d => locations[org.organization_id]?.some(l => l.location_id === d.location_id)).map(device => (
                      <div key={device.device_id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{device.device_name}</div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            device.device_status === 'paired' ? 'bg-green-100 text-green-800' :
                            device.device_status === 'unpaired' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {device.device_status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">Type: {device.device_type}</div>
                        {device.pairing_code && (
                          <div className="text-xs text-gray-600 mt-1 font-mono bg-white px-2 py-1 rounded">
                            Code: {device.pairing_code}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showOrgModal} onClose={() => setShowOrgModal(false)} title="Create Organization">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <Input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="My Restaurant"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowOrgModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateOrg} className="flex-1">
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} title="Add Location">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
            <Input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Main Floor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input
              value={newLocationAddress}
              onChange={(e) => setNewLocationAddress(e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <Input
              value={newLocationTimezone}
              onChange={(e) => setNewLocationTimezone(e.target.value)}
              placeholder="UTC"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowLocationModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateLocation} className="flex-1">
              Add Location
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLicenseModal} onClose={() => setShowLicenseModal(false)} title="Add License Key">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Key</label>
            <Input
              value={newLicenseKey}
              onChange={(e) => setNewLicenseKey(e.target.value)}
              placeholder="Enter license key"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowLicenseModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSetLicense} className="flex-1">
              Add License
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeviceModal} onClose={() => setShowDeviceModal(false)} title="Register Device">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
            <Input
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              placeholder="POS Terminal 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
            <select 
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
<option value="POS">POS Terminal</option>
<option value="KitchenDisplay">Kitchen Display</option>
<option value="CustomerDisplay">Customer Display</option>
</select>
</div>
<div className="flex gap-3">
<Button variant="secondary" onClick={() => setShowDeviceModal(false)} className="flex-1">
Cancel
</Button>
<Button onClick={handleRegisterDevice} className="flex-1">
Register
</Button>
</div>
</div>
</Modal>
</div>
);
};
                
<parameter name="command">update</parameter>
<parameter name="id">restaurant-pos-frontend</parameter>
<parameter name="old_str">              onChange={(</parameter>
<parameter name="new_str">              onChange={(e) => setNewDeviceName(e.target.value)}
placeholder="POS Terminal 1"
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
<select
value={newDeviceType}
onChange={(e) => setNewDeviceType(e.target.value)}
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
<option value="POS">POS Terminal</option>
<option value="KitchenDisplay">Kitchen Display</option>
<option value="CustomerDisplay">Customer Display</option>
</select>
</div>
<div className="flex gap-3">
<Button variant="secondary" onClick={() => setShowDeviceModal(false)} className="flex-1">
Cancel
</Button>
<Button onClick={handleRegisterDevice} className="flex-1">
Register
</Button>
</div>
</div>
</Modal>
</div>
);
};