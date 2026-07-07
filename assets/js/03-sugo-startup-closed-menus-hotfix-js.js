(function(){
  var GROUPS = '.nav-lroot-children,.nav-l0-children,.nav-l00-children';
  var CHEVS = '.nav-lroot-chev,.nav-l0-chev,.nav-l00-chev';
  var BUTTONS = '.nav-lroot-btn,.nav-l0-btn,.nav-l00-btn,.nav-l000-btn';
  var manualUnlocked = true;
  // disabled: delayed startup collapse was closing options/search after user clicks.

  function byId(id){ return document.getElementById(id); }

  function removePersistedOpenState(){
    try{
      localStorage.removeItem('sugo_last_pane');
      localStorage.removeItem('sugo_nav_state_v2');
      localStorage.removeItem('sugo_options_open');
    }catch(e){}
  }

  function collapseLeftMenus(){
    if(manualUnlocked) return;
    removePersistedOpenState();

    var nav = byId('sidebarNav');
    if(nav){
      nav.classList.add('sugo-initial-closed');
      nav.classList.add('sugo-startup-closed');
      nav.classList.remove('sugo-cascade-mode');
    }

    document.querySelectorAll(GROUPS).forEach(function(el){
      el.classList.remove('open');
      el.style.display = 'none';
    });
    document.querySelectorAll(CHEVS).forEach(function(el){ el.classList.remove('open'); });
    document.querySelectorAll(BUTTONS).forEach(function(el){ el.classList.remove('active'); });

    var librarySelect = byId('sugoLibrarySelect');
    if(librarySelect) librarySelect.value = '';

    var cascade = byId('sugoCascadeMenu');
    if(cascade) cascade.classList.remove('active');

    ['sugoCascadeCategory','sugoCascadeSection','sugoCascadeTopic'].forEach(function(id){
      var sel = byId(id);
      if(sel){ sel.value = ''; sel.disabled = true; }
    });

    var topicFilter = byId('sugoCascadeTopicSearch');
    if(topicFilter){ topicFilter.value = ''; topicFilter.disabled = true; }

    document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(pane){ pane.classList.remove('active'); });
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'flex';

    var sidebar = byId('sidebar');
    if(sidebar) sidebar.classList.remove('options-open');
    var optionsBtn = byId('optionsToggleBtn');
    if(optionsBtn) optionsBtn.setAttribute('aria-expanded','false');
  }

  function unlockManualNavigation(event){
    if(!event.target || !event.target.closest || !event.target.closest('#sidebarNav')) return;
    manualUnlocked = true;
    var nav = byId('sidebarNav');
    if(nav) nav.classList.remove('sugo-startup-closed');
    document.querySelectorAll(GROUPS).forEach(function(el){ el.style.display = ''; });
    document.removeEventListener('pointerdown', unlockManualNavigation, true);
    document.removeEventListener('click', unlockManualNavigation, true);
    document.removeEventListener('keydown', unlockKeyboardNavigation, true);
  }

  function unlockKeyboardNavigation(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    unlockManualNavigation(event);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', collapseLeftMenus);
  else collapseLeftMenus();

  window.addEventListener('load', function(){
    // Disabled delayed collapse: it was closing opened options and clearing search.
  });

  document.addEventListener('pointerdown', unlockManualNavigation, true);
  document.addEventListener('click', unlockManualNavigation, true);
  document.addEventListener('keydown', unlockKeyboardNavigation, true);
})();


// ===== SUGO SV — Clean refined macros from 1.txt and 2.txt =====
(function(){
  const svDeletePatterns = [/^sv-/, /^binding-ticket-optimized$/, /^reporting-ticket-optimized$/, /^banned-ticket-optimized$/, /^agency-ticket-optimized$/, /^games-ticket-optimized$/, /^tasks-ticket-optimized$/, /^withdrawal-coin-ticket-optimized$/, /^app-crash-ticket-optimized$/, /^change-country-ticket-optimized$/, /^location-ticket-optimized$/];
  Object.keys(paneContent).forEach(function(id){ if (svDeletePatterns.some(function(re){ return re.test(id); })) delete paneContent[id]; });
  sugoTopicsCache = null;
})();

/* lazy-loaded pane removed from startup bundle: sv-refined-contact-from-same-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-customer-service-greeting */

/* lazy-loaded pane removed from startup bundle: sv-refined-duplicate-conversation */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-customer-id */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-id-and-issue-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-submitted-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-welcome-how-can-we-help */

