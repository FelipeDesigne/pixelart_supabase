import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdvnwfxixdasbeotxmyn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdm53Znhp' +
                   'eGRhc2Jlb3R4bXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI1OTY3NTYsImV4cCI6MjAxODE3Mjc1Nn0.' +
                   'PXlwzn7qWYDDDC7bZQZVvBvLfEJ_BZJQpbZvjXKxGfE'

export const supabase = createClient(supabaseUrl, supabaseKey)
