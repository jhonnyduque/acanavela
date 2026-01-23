
import { Order, Customer, AppUser, AuditLogEntry } from '../types';

const STORAGE_KEY = 'acanavela_orders_v2';
const CUSTOMERS_KEY = 'acanavela_customers_v1';
const USERS_KEY = 'acanavela_users_v1';
const LOGS_KEY = 'acanavela_user_logs_v1';
const BACKUP_KEY = 'acanavela_backup_v2';

const DEFAULT_USERS: AppUser[] = [
  {
    id: '1',
    name: 'Administrador Principal',
    username: 'admin',
    role: 'ADMIN',
    isActive: true,
    pin: '1234'
  },
  {
    id: '2',
    name: 'Yaliana Belandria',
    username: 'yaliana',
    role: 'MANAGER',
    isActive: true,
    pin: '1234'
  },
  {
    id: '3',
    name: 'Isabella Duque',
    username: 'isabella',
    role: 'VENDOR',
    isActive: true,
    pin: '1234'
  }
];

export const storageService = {
  getOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveOrders: (orders: Order[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    const customers = storageService.getCustomers();
    localStorage.setItem(BACKUP_KEY, JSON.stringify({
      orders,
      customers,
      timestamp: new Date().toISOString()
    }));
  },

  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  },

  getUsers: (): AppUser[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : DEFAULT_USERS;
  },

  saveUsers: (users: AppUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getLogs: (): AuditLogEntry[] => {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveLogs: (logs: AuditLogEntry[]) => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(-50)));
  },

  addLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const logs = storageService.getLogs();
    const newLog: AuditLogEntry = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    storageService.saveLogs([newLog, ...logs]);
  },

  getBackupInfo: () => {
    const data = localStorage.getItem(BACKUP_KEY);
    return data ? JSON.parse(data) : null;
  }
};
