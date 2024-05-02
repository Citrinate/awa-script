// ==UserScript==
// @name         AWA Script
// @namespace    https://github.com/Citrinate
// @version      1.0.0
// @description  Improves Alienware Arena somewhat
// @author       Citrinate
// @match        *://*.alienwarearena.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_webRequest
// @homepageURL  https://github.com/Citrinate/awa-script
// @supportURL   https://github.com/Citrinate/awa-script/issues
// @downloadURL  https://github.com/Citrinate/awa-script/raw/main/code.user.js
// @updateURL    https://github.com/Citrinate/awa-script/raw/main/code.user.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const VAULT_OPENS_AT = Date.parse("2024-05-24 19:00:00 UTC"); // This needs to be manually updated every month

    const SETTING_DISABLE_TOS = "SETTING_DISABLE_TOS";

	var defaultSettings = {
		SETTING_DISABLE_TOS: false,
	};

    function GetSetting(name) { return GM_getValue(name, defaultSettings[name]); }
	function SetSetting(name, value) { GM_setValue(name, value); }

    const PAGE_VAULT = 0;
    const PAGE_ARTIFACT = 1;

    let currentPage = null;
    if (window.location.href.includes('/artifacts')) {
        currentPage = PAGE_ARTIFACT;
    } else if (window.location.href.includes('/game-vault')) {
        currentPage = PAGE_VAULT;
    }

    if (currentPage == PAGE_ARTIFACT) {
        // Add countdown timer indicating when artifacts can we swapped out
        window.addEventListener("load", function CreateArtifactTimer() {

            document.querySelectorAll(".artifact-block > .slots > .slot").forEach((slot, index) => {
                let modalSlot = document.querySelectorAll(".modal-slot")[index];
                if (!modalSlot) {
                    return;
                }

                let slotCountdownParent = document.createElement("div");
                slotCountdownParent.style.cssText = "text-align: center; margin-top: 16px; display: none;"
                slotCountdownParent.innerText = "Replaceable in ";
                slot.appendChild(slotCountdownParent);

                    let slotCountdown = document.createElement("div");
                    slotCountdown.style.cssText = "display: inline"
                    slotCountdownParent.appendChild(slotCountdown);

                let modalSlotCountdown = document.createElement("div");
                modalSlotCountdown.style.cssText = "position: absolute; background: rgba(0, 0, 0, .85); width: 100%; padding-top: 4px; text-align: center; bottom: 0px;";
                modalSlot.appendChild(modalSlotCountdown);

                let artifactData = artifactsData.userActiveArtifacts[index + 1];
                if (!artifactData) {
                    return;
                }

                let artifactEquipTime = Date.parse(artifactData.equippedAt.date + "UTC");
                let artifactReplaceableAt = artifactEquipTime + 86400000;

                let intervalID;
                intervalID = setInterval(function UpdateArtifactTimer() {
                    let millisecondsRemaining = Math.max(0, (artifactReplaceableAt - new Date().getTime()));
                    if (millisecondsRemaining == 0) {
                        if (intervalID) {
                            slot.removeChild(slotCountdownParent);
                            modalSlot.removeChild(modalSlotCountdown);
                            modalSlot.classList.remove("disabled"); // enable the swap button
                            clearInterval(intervalID);
                        }

                        return UpdateArtifactTimer;
                    }

                    let s = (new Date(millisecondsRemaining).toISOString().substring(11, 19)); // https://stackoverflow.com/a/70781722
                    slotCountdown.innerText = s;
                    slotCountdownParent.style.display = "block";
                    modalSlotCountdown.innerText = s;

                    return UpdateArtifactTimer;
                }(), 1000);
            });
        });
    }

    if (currentPage == PAGE_VAULT) {
        // Add countdown timer indicating when the game vault will open
        document.addEventListener("DOMContentLoaded", function CreateVaultTimer() {

            let marketplaceSidebar = document.querySelector(".marketplace-sidebar-text");
            if (!marketplaceSidebar) {
                return;
            }

            let vaultCountdownParent = document.createElement("div");
            vaultCountdownParent.classList.add("row", "mt-3");
            vaultCountdownParent.style.display = "none";
            marketplaceSidebar.after(vaultCountdownParent);

                let vaultCountdownText = document.createElement("div");
                vaultCountdownText.classList.add("col", "text-center", "active-market");
                vaultCountdownText.style.cssText = "font-weight: bold; font-size: 20px;";
                vaultCountdownText.innerText = "Vault opens in ";
                vaultCountdownParent.appendChild(vaultCountdownText);

                    let vaultCountdown = document.createElement("div");
                    vaultCountdown.style.cssText = "display: inline;";
                    vaultCountdownText.appendChild(vaultCountdown);

            let intervalID;
            intervalID = setInterval(function UpdateVaultTimer() {
                let millisecondsRemaining = Math.max(0, (VAULT_OPENS_AT - new Date().getTime()));
                if (millisecondsRemaining == 0) {
                    if (intervalID) {
                        marketplaceSidebar.parentElement.removeChild(vaultCountdownParent);
                        clearInterval(intervalID);
                    }

                    return UpdateVaultTimer;
                }

                let s = Math.floor(millisecondsRemaining/86400000) + ":" + (new Date(millisecondsRemaining).toISOString().substring(11, 19)); // https://stackoverflow.com/a/70781722
                vaultCountdown.innerText = s;
                vaultCountdownParent.style.display = "block";

                return UpdateVaultTimer;
            }(), 1000);
        });
    }

    // Allow for the possibility to disable Time on Site earnings
    // Time on Site earnings stop for the day after reaching the max, even if you later increase the max
    // So this is useful if you plan on swapping in the Time on Site artifact and want to get the full benefit
    (function ToggleTimeOnSite() {

        let tosToggleParent = document.createElement("div");
        tosToggleParent.style.cssText = "position: fixed; bottom: 50px; right: 20px; text-align: center; border: 1px solid";
        document.addEventListener("DOMContentLoaded", function() { document.body.appendChild(tosToggleParent); });

            let tosToggleEnabled = document.createElement("div");
            tosToggleEnabled.innerText = "Time on Site Enabled";
            tosToggleEnabled.style.cssText = "cursor: pointer; color: #fff; display: none; padding: 8px 16px 4px;";
            tosToggleEnabled.onclick = () => { UpdateTimeOnSiteToggle(true, true); };
            tosToggleParent.appendChild(tosToggleEnabled);

            let tosToggleDisabled = document.createElement("div");
            tosToggleDisabled.innerText = "Time on Site Disabled";
            tosToggleDisabled.style.cssText = "cursor: pointer; color: red; font-weight: bold; display: none; padding: 8px 16px 4px;";
            tosToggleDisabled.onclick = () => { UpdateTimeOnSiteToggle(false, true); };
            tosToggleParent.appendChild(tosToggleDisabled);

            // Once TOS has been blocked once, the page will need to be reloaded to re-enable it
            let tosWasBlocked = false;
            let tosToggleReload = document.createElement("div");
            tosToggleReload.innerText = "Reload page to enable TOS";
            tosToggleReload.style.cssText = "cursor: pointer; font-weight: bold; color: #fff; display: none; padding: 8px 16px 4px;";
            tosToggleReload.onclick = () => { UpdateTimeOnSiteToggle(true, true); };
            tosToggleParent.appendChild(tosToggleReload);

        function UpdateTimeOnSiteToggle(newState, saveSettings) {
            if (disableTOS == newState) {
                return;
            }

            saveSettings = saveSettings ?? false;
            if (saveSettings) {
                SetSetting(SETTING_DISABLE_TOS, newState)
            }

            disableTOS = newState;

            GM_webRequest([{ selector: '*/tos/track', action: { cancel: disableTOS }}], function() {
                tosWasBlocked = true;
                tosToggleParent.style.borderWidth = "2px";
            });

            tosToggleEnabled.style.display = "none";
            tosToggleDisabled.style.display = "none";
            tosToggleReload.style.display = "none";

            if (disableTOS) {
                tosToggleDisabled.style.display = "block";
                tosToggleParent.style.borderColor = "red";
            } else {
                tosToggleParent.style.borderColor = "white";
                if (tosWasBlocked) {
                    tosToggleReload.style.display = "block";
                } else {
                    tosToggleEnabled.style.display = "block";
                }
            }
        };

        let disableTOS;
        UpdateTimeOnSiteToggle(GetSetting(SETTING_DISABLE_TOS));

        setInterval(() => {
            UpdateTimeOnSiteToggle(GetSetting(SETTING_DISABLE_TOS));
        }, 1000);
    })();
})();
