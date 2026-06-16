import { createClient } from '@supabase/supabase-js';

const isPlaceholderUrl = (url: string | undefined): boolean => {
  return !url || url.includes('placeholder') || url.includes('example.com') || url === '';
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const shouldUseMock = isPlaceholderUrl(supabaseUrl) || isPlaceholderUrl(supabaseAnonKey);

function getSeededData(tableName: string): any[] {
  if (tableName === 'wines') {
    return [
      {
        id: 'w1',
        name: 'Meerlust Rubicon',
        region: 'Stellenbosch',
        grape: 'Cabernet Sauvignon',
        vintage: '2018',
        price: 'R 500',
        image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop',
        notes: 'A classic Stellenbosch Bordeaux blend with notes of cassis and cedar.',
        rating: 4.5
      },
      {
        id: 'w2',
        name: 'Vilafonté Series C',
        region: 'Paarl',
        grape: 'Cabernet Sauvignon',
        vintage: '2019',
        price: 'R 1200',
        image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop',
        notes: 'Elegant and structured, bursting with dark fruit.',
        rating: 4.8
      },
      {
        id: 'w3',
        name: 'Ataraxia Chardonnay',
        region: 'Hemel-en-Aarde',
        grape: 'Chardonnay',
        vintage: '2021',
        price: 'R 350',
        image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop',
        notes: 'Crisp, mineral-driven Chardonnay from the cool Hemel-en-Aarde valley.',
        rating: 4.6
      },
      {
        id: 'w4',
        name: 'Kanonkop Pinotage',
        region: 'Stellenbosch',
        grape: 'Pinotage',
        vintage: '2019',
        price: 'R 450',
        image: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=400&auto=format&fit=crop',
        notes: 'The benchmark for Pinotage. Rich red fruit and subtle oak.',
        rating: 4.7
      },
      {
        id: 'w5',
        name: 'Sadie Family Columella',
        region: 'Swartland',
        grape: 'Shiraz',
        vintage: '2020',
        price: 'R 1200',
        image: 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=400&auto=format&fit=crop',
        notes: 'Spectacular Mediterranean-style red blend from Swartland.',
        rating: 4.9
      }
    ];
  }
  if (tableName === 'news') {
    return [
      {
        id: 'n1',
        title: 'Global Supply Shift Shapes Upcoming Vintages',
        category: 'Global News',
        image: 'https://images.unsplash.com/photo-1596758410228-568ea46a9b51?q=80&w=600&auto=format&fit=crop',
        description: 'Experts predict a rise in alternative varietals as traditional regions adapt to climate shifts this year.',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'n2',
        title: "South Africa's Cap Classique Renaissance",
        category: 'Local Spotlight',
        image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=600&auto=format&fit=crop',
        description: 'Stellenbosch producers are gaining international acclaim for traditional method sparkling wines.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        id: 'n3',
        title: 'The Rise of Low-Intervention Wonders',
        category: 'Trend',
        image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=600&auto=format&fit=crop',
        description: 'Natural and biodynamic wines continue to see explosive growth among modern connoisseurs.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ];
  }
  return [];
}

class MockUpdateBuilder {
  tableName: string;
  payload: any;
  filters: ((item: any) => boolean)[] = [];

  constructor(tableName: string, payload: any) {
    this.tableName = tableName;
    this.payload = payload;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    const stored = localStorage.getItem(`mock_db_${this.tableName}`);
    let data: any[] = [];
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {}
    }
    const updated = data.map(item => {
      const matchesAll = this.filters.every(f => f(item));
      if (matchesAll) {
        return { ...item, ...this.payload };
      }
      return item;
    });
    localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(updated));
    return { data: updated, error: null };
  }
}

class MockDeleteBuilder {
  tableName: string;
  filters: ((item: any) => boolean)[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    const stored = localStorage.getItem(`mock_db_${this.tableName}`);
    let data: any[] = [];
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {}
    }
    const rem = data.filter(item => {
      const matchesAll = this.filters.every(f => f(item));
      return !matchesAll;
    });
    localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(rem));
    return { data: rem, error: null };
  }
}

