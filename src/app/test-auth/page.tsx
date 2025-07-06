'use client'

import { useState } from 'react'
import { supabase, supabaseError } from '@/lib/supabase'

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('Testing Supabase connection...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase Error:', supabaseError)
      console.log('Supabase Client:', supabase)

      if (supabaseError || !supabase) {
        throw new Error(supabaseError || 'Supabase client not initialized')
      }

      // Test 1: Simple query
      console.log('Test 1: Simple query to nhan_vien table...')
      const { data: users, error: usersError } = await supabase
        .from('nhan_vien')
        .select('username, role')
        .limit(1)

      if (usersError) {
        console.error('Users query error:', usersError)
        setError(`Users query failed: ${usersError.message}`)
        return
      }

      console.log('Users query success:', users)

      // Test 2: RPC function call
      console.log('Test 2: Testing authenticate_user RPC...')
      const { data: authData, error: authError } = await supabase.rpc('authenticate_user', {
        p_username: 'ntchi',
        p_password: 'admin'
      })

      if (authError) {
        console.error('Auth RPC error:', authError)
        setError(`Auth RPC failed: ${authError.message}`)
        return
      }

      console.log('Auth RPC success:', authData)

      setResult({
        usersQuery: users,
        authResult: authData,
        success: true
      })

    } catch (err: any) {
      console.error('Test failed:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testFallbackAuth = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('Testing fallback authentication...')
      
      const { data, error } = await supabase!
        .from('nhan_vien')
        .select('*')
        .eq('username', 'ntchi')
        .single()

      if (error) {
        console.error('Fallback auth error:', error)
        setError(`Fallback auth failed: ${error.message}`)
        return
      }

      console.log('Fallback auth success:', data)
      setResult({
        fallbackAuth: data,
        passwordMatch: data.password === 'admin',
        success: true
      })

    } catch (err: any) {
      console.error('Fallback test failed:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testSupabaseConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Supabase + RPC'}
        </button>

        <button
          onClick={testFallbackAuth}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Fallback Auth'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>Result:</strong>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Environment Check:</h3>
        <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p><strong>Supabase Error:</strong> {supabaseError || 'None'}</p>
        <p><strong>Supabase Client:</strong> {supabase ? 'Initialized' : 'Not initialized'}</p>
      </div>
    </div>
  )
}
