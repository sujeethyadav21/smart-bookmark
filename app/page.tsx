'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [bookmarks, setBookmarks] = useState<any[]>([]) // Step 6 state
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) fetchBookmarks() // Fetch if already logged in
    }
    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchBookmarks()
    })

    return () => subscription.unsubscribe()
  }, [])

useEffect(() => {
  // 7.1 Create a channel to listen for changes
  const channel = supabase
    .channel('bookmarks')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookmarks' },
      () => fetchBookmarks() // This runs every time a bookmark is added/deleted
    )
    .subscribe()

  // Cleanup the connection when the user leaves the page
  return () => {
    supabase.removeChannel(channel)
  }
}, [])

// Step 8: Function to delete a bookmark
const handleDeleteBookmark = async (bookmarkId: string) => {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)

  if (error) {
    alert('Error deleting: ' + error.message)
  } else {
    // No need to manually refresh; Step 7.1's real-time listener will update the list!
    alert('Bookmark deleted!')
  }
}

  // Step 6: Fetch user's bookmarks (PRIVATE)
  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching:', error.message)
    else setBookmarks(data || [])
  }

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('bookmarks')
      .insert({ title, url, user_id: session.user.id })

    if (error) alert(error.message)
    else {
      setTitle(''); setUrl('')
      fetchBookmarks() // Refresh list after adding
    }
  }

  if (!session) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Smart Bookmark App</h1>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}>
          Login with Google
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header & Logout */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Smart Bookmarks</h1>
          <button 
  onClick={() => supabase.auth.signOut()}
  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 hover:text-red-600 hover:border-red-100 transition-all duration-200"
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-4 w-4" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
  Logout
</button>
        </div>

        {/* Add Bookmark Form */}
        <form onSubmit={handleAddBookmark} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/60 mb-10 border border-slate-100">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    {/* Title Input */}
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 ml-1">Website Title</label>
      <input 
        type="text"
        placeholder="e.g. Google Search" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
        required 
      />
    </div>

    {/* URL Input */}
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 ml-1">Website URL</label>
      <input 
        type="url" 
        placeholder="https://google.com" 
        value={url} 
        onChange={(e) => setUrl(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-blue-600 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
        required 
      />
    </div>
  </div>

  {/* High-Visibility Add Button */}
  <button 
    type="submit"
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
    Add to Bookmarks
  </button>
</form>

        {/* Bookmarks List */}
        <div className="space-y-4">
          {bookmarks.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center group transition-all hover:border-blue-200">
              <div>
                <h3 className="font-bold text-gray-900">{b.title}</h3>
                <a href={b.url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline break-all">
                  {b.url}
                </a>
              </div>
              <button 
                onClick={() => handleDeleteBookmark(b.id)}
                className="text-gray-400 hover:text-red-500 p-2 text-2xl"
              >
                ×
              </button>
            </div>
          ))}

          {/* Empty State */}
          {bookmarks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-100">
              <div className="text-4xl mb-4">🔖</div>
              <p className="text-gray-500 font-medium">Your bookmark list is empty.</p>
              <p className="text-gray-400 text-sm">Add your favorite websites to get started! 🚀</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}