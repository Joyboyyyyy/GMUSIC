/**
 * Supabase Adapter
 * 
 * Provides a Prisma-like interface for Supabase JS client.
 * This allows services to use the same API regardless of database backend.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client with service role key (for backend operations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not found. Supabase adapter will not work.');
  console.warn('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Convert Prisma select to Supabase select
 */
function buildSelect(select) {
  if (!select) return '*';
  
  // Convert select object to comma-separated string
  const fields = Object.keys(select).filter(key => select[key] === true);
  return fields.length > 0 ? fields.join(',') : '*';
}

/**
 * Convert Prisma include to Supabase query
 * Note: Supabase doesn't support joins like Prisma, so we'll need to handle this differently
 */
async function handleInclude(data, include, tableName) {
  if (!include || !data) return data;
  
  // For now, we'll return data as-is
  // In a full implementation, you'd fetch related data separately
  return data;
}

/**
 * Supabase Adapter Class
 * Mimics Prisma Client interface
 */
class SupabaseAdapter {
  constructor() {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
  }

  // User model
  get user() {
    return {
      findUnique: async ({ where, select }) => {
        if (!where || (!where.id && !where.email)) {
          return null;
        }
        
        let query = supabase.from('User');
        if (where.id) {
          query = query.eq('id', where.id);
        } else if (where.email) {
          query = query.eq('email', where.email);
        }
        
        const { data, error } = await query.select(buildSelect(select)).single();
        
        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw error;
        }
        
        return data;
      },

      findFirst: async ({ where, select }) => {
        let query = supabase.from('User');
        
        if (where) {
          if (where.id) query = query.eq('id', where.id);
          if (where.email) query = query.eq('email', where.email);
          if (where.verificationToken) query = query.eq('verificationToken', where.verificationToken);
          if (where.resetToken) query = query.eq('resetToken', where.resetToken);
          if (where.emailVerified !== undefined) query = query.eq('emailVerified', where.emailVerified);
        }
        
        const { data, error } = await query.select(buildSelect(select)).limit(1).maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        return data || null;
      },

      findMany: async ({ where, select, orderBy }) => {
        let query = supabase.from('User');
        
        if (where) {
          if (where.id) query = query.eq('id', where.id);
          if (where.email) query = query.eq('email', where.email);
          if (where.isActive !== undefined) query = query.eq('isActive', where.isActive);
        }
        
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0];
          query = query.order(field, { ascending: direction === 'asc' });
        }
        
        const { data, error } = await query.select(buildSelect(select));
        