class MockQueryBuilder {
  tableName: string;
  data: any[];
  filters: ((item: any) => boolean)[] = [];
  limitVal: number | null = null;
  orderByVal: { column: string, ascending: boolean } | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
    const stored = localStorage.getItem(`mock_db_${tableName}`);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
      } catch {
        this.data = [];
      }
    } else {
      this.data = getSeededData(tableName);
      localStorage.setItem(`mock_db_${tableName}`, JSON.stringify(this.data));
    }
  }

  select(columns?: string) {
    return this;
  }

  or(filterStr: string) {
    const matches = filterStr.split(',').map(part => {
      const match = part.match(/([a-zA-Z0-9_]+)\.(ilike|eq)\.%(.*)%/);
      if (match) {
        return { field: match[1], op: match[2], val: match[3] };
      }
      return null;
    }).filter(Boolean);

    this.filters.push((item: any) => {
      if (matches.length === 0) return true;
      return matches.some(m => {
        if (!m) return false;
        const itemVal = String(item[m.field] || '').toLowerCase();
        return itemVal.includes(m.val.toLowerCase());
      });
    });
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => {
      return item[column] === value;
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item: any) => {
      return item[column] !== value;
    });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((item: any) => {
      const val = item[column];
      if (val === undefined || val === null) return false;
      return val >= value;
    });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((item: any) => {
      const val = item[column];
      if (val === undefined || val === null) return false;
      return val <= value;
    });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((item: any) => {
      const val = item[column];
      if (val === undefined || val === null) return false;
      return val > value;
    });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((item: any) => {
      const val = item[column];
      if (val === undefined || val === null) return false;
      return val < value;
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByVal = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(num: number) {
    this.limitVal = num;
    return this;
  }

  single() {
    return this.executeSingle();
  }

  async executeSingle() {
    let result = [...this.data];
    for (const f of this.filters) {
      result = result.filter(f);
    }
    if (result.length === 0) {
      return { data: null, error: { code: 'PGRST116' } };
    }
    return { data: result[0], error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    let result = [...this.data];
    for (const f of this.filters) {
      result = result.filter(f);
    }
    if (this.orderByVal) {
      const { column, ascending } = this.orderByVal;
      result.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === 'string') {
          return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return ascending ? (valA - valB) : (valB - valA);
      });
    }
    if (this.limitVal !== null) {
      result = result.slice(0, this.limitVal);
    }
    return { data: result, error: null };
  }

  async insert(rowOrRows: any) {
    const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    const records = rows.map(r => ({
      id: r.id || crypto.randomUUID(),
      created_at: r.created_at || new Date().toISOString(),
      ...r
    }));
    this.data.unshift(...records);
    localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(this.data));
    return { data: records, error: null };
  }

  async upsert(rowOrRows: any) {
    const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    rows.forEach(r => {
      const idx = this.data.findIndex(x => x.id === r.id);
      if (idx !== -1) {
        this.data[idx] = { ...this.data[idx], ...r };
      } else {
        this.data.unshift({
          id: r.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...r
        });
      }
    });
    localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(this.data));
    return { data: rows, error: null };
  }

  update(row: any) {
    return new MockUpdateBuilder(this.tableName, row);
  }

  delete() {
    return new MockDeleteBuilder(this.tableName);
  }
}

class MockChannel {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  on(event: string, filter: any, callback: () => void) {
    return this;
  }
  subscribe() {
    return this;
  }
}

class MockAuth {
  currentUser: any = null;
  listeners: ((event: string, session: any) => void)[] = [];

  constructor() {
    const storedUser = localStorage.getItem('mock_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch {}
    }
  }

