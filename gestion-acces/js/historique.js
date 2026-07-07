let historiqueFiltre = [];

function chargerHistorique() {
    historiqueFiltre = DB.get('historique').filter(h => 
        h.type === 'personnel' || h.type === 'visiteur' || h.type === 'action'
    );
    afficher();
}

function afficher() {
    const tbody = document.getElementById('corpsHistorique');
    const admin = isAdmin();
    document.getElementById('nbResultats').textContent = historiqueFiltre.length;
    
    // Ajouter/Retirer la colonne actions selon le rôle
    const thead = document.querySelector('#tableHistorique thead tr');
    if (thead && !thead.querySelector('.col-actions')) {
        const th = document.createElement('th');
        th.className = 'col-actions admin-only';
        th.textContent = 'Actions';
        thead.appendChild(th);
        if (!admin) th.style.display = 'none';
    }
    
    if (historiqueFiltre.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${admin ? 7 : 6}" style="text-align:center;color:#999;">Aucun résultat</td></tr>`;
        return;
    }
    
    tbody.innerHTML = [...historiqueFiltre].reverse().map(h => `
        <tr>
            <td>${new Date(h.date).toLocaleString('fr-FR')}</td>
            <td>${getTypeIcon(h.type)} ${h.type}</td>
            <td>${h.nom}</td>
            <td>${h.details}</td>
            <td>${getActionBadge(h.action)}</td>
            <td>${h.agent || '-'}</td>
            ${admin ? `<td><button class="btn-danger btn-icon" onclick="supprimerEntreeHist(${h.id})" title="Supprimer">🗑️</button></td>` : ''}
        </tr>
    `).join('');
}

function getTypeIcon(type) {
    const icons = { personnel: '👥', visiteur: '🚶', action: '⚙️', connexion: '🔑' };
    return icons[type] || '📌';
}

function getActionBadge(action) {
    const badges = {
        entree: '<span class="badge-entree">✅ Entrée</span>',
        sortie: '<span class="badge-sortie">🚪 Sortie</span>',
        ajout: '<span class="badge-entree">➕ Ajout</span>',
        modification: '<span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:12px;font-size:0.85em;font-weight:600;">✏️ Modif</span>',
        suppression: '<span class="badge-sortie">🗑️ Suppr</span>',
        login: '<span style="background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:12px;font-size:0.85em;">🔑 Login</span>',
        logout: '<span style="background:#f3f4f6;color:#374151;padding:4px 10px;border-radius:12px;font-size:0.85em;">🚪 Logout</span>'
    };
    return badges[action] || action;
}

function filtrerHistorique() {
    const type = document.getElementById('filtreType').value;
    const action = document.getElementById('filtreAction').value;
    const dateDebut = document.getElementById('dateDebut').value;
    const dateFin = document.getElementById('dateFin').value;
    const recherche = document.getElementById('rechercheHist').value.toLowerCase();
    
    historiqueFiltre = DB.get('historique').filter(h => {
        if (type !== 'tous' && h.type !== type) return false;
        if (action !== 'tous' && h.action !== action) return false;
        if (dateDebut && h.date < dateDebut) return false;
        if (dateFin && h.date > dateFin + 'T23:59:59') return false;
        if (recherche && !(h.nom.toLowerCase().includes(recherche) || h.details.toLowerCase().includes(recherche))) return false;
        return true;
    });
    
    afficher();
}

function resetFiltres() {
    document.getElementById('filtreType').value = 'tous';
    document.getElementById('filtreAction').value = 'tous';
    document.getElementById('dateDebut').value = '';
    document.getElementById('dateFin').value = '';
    document.getElementById('rechercheHist').value = '';
    chargerHistorique();
}

// Export CSV (autorisé pour tous)
function exporterCSV() {
    let csv = 'Date,Type,Nom,Details,Action,Agent\n';
    historiqueFiltre.forEach(h => {
        csv += `"${new Date(h.date).toLocaleString('fr-FR')}","${h.type}","${h.nom}","${h.details}","${h.action}","${h.agent || ''}"\n`;
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function imprimerHistorique() {
    window.print();
}

// 🔒 SUPPRESSION - ADMIN UNIQUEMENT
function supprimerEntreeHist(id) {
    if (!checkPermission('supprimer une entrée de l\'historique')) return;
    
    if (!confirm('⚠️ Supprimer cette entrée de l\'historique ?\n\nCette action est irréversible.')) return;
    
    DB.delete('historique', id);
    chargerHistorique();
    alert('✅ Entrée supprimée');
}

// 🔒 VIDER TOUT - ADMIN UNIQUEMENT
function viderHistorique() {
    if (!checkPermission('vider l\'historique')) return;
    
    if (!confirm('⚠️ ATTENTION !\n\nVoulez-vous vraiment SUPPRIMER TOUT L\'HISTORIQUE ?\n\nCette action est IRRÉVERSIBLE.')) return;
    if (!confirm('Êtes-vous absolument sûr ? Confirmez à nouveau.')) return;
    
    DB.set('historique', []);
    chargerHistorique();
    alert('✅ Historique vidé');
}

chargerHistorique();