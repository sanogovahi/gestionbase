const params = new URLSearchParams(window.location.search);
const now = new Date();

document.getElementById('badgeNum').textContent = '#' + (params.get('badge') || 'V000');
document.getElementById('badgeNom').textContent = params.get('nom') || '-';
document.getElementById('badgeEntreprise').textContent = params.get('entreprise') || '-';
document.getElementById('badgeVisite').textContent = params.get('personneVisitee') || '-';
document.getElementById('badgeMotif').textContent = params.get('motif') || '-';
document.getElementById('badgeDate').textContent = now.toLocaleDateString('fr-FR');
document.getElementById('badgeHeure').textContent = now.toLocaleTimeString('fr-FR');

// Auto-print après 500ms
setTimeout(() => window.print(), 500);