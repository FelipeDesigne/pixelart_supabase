import { createClient } from '@supabase/supabase-js'
import { auth } from './firebase'

const supabaseUrl = 'https://sdvnwfxixdasbeotxmyn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdm53ZnhpeGRhc2Jlb3R4bXluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDIxNzQ5NSwiZXhwIjoyMDQ5NzkzNDk1fQ.QBq0jPZD_QmsPOPNeJD440_tvaaM2zGzNL5OLY8fRTE'

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// Função para obter o token do Firebase
export async function getFirebaseToken() {
  return await auth.currentUser?.getIdToken()
}

// Função para obter headers de autorização
export async function getAuthHeaders() {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal'
  }
}