/* lazy-loaded pane removed from startup bundle: sv-refined-account-ownership-verification */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-phone-number */

/* lazy-loaded pane removed from startup bundle: sv-refined-password-reset-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-phone-binding-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-identity-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-male-using-female-account-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-underage-verification-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-verification-rejected */

/* lazy-loaded pane removed from startup bundle: sv-refined-moments-watermark-removal */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-evidence */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-insulting-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-issue-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-reason-placeholder */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-telegram */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-insulting-another-user */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-male-using-female-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-a-coin-seller */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-promoting-other-platforms */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-commerce */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-content-in-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-moments */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-offer */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-picture */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-underage-suspicion */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-vpn-region-violation */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-high-risk-restriction */

/* lazy-loaded pane removed from startup bundle: sv-refined-medium-risk-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-unban-apology */

/* lazy-loaded pane removed from startup bundle: sv-refined-coins-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-recharge-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-elite-club-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-first-recharge-requirement */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-failed-alternatives */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-general-guide */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-link */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-methods */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-egypt */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-iraq */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-saudi-arabia */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-syria */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-uae */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-visa */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-recharge-invoice */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-remove-withdrawal-option */

/* lazy-loaded pane removed from startup bundle: sv-refined-cancel-withdrawal-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-fast-withdrawal-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-withdrawal-screenshot */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-successful-but-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-through-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-waiting-period */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-admin-whatsapp-group-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-transfer-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-apply-to-open-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-agency-for-anchor */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-sub-agency-to-main-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-sub-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-daily-and-family-tasks */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information-alternative */

/* lazy-loaded pane removed from startup bundle: sv-refined-games-access-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-1 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-2 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-3 */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-refresh-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-upload-log */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-close-location-hide-distance */

/* lazy-loaded pane removed from startup bundle: sv-refined-location-disappeared */
// ===== SUGO SV — Quality 95+ polished macro overrides =====
(function(){
  sugoTopicsCache = null;
  
/* lazy-loaded pane removed from startup bundle: sv-refined-contact-from-same-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-customer-service-greeting */

/* lazy-loaded pane removed from startup bundle: sv-refined-duplicate-conversation */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-customer-id */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-id-and-issue-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-submitted-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-welcome-how-can-we-help */

/* lazy-loaded pane removed from startup bundle: sv-refined-account-ownership-verification */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-phone-number */

/* lazy-loaded pane removed from startup bundle: sv-refined-password-reset-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-phone-binding-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-identity-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-male-using-female-account-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-underage-verification-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-verification-rejected */

/* lazy-loaded pane removed from startup bundle: sv-refined-moments-watermark-removal */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-evidence */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-insulting-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-issue-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-reason-placeholder */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-telegram */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-insulting-another-user */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-male-using-female-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-a-coin-seller */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-promoting-other-platforms */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-commerce */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-content-in-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-moments */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-offer */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-picture */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-underage-suspicion */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-vpn-region-violation */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-high-risk-restriction */

/* lazy-loaded pane removed from startup bundle: sv-refined-medium-risk-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-unban-apology */

/* lazy-loaded pane removed from startup bundle: sv-refined-coins-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-recharge-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-elite-club-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-first-recharge-requirement */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-failed-alternatives */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-general-guide */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-link */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-methods */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-egypt */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-iraq */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-saudi-arabia */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-syria */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-uae */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-visa */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-recharge-invoice */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-remove-withdrawal-option */

/* lazy-loaded pane removed from startup bundle: sv-refined-cancel-withdrawal-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-fast-withdrawal-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-withdrawal-screenshot */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-successful-but-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-through-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-waiting-period */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-admin-whatsapp-group-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-transfer-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-apply-to-open-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-agency-for-anchor */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-sub-agency-to-main-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-sub-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-daily-and-family-tasks */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information-alternative */

/* lazy-loaded pane removed from startup bundle: sv-refined-games-access-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-1 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-2 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-3 */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-refresh-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-upload-log */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-close-location-hide-distance */

/* lazy-loaded pane removed from startup bundle: sv-refined-location-disappeared */
})();

