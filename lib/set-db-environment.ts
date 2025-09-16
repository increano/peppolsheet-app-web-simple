import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Set environment variables in database session for role detection
 */
export async function setDatabaseEnvironment() {
  try {
    // Set environment variables in database session
    await supabase.rpc('set_config', {
      key: 'app.admin_user_email',
      value: process.env.ADMIN_USER_EMAIL || ''
    })
    
    await supabase.rpc('set_config', {
      key: 'app.support_user_emails',
      value: process.env.SUPPORT_USER_EMAILS || ''
    })
    
    await supabase.rpc('set_config', {
      key: 'app.editor_user_emails',
      value: process.env.EDITOR_USER_EMAILS || ''
    })
    
    await supabase.rpc('set_config', {
      key: 'app.technical_user_emails',
      value: process.env.TECHNICAL_USER_EMAILS || ''
    })
    
    console.log('Database environment variables set successfully')
  } catch (error) {
    console.error('Error setting database environment variables:', error)
  }
}

/**
 * Get current database environment settings
 */
export async function getDatabaseEnvironment() {
  try {
    const { data: adminEmail } = await supabase.rpc('current_setting', {
      setting_name: 'app.admin_user_email'
    })
    
    const { data: supportEmails } = await supabase.rpc('current_setting', {
      setting_name: 'app.support_user_emails'
    })
    
    const { data: editorEmails } = await supabase.rpc('current_setting', {
      setting_name: 'app.editor_user_emails'
    })
    
    const { data: technicalEmails } = await supabase.rpc('current_setting', {
      setting_name: 'app.technical_user_emails'
    })
    
    return {
      adminEmail,
      supportEmails,
      editorEmails,
      technicalEmails
    }
  } catch (error) {
    console.error('Error getting database environment variables:', error)
    return null
  }
}
