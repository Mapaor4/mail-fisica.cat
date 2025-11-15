'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';

const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'example.com';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ alias: string; email: string; forward_to: string | null } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [forwardTo, setForwardTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      
      const response = await fetch('/api/forwarding');
      const data = await response.json();

      if (data.success) {
        setProfile({
          alias: data.alias,
          email: data.email,
          forward_to: data.forward_to,
        });
        setForwardTo(data.forward_to || '');
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile' });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forward_to: forwardTo || null }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: data.warning || data.message || 'Adreça de redirecció actualitzada amb èxit' 
        });
        setProfile(prev => prev ? { ...prev, forward_to: forwardTo || null } : null);
      } else {
        setMessage({ type: 'error', text: data.error || "Hi ha hagut un error actualitzant l'adreça redirecció" });
      }
    } catch (error) {
      console.error('Failed to update forwarding:', error);
      setMessage({ type: 'error', text: "Hi ha hagut un error actualitzant l'adreça redirecció" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: "ID de l'usuari no trobat" });
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        // Sign out and redirect
        await supabase.auth.signOut();
        router.push('/sign-in');
      } else {
        setMessage({ type: 'error', text: data.error || 'Hi ha hagut un error eliminant el compte' });
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setMessage({ type: 'error', text: 'Hi ha hagut un error eliminant el compte' });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Configuració" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Carregant configuració...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Configuració" />
      
      <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          {/* Profile Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">El teu compte</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Alias</label>
            <p className="text-lg text-gray-900 dark:text-white">{profile?.alias}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Correu electrònic</label>
            <p className="text-lg font-mono text-gray-900 dark:text-white">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Forwarding Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Adreça de redirecció</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Tots els correus que rebis s&apos;enviaran també a la següent adreça electrònica. Deixa-ho en blanc per desactivar la redirecció de correus electrònics.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="forward_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Redirigir a
            </label>
            <input
              type="email"
              id="forward_to"
              value={forwardTo}
              onChange={(e) => setForwardTo(e.target.value)}
              placeholder="mailpersonal@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardant els canvis...' : 'Guardar'}
            </button>
            {forwardTo && (
              <button
                type="button"
                onClick={() => setForwardTo('')}
                disabled={saving}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Desactivar
              </button>
            )}
          </div>
        </form>

        {profile?.forward_to && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              <strong>Redirecció activa:</strong> Els correus enviats a <span className="font-mono">{profile.email}</span> seran redirigits a{' '}
              <span className="font-mono">{profile.forward_to}</span>
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Com funciona</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>Els correus enviats al teu usuari de {APEX_DOMAIN} es guardaran a la teva Safata d&apos;entrada (com sempre)</li>
          <li>Si la redirecció està activa, a més, els correus s&apos;enviaran també a la teva adreça de redirecció.</li>
          <li>Pots desactivar la redirecció sempre que vulguis deixant l&apos;adreça de redirecció en blanc.</li>
          <li>La redirecció funciona via ForwardEmail, és a dir per configuració de DNS, així que els canvis poden tardar uns minuts a fer-se efectius.</li>
        </ul>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-1 border-red-600 dark:border-red-800">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-500 mb-4">Eliminar compte</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Aquesta acció elimina permanentment el teu compte i totes les seves dades. <br></br><br></br>Nota: Aquesta acció és irreversible però tot i així podràs crear nous comptes i si cal utilitzar el mateix alias de nou.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="px-6 py-2 bg-red-600 dark:bg-red-800 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar el meu compte
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400 font-semibold mb-2">
                ⚠️ Estàs totalment segur/a?
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                S&apos;eliminaran tots els correus electrònics que hagis enviat o rebut alguna vegada a <span className="font-mono">{profile?.email}</span>.
                 Aquesta acció és irreversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 dark:bg-red-800 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {deleting ? 'Eliminant...' : 'Sí, Elimina el meu compte'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel·lar
              </button>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
