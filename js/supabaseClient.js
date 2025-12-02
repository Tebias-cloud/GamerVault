// js/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// --- CONFIGURACIÓN CRÍTICA ---
const SUPABASE_URL = 'https://osoquwfvzzetacejvgyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zb3F1d2Z2enpldGFjZWp2Z3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzcyNjcsImV4cCI6MjA3ODk1MzI2N30.TvZTWkHDXkwBnmk_-w4ORI8pkbc85X_3mjY3dMB3T6k';

// --- INICIALIZACIÓN CON CONTEXTO ---

/**
 * Esta estructura asegura que la clave sea tratada como una propiedad 
 * directa del objeto createClient, forzando la inyección en el contexto ESM.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        headers: {
            // Forzamos la inclusión de la clave como un encabezado por si la librería falla
            'apikey': SUPABASE_ANON_KEY
        }
    }
});

// Función auxiliar para obtener usuario actual
export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