// ===== SUGO SV — Quality 96+ recharge and language polish overrides =====
(function(){
  sugoTopicsCache = null;
  
/* lazy-loaded pane removed from startup bundle: sv-refined-contact-from-same-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-customer-service-greeting */

/* lazy-loaded pane removed from startup bundle: sv-refined-duplicate-conversation */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-customer-id */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-id-and-issue-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-submitted-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-welcome-how-can-we-help */

/* lazy-loaded pane removed from startup bundle: sv-refined-account-ownership-verification */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-phone-number */

/* lazy-loaded pane removed from startup bundle: sv-refined-password-reset-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-phone-binding-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-identity-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-male-using-female-account-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-underage-verification-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-verification-rejected */

/* lazy-loaded pane removed from startup bundle: sv-refined-moments-watermark-removal */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-evidence */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-insulting-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-issue-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-reason-placeholder */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-telegram */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-insulting-another-user */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-male-using-female-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-a-coin-seller */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-promoting-other-platforms */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-commerce */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-content-in-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-moments */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-offer */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-picture */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-underage-suspicion */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-vpn-region-violation */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-high-risk-restriction */

/* lazy-loaded pane removed from startup bundle: sv-refined-medium-risk-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-unban-apology */

/* lazy-loaded pane removed from startup bundle: sv-refined-coins-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-recharge-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-elite-club-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-first-recharge-requirement */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-failed-alternatives */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-general-guide */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-link */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-methods */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-egypt */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-iraq */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-saudi-arabia */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-syria */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-uae */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-visa */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-recharge-invoice */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-remove-withdrawal-option */

/* lazy-loaded pane removed from startup bundle: sv-refined-cancel-withdrawal-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-fast-withdrawal-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-withdrawal-screenshot */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-successful-but-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-through-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-waiting-period */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-admin-whatsapp-group-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-transfer-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-apply-to-open-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-agency-for-anchor */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-sub-agency-to-main-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-sub-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-daily-and-family-tasks */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information-alternative */

/* lazy-loaded pane removed from startup bundle: sv-refined-games-access-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-1 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-2 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-3 */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-refresh-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-upload-log */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-close-location-hide-distance */

/* lazy-loaded pane removed from startup bundle: sv-refined-location-disappeared */
})();

