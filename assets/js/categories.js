// Éléments DOM
const categoryHeader = document.getElementById('categoryHeader');
const quickFilters = document.getElementById('quickFilters');
const recettesList = document.getElementById('recettesList');
const noResults = document.getElementById('noResults');
const pagination = document.getElementById('pagination');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// Variables
let currentCategory = null;
let filteredRecettes = [];
let currentPage = 1;
let activeFilters = {
    difficulte: 'toutes',
    temps: 'toutes'
};
const recettesPerPage = 12;

// FONCTIONS UTILITAIRES
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatTemps(minutes) {
    if (minutes >= 60) {
        const heures = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${heures}h${mins.toString().padStart(2, '0')}` : `${heures}h`;
    }
    return `${minutes} min`;
}

function getDifficultyIcon(difficulte) {
    switch(difficulte.toLowerCase()) {
        case 'très facile': return '🥄 Très facile';
        case 'facile': return '🍳 Facile';
        case 'moyen': return '👨‍🍳 Moyen';
        case 'difficile': return '🧑‍🍳 Difficile';
        default: return difficulte;
    }
}

function getFavoris() {
    const favoris = localStorage.getItem('recettes_favoris');
    return favoris ? JSON.parse(favoris) : [];
}

// AFFICHAGE DE LA CATÉGORIE
function afficherCategoryHeader(categorie) {
    // Compter les recettes et calculer les statistiques
    let recettesCategorie = [];
    if (categorie.id === 'all') {
        recettesCategorie = [...allRecettes];
    } else {
        recettesCategorie = allRecettes.filter(r => r.categorie === categorie.id);
    }
    
    const totalRecettes = recettesCategorie.length;
    const recettesFavorites = recettesCategorie.filter(r => getFavoris().includes(r.id)).length;
    const totalTime = recettesCategorie.reduce((sum, r) => sum + parseInt(r.temps), 0);
    const avgTime = totalRecettes > 0 ? Math.round(totalTime / totalRecettes) : 0;
    
    categoryHeader.innerHTML = `
        <div class="category-banner slide-up">
            <div class="banner-content">
                <div class="category-icon-lg">
                    <i class="${categorie.icon}"></i>
                </div>
                <div class="banner-text">
                    <h1>${categorie.nom}</h1>
                    <p>${categorie.description}</p>
                    <div class="category-stats">
                        <div class="category-stat">
                            <i class="fas fa-utensils"></i>
                            <span>${totalRecettes} recettes</span>
                        </div>
                        <div class="category-stat">
                            <i class="fas fa-heart"></i>
                            <span>${recettesFavorites} favoris</span>
                        </div>
                        <div class="category-stat">
                            <i class="fas fa-clock"></i>
                            <span>${avgTime} min moyenne</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// CRÉER LES FILTRES RAPIDES
function creerFiltresRapides() {
    const difficulteOptions = [
        { value: 'toutes', label: 'Toutes difficultés', icon: 'fa-bars' },
        { value: 'Très facile', label: 'Très facile', icon: 'fa-smile' },
        { value: 'Facile', label: 'Facile', icon: 'fa-thumbs-up' },
        { value: 'Moyen', label: 'Moyen', icon: 'fa-user-check' },
        { value: 'Difficile', label: 'Difficile', icon: 'fa-award' }
    ];
    
    const tempsOptions = [
        { value: 'toutes', label: 'Tous les temps', icon: 'fa-clock' },
        { value: 15, label: '≤ 15 min', icon: 'fa-bolt' },
        { value: 30, label: '≤ 30 min', icon: 'fa-stopwatch' },
        { value: 60, label: '≤ 1 heure', icon: 'fa-hourglass-half' },
        { value: 90, label: '≤ 1h30', icon: 'fa-hourglass' }
    ];
    
    let html = '';
    
    // Filtres de difficulté
    html += `<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">`;
    html += `<span style="font-weight: 600; color: var(--dark); display: flex; align-items: center; gap: 8px;">`;
    html += `<i class="fas fa-chart-line"></i> Difficulté:</span>`;
    difficulteOptions.forEach(option => {
        const isActive = activeFilters.difficulte === option.value;
        html += `
            <button class="filter-btn ${isActive ? 'active' : ''}" 
                    data-filter="difficulte" 
                    data-value="${option.value}"
                    style="padding: 8px 16px; font-size: 13px;">
                <i class="fas ${option.icon}"></i>
                ${option.label}
            </button>
        `;
    });
    html += `</div>`;
    
    // Filtres de temps
    html += `<div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
    html += `<span style="font-weight: 600; color: var(--dark); display: flex; align-items: center; gap: 8px;">`;
    html += `<i class="fas fa-clock"></i> Temps:</span>`;
    tempsOptions.forEach(option => {
        const isActive = activeFilters.temps.toString() === option.value.toString();
        html += `
            <button class="filter-btn ${isActive ? 'active' : ''}" 
                    data-filter="temps" 
                    data-value="${option.value}"
                    style="padding: 8px 16px; font-size: 13px;">
                <i class="fas ${option.icon}"></i>
                ${option.label}
            </button>
        `;
    });
    html += `</div>`;
    
    quickFilters.innerHTML = html;
    
    // Événements des filtres
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            
            // Retirer la classe active de tous les boutons de ce filtre
            document.querySelectorAll(`.filter-btn[data-filter="${filterType}"]`).forEach(b => {
                b.classList.remove('active');
            });
            
            // Activer le bouton cliqué
            this.classList.add('active');
            
            // Mettre à jour les filtres actifs
            activeFilters[filterType] = filterValue;
            
            // Filtrer les recettes
            filtrerRecettes();
            
            // Scroll vers le haut
            window.scrollTo({ top: categoryHeader.offsetTop, behavior: 'smooth' });
        });
    });
}

// CRÉER UNE CARTE DE RECETTE
function creerCarteRecette(recette) {
    const isFavorite = getFavoris().includes(recette.id);
    const categorieNom = getCategoryName(recette.categorie);
    
    return `
        <a href="recette.html?id=${recette.id}" class="recette-card fade-in" data-id="${recette.id}">
            <div class="recette-image">
                <img src="${recette.image}" alt="${recette.titre}" loading="lazy">
                <div class="recette-badge">${categorieNom}</div>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        onclick="event.preventDefault(); event.stopPropagation(); toggleFavori(${recette.id})"
                        aria-label="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <div class="recette-content">
                <h3>${recette.titre}</h3>
                <p class="recette-description">${recette.description}</p>
                <div class="recette-meta">
                    <div class="meta-item">
                        <i class="far fa-clock"></i>
                        <span>${formatTemps(parseInt(recette.temps))}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-chart-line"></i>
                        <span>${getDifficultyIcon(recette.difficulte)}</span>
                    </div>
                </div>
            </div>
        </a>
    `;
}

// AFFICHER LES RECETTES
function afficherRecettes(recettes, page = 1) {
    const startIndex = (page - 1) * recettesPerPage;
    const endIndex = startIndex + recettesPerPage;
    const pageRecettes = recettes.slice(startIndex, endIndex);
    
    if (recettes.length === 0) {
        recettesList.innerHTML = '';
        noResults.style.display = 'block';
        pagination.innerHTML = '';
        return;
    }
    
    noResults.style.display = 'none';
    recettesList.innerHTML = pageRecettes.map(recette => creerCarteRecette(recette)).join('');
    
    afficherPagination(recettes.length, page);
}

// AFFICHER LA PAGINATION
function afficherPagination(totalRecettes, currentPage) {
    const totalPages = Math.ceil(totalRecettes / recettesPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Bouton précédent
    html += `
        <button class="pagination-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Pages
    const maxVisiblePages = window.innerWidth < 768 ? 3 : 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            html += `<span style="padding: 0 12px; color: var(--text-light);">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span style="padding: 0 12px; color: var(--text-light);">...</span>`;
        }
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Bouton suivant
    html += `
        <button class="pagination-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = html;
    
    // Événements de pagination
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            afficherRecettes(filteredRecettes, currentPage);
            window.scrollTo({ top: categoryHeader.offsetTop, behavior: 'smooth' });
        }
    });
    
    document.getElementById('nextPage')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            afficherRecettes(filteredRecettes, currentPage);
            window.scrollTo({ top: categoryHeader.offsetTop, behavior: 'smooth' });
        }
    });
    
    document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page !== currentPage) {
                currentPage = page;
                afficherRecettes(filteredRecettes, currentPage);
                window.scrollTo({ top: categoryHeader.offsetTop, behavior: 'smooth' });
            }
        });
    });
}

// FILTRER LES RECETTES
function filtrerRecettes() {
    const categorieId = new URLSearchParams(window.location.search).get('categorie');
    if (!categorieId) return;
    
    let resultats = [];
    
    // Filtrer par catégorie
    if (categorieId === 'all') {
        resultats = [...allRecettes];
    } else {
        resultats = allRecettes.filter(r => r.categorie === categorieId);
    }
    
    // Appliquer les filtres actifs
    if (activeFilters.difficulte !== 'toutes') {
        resultats = resultats.filter(r => r.difficulte === activeFilters.difficulte);
    }
    
    if (activeFilters.temps !== 'toutes') {
        const tempsMax = parseInt(activeFilters.temps);
        resultats = resultats.filter(r => parseInt(r.temps) <= tempsMax);
    }
    
    // Trier par popularité par défaut
    resultats.sort((a, b) => b.rating - a.rating);
    
    filteredRecettes = resultats;
    currentPage = 1;
    afficherRecettes(resultats, currentPage);
    
    // Mettre à jour le compteur de résultats
    const totalRecettes = resultats.length;
    showToast(`${totalRecettes} recette${totalRecettes > 1 ? 's' : ''} trouvée${totalRecettes > 1 ? 's' : ''}`, 'info');
}

// RÉINITIALISER LES FILTRES
function reinitialiserFiltres() {
    activeFilters = {
        difficulte: 'toutes',
        temps: 'toutes'
    };
    
    // Réinitialiser les boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'difficulte' && btn.dataset.value === 'toutes') {
            btn.classList.add('active');
        }
        if (btn.dataset.filter === 'temps' && btn.dataset.value === 'toutes') {
            btn.classList.add('active');
        }
    });
    
    filtrerRecettes();
    showToast('Filtres réinitialisés', 'info');
}

// GESTION DES FAVORIS (utilise les fonctions de base.js)
function toggleFavori(recetteId) {
    const favoris = getFavoris();
    const index = favoris.indexOf(recetteId);
    
    if (index > -1) {
        favoris.splice(index, 1);
        showToast('Recette retirée des favoris', 'info');
    } else {
        favoris.push(recetteId);
        showToast('Recette ajoutée aux favoris !', 'success');
    }
    
    localStorage.setItem('recettes_favoris', JSON.stringify(favoris));
    
    // Mettre à jour l'icône
    const btn = document.querySelector(`.favorite-btn[onclick*="${recetteId}"]`);
    if (btn) {
        btn.classList.toggle('active');
        btn.innerHTML = `<i class="${favoris.includes(recetteId) ? 'fas' : 'far'} fa-heart"></i>`;
        btn.setAttribute('aria-label', favoris.includes(recetteId) ? 'Retirer des favoris' : 'Ajouter aux favoris');
    }
}

// FONCTION UTILITAIRE POUR NOM DE CATÉGORIE
function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.nom : categoryId;
}

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que les données sont chargées
    if (!allRecettes || !categories) {
        console.error('Les données ne sont pas chargées !');
        setTimeout(() => {
            if (!allRecettes) window.location.href = 'index.html';
        }, 1000);
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const categorieId = urlParams.get('categorie');
    
    if (!categorieId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Trouver la catégorie ou gérer "all"
    if (categorieId === 'all') {
        currentCategory = {
            id: 'all',
            nom: 'Toutes les recettes',
            icon: 'fas fa-utensils',
            description: 'Découvrez toutes nos recettes',
            color: '#D32F2F'
        };
    } else {
        currentCategory = categories.find(cat => cat.id === categorieId);
    }
    
    if (!currentCategory) {
        categoryHeader.innerHTML = `
            <div class="category-banner" style="background: var(--dark);">
                <div class="banner-content">
                    <div class="category-icon-lg">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <div class="banner-text">
                        <h1>Catégorie non trouvée</h1>
                        <p>Cette catégorie n'existe pas ou a été supprimée.</p>
                        <a href="index.html" style="display: inline-flex; align-items: center; gap: 8px; color: var(--white); text-decoration: none; margin-top: 20px; font-weight: 600;">
                            <i class="fas fa-home"></i>
                            Retour à l'accueil
                        </a>
                    </div>
                </div>
            </div>
        `;
        recettesList.innerHTML = '';
        quickFilters.style.display = 'none';
        return;
    }
    
    // Afficher l'en-tête
    afficherCategoryHeader(currentCategory);
    
    // Mettre à jour le titre de la page
    document.title = `${currentCategory.nom} - Recettes Faciles`;
    
    // Créer les filtres rapides
    creerFiltresRapides();
    
    // Initialiser les filtres
    filtrerRecettes();
    
    // Événement réinitialisation
    resetFiltersBtn?.addEventListener('click', reinitialiserFiltres);
    
    // Animation d'entrée
    setTimeout(() => {
        showToast(`Explorez ${currentCategory.nom.toLowerCase()}`, 'info');
    }, 500);
});