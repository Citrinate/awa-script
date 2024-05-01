// ==UserScript==
// @name         AWA Script
// @namespace    https://github.com/Citrinate
// @version      1.0.0
// @description  Improves Alienware Arena somewhat
// @author       Citrinate
// @match        *://*.alienwarearena.com/member/*/artifacts
// @match        *://*.alienwarearena.com/marketplace/game-vault
// @grant        none
// @homepageURL  https://github.com/Citrinate/awa-script
// @supportURL   https://github.com/Citrinate/awa-script/issues
// @downloadURL  https://github.com/Citrinate/awa-script/raw/main/code.user.js
// @updateURL    https://github.com/Citrinate/awa-script/raw/main/code.user.js
// ==/UserScript==

(function() {
    'use strict';

    let vault_opens_at = Date.parse("2024-05-24 19:00:00 UTC"); // This needs to be manually updated every month

    const PAGE_VAULT = 0;
    const PAGE_ARTIFACT = 1;

    let current_page = null;
    if (window.location.href.includes('/artifacts')) {
        current_page = PAGE_ARTIFACT;
    } else if (window.location.href.includes('/game-vault')) {
        current_page = PAGE_VAULT;
    }

    if (current_page == PAGE_ARTIFACT) {
        // Add countdown timer indicating when artifacts can we swapped out
        (function createArtifactTimer() {

            document.querySelectorAll(".artifact-block > .slots > .slot").forEach((slot, index) => {
                let modal_slot = document.querySelectorAll(".modal-slot")[index];
                if (!modal_slot) {
                    return;
                }

                let slot_countdown = document.createElement("div");
                slot_countdown.style.cssText = "text-align: center; margin-top: 16px;"
                slot.appendChild(slot_countdown);

                let modal_slot_countdown = document.createElement("div");
                modal_slot_countdown.style.cssText = "position: absolute; background: rgba(0, 0, 0, .85); width: 100%; padding-top: 4px; text-align: center; bottom: 0px;";
                modal_slot.appendChild(modal_slot_countdown);

                let artifact_data = artifactsData.userActiveArtifacts[index + 1];
                if (!artifact_data) {
                    return;
                }

                let artifact_equip_time = Date.parse(artifact_data.equippedAt.date + "UTC");
                let artifact_replaceable_at = artifact_equip_time + 86400000;

                let interval_id;
                interval_id = setInterval(function update() {
                    let milliseconds_remaining = Math.max(0, (artifact_replaceable_at - new Date().getTime()));
                    if (milliseconds_remaining == 0) {
                        if (interval_id) {
                            slot.removeChild(slot_countdown);
                            modal_slot.removeChild(modal_slot_countdown);
                            modal_slot.classList.remove("disabled"); // enable the swap button
                            clearInterval(interval_id);
                        }

                        return update;
                    }

                    let s = (new Date(milliseconds_remaining).toISOString().substring(11, 19)); // https://stackoverflow.com/a/70781722
                    slot_countdown.innerHTML = `Replaceable in ${s}`;
                    modal_slot_countdown.innerHTML = s;

                    return update;
                }(), 1000);
            });
        })();
    }

    if (current_page == PAGE_VAULT) {
        // Add countdown timer indicating when the game vault will open
        (function createVaultTimer() {

            let marketplace_sidebar = document.querySelector(".marketplace-sidebar-text");
            if (!marketplace_sidebar) {
                return;
            }

            let vault_countdown_parent = document.createElement("div");
            vault_countdown_parent.classList.add("row", "mt-3");
            let vault_countdown = document.createElement("div");
            vault_countdown.classList.add("col", "text-center", "active-market");
            vault_countdown.style.cssText = "font-weight: bold; font-size: 20px;";
            vault_countdown_parent.appendChild(vault_countdown);
            marketplace_sidebar.after(vault_countdown_parent);

            let interval_id;
            interval_id = setInterval(function update() {
                let milliseconds_remaining = Math.max(0, (vault_opens_at - new Date().getTime()));
                if (milliseconds_remaining == 0) {
                    if (interval_id) {
                        marketplace_sidebar.parentElement.removeChild(vault_countdown_parent);
                        clearInterval(interval_id);
                    }

                    return update;
                }

                let s = Math.floor(milliseconds_remaining/86400000) + ":" + (new Date(milliseconds_remaining).toISOString().substring(11, 19)); // https://stackoverflow.com/a/70781722
                vault_countdown.innerHTML = `Vault opens in ${s}`;

                return update;
            }(), 1000);
        })();
    }
})();