// ===== SUGO SV — Quality 97+ final country/link polish overrides =====
(function(){
  sugoTopicsCache = null;
  
/* lazy-loaded pane removed from startup bundle: sv-refined-contact-from-same-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-customer-service-greeting */

/* lazy-loaded pane removed from startup bundle: sv-refined-duplicate-conversation */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-customer-id */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-id-and-issue-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-submitted-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-welcome-how-can-we-help */

/* lazy-loaded pane removed from startup bundle: sv-refined-account-ownership-verification */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-phone-number */

/* lazy-loaded pane removed from startup bundle: sv-refined-password-reset-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-phone-binding-request-submitted */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-identity-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-male-using-female-account-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-unban-review-underage-verification-video-sent */

/* lazy-loaded pane removed from startup bundle: sv-refined-verification-rejected */

/* lazy-loaded pane removed from startup bundle: sv-refined-moments-watermark-removal */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-abuse-evidence */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-insulting-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-report-issue-case */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-reason-placeholder */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-drug-use-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-external-contact-telegram */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-insulting-another-user */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-male-using-female-account */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-pretending-to-be-a-coin-seller */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-promoting-other-platforms */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-commerce */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-content-in-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-messages */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-moments */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-offer */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-picture */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-sexual-video */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-smoking-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-underage-suspicion */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-vpn-region-violation */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-during-live */

/* lazy-loaded pane removed from startup bundle: sv-refined-ban-weapon-image */

/* lazy-loaded pane removed from startup bundle: sv-refined-high-risk-restriction */

/* lazy-loaded pane removed from startup bundle: sv-refined-medium-risk-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-unban-apology */

/* lazy-loaded pane removed from startup bundle: sv-refined-coins-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-recharge-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-elite-club-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-first-recharge-requirement */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-failed-alternatives */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-general-guide */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-link */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-methods */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-egypt */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-iraq */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-saudi-arabia */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-syria */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-agency-uae */

/* lazy-loaded pane removed from startup bundle: sv-refined-recharge-through-visa */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-recharge-invoice */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-remove-withdrawal-option */

/* lazy-loaded pane removed from startup bundle: sv-refined-cancel-withdrawal-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-fast-withdrawal-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-request-withdrawal-screenshot */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-successful-but-not-received */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-through-management */

/* lazy-loaded pane removed from startup bundle: sv-refined-withdrawal-waiting-period */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-admin-whatsapp-group-requirements */

/* lazy-loaded pane removed from startup bundle: sv-refined-agency-transfer-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-apply-to-open-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-agency-for-anchor */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-sub-agency-to-main-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-host-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-create-sub-agency */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-add-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-daily-and-family-tasks */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information */

/* lazy-loaded pane removed from startup bundle: sv-refined-game-access-information-alternative */

/* lazy-loaded pane removed from startup bundle: sv-refined-games-access-conditions */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-1 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-2 */

/* lazy-loaded pane removed from startup bundle: sv-refined-matching-issue-3 */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-game-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-remove-games-request */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-refresh-steps */

/* lazy-loaded pane removed from startup bundle: sv-refined-app-crash-upload-log */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country */

/* lazy-loaded pane removed from startup bundle: sv-refined-change-country-follow-up */

/* lazy-loaded pane removed from startup bundle: sv-refined-close-location-hide-distance */

/* lazy-loaded pane removed from startup bundle: sv-refined-location-disappeared */
})();
// ===== SUGO Smart Keyword Search — Arabic / English Aliases =====
(function(){
  'use strict';

  var KEYWORD_GROUPS = [
    {name:'account', terms:['account','login','sign in','password','reset password','forgot password','binding','bind','unbind','phone','phone number','email','id','user id','ownership','verification','verify','security','recovery','حساب','الحساب','تسجيل','تسجيل دخول','دخول','كلمة السر','كلمة السر','كلمة مرور','باسورد','استرجاع','استعادة','ربط','فك الربط','رقم الهاتف','رقم','ايميل','البريد','الاي دي','الاى دى','ايدي','آي دي','ملكية','ملكيه','تحقق','توثيق','امان']},
    {name:'ban', terms:['ban','banned','unban','blocked','block','restriction','restricted','appeal','apology','violation','policy violation','حظر','الحظر','محظور','محظورة','فك الحظر','رفع الحظر','تقييد','مقيد','مقيدة','قيود','مخالفة','مخالفه','انتهاك','اعتذار','التماس']},
    {name:'sexual-ban', terms:['sexual','sex','nudity','nude','private part','adult','explicit','porn','sexual content','sexual offer','sexual commerce','جنسي','جنسية','محتوى جنسي','ايحاء','إيحاء','ايحاءات','إيحاءات','عضو جنسي','عروض جنسية','اتجار جنسي','كلام جنسي','صور جنسية','فيديو جنسي']},
    {name:'underage', terms:['underage','minor','below 18','under 18','age verification','national id','identity card','قاصر','تحت السن','تحت 18','السن القانوني','دون السن','هوية','بطاقة','بطاقه','اثبات السن']},
    {name:'smoking-weapon-drugs', terms:['smoking','smoke','weapon','gun','knife','drugs','narcotics','live violation','تدخين','سيجارة','سجائر','سلاح','اسلحة','أسلحة','مسدس','سكين','مخدرات','مواد مخدرة','لايف','بث مباشر']},
    {name:'vpn-device', terms:['vpn','simulator','emulator','abnormal device','device','phone type','model','same device','multiple accounts','outside region','في بي ان','vpn','محاكي','جهاز غير طبيعي','جهاز','نوع الهاتف','موديل','نفس الجهاز','حسابات كثيرة','خارج المنطقة','خارج الشرق الاوسط']},
    {name:'recharge', terms:['recharge','charge','top up','coins','coin','gold','payment','purchase','invoice','receipt','transaction','order','visa','card','itunes','google play','agent recharge','recharge agent','refund','failed recharge','did not receive coins','شحن','الشحن','اشحن','تشحن','إعادة الشحن','اعادة الشحن','كوين','كوينز','كوينات','ذهب','دفع','مدفوعات','شراء','فاتورة','ايصال','إيصال','رقم العملية','عملية','فيزا','كارت','بطاقة','ايتونز','جوجل','وكيل شحن','وكلاء الشحن','لم تصل الكوينات','ما وصلت الكوينات','فشل الشحن','استرداد']},
    {name:'withdrawal', terms:['withdraw','withdrawal','salary','cash out','cashout','diamonds','diamond','exchange','transfer','wallet','payoneer','vodafone cash','fawry','cancel withdrawal','fast withdrawal','سحب','السحب','راتب','الراتب','استلام الراتب','ما وصل الراتب','لم يصل الراتب','ماسات','ماسه','ماس','تحويل','استبدال','محفظة','محفظه','بايونير','فودافون كاش','فوري','الغاء السحب','إلغاء السحب','السحب السريع']},
    {name:'agency', terms:['agency','host','anchor','sub agency','main agency','agency transfer','agency change','create agency','recharge agency','agent','target','charm','moderator','وكالة','وكاله','وكالات','مضيفة','مضيفه','مذيعة','مذيعه','هوست','انكور','وكيل','وكيلة','وكيله','وكالة فرعية','وكاله فرعيه','وكالة رئيسية','وكاله رئيسيه','نقل وكالة','تغيير وكالة','إنشاء وكالة','انشاء وكالة','وكالة شحن','تارجت','جاذبية','جازبية']},
    {name:'reports', terms:['report','abuse','insult','harassment','complaint','evidence','screenshot','screen recording','video','chat','private chat','voice room','violator','reporter','بلاغ','ابلاغ','إبلاغ','اساءة','إساءة','إهانه','اهانة','شتيمة','شكوى','دليل','اثبات','سكرين','لقطة شاشة','لقطه شاشه','تسجيل شاشة','فيديو','محادثة','محادثه','غرفة صوتية','روم','المخالف','المبلغ']},
    {name:'games-tasks', terms:['game','games','cat game','add game','remove game','tasks','daily tasks','family tasks','matching','match','reward','لعبة','اللعبة','العاب','الألعاب','لعبه','لعب','لعبة القطة','لعبه القطه','اضافة لعبة','إضافة لعبة','إزالة لعبة','ازالة لعبة','مهام','المهام','مهام يومية','مهام عائلية','مطابقة','ماتش','مكافأة','مكافاه']},
    {name:'country-location', terms:['country','change country','location','gps','nearby','distance','region','hide distance','close location','بلد','الدولة','دولة','تغيير البلد','تغيير الدولة','موقع','لوكيشن','الموقع','gps','الاشخاص القريبين','الأشخاص القريبين','المسافة','المسافة','اخفاء المسافة','إخفاء المسافة','المنطقة','منطقة']},
    {name:'app-technical', terms:['app','crash','bug','freeze','not working','refresh','upload log','app log','technical issue','error message','screenshot','تطبيق','البرنامج','عطل','مشكلة تقنية','مشكله تقنيه','كراش','يعلق','تعليق','لا يعمل','مش شغال','تنشيط','رفع السجل','تحميل السجل','رسالة خطأ','رساله خطا']},
    {name:'vip', terms:['vip','svip','supporter','elite','elite club','vip4','vip 4','vip6','vip 6','داعمين','داعم','كبار الداعمين','نادي النخبة','نادى النخبه','النخبة','في اي بي','vip']},
    {name:'greeting', terms:['greeting','welcome','hello','hi','thanks','thank you','closing','follow up','مرحبا','مرحبًا','اهلا','أهلا','شكرا','شكرًا','تحية','ترحيب','خاتمة','متابعة','مساعدة أخرى']}
  ];

  var STOP_WORDS = new Set(['the','a','an','is','are','to','for','of','in','on','and','or','with','from','about','please','kindly','i','my','me','you','your','not','can','cant','cannot','لا','ما','مش','مو','في','من','على','علي','عن','الى','إلى','او','أو','و','يا','لو','اذا','إذ','هل','كيف','بدي','عايز','عاوز','اريد','ممكن','حضرتك','فندم','رجاء','برجاء','يرجى','ياريت','هذا','هذه','هو','هي']);

  function norm(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g,'')
      .replace(/[إأآا]/g,'ا')
      .replace(/ى/g,'ي')
      .replace(/ؤ/g,'و')
      .replace(/ئ/g,'ي')
      .replace(/ة/g,'ه')
      .replace(/گ/g,'ك')
      .replace(/ـ/g,'')
      .replace(/[^\u0600-\u06FF\p{L}\p{N}\s]/gu,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function splitTokens(value){
    return norm(value).split(' ').filter(function(t){ return t && t.length > 1 && !STOP_WORDS.has(t); });
  }

  function groupNormTerms(group){
    if(group._normTerms) return group._normTerms;
    group._normTerms = group.terms.map(norm).filter(Boolean);
    group._tokens = Array.from(new Set(group._normTerms.join(' ').split(' ').filter(Boolean)));
    return group._normTerms;
  }

  KEYWORD_GROUPS.forEach(groupNormTerms);

  function textMatchesGroup(normalizedText, group){
    var terms = groupNormTerms(group);
    return terms.some(function(term){ return term && normalizedText.indexOf(term) !== -1; });
  }

  function addGroupTerms(set, group){
    groupNormTerms(group).forEach(function(term){
      if(!term) return;
      set.add(term);
      term.split(' ').forEach(function(part){ if(part && part.length > 1) set.add(part); });
    });
  }

  function expandQueryTokens(query){
    var normalized = norm(query);
    var set = new Set(splitTokens(query));
    KEYWORD_GROUPS.forEach(function(group){
      var terms = groupNormTerms(group);
      var hit = terms.some(function(term){
        if(!term) return false;
        if(normalized.indexOf(term) !== -1) return true;
        return term.split(' ').some(function(part){ return part.length > 2 && normalized.split(' ').indexOf(part) !== -1; });
      });
      if(hit) addGroupTerms(set, group);
    });
    return Array.from(set).filter(function(t){ return t && t.length > 1 && !STOP_WORDS.has(t); });
  }

  var SUGO_EXPANDED_HAYSTACK_CACHE = new Map();
  function expandHaystack(text){
    var raw = String(text || '');
    var cacheKey = raw.length <= 16000 ? raw : raw.slice(0, 16000);
    if(SUGO_EXPANDED_HAYSTACK_CACHE.has(cacheKey)) return SUGO_EXPANDED_HAYSTACK_CACHE.get(cacheKey);
    var normalized = norm(cacheKey);
    var extras = new Set();
    KEYWORD_GROUPS.forEach(function(group){ if(textMatchesGroup(normalized, group)) addGroupTerms(extras, group); });
    var out = normalized + ' ' + Array.from(extras).join(' ');
    if(SUGO_EXPANDED_HAYSTACK_CACHE.size > 600) SUGO_EXPANDED_HAYSTACK_CACHE.clear();
    SUGO_EXPANDED_HAYSTACK_CACHE.set(cacheKey, out);
    return out;
  }

  function getPaneRecord(paneId){
    try{
      var topics = typeof getAllTopics === 'function' ? getAllTopics() : [];
      for(var i=0;i<topics.length;i++){ if(topics[i].id === paneId) return topics[i]; }
    }catch(e){}
    return null;
  }

  function ancestorText(btn){
    var parts = [];
    try{
      var root = btn.closest('.nav-lroot');
      var cat = btn.closest('.nav-l0');
      var sec = btn.closest('.nav-l00');
      [root, cat, sec].forEach(function(node){
        if(!node) return;
        var span = node.querySelector(':scope > button span');
        if(span) parts.push(span.textContent || '');
      });
    }catch(e){}
    return parts.join(' ');
  }

  function topicHaystack(btn){
    if(!btn) return '';
    if(btn.__sugoKeywordHaystack) return btn.__sugoKeywordHaystack;
    var paneId = btn.getAttribute('data-pane') || '';
    var record = getPaneRecord(paneId);
    var body = record && record.allText ? String(record.allText).slice(0, 4200) : '';
    btn.__sugoKeywordHaystack = [
      btn.textContent || '',
      paneId,
      ancestorText(btn),
      body
    ].join('\n');
    return btn.__sugoKeywordHaystack;
  }

  function smartScore(query, haystack){
    var nq = norm(query);
    if(!nq) return 0;
    var core = splitTokens(query);
    if(!core.length) return 0;
    var expandedHay = expandHaystack(haystack);
    var matchedCore = 0;
    core.forEach(function(t){ if(expandedHay.indexOf(t) !== -1) matchedCore++; });
    var needed = core.length <= 1 ? 1 : Math.ceil(core.length * 0.66);
    if(matchedCore < needed && expandedHay.indexOf(nq) === -1) return 0;
    var score = matchedCore * 6;
    if(expandedHay.indexOf(nq) !== -1) score += 16;
    expandQueryTokens(query).forEach(function(t){ if(expandedHay.indexOf(t) !== -1) score += 2; });
    return score;
  }

  function selectedLibraryRoot(){
    var select = document.getElementById('sugoLibrarySelect');
    var value = select ? select.value : '';
    if(value === 'sv') return document.getElementById('rootSVTickets') && document.getElementById('rootSVTickets').closest('.nav-lroot');
    if(value === 'kb') return document.getElementById('rootKB') && document.getElementById('rootKB').closest('.nav-lroot');
    return null;
  }

  function allTopicButtons(scope){
    var root = scope || selectedLibraryRoot() || document;
    return Array.prototype.slice.call(root.querySelectorAll('.nav-l000-btn[data-pane]'));
  }

  function smartSearchNavigation(value){
    var q = String(value || '').trim();
    var nr = document.getElementById('noResults');
    if(!q){
      document.querySelectorAll('.nav-l0,.nav-l00,.nav-l000-btn').forEach(function(el){ el.classList.remove('hidden-search'); });
      if(nr) nr.style.display='none';
      return;
    }
    var any = false;
    document.querySelectorAll('.nav-l000-btn[data-pane]').forEach(function(btn){
      var score = smartScore(q, topicHaystack(btn));
      var match = score > 0;
      btn.classList.toggle('hidden-search', !match);
      if(match) any = true;
    });
    document.querySelectorAll('.nav-l00').forEach(function(sec){
      var vis = Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return !b.classList.contains('hidden-search'); });
      sec.classList.toggle('hidden-search', !vis);
    });
    document.querySelectorAll('.nav-l0').forEach(function(cat){
      var vis = Array.prototype.some.call(cat.querySelectorAll('.nav-l00'), function(s){ return !s.classList.contains('hidden-search'); });
      cat.classList.toggle('hidden-search', !vis);
    });
    if(nr) nr.style.display = any ? 'none' : 'block';
  }

  function topicTitle(btn){ return (btn && (btn.textContent || '').trim()) || 'Untitled topic'; }
  function topicSection(btn){
    var parts = [];
    try{
      var cat = btn.closest('.nav-l0');
      var sec = btn.closest('.nav-l00');
      [cat, sec].forEach(function(node){
        var span = node && node.querySelector(':scope > button span');
        if(span) parts.push((span.textContent || '').trim());
      });
    }catch(e){}
    return parts.filter(Boolean).join(' › ');
  }

  function renderSmartBestMatch(query){
    var panel = document.getElementById('v51BestMatchPanel');
    if(!panel) return;
    var q = String(query || '').trim();
    if(!q){ panel.style.display='none'; panel.innerHTML=''; return; }
    var ranked = allTopicButtons(document).map(function(btn){ return {btn:btn, score:smartScore(q, topicHaystack(btn))}; })
      .filter(function(item){ return item.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });
    if(!ranked.length){ panel.style.display='none'; panel.innerHTML=''; return; }
    var best = ranked[0];
    var confidence = best.score >= 28 ? 'High' : (best.score >= 14 ? 'Medium' : 'Low');
    var paneId = best.btn.getAttribute('data-pane') || '';
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-keyword-best-match">'
      + '<div class="v51-best-top"><span class="v51-best-badge">Keyword Match</span><span class="v51-best-score">' + confidence + '</span></div>'
      + '<div class="v51-best-title">' + escapeHtml(topicTitle(best.btn)) + '</div>'
      + '<div class="v51-best-section">' + escapeHtml(topicSection(best.btn)) + '</div>'
      + '<div class="v51-best-actions">'
      + '<button type="button" class="v51-mini-btn" data-sugo-keyword-open="' + escapeHtml(paneId) + '">Open SOP</button>'
      + '<button type="button" class="v51-mini-btn" data-sugo-keyword-ask="' + escapeHtml(topicTitle(best.btn)) + '" data-sugo-keyword-pane="' + escapeHtml(paneId) + '">Ask AI</button>'
      + '</div></div>';
  }

  function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; });
  }

  function directChildren(parent, selector){
    if(!parent) return [];
    return Array.prototype.filter.call(parent.children, function(child){ return child.matches && child.matches(selector); });
  }
  function selectedByIndex(items, select){
    var idx = Number(select && select.value);
    return Number.isFinite(idx) && idx >= 0 ? items[idx] : null;
  }

  function currentCascadeTopics(){
    var library = document.getElementById('sugoLibrarySelect');
    var category = document.getElementById('sugoCascadeCategory');
    var section = document.getElementById('sugoCascadeSection');
    if(!library || !category || !section) return [];
    var root = selectedLibraryRoot();
    if(!root) return [];
    var categories = directChildren(root.querySelector('.nav-lroot-children'), '.nav-l0');
    var cat = selectedByIndex(categories, category);
    var sections = directChildren(cat && cat.querySelector('.nav-l0-children'), '.nav-l00');
    var sec = selectedByIndex(sections, section);
    return directChildren(sec && sec.querySelector('.nav-l00-children'), '.nav-l000-btn');
  }

  function applySmartTopicFilter(){
    var input = document.getElementById('sugoCascadeTopicSearch');
    var select = document.getElementById('sugoCascadeTopic');
    var meta = document.getElementById('sugoCascadeMeta');
    if(!input || !select) return;
    var q = String(input.value || '').trim();
    if(!q) return;
    var topics = currentCascadeTopics();
    var ranked = topics.map(function(btn, index){ return {btn:btn, index:index, score:smartScore(q, topicHaystack(btn))}; })
      .filter(function(item){ return item.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });
    select.innerHTML = '';
    if(!ranked.length){
      var empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'No matching topic';
      select.appendChild(empty);
      select.disabled = true;
      if(meta) meta.textContent = '0 topic(s)';
      return;
    }
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose topic';
    select.appendChild(placeholder);
    ranked.forEach(function(item, idx){
      var opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = topicTitle(item.btn);
      opt.setAttribute('data-smart-pane', item.btn.getAttribute('data-pane') || '');
      opt.setAttribute('data-smart-title', topicTitle(item.btn));
      select.appendChild(opt);
    });
    select.disabled = false;
    if(meta) meta.textContent = ranked.length + ' topic(s)';
  }

  function install(){
    try{
      var topInput = document.getElementById('searchInput');
      if(topInput) topInput.setAttribute('placeholder','Search Arabic / English keywords...');
      var topicInput = document.getElementById('sugoCascadeTopicSearch');
      if(topicInput) topicInput.setAttribute('placeholder','Filter by Arabic / English keywords...');
    }catch(e){}

    if(window.SugoApp && window.SugoApp.navigation){
      window.SugoApp.navigation.search = smartSearchNavigation;
    }

    var previousDoSearch = window.doSearch;
    if(typeof previousDoSearch === 'function' && !previousDoSearch._sugoKeywordWrapped){
      var wrapped = function(q){
        var result = previousDoSearch.apply(this, arguments);
        try{ smartSearchNavigation(q); }catch(e){}
        setTimeout(function(){ renderSmartBestMatch(q); }, 0);
        return result;
      };
      wrapped._sugoKeywordWrapped = true;
      window.doSearch = wrapped;
    }

    document.addEventListener('input', function(e){
      if(e.target && e.target.id === 'searchInput'){
        return;
      }
      if(e.target && e.target.id === 'sugoCascadeTopicSearch'){
        clearTimeout(window.__sugoTopicSmartFilterTimer); window.__sugoTopicSmartFilterTimer = setTimeout(applySmartTopicFilter, 140);
      }
    }, true);

    document.addEventListener('change', function(e){
      if(e.target && e.target.id === 'sugoCascadeTopic'){
        var opt = e.target.options[e.target.selectedIndex];
        var pane = opt && opt.getAttribute('data-smart-pane');
        if(pane){
          e.preventDefault();
          e.stopImmediatePropagation();
          if(typeof showPane === 'function') showPane(pane, true);
          if(window.SugoApp && SugoApp.navigation && typeof SugoApp.navigation.syncToPane === 'function'){
            try{ SugoApp.navigation.syncToPane(pane, {persist:true}); }catch(err){}
          }
        }
      }
    }, true);

    document.addEventListener('click', function(e){
      var open = e.target.closest && e.target.closest('[data-sugo-keyword-open]');
      if(open){
        e.preventDefault();
        var paneId = open.getAttribute('data-sugo-keyword-open');
        if(paneId && typeof showPane === 'function') showPane(paneId, true);
        return;
      }
      var ask = e.target.closest && e.target.closest('[data-sugo-keyword-ask]');
      if(ask){
        e.preventDefault();
        var q = ask.getAttribute('data-sugo-keyword-ask') || '';
        var pane = ask.getAttribute('data-sugo-keyword-pane') || '';
        if(pane){ window.SUGO_EXACT_AI_PANE = pane; window.SUGO_ACTIVE_PANE = pane; window.SUGO_ACTIVE_PANE_TS = Date.now(); }
        var input = document.getElementById('searchInput');
        if(input) input.value = q;
        if(typeof askAI === 'function') askAI(q);
      }
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.SUGO_KEYWORD_SEARCH = {
    version: '1.0.0',
    groups: KEYWORD_GROUPS,
    norm: norm,
    smartScore: smartScore,
    expandQueryTokens: expandQueryTokens
  };
})();
