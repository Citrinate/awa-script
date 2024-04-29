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

    // Enable artifact swapping interface even when artifacts can't be swapped
    document.querySelectorAll(".modal-slot.disabled").forEach(x => x.classList.toggle("disabled"));

    // Add countdown timer indicating when artifacts can we swapped out
    let artifact_equip_times = Object.values(artifactsData.userActiveArtifacts).map(x => Date.parse(x.equippedAt.date + "UTC"));
    document.querySelectorAll(".artifact-block > .slots > .slot").forEach((slot, index) => {
        let artifact_replaceable_at = artifact_equip_times[index] + 86400000;
        let countdown_div = document.createElement("div");
        countdown_div.style.cssText = "text-align: center; margin-top: 16px;"
        slot.appendChild(countdown_div);

        setInterval(() => {
            let seconds_remaining = Math.ceil(Math.max(0, (artifact_replaceable_at - new Date().getTime()) / 1000));
            let s = (new Date(seconds_remaining * 1000).toISOString().substr(11, 8)); // https://stackoverflow.com/a/70781722

            if (seconds_remaining == 0) {
                countdown_div.innerHTML = "";
            } else {
                countdown_div.innerHTML = `Replaceable in ${s}`;
            }
        }, 1000);
    });
})();
