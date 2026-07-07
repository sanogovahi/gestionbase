// Double vérification : cette page est réservée aux admins
if (!isAdmin()) {
    alert('⛔ Accès refusé');
    window.location.href = 'dashboard.html';
}

function chargerUtilisateurs() {
    const users = DB.get('users');
    const currentUser = getCurrentUser();
    
    document.getElementById('listeUtilisateurs').innerHTML = users.map(u => `
        <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.nomComplet}</td>
            <td><span class="badge-role role-${u.role}">${u.role === 'admin' ? '👑 Admin' : '👮 Agent'}</span></td>
            <td>${u.email || '-'}</td>
            <td>${new Date(u.dateCreation).toLocaleDateString('fr-FR')}</td>
            <td>${u.actif ? '<span class="status-actif">✅ Actif</span>' : '<span class="status-inactif">❌ Inactif</span>'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn-warning btn-icon" onclick="toggleActif(${u.id})" title="Activer/Désactiver">🔄</button>
                    <button class="btn-primary btn-icon" onclick="resetPassword(${u.id})" title="Reset password">🔑</button>
                    ${u.id !== currentUser.id ? `<button class="btn-danger btn-icon" onclick="supprimerUser(${u.id})" title="Supprimer">🗑️</button>` : '<span style="color:#999;font-size:0.85em;">(vous)</span>'}
                </div>
            </td>
        </tr>
    `).join('');
}

document.getElementById('formUtilisateur').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!checkPermission('créer un utilisateur')) return;
    
    const username = document.getElementById('usernameNew').value;
    const users = DB.get('users');
    
    if (users.some(u => u.username === username)) {
        alert('❌ Nom d\'utilisateur déjà pris');
        return;
    }
    
    const newUser = {
        username,
        password: DB.hash(document.getElementById('passwordNew').value),
        nomComplet: document.getElementById('nomComplet').value,
        role: document.getElementById('roleNew').value,
        email: document.getElementById('emailNew').value,
        actif: true,
        dateCreation: new Date().toISOString(),
        creePar: getCurrentUser().nomComplet
    };
    
    DB.add('users', newUser);
    DB.logHistorique({
        type: 'action',
        nom: newUser.nomComplet,
        details: `Création utilisateur: ${newUser.username} (${newUser.role})`,
        action: 'ajout'
    });
    
    e.target.reset();
    chargerUtilisateurs();
    alert('✅ Utilisateur créé !');
});

function toggleActif(id) {
    if (!checkPermission('activer/désactiver un utilisateur')) return;
    
    const users = DB.get('users');
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    // Empêcher de désactiver son propre compte
    if (user.id === getCurrentUser().id) {
        alert('⚠️ Vous ne pouvez pas désactiver votre propre compte');
        return;
    }
    
    DB.update('users', id, { actif: !user.actif });
    DB.logHistorique({
        type: 'action',
        nom: user.nomComplet,
        details: `${user.actif ? 'Désactivation' : 'Activation'} utilisateur: ${user.username}`,
        action: 'modification'
    });
    
    chargerUtilisateurs();
}

function resetPassword(id) {
    if (!checkPermission('réinitialiser un mot de passe')) return;
    
    const users = DB.get('users');
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const newPass = prompt('Nouveau mot de passe (min 6 caractères) :');
    if (!newPass || newPass.length < 6) { alert('❌ Trop court (min 6 caractères)'); return; }
    
    DB.update('users', id, { password: DB.hash(newPass) });
    DB.logHistorique({
        type: 'action',
        nom: user.nomComplet,
        details: `Réinitialisation mot de passe: ${user.username}`,
        action: 'modification'
    });
    
    alert('✅ Mot de passe modifié');
}

function supprimerUser(id) {
    if (!checkPermission('supprimer un utilisateur')) return;
    
    const user = DB.get('users').find(u => u.id === id);
    if (!user) return;
    
    if (user.id === getCurrentUser().id) {
        alert('⚠️ Vous ne pouvez pas supprimer votre propre compte');
        return;
    }
    
    if (!confirm(`⚠️ Supprimer définitivement l'utilisateur ${user.nomComplet} ?`)) return;
    
    DB.delete('users', id);
    DB.logHistorique({
        type: 'action',
        nom: user.nomComplet,
        details: `Suppression utilisateur: ${user.username}`,
        action: 'suppression'
    });
    
    chargerUtilisateurs();
}

chargerUtilisateurs();