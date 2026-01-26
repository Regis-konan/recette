// FONCTIONS UTILITAIRES AMÉLIORÉES
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    const color = type === 'success' ? 'var(--primary-red)' : 'var(--accent)';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toast.style.borderLeftColor = color;
    document.body.appendChild(toast);
    
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

function getCategoryIcon(category) {
    switch(category) {
        case 'dessert': return 'fa-birthday-cake';
        case 'plat': return 'fa-utensils';
        case 'snack': return 'fa-hamburger';
        case 'petit-dejeuner': return 'fa-egg';
        case 'africain': return 'fa-globe-africa';
        case 'rapide': return 'fa-bolt';
        case 'vegetarien': return 'fa-leaf';
        case 'boisson': return 'fa-glass-whiskey';
        default: return 'fa-utensils';
    }
}

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.nom : categoryId;
}

function updateHeroStats() {
    const totalRecipesEl = document.getElementById('totalRecipes');
    const avgRatingEl = document.getElementById('avgRating');

    if (totalRecipesEl) {
        totalRecipesEl.textContent = allRecettes.length;
    }

    if (avgRatingEl) {
        const avgRating =
            allRecettes.reduce((sum, recette) => sum + (recette.rating || 0), 0) /
            allRecettes.length;

        avgRatingEl.textContent = avgRating.toFixed(1);
    }
}


function renderCategories() {
    const mobileContainer = document.getElementById('categoriesContainer');
    const desktopContainer = document.getElementById('categoriesDesktop');
    
    const categoriesHTML = categories.map(categorie => `
        <a href="categories.html?categorie=${categorie.id}" class="${desktopContainer ? 'category-horizontal-item' : 'category-item'}">
            <div class="category-icon">
                <i class="fas ${categorie.icon}"></i>
            </div>
            <div class="category-info">
                <h4>${categorie.nom}</h4>
                <span class="category-count">${categorie.count} recettes</span>
            </div>
        </a>
    `).join('');
    
    if (mobileContainer) {
        mobileContainer.innerHTML = categoriesHTML;
    }
    
    if (desktopContainer) {
        desktopContainer.innerHTML = categoriesHTML;
    }
}

function createRecetteCard(recette) {
    const isFavorite = getFavoris().includes(recette.id);
    
    return `
        <a href="recette.html?id=${recette.id}" class="recette-card" data-id="${recette.id}">
            <div class="recette-image">
                <img src="${recette.image}" alt="${recette.titre}" loading="lazy">
                <div class="recette-badge">${getCategoryName(recette.categorie)}</div>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        onclick="event.preventDefault(); event.stopPropagation(); toggleFavori(${recette.id})"
                        aria-label="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <div class="recette-overlay">
                    <span class="recette-difficulty">${recette.difficulte}</span>
                </div>
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
                        <i class="fas fa-user-friends"></i>
                        <span>${recette.portions} pers</span>
                    </div>
                </div>
            </div>
        </a>
    `;
}

function renderRecettes(containerId, recettesList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (recettesList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-light);">
                <i class="fas fa-utensils" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <p>Aucune recette trouvée</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recettesList.map(recette => createRecetteCard(recette)).join('');
}

function getRecettesPopulaires() {
    return allRecettes
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);
}

function getRecettesAfricaines() {
    return allRecettes
        .filter(r => r.categorie === 'africain')
        .slice(0, 8);
}

function getRecettesRapides() {
    return allRecettes
        .filter(r => parseInt(r.temps) <= 30)
        .slice(0, 8);
}

// FONCTIONS DE RECHERCHE
function rechercherRecettes(term) {
    if (!term || term.trim().length < 2) {
        return [];
    }
    
    const searchTerm = term.toLowerCase().trim();
    return allRecettes.filter(recette => {
        // Recherche dans le titre
        if (recette.titre.toLowerCase().includes(searchTerm)) return true;
        
        // Recherche dans la description
        if (recette.description.toLowerCase().includes(searchTerm)) return true;
        
        // Recherche dans la catégorie
        const categoryName = getCategoryName(recette.categorie).toLowerCase();
        if (categoryName.includes(searchTerm)) return true;
        
        // Recherche dans les ingrédients
        if (recette.ingredients && recette.ingredients.some(ingredient => 
            ingredient.toLowerCase().includes(searchTerm))) return true;
        
        // Recherche par temps
        if (searchTerm.includes("rapide") && parseInt(recette.temps) <= 30) return true;
        
        return false;
    });
}

