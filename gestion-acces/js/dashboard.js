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
                userInfo.innerHTML = `👤 ${user.nomComplet}<br><small>${user.role === 'admin' ? '👑 Admin' : '👮 Agent'}</small>`;
            }
            
            // Masquer menu Utilisateurs pour non-admin
            const menuUsers = document.getElementById('menuUtilisateurs');
            if (menuUsers && user.role !== 'admin') {
                menuUsers.style.display = 'none';
            }
            
            // Redirection si non-admin sur page utilisateurs
            if (window.location.pathname.includes('utilisateurs.html') && user.role !== 'admin') {
                alert('Accès refusé : réservé aux administrateurs');
                window.location.href = 'dashboard.html';
            }
        }, 0);
    }
}

// Horloge
function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) {
        clock.textContent = new Date().toLocaleString('fr-FR');
    }
}
setInterval(updateClock, 1000);
setTimeout(updateClock, 0);

// Login
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