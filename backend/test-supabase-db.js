import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // backend only
)

async function test() {
  const { data, error } = await supabase
    .from('test_connection')
    .select('*')

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Database working:', data)
  }
}

test()
