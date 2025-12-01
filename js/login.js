// js/login.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const URL = 'https://osoquwfvzzetacejvgyj.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zb3F1d2Z2enpldGFjZWp2Z3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzcyNjcsImV4cCI6MjA3ODk1MzI2N30.TvZTWkHDXkwBnmk_-w4ORI8pkbc85X_3mjY3dMB3T6k';
const supabase = createClient(URL, KEY);

console.log("🔐 Login Script Cargado");

// ELEMENTOS DOM DEL LOGIN
const authForm = document.getElementById('auth-form');
const googleBtn = document.getElementById('google-login-btn');
const msgLabel = document.getElementById('auth-message');

// 1. LOGIN CON GOOGLE
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        if(msgLabel) msgLabel.textContent = "🔄 Redirigiendo a Google...";
        
        const redirectUrl = window.location.origin + '/index.html';
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
        });

        if (error) {
            console.error("Error Google:", error);
            if(msgLabel) msgLabel.textContent = "Error: " + error.message;
        }
    });
}

// 2. LOGIN CON EMAIL / PASSWORD
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.querySelector('input[type="email"]').value;
        const password = document.querySelector('input[type="password"]').value;

        if(msgLabel) msgLabel.textContent = "🔄 Procesando...";

        // Intentar Login
        let { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            // Si falla login, intentar Registro
            if(msgLabel) msgLabel.textContent = "Usuario no encontrado, creando cuenta...";
            const { error: signUpError } = await supabase.auth.signUp({ email, password });
            
            if (signUpError) {
                if(msgLabel) msgLabel.textContent = "❌ Error: " + signUpError.message;
            } else {
                if(msgLabel) msgLabel.textContent = "✅ Cuenta creada. Entrando...";
                setTimeout(() => window.location.href = 'index.html', 1500);
            }
        } else {
            // Login Exitoso
            window.location.href = 'index.html';
        }
    });
}