        if (error) throw error;
        return data || [];
      },

      create: async ({ data, select }) => {
        let query = supabase.from('User');
        query = query.insert(data);
        query = query.select(buildSelect(select));
        const { data: result, error } = await query.single();
        
        if (error) throw error;
        return result;
      },

      update: async ({ where, data, select }) => {
        let query = supabase.from('User');
        query = query.update(data);
        
        if (where.id) {
          query = query.eq('id', where.id);
        } else if (where.email) {
          query = query.eq('email', where.email);
        } else {
          throw new Error('update requires where.id or where.email');
        }
        
        const { data: result, error } = await query.select(buildSelect(select)).single();
        
        if (error) throw error;
        return result;
      },

      updateMany: async ({ where, data }) => {
        let query = supabase.from('User');
        query = query.update(data);
        
        if (where) {
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
        }
        
        const { error } = await query;
        
        if (error) throw error;
        return { count: 1 };
      },

      upsert: async ({ where, create, update, select }) => {
        let existing = null;
        if (where && (where.id || where.email)) {
          let query = supabase.from('User');
          if (where.id) {
            query = query.eq('id', where.id);
          } else if (where.email) {
            query = query.eq('email', where.email);
          }
          const { data, error } = await query.select(buildSelect(select)).single();
          if (!error || error.code === 'PGRST116') {
            existing = data || null;
          } else {
            throw error;
          }
        }
        
        if (existing) {
          let query = supabase.from('User');
          query = query.update(update);
          if (where.id) {
            query = query.eq('id', where.id);
          } else if (where.email) {
            query = query.eq('email', where.email);
          } else {
            throw new Error('update requires where.id or where.email');
          }
          const { data: result, error } = await query.select(buildSelect(select)).single();
          if (error) throw error;
          return result;
        } else {
          let query = supabase.from('User');
          query = query.insert({ ...create, ...where });
          query = query.select(buildSelect(select));
          const { data: result, error } = await query.single();
          if (error) throw error;
          return result;
        }
      },

      delete: async ({ where }) => {
        let query = supabase.from('User');
        
        if (where.id) {
          query = query.eq('id', where.id);
        } else {
          throw new Error('delete requires where.id');
        }
        
        const { error } = await query.delete();
        
        if (error) throw error;
        return { id: where.id };
      },

      deleteMany: async ({ where }) => {
        let query = supabase.from('User');
        
        if (where) {
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
        }
        
        const { error } = await query.delete();
        
        if (error) throw error;
        return { count: 1 };
      }
    };
  }

  // Course model
  get course() {
    return {
      findUnique: async ({ where, select, include }) => {
        if (!where || !where.id) {
          return null;
        }
        
        let query = supabase.from('Course');
        query = query.eq('id', where.id);
        const { data, error } = await query.select(buildSelect(select)).single();
        
        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }
        
        return await handleInclude(data, include, 'Course');
      },

      findFirst: async ({ where, select }) => {
        let query = supabase.from('Course');
        
        if (where) {
          if (where.id) query = query.eq('id', where.id);
          if (where.isActive !== undefined) query = query.eq('isActive', where.isActive);
        }
        
        const { data, error } = await query.select(buildSelect(select)).limit(1).maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        return data || null;
      },

      findMany: async ({ where, select, include, orderBy }) => {
        let query = supabase.from('Course');
        
        if (where) {
          if (where.id) query = query.eq('id', where.id);
          if (where.isActive !== undefined) query = query.eq('isActive', where.isActive);
          if (where.title?.contains) {
            query = query.ilike('title', `%${where.title.contains}%`);
          }
        }
        
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0];
          query = query.order(field, { ascending: direction === 'asc' });
        }
        
        const { data, error } = await query.select(buildSelect(select));
        
        if (error) throw error;
        return data || [];
      },

      create: async ({ data, select }) => {
        let query = supabase.from('Course');
        query = query.insert(data);
        query = query.select(buildSelect(select));
        const { data: result, error } = await query.single();
        
        if (error) throw error;
        return result;
      },

      update: async ({ where, data, select }) => {
        if (!where || !where.id) {
          throw new Error('update requires where.id');
        }
        
        const updateData = { ...data };
        if (data.studentsCount?.increment) {
          let query = supabase.from('Course');
          query = query.eq('id', where.id);
          const { data: current, error: fetchError } = await query.select('studentsCount').single();
          if (!fetchError && current) {
            updateData.studentsCount = (current.studentsCount || 0) + data.studentsCount.increment;
          }
          delete updateData.studentsCount.increment;
        }
        if (data.tracksCount?.increment) {
          let query = supabase.from('Course');
          query = query.eq('id', where.id);
          const { data: current, error: fetchError } = await query.select('tracksCount').single();
          if (!fetchError && current) {
            updateData.tracksCount = (current.tracksCount || 0) + data.tracksCount.increment;
          }
          delete updateData.tracksCount.increment;
        }
        if (data.duration?.increment) {
          let query = supabase.from('Course');
          query = query.eq('id', where.id);
          const { data: current, error: fetchError } = await query.select('duration').single();
          if (!fetchError && current) {
            updateData.duration = (current.duration || 0) + data.duration.increment;
          }
          delete updateData.duration.increment;
        }
        
        let query = supabase.from('Course');
        query = query.update(updateData);
        query = query.eq('id', where.id);
        const { data: result, error } = await query.select(buildSelect(select)).single();
        
        if (error) throw error;
        return result;
      },

      delete: async ({ where }) => {
        if (!where || !where.id) {
          throw new Error('delete requires where.id');
        }
        
        let query = supabase.from('Course');
        query = query.delete();
        query = query.eq('id', where.id);
        const { error } = await query;
        
        if (error) throw error;
        return { id: where.id };
      }
    };
  }

  // Enrollment model
  get enrollment() {
    return {
      findUnique: async ({ where, select, include }) => {
        if (!where || !where.id) {
          return null;
        }
        
        let query = supabase.from('Enrollment');
        query = query.eq('id', where.id);
        const { data, error } = await query.select(buildSelect(select)).single();
        
        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }
        
        return await handleInclude(data, include, 'Enrollment');
      },

      findFirst: async ({ where, select }) => {
        let query = supabase.from('Enrollment');
        
        if (where) {
          if (where.id) query = query.eq('id', where.id);
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
          if (where.status) query = query.eq('status', where.status);
        }
        
        const { data, error } = await query.select(buildSelect(select)).limit(1).maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        return data || null;
      },

      findMany: async ({ where, select, include, orderBy }) => {
        let query = supabase.from('Enrollment');
        
        if (where) {
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
          if (where.status) query = query.eq('status', where.status);
        }
        
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0];
          query = query.order(field, { ascending: direction === 'asc' });
        }
        
        const { data, error } = await query.select(buildSelect(select));
        
        if (error) throw error;
        return data || [];
      },

      create: async ({ data, select }) => {
        let query = supabase.from('Enrollment');
        query = query.insert(data);
        query = query.select(buildSelect(select));
        const { data: result, error } = await query.single();
        
        if (error) throw error;
        return result;
      },

      update: async ({ where, data, select }) => {
        if (!where || !where.id) {
          throw new Error('update requires where.id');
        }
        
        let query = supabase.from('Enrollment');
        query = query.update(data);
        query = query.eq('id', where.id);
        const { data: result, error } = await query.select(buildSelect(select)).single();
        
        if (error) throw error;
        return result;
      },

      updateMany: async ({ where, data }) => {
        let query = supabase.from('Enrollment');
        query = query.update(data);
        
        if (where) {
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
          if (where.status) query = query.eq('status', where.status);
        }
        
        const { error } = await query;
        
        if (error) throw error;
        return { count: 1 };
      },

      delete: async ({ where }) => {
        if (!where || !where.id) {
          throw new Error('delete requires where.id');
        }
        
        let query = supabase.from('Enrollment');
        query = query.delete();
        query = query.eq('id', where.id);
        const { error } = await query;
        
        if (error) throw error;
        return { id: where.id };
      },

      deleteMany: async ({ where }) => {
        let query = supabase.from('Enrollment');
        
        if (where) {
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
        }
        
        const { error } = await query.delete();
        
        if (error) throw error;
        return { count: 1 };
      }
    };
  }

  // Purchase model (if it exists in schema)
  get purchase() {
    return {
      findUnique: async ({ where, select, include }) => {
        if (!where || !where.id) {
          return null;
        }
        
        let query = supabase.from('Purchase');
        query = query.eq('id', where.id);
        const { data, error } = await query.select(buildSelect(select)).single();
        
        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }
        
        return await handleInclude(data, include, 'Purchase');
      },

      findFirst: async ({ where, select }) => {
        let query = supabase.from('Purchase');
        
        if (where) {
          if (where.id) query = query.eq('id', where.id);
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
          if (where.status) query = query.eq('status', where.status);
        }
        
        const { data, error } = await query.select(buildSelect(select)).limit(1).maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        return data || null;
      },

      findMany: async ({ where, select, include, orderBy }) => {
        let query = supabase.from('Purchase');
        
        if (where) {
          if (where.userId) query = query.eq('userId', where.userId);
          if (where.courseId) query = query.eq('courseId', where.courseId);
          if (where.status) query = query.eq('status', where.status);
        }
        
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0];
          query = query.order(field, { ascending: direction === 'asc' });
        }
        
        const { data, error } = await query.select(buildSelect(select));
        
        if (error) throw error;
        return data || [];
      },

      create: async ({ data, select }) => {
        let query = supabase.from('Purchase');
        query = query.insert(data);
        query = query.select(buildSelect(select));
        const { data: result, error } = await query.single();
        
        if (error) throw error;
        return result;
      },

      update: async ({ where, data, select }) => {
        if (!where || !where.id) {
          throw new Error('update requires where.id');
        }
        
        let query = supabase.from('Purchase');
        query = query.update(data);
        query = query.eq('id', where.id);
        const { data: result, error } = await query.select(buildSelect(select)).single();
        
        if (error) throw error;
        return result;
      },

      delete: async ({ where }) => {
        if (!where || !where.id) {
          throw new Error('delete requires where.id');
        }
        
        let query = supabase.from('Purchase');
        query = query.delete();
        query = query.eq('id', where.id);
        const { error } = await query;
        
        if (error) throw error;
        return { id: where.id };
      }
    };
  }

  // Prisma-like connection methods
  async $connect() {
    // Supabase client is always connected via HTTPS
    return Promise.resolve();
  }

  async $disconnect() {
    // No-op for Supabase
    return Promise.resolve();
  }

  async $queryRaw(query) {
    // Supabase doesn't support raw SQL queries via JS client
    // This is a limitation for local dev
    console.warn('⚠️  $queryRaw is not supported in Supabase adapter');
    return [];
  }

  // Track model (if it exists in schema)
  get track() {
    return {
      create: async ({ data, select }) => {
        let query = supabase.from('Track');
        query = query.insert(data);
        query = query.select(buildSelect(select));
        const { data: result, error } = await query.single();
        
        if (error) throw error;
        return result;
      },

      findMany: async ({ where, select, orderBy }) => {
        let query = supabase.from('Track');
        
        if (where) {
          if (where.courseId) query = query.eq('courseId', where.courseId);
        }
        
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0];
          query = query.order(field, { ascending: direction === 'asc' });
        }
        
        const { data, error } = await query.select(buildSelect(select));
        
        if (error) throw error;
        return data || [];
      }
    };
  }

  // Expose fields property for compatibility (used in server.js)
  get _userFields() {
    return {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      avatar: true,
      resetToken: true,
      resetTokenExpiry: true,
      failedLoginAttempts: true,
      isLockedUntil: true,
      lastFailedLogin: true,
      emailVerified: true,
      verificationExpiry: true,
      verificationToken: true,
      isActive: true,
      createdAt: true
    };
  }
}

// Export singleton instance
// Only create adapter if supabase client is properly initialized
if (!supabase) {
  console.error('❌ Supabase client is null. Cannot create adapter.');
  console.error('   Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

export default supabase ? new SupabaseAdapter() : null;


