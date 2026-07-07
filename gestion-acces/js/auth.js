// ========================================
// SYSTÈME D'AUTHENTIFICATION & PERMISSIONS
// ========================================

// Vérifier l'authentification (hors page login)
if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
    } else {
        const user = JSON.parse(currentUser);
        
        // Afficher infos utilisateur
        setTimeout(() => {
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                userInfo.innerHTML = `👤 ${user.nomComplet}<br><small>${user.role === 'admin' ? '👑 Administrateur' : '👮 Agent'}</small>`;
            }
            
            // Masquer menu Utilisateurs pour non-admin
            const menuUsers = document.getElementById('menuUtilisateurs');
            if (menuUsers && user.role !== 'admin') {
                menuUsers.style.display = 'none';
            }
            
            // Redirection si non-admin sur page utilisateurs
            if (window.location.pathname.includes('utilisateurs') && user.role !== 'admin') {
                alert('⛔ Accès refusé : réservé aux administrateurs');
                window.location.href = 'dashboard.html';
            }
            
            // Appliquer les permissions sur la page
            appliquerPermissions();
        }, 0);
    }
}

// ========================================
// FONCTIONS DE PERMISSIONS
// ========================================

/**
 * Vérifie si l'utilisateur courant est administrateur
 */
function isAdmin() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return user.role === 'admin';
}

/**
 * Récupère l'utilisateur courant
 */
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
}

/**
 * Vérifie une permission et affiche un message d'erreur si refusée
 */
function checkPermission(action = 'effectuer cette action') {
    if (!isAdmin()) {
        alert(`⛔ ACCÈS REFUSÉ\n\nSeul un administrateur peut ${action}.\n\nVeuillez contacter votre superviseur.`);
        return false;
    }
    return true;
}

/**
 * Masque les éléments réservés aux administrateurs
 */
function appliquerPermissions() {
    if (!isAdmin()) {
        // Cacher tous les boutons/éléments avec la classe "admin-only"
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        
        // Désactiver les inputs marqués "admin-only-input"
        document.querySelectorAll('.admin-only-input').forEach(el => {
            el.disabled = true;
            el.title = 'Réservé aux administrateurs';
        });
    }
}

// ========================================
// HORLOGE
// ========================================
function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) {
        clock.textContent = new Date().toLocaleString('fr-FR');
    }
}
setInterval(updateClock, 1000);
setTimeout(updateClock, 0);

// ========================================
// LOGIN
// ========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        
        const users = DB.get('users');
        const user = users.find(u => 
            u.username === username && 
            u.password === DB.hash(password) &&
            u.actif
        );
        
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            DB.logHistorique({
                type: 'connexion',
                nom: user.nomComplet,
                details: `Connexion utilisateur ${user.username}`,
                action: 'login'
            });
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = '❌ Identifiants incorrects ou compte désactivé';
            errorMsg.style.display = 'block';
        }
    });
}

// ========================================
// LOGOUT
// ========================================
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (user) {
            DB.logHistorique({
                type: 'connexion',
                nom: user.nomComplet,
                details: `Déconnexion utilisateur ${user.username}`,
                action: 'logout'
            });
        }
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}