// js/supabaseClient.js
// Importa la función de creación del cliente desde la CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// --- VARIABLES DE CONFIGURACIÓN ---
// URL de tu proyecto Supabase (necesita ser visible y precisa)
const SUPABASE_URL = 'https://osoquwfvzzetacejvgyj.supabase.co';

// Clave ANÓNIMA pública (anon key)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zb3F1d2Z2enpldGFjZWp2Z3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzcyNjcsImV4cCI6MjA3ODk1MzI2N30.TvZTWkHDXkwBnmk_-w4ORI8pkbc85X_3mjY3dMB3T6k';

// --- INICIALIZACIÓN DEL CLIENTE Y EXPORTACIÓN ---

/**
 * Inicializa el cliente Supabase y lo exporta. 
 * Esta estructura asegura que el objeto 'supabase' contenga las credenciales.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función auxiliar para obtener usuario actual (No requiere cambios, pero la incluimos para completar)
export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