  async getUser() {
    return { data: { user: this.currentUser }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    const session = this.currentUser ? { user: this.currentUser } : null;
    setTimeout(() => {
      callback(this.currentUser ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    }, 0);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(c => c !== callback);
          }
        }
      }
    };
  }

  async signInWithPassword({ email, password }: any) {
    const accountsStored = localStorage.getItem('mock_accounts');
    let accounts: Record<string, any> = {};
    if (accountsStored) {
      try {
        accounts = JSON.parse(accountsStored);
      } catch {}
    }
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'simao@neurogrowthlabs.co.za') {
      if (password !== 'SommelierAI') {
        throw new Error("Invalid login credentials");
      }
      accounts[cleanEmail] = { email: cleanEmail, password: 'SommelierAI' };
      localStorage.setItem('mock_accounts', JSON.stringify(accounts));
    } else {
      if (!accounts[cleanEmail]) {
        accounts[cleanEmail] = { email: cleanEmail, password: password || '123456' };
        localStorage.setItem('mock_accounts', JSON.stringify(accounts));
      } else if (password && accounts[cleanEmail].password !== password) {
        throw new Error("Invalid login credentials");
      }
    }

    const user = {
      id: 'mock-user-id-' + encodeURIComponent(cleanEmail),
      email: cleanEmail,
      role: 'authenticated'
    };
    this.currentUser = user;
    localStorage.setItem('mock_user', JSON.stringify(user));

    const profiles = new MockQueryBuilder('profiles');
    const existingProfile = await profiles.eq('id', user.id).single();
    if (!existingProfile.data) {
      await profiles.insert({
        id: user.id,
        email: cleanEmail,
        first_name: cleanEmail === 'simao@neurogrowthlabs.co.za' ? 'Simão' : cleanEmail.split('@')[0],
        identity: cleanEmail === 'simao@neurogrowthlabs.co.za' ? 'Investor / Collector' : '',
        role: cleanEmail === 'simao@neurogrowthlabs.co.za' ? 'super_admin' : 'explorer',
        taste_dna: {}
      });
    } else {
      if (cleanEmail === 'simao@neurogrowthlabs.co.za') {
        await profiles.update({ role: 'super_admin', first_name: 'Simão', identity: 'Investor / Collector' }).eq('id', user.id);
      }
    }

    const session = { user };
    this.listeners.forEach(c => c('SIGNED_IN', session));
    return { data: { user, session }, error: null };
  }

  async signUp({ email, password }: any) {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'simao@neurogrowthlabs.co.za') {
      if (password !== 'SommelierAI') {
        throw new Error("Invalid password for Super Admin. Please use 'SommelierAI'.");
      }
      const accountsStored = localStorage.getItem('mock_accounts');
      let accounts: Record<string, any> = {};
      if (accountsStored) {
        try {
          accounts = JSON.parse(accountsStored);
        } catch {}
      }
      accounts[cleanEmail] = { email: cleanEmail, password: 'SommelierAI' };
      localStorage.setItem('mock_accounts', JSON.stringify(accounts));
      return this.signInWithPassword({ email, password: 'SommelierAI' });
    }

    const accountsStored = localStorage.getItem('mock_accounts');
    let accounts: Record<string, any> = {};
    if (accountsStored) {
      try {
        accounts = JSON.parse(accountsStored);
      } catch {}
    }
    if (accounts[cleanEmail]) {
      throw new Error("User already exists");
    }
    accounts[cleanEmail] = { email: cleanEmail, password };
    localStorage.setItem('mock_accounts', JSON.stringify(accounts));

    return this.signInWithPassword({ email, password });
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('mock_user');
    this.listeners.forEach(c => c('SIGNED_OUT', null));
    return { error: null };
  }
}

class MockSupabaseClient {
  auth = new MockAuth();

  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  }

  channel(name: string) {
    return new MockChannel(name);
  }

  removeChannel(channel: any) {}
}

const realSupabase = !shouldUseMock ? createClient(supabaseUrl, supabaseAnonKey) : null;
const mockSupabase = new MockSupabaseClient();

class DynamicQueryBuilder {
  tableName: string;
  realBuilder: any;
  mockBuilder: any;
  chainOps: Array<{ type: string; args: any[] }> = [];

  constructor(tableName: string, realBuilder: any, mockBuilder: any) {
    this.tableName = tableName;
    this.realBuilder = realBuilder;
    this.mockBuilder = mockBuilder;
  }

