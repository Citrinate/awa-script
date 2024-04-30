// ==UserScript==
// @name         AWA Script
// @namespace    https://github.com/Citrinate
// @version      1.0.0
// @description  Improves Alienware Arena somewhat
// @author       Citrinate
// @match        *://*.alienwarearena.com/member/*/artifacts
// @grant        none
// @homepageURL  https://github.com/Citrinate/awa-script
// @supportURL   https://github.com/Citrinate/awa-script/issues
// @downloadURL  https://github.com/Citrinate/awa-script/raw/main/code.user.js
// @updateURL    https://github.com/Citrinate/awa-script/raw/main/code.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Add countdown timer indicating when artifacts can we swapped out
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
        let interval_id = setInterval(() => {
            let milliseconds_remaining = Math.max(0, (artifact_replaceable_at - new Date().getTime()));
            if (milliseconds_remaining == 0) {
                slot.removeChild(slot_countdown);
                modal_slot.removeChild(modal_slot_countdown);
                modal_slot.classList.remove("disabled"); // enable the swap button
                clearInterval(interval_id);

                return;
            }

            let s = (new Date(milliseconds_remaining).toISOString().substring(11, 19)); // https://stackoverflow.com/a/70781722
            slot_countdown.innerHTML = `Replaceable in ${s}`;
            modal_slot_countdown.innerHTML = s;
        }, 1000);
    });
})();
