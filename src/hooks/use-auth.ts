import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo, ${session?.user?.user_metadata?.full_name || session?.user?.email}`,
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Logout realizado",
            description: "Você foi desconectado com sucesso",
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Erro ao sair",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};