  select(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.select === 'function') {
      this.realBuilder = this.realBuilder.select(...args);
    }
    this.mockBuilder = this.mockBuilder.select(...args);
    this.chainOps.push({ type: 'select', args });
    return this;
  }

  or(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.or === 'function') {
      this.realBuilder = this.realBuilder.or(...args);
    }
    this.mockBuilder = this.mockBuilder.or(...args);
    this.chainOps.push({ type: 'or', args });
    return this;
  }

  eq(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.eq === 'function') {
      this.realBuilder = this.realBuilder.eq(...args);
    }
    this.mockBuilder = this.mockBuilder.eq(...args);
    this.chainOps.push({ type: 'eq', args });
    return this;
  }

  neq(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.neq === 'function') {
      this.realBuilder = this.realBuilder.neq(...args);
    }
    this.mockBuilder = this.mockBuilder.neq(...args);
    this.chainOps.push({ type: 'neq', args });
    return this;
  }

  order(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.order === 'function') {
      this.realBuilder = this.realBuilder.order(...args);
    }
    this.mockBuilder = this.mockBuilder.order(...args);
    this.chainOps.push({ type: 'order', args });
    return this;
  }

  limit(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.limit === 'function') {
      this.realBuilder = this.realBuilder.limit(...args);
    }
    this.mockBuilder = this.mockBuilder.limit(...args);
    this.chainOps.push({ type: 'limit', args });
    return this;
  }

  gte(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.gte === 'function') {
      this.realBuilder = this.realBuilder.gte(...args);
    }
    this.mockBuilder = this.mockBuilder.gte(...args);
    this.chainOps.push({ type: 'gte', args });
    return this;
  }

  lte(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.lte === 'function') {
      this.realBuilder = this.realBuilder.lte(...args);
    }
    this.mockBuilder = this.mockBuilder.lte(...args);
    this.chainOps.push({ type: 'lte', args });
    return this;
  }

  gt(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.gt === 'function') {
      this.realBuilder = this.realBuilder.gt(...args);
    }
    this.mockBuilder = this.mockBuilder.gt(...args);
    this.chainOps.push({ type: 'gt', args });
    return this;
  }

  lt(...args: any[]) {
    if (this.realBuilder && typeof this.realBuilder.lt === 'function') {
      this.realBuilder = this.realBuilder.lt(...args);
    }
    this.mockBuilder = this.mockBuilder.lt(...args);
    this.chainOps.push({ type: 'lt', args });
    return this;
  }

  insert(...args: any[]) {
    this.chainOps.push({ type: 'insert', args });
    return this;
  }

  upsert(...args: any[]) {
    this.chainOps.push({ type: 'upsert', args });
    return this;
  }

  update(...args: any[]) {
    this.chainOps.push({ type: 'update', args });
    return this;
  }

  delete(...args: any[]) {
    this.chainOps.push({ type: 'delete', args });
    return this;
  }

  single() {
    this.chainOps.push({ type: 'single', args: [] });
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    if (mockSupabase?.auth?.currentUser?.email?.toLowerCase().trim() === 'simao@neurogrowthlabs.co.za') {
      return this.executeMock();
    }
    if (!shouldUseMock && realSupabase) {
      try {
        let query: any = realSupabase.from(this.tableName);
        for (const op of this.chainOps) {
          if (query && typeof query[op.type] === 'function') {
            query = query[op.type](...op.args);
          }
        }
        const response = await query;
        if (response && response.error) {
          const errMsg = response.error.message || '';
          const errCode = response.error.code || '';
          if (
            errMsg.includes('Failed to fetch') || 
            errMsg.includes('fetch') || 
            errMsg.includes('URL') ||
            response.error.code === 'TypeError' ||
            errCode === 'PGRST205' ||
            errCode === '42P01' ||
            errMsg.includes('Could not find the table') ||
            errMsg.includes('relation') ||
            errMsg.includes('does not exist')
          ) {
            console.warn(`[Supabase Error] Table missing or network failed on ${this.tableName}, hot-swapping to dynamic fallback DB.`, response.error);
            return this.executeMock();
          }
        }
        return response;
      } catch (err: any) {
        console.warn(`[Supabase Connection error] Failed query, falling back on mock storage for table ${this.tableName}:`, err);
        return this.executeMock();
      }
    }
    return this.executeMock();
  }

  async executeMock() {
    let query: any = this.mockBuilder;
    for (const op of this.chainOps) {
      if (query && typeof query[op.type] === 'function') {
        query = query[op.type](...op.args);
      }
    }
    // If the mock operation has a thenable builder (like UpdateBuilder/DeleteBuilder), execute it
    if (query && typeof query.then === 'function' && query !== this) {
      return query;
    }
    return query;
  }
}

