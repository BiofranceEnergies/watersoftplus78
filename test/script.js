document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION & DONNÉES ---
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyHYz40LwNcC0lYeymn_93CLK-LBfObF6reZPSjWLH4QDlzUb4dnkfpIkg1lWCTtTwL/exec";
    
    // ID GOOGLE ADS (Ton compte)
    const ADS_ID = 'AW-11242044118'; 
    
    // LABELS DE CONVERSION (Les clés spécifiques)
    const LABEL_LEAD_FINAL = 'DO1tCKLg97sbENb1z_Ap';        // Conversion Principale (Formulaire)
    const LABEL_SIMULATION = 'M1S7CInK-NAbENb1z_Ap';        // Conversion Secondaire (Calcul Prix)

    // Données de calcul
    const TVA_RATE = 0.10; 
    // PRIX AJUSTÉS POUR L'OFFRE STANDARD (Commencent par 1...)
    const BASE_PRICES_HT = {
        "10L": 1636,36, // Donnera env. 1595€ TTC
        "15L": 1809,09 // Donnera env. 1694€ TTC (Le Cœur de cible)
        "20L": 1909,09  // Donnera env. 1870€ TTC
    };

    // Variables globales
    let selectedPeople = 4; // Valeur par défaut (3 à 4 pers)
    let selectedModelName = "NOVAQUA 15L";
    let finalPriceTTC = 0;
    let estimatedSavings = 0;

    // --- LOGIQUE DE DÉTECTION DE LA SOURCE (Adou 27, 28, etc) ---
    const sourceInput = document.getElementById('source_lp');
    const currentSource = sourceInput ? sourceInput.value : "Watersoft LP";

    // --- 2. GESTION DES MODALES ---
    window.openModal = function(modalId) {
        const m = document.getElementById(modalId);
        if(m) m.classList.add('show');
    };
    window.closeModal = function(modalId) {
        const m = document.getElementById(modalId);
        if(m) m.classList.remove('show');
    };
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) event.target.classList.remove('show');
    };

    // --- 3. GESTION DU SIMULATEUR (CHOIX PERSONNES) ---
    const peopleBtns = document.querySelectorAll('.option-btn');
    peopleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            peopleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const val = this.getAttribute('data-value');
            selectedPeople = parseInt(val);
        });
    });

    // --- 4. CŒUR DU CALCULATEUR (LE CLICK "CALCULER") ---
    const btnCalculate = document.querySelector('#btn-calculate');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    
    if(btnCalculate) {
        btnCalculate.addEventListener('click', function() {
            
            // A. Calcul du Modèle adapté et du prix HT
            let priceHT = 0;
            if (selectedPeople <= 2) {
                selectedModelName = "NOVAQUA 10L"; priceHT = BASE_PRICES_HT["10L"];
            } else if (selectedPeople >= 5) {
                selectedModelName = "NOVAQUA 20L"; priceHT = BASE_PRICES_HT["20L"];
            } else {
                selectedModelName = "NOVAQUA 15L"; priceHT = BASE_PRICES_HT["15L"];
            }

            // B. Calculs Financiers
            finalPriceTTC = Math.round(priceHT * (1 + TVA_RATE));
            // 1. On convertit le prix en texte
            let priceString = finalPriceTTC.toString();
            
            // 2. On sépare le premier chiffre du reste
            let firstDigit = priceString.charAt(0);
            let restDigits = priceString.substring(1);

            // 3. On injecte dans le HTML (Teasing)
            const teaserFirstEl = document.getElementById('teaser-first');
            const teaserRestEl = document.getElementById('teaser-rest');

            if(teaserFirstEl && teaserRestEl) {
                teaserFirstEl.textContent = firstDigit;
                teaserRestEl.textContent = restDigits;
            }
            const ecoEnergie = Math.round(selectedPeople * 800 * 0.27 * 0.1); 
            const ecoProduits = Math.round(selectedPeople * 220 * 0.40);        
            const ecoMateriel = 80; 
            estimatedSavings = ecoEnergie + ecoProduits + ecoMateriel;

            // --- SIGNAL GOOGLE ADS : SIMULATION (SECONDAIRE) ---
            if(typeof gtag === 'function') {
                gtag('event', 'conversion', {
                    'send_to': ADS_ID + '/' + LABEL_SIMULATION,  // Envoi vers "Clic Simulateur"
                    'value': 1.0,
                    'currency': 'EUR'
                });
                console.log("Signal Ads envoyé : Clic Simulateur (Secondaire)");
            }

            // --- ENVOI SILENCIEUX AU TABLEUR (Google Sheets) ---
            const simData = new FormData();
            simData.append("phase", "Simulation (Sans N°)"); 
            simData.append("source", currentSource);
            simData.append("phone", "Non renseigné"); 
            simData.append("foyer", selectedPeople + " personnes");
            simData.append("model_recommande", selectedModelName);
            simData.append("prix_ttc_estime", finalPriceTTC + " €");
            simData.append("economie_annuelle", estimatedSavings + " €/an");
            
            fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: simData, mode: "no-cors" })
            .then(() => console.log("Données simulation envoyées au Sheet"))
            .catch(e => console.error("Erreur envoi sheet", e));

            // C. Injection des données dans le HTML
            
            // 1. Modèle dans le bloc "Sylvain" (Step 2)
            const displayEl = document.getElementById('model-name-display');
            if(displayEl) displayEl.textContent = selectedModelName;

            // 2. Modèle dans le Titre Vert (Step 3 - Résultat final)
            // === C'EST ICI LA NOUVEAUTÉ ===
            const finalTitleEl = document.getElementById('final-model-title');
            if(finalTitleEl) finalTitleEl.textContent = "ADOUCISSEUR " + selectedModelName;

            // 3. Économies Totales
            const dispTotal = document.getElementById('disp-total');
            if(dispTotal) {
                dispTotal.textContent = estimatedSavings + " € / an"; 
            }

            // D. Affichage de l'étape suivante
            if(step1) step1.style.display = 'none';
            if(step2) step2.style.display = 'block';
            
            step2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // --- 5. GESTION DU CTA BAS DE PAGE ---
    const btnBottom = document.getElementById('btn-bottom-cta');
    if(btnBottom) {
        btnBottom.addEventListener('click', function(e) {
            e.preventDefault(); 
            // Signal simple d'engagement
            if(typeof gtag === 'function') {
                gtag('event', 'bottom_cta_click', {
                    'event_category': 'Engagement',
                    'event_label': 'Click CTA Bas de page'
                });
            }
            window.scrollTo({top:0, behavior:'smooth'});
        });
    }

    // --- 6. ENVOI DU FORMULAIRE ET REVEAL (LOGIQUE 3 TEMPS) ---
    const finalForm = document.getElementById('final-form');
    
    if(finalForm) {
        const phoneInput = finalForm.querySelector('input[type="tel"]');
        const submitBtn = finalForm.querySelector('button');

        // Formatage automatique du numéro (espaces)
        if(phoneInput) {
            phoneInput.addEventListener('input', function (e) {
                let v = e.target.value.replace(/\D/g, "").substring(0, 10);
                e.target.value = v.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
            });
        }

        finalForm.addEventListener('submit', function(e) {
            e.preventDefault(); // On bloque le rechargement de page
            if(!phoneInput) return;

            const rawPhone = phoneInput.value.replace(/\s/g, '');
            
            // Validation stricte 10 chiffres
            if(rawPhone.length < 10) {
                alert("Merci d'entrer un numéro valide (10 chiffres).");
                return;
            }

            // Bouton en chargement
            if(submitBtn) {
                submitBtn.innerHTML = "Vérification en cours..."; // Petit effet "Pro"
                submitBtn.disabled = true;
                submitBtn.style.opacity = "0.7";
            }

            // Préparation des données pour le Sheet
            const formData = new FormData();
            formData.append("phase", "Lead Qualifié (Offre Débloquée)"); 
            formData.append("source", currentSource);
            formData.append("phone", rawPhone);
            formData.append("foyer", selectedPeople + " personnes");
            formData.append("model_recommande", selectedModelName);
            formData.append("prix_ttc_estime", finalPriceTTC + " €");
            formData.append("economie_annuelle", estimatedSavings + " €/an");
            
            // Paramètres URL (UTM)
            const params = new URLSearchParams(location.search);
            formData.append("utm_source", params.get("utm_source") || "");
            formData.append("utm_campaign", params.get("utm_campaign") || "");

            // ENVOI (Fetch)
            fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: formData, mode: "no-cors" })
            .then(() => {
                
                // 1. SIGNAL GOOGLE ADS (Conversion)
                if(typeof gtag === 'function') {
                    gtag('event', 'conversion', {
                        'send_to': ADS_ID + '/' + LABEL_LEAD_FINAL, 
                        'value': 1.0,
                        'currency': 'EUR'
                    });
                }

                // ===============================================
                // 2. EFFET "REVEAL" (BASCULE VISUELLE)
                // ===============================================

                // A. Mise à jour du PRIX FINAL (Step 3)
                const finalDisplay = document.getElementById('final-price-display');
                if(finalDisplay) {
                    // Ajoute un espace pour les milliers (ex: 1 694)
                    finalDisplay.textContent = finalPriceTTC.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                }

                // B. Calcul et Affichage de la mensualité (4x)
                const monthlyPayment = Math.round(finalPriceTTC / 4);
                const monthlyEl = document.getElementById('monthly-payment');
                if(monthlyEl) {
                    monthlyEl.textContent = monthlyPayment;
                }

                // C. On Cache l'étape 2 (Verrou)
                const step2 = document.getElementById('step-2');
                if(step2) step2.style.display = 'none';

                // D. On Affiche l'étape 3 (Résultat)
                const step3 = document.getElementById('step-3');
                if(step3) {
                    step3.style.display = 'block';
                    // Scroll automatique vers le résultat
                    step3.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

            })
            .catch(err => {
                console.error("Erreur sheet", err);
                if(submitBtn) {
                    submitBtn.innerHTML = "Erreur, réessayez";
                    submitBtn.disabled = false;
                }
            });
        });
    }

    // Fonction restart
    window.restartSim = function() {
        const s1 = document.getElementById('step-1');
        const s2 = document.getElementById('step-2');
        const s3 = document.getElementById('step-3'); // Ajout pour fermer le step 3 aussi
        if(s3) s3.style.display = 'none';
        if(s2) s2.style.display = 'none';
        if(s1) s1.style.display = 'block';
    };

    // ----------------------------------------------------------------------
    // --- 7. BANNIÈRE COOKIES & CONSENT MODE V2 ---
    // ----------------------------------------------------------------------
    const cookieBanner = document.getElementById('consent-ui-box');
    const btnAccept = document.getElementById('cookie-accept');
    const btnRefuse = document.getElementById('cookie-refuse');

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return null;
    }

    function setCookie(name, value, days) {
        var d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    function grantGoogleConsent() {
        if(typeof gtag === 'function') {
            gtag('consent', 'update', {
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'analytics_storage': 'granted'
            });
            console.log("Consentement Google : ACCORDÉ ✅");
        }
    }
    
    function denyGoogleConsent() {
        if(typeof gtag === 'function') {
            gtag('consent', 'update', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied'
            });
            console.log("Consentement Google : REFUSÉ ❌");
        }
    }

    const currentConsent = getCookie('watersoft_consent');
    
    if (currentConsent === 'accepted') {
        grantGoogleConsent();
    } else if (currentConsent === 'refused') {
        denyGoogleConsent(); 
    } else if (currentConsent === null) {
        setTimeout(function() {
            if(cookieBanner) {
                cookieBanner.style.display = 'block';
                setTimeout(() => {
                    cookieBanner.classList.add('show-banner');
                }, 50);
            }
        }, 1000);
    }

    if(btnAccept) {
        btnAccept.addEventListener('click', function() {
            setCookie('watersoft_consent', 'accepted', 365); 
            grantGoogleConsent(); 
            
            if(cookieBanner) {
                cookieBanner.style.display = 'none';
                cookieBanner.classList.remove('show-banner');
            }
        });
    }

    if(btnRefuse) {
        btnRefuse.addEventListener('click', function() {
            setCookie('watersoft_consent', 'refused', 30); 
            denyGoogleConsent(); 
            
            if(cookieBanner) {
                cookieBanner.style.display = 'none';
                cookieBanner.classList.remove('show-banner');
            }
        });
    }

});