function afficherResultatsRecherche(recettesList, searchTerm) {
    const container = document.getElementById('searchResultsContent');
    if (!container) return;
    
    if (recettesList.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-search-minus"></i>
                <span>Aucun résultat trouvé pour "${searchTerm}"</span>
                <p style="font-size: 14px; margin-top: 10px; color: var(--text-light);">
                    Essayez avec d'autres mots-clés ou parcourez nos catégories.
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="search-results-container">
            <div class="search-results-count">
                <strong>${recettesList.length}</strong> résultat${recettesList.length > 1 ? 's' : ''} pour "${searchTerm}"
            </div>
            <div class="search-results-grid">
                ${recettesList.map(recette => createRecetteCard(recette)).join('')}
            </div>
        </div>
    `;
}

// GESTION DES FAVORIS
function getFavoris() {
    const favoris = localStorage.getItem('recettes_favoris');
    return favoris ? JSON.parse(favoris) : [];
}

function sauvegarderFavoris(favoris) {
    localStorage.setItem('recettes_favoris', JSON.stringify(favoris));
}

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
    
    sauvegarderFavoris(favoris);
    updateFavoriteBadge();
    mettreAJourAffichageFavoris();
    
    // Mettre à jour les boutons favoris sur la page
    const btn = document.querySelector(`.favorite-btn[onclick*="${recetteId}"]`);
    if (btn) {
        btn.classList.toggle('active');
        btn.innerHTML = `<i class="${favoris.includes(recetteId) ? 'fas' : 'far'} fa-heart"></i>`;
        btn.setAttribute('aria-label', favoris.includes(recetteId) ? 'Retirer des favoris' : 'Ajouter aux favoris');
    }
}

function updateFavoriteBadge() {
    const favoritesBtn = document.getElementById('favoritesBtn');
    const favoritesCount = document.getElementById('favoritesCount');
    
    if (favoritesBtn && favoritesCount) {
        const favorites = getFavoris();
        favoritesCount.textContent = favorites.length;
        
        if (favorites.length === 0) {
            favoritesCount.style.display = 'none';
        } else {
            favoritesCount.style.display = 'flex';
        }
    }
}

function mettreAJourAffichageFavoris() {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;
    
    const favoris = getFavoris();
    
    if (favoris.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-heart"></i>
                <span>Vos recettes favorites apparaîtront ici</span>
                <p style="font-size: 14px; color: var(--text-light);">
                    Commencez par ajouter des recettes à vos favoris en cliquant sur le cœur
                </p>
            </div>
        `;
        return;
    }
    
    const recettesFavorites = favoris.map(id => allRecettes.find(r => r.id === id)).filter(r => r);
    
    favoritesList.innerHTML = `
        <div style="display: grid; gap: 15px;">
            ${recettesFavorites.map(recette => `
                <a href="recette.html?id=${recette.id}" class="recette-card" style="text-decoration: none; margin-bottom: 0;">
                    <div class="recette-image">
                        <img src="${recette.image}" alt="${recette.titre}" style="height: 120px;">
                        <div class="recette-badge">${getCategoryName(recette.categorie)}</div>
                        <button class="favorite-btn active" 
                                onclick="event.preventDefault(); event.stopPropagation(); toggleFavori(${recette.id})"
                                style="width: 32px; height: 32px; font-size: 14px;">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                    <div class="recette-content" style="padding: 15px;">
                        <h4 style="font-size: 16px; margin-bottom: 8px;">${recette.titre}</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px; color: var(--text-light);">
                                <i class="far fa-clock"></i> ${formatTemps(parseInt(recette.temps))}
                            </span>
                        </div>
                    </div>
                </a>
            `).join('')}
        </div>
    `;
}

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    console.log('🍳 Recettes Faciles - Initialisation avec vraies données...');

    updateHeroStats();
    renderCategories();
    renderRecettes('popularRecettes', getRecettesPopulaires());
    renderRecettes('africanRecettes', getRecettesAfricaines());
    renderRecettes('quickRecettes', getRecettesRapides());
    updateFavoriteBadge();
    mettreAJourAffichageFavoris();

    // ===== RECHERCHE =====
    const searchBtn = document.getElementById('searchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const closeSearch = document.getElementById('closeSearch');
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestionsContainer');

    if (suggestionsContainer && searchInput) {
        const suggestions = [
            "chocolat","poulet","salade","pâtes","riz",
            "œufs","fromage","fruit","légume","viande",
            "rapide","facile","végétarien","dessert","africain"
        ];

        suggestionsContainer.innerHTML = suggestions.map(tag => `
            <div class="suggestion-tag"
                 onclick="document.getElementById('searchInput').value='${tag}'; lancerRecherche('${tag}')">
                <i class="fas fa-search"></i> ${tag}
            </div>
        `).join('');
    }

    if (searchBtn && searchOverlay && searchInput) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            searchOverlay.classList.add('active');
            searchInput.focus();
        });
    }

    if (closeSearch && searchOverlay && searchInput) {
        closeSearch.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
            searchInput.value = '';
        });
    }

    if (searchOverlay) {
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                searchOverlay.classList.remove('active');
            }
        });
    }

    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const term = e.target.value.trim();
            if (term.length >= 2) {
                searchTimeout = setTimeout(() => lancerRecherche(term), 500);
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const term = searchInput.value.trim();
                if (term.length >= 2) lancerRecherche(term);
            }
        });
    }

    // ===== FAVORIS =====
    const favoritesBtn = document.getElementById('favoritesBtn');
    const favoritesModal = document.getElementById('favoritesModal');
    const closeFavorites = document.getElementById('closeFavorites');

    if (favoritesBtn && favoritesModal) {
        favoritesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mettreAJourAffichageFavoris();
            favoritesModal.classList.add('active');
        });
    }

    if (closeFavorites && favoritesModal) {
        closeFavorites.addEventListener('click', () => {
            favoritesModal.classList.remove('active');
        });
    }

    if (favoritesModal) {
        favoritesModal.addEventListener('click', (e) => {
            if (e.target === favoritesModal) {
                favoritesModal.classList.remove('active');
            }
        });
    }

    // ===== MODAL RÉSULTATS =====
    const searchResultsModal = document.getElementById('searchResultsModal');
    const closeSearchResults = document.getElementById('closeSearchResults');

    if (closeSearchResults && searchResultsModal) {
        closeSearchResults.addEventListener('click', () => {
            searchResultsModal.classList.remove('active');
        });
    }

    if (searchResultsModal) {
        searchResultsModal.addEventListener('click', (e) => {
            if (e.target === searchResultsModal) {
                searchResultsModal.classList.remove('active');
            }
        });
    }

    // ===== DROPDOWN MOBILE =====
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownIcon = document.getElementById('dropdownIcon');
    const categoriesList = document.getElementById('categoriesList');

    if (dropdownToggle && categoriesList && dropdownIcon) {
        dropdownToggle.addEventListener('click', () => {
            categoriesList.classList.toggle('active');
            dropdownIcon.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !categoriesList.contains(e.target)) {
                categoriesList.classList.remove('active');
                dropdownIcon.classList.remove('active');
            }
        });
    }

    setTimeout(() => {
        showToast('👨‍🍳 Bienvenue ! Prêt à cuisiner quelque chose de délicieux ?');
    }, 1500);
});


// Fonction pour lancer la recherche
function lancerRecherche(term) {
    const results = rechercherRecettes(term);
    afficherResultatsRecherche(results, term);
    
    // Fermer l'overlay et ouvrir le modal
    document.getElementById('searchOverlay').classList.remove('active');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResultsModal').classList.add('active');
}