class DynamicAuth {
  async getUser() {
    const mockUserRes = await mockSupabase.auth.getUser();
    if (mockUserRes?.data?.user?.email?.toLowerCase().trim() === 'simao@neurogrowthlabs.co.za') {
      return mockUserRes;
    }
    if (!shouldUseMock && realSupabase) {
      try {
        const res = await realSupabase.auth.getUser();
        if (res && res.data && res.data.user) {
          return res;
        }
        if (res && res.error) {
          const errMsg = res.error.message || '';
          if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
            return mockUserRes;
          }
        }
        return res;
      } catch {
        return mockUserRes;
      }
    }
    return mockUserRes;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!shouldUseMock && realSupabase) {
      try {
        const subscription = realSupabase.auth.onAuthStateChange(callback);
        // Also fire callback on mock to ensure local state sync
        const mockSubscription = mockSupabase.auth.onAuthStateChange(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                if (subscription?.data?.subscription) subscription.data.subscription.unsubscribe();
                if (mockSubscription?.data?.subscription) mockSubscription.data.subscription.unsubscribe();
              }
            }
          }
        };
      } catch {
        return mockSupabase.auth.onAuthStateChange(callback);
      }
    }
    return mockSupabase.auth.onAuthStateChange(callback);
  }

  async signInWithPassword(credentials: any) {
    const cleanEmail = credentials?.email?.toLowerCase().trim();
    if (cleanEmail === 'simao@neurogrowthlabs.co.za') {
      return mockSupabase.auth.signInWithPassword(credentials);
    }
    if (!shouldUseMock && realSupabase) {
      try {
        const res = await realSupabase.auth.signInWithPassword(credentials);
        if (res && res.error) {
          const errMsg = res.error.message || '';
          if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
            return mockSupabase.auth.signInWithPassword(credentials);
          }
        }
        return res;
      } catch (err) {
        console.warn('Real Supabase login failed, utilizing secure local auth fallback:', err);
        return mockSupabase.auth.signInWithPassword(credentials);
      }
    }
    return mockSupabase.auth.signInWithPassword(credentials);
  }

  async signUp(credentials: any) {
    const cleanEmail = credentials?.email?.toLowerCase().trim();
    if (cleanEmail === 'simao@neurogrowthlabs.co.za') {
      return mockSupabase.auth.signUp(credentials);
    }
    if (!shouldUseMock && realSupabase) {
      try {
        const res = await realSupabase.auth.signUp(credentials);
        if (res && res.error) {
          const errMsg = res.error.message || '';
          if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
            return mockSupabase.auth.signUp(credentials);
          }
        }
        return res;
      } catch (err) {
        console.warn('Real Supabase signup failed, using local auth fallback:', err);
        return mockSupabase.auth.signUp(credentials);
      }
    }
    return mockSupabase.auth.signUp(credentials);
  }

  async signOut() {
    if (!shouldUseMock && realSupabase) {
      try {
        const res = await realSupabase.auth.signOut();
        await mockSupabase.auth.signOut();
        return res;
      } catch {
        return mockSupabase.auth.signOut();
      }
    }
    return mockSupabase.auth.signOut();
  }
}

class DynamicSupabaseClient {
  auth = new DynamicAuth();

  from(tableName: string) {
    const isMockUser = mockSupabase?.auth?.currentUser;
    const realBuilder = !isMockUser && !shouldUseMock && realSupabase ? realSupabase.from(tableName) : null;
    const mockBuilder = mockSupabase.from(tableName);
    return new DynamicQueryBuilder(tableName, realBuilder, mockBuilder);
  }

  channel(name: string) {
    const isMockUser = mockSupabase?.auth?.currentUser;
    if (isMockUser || shouldUseMock || !realSupabase) {
      return mockSupabase.channel(name);
    }
    try {
      return realSupabase.channel(name);
    } catch {
      return mockSupabase.channel(name);
    }
  }

  removeChannel(channel: any) {
    const isMockUser = mockSupabase?.auth?.currentUser;
    if (isMockUser || shouldUseMock || !realSupabase) {
      return mockSupabase.removeChannel(channel);
    }
    try {
      return realSupabase.removeChannel(channel);
    } catch {
      return mockSupabase.removeChannel(channel);
    }
  }
}

export const supabase: any = new DynamicSupabaseClient();

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const registerWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
