import { createClient } from '@supabase/supabase-js'
import { config, validateEnvironment } from '@/config/environment'

// Validate environment variables
const { isValid, missing } = validateEnvironment()
if (!isValid) {
  console.warn('Missing environment variables:', missing.join(', '))
  console.warn('Using fallback values for development')
}

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Connection test function for debugging
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('teams')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}