// ==UserScript==
// @name         AWA Script
// @namespace    https://github.com/Citrinate
// @version      1.0.0
// @description  Improves Alienware Arena somewhat
// @author       Citrinate
// @match        *://*.alienwarearena.com/*
// @match        *://ehc5ey5g9hoehi8ys54lr6eknomqgr.ext-twitch.tv/*
// @connect      raw.githubusercontent.com
// @connect      alienware.jkmartindale.dev
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_webRequest
// @grant        GM_xmlhttpRequest
// @homepageURL  https://github.com/Citrinate/awa-script
// @supportURL   https://github.com/Citrinate/awa-script/issues
// @downloadURL  https://github.com/Citrinate/awa-script/raw/main/code.user.js
// @updateURL    https://github.com/Citrinate/awa-script/raw/main/code.user.js
// @run-at       document-start
// ==/UserScript==

(function() {
	'use strict';

	//#region Settings
	const SETTING_DISABLE_TOS = "SETTING_DISABLE_TOS";

	var defaultSettings = {
		SETTING_DISABLE_TOS: false,
	};

	function GetSetting(name) {
		return GM_getValue(name, defaultSettings[name]);
	}

	function SetSetting(name, value) {
		GM_setValue(name, value);
	}
	//#endregion

	const PAGE_VAULT = 0;
	const PAGE_ARTIFACT = 1;
	const PAGE_TWITCH_EXT = 2;

	let currentPage = null;
	if (window.location.href.includes('/artifacts')) {
		currentPage = PAGE_ARTIFACT;
	} else if (window.location.href.includes('/game-vault')) {
		currentPage = PAGE_VAULT;
	} else if (window.location.href.includes('ehc5ey5g9hoehi8ys54lr6eknomqgr')) {
		currentPage = PAGE_TWITCH_EXT;
	}

	//#region Helper Functions
	let WaitForElm = function(selector) {
		// https://stackoverflow.com/a/61511955
		return new Promise(resolve => {
			if (document.querySelector(selector)) {
				return resolve(document.querySelector(selector));
			}

			const observer = new MutationObserver(mutations => {
				if (document.querySelector(selector)) {
					observer.disconnect();
					resolve(document.querySelector(selector));
				}
			});

			observer.observe(document.documentElement, {
				childList: true,
				subtree: true
			});
		});
	}

	let WaitForTrue = function(func){
		return new Promise(resolve => {
			let intervalID = setInterval(() => {
				if (func()) {
					clearInterval(intervalID);
					resolve();
				}
			}, 100);
		});
	}

	let GM_fetch = function(details) {
		return new Promise((resolve, reject) => {
			details.onload = function(response) { resolve(response); }
			details.onerror = function(error) { reject(error); }

			GM_xmlhttpRequest(details);
		});
	}
	//#endregion

	if (currentPage == PAGE_ARTIFACT) {
		//#region Artifact Countdown
		// Add countdown timer indicating when artifacts can we swapped out
		WaitForElm('.artifact-block').then(() => {

			document.querySelectorAll(".artifact-block > .slots > .slot").forEach((slot, index) => {
				let modalSlot = document.querySelectorAll(".modal-slot")[index];
				if (!modalSlot) {
					return;
				}

				//#region UI
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
				//#endregion

				let artifactData = artifactsData.userActiveArtifacts[index + 1];
				if (!artifactData) {
					return;
				}

				let artifactEquipTime = Date.parse(artifactData.equippedAt.date + "UTC");
				let artifactReplaceableAt = artifactEquipTime + 86400000;

				let intervalID;
				let UpdateArtifactTimer = function() {
					let millisecondsRemaining = Math.max(0, (artifactReplaceableAt - new Date().getTime()));
					if (millisecondsRemaining == 0) {
						if (intervalID) {
							slot.removeChild(slotCountdownParent);
							modalSlot.removeChild(modalSlotCountdown);
							modalSlot.classList.remove("disabled"); // enable the swap button
							clearInterval(intervalID);
						}

						return;
					}

					let s = (new Date(millisecondsRemaining).toISOString().substring(11, 19)); // https://stackoverflow.com/a/70781722
					slotCountdown.innerText = s;
					slotCountdownParent.style.display = "block";
					modalSlotCountdown.innerText = s;
				}

				UpdateArtifactTimer();
				intervalID = setInterval(UpdateArtifactTimer, 1000);
			});
		});
		//#endregion
	}

	if (currentPage == PAGE_VAULT) {
		//#region Vault Countdown
		// Add countdown timer indicating when the game vault will open
		GM_fetch({"url": "https://raw.githubusercontent.com/Citrinate/awa-script/main/vault_time.txt", method: 'GET'})
			.then(response => Date.parse(response.responseText))
			.then((vaultOpensAt) => WaitForElm('.marketplace-sidebar-text')
			.then((marketplaceSidebar) => {

			//#region UI
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
			//#endregion

			let intervalID;
			let UpdateVaultTimer = function() {
				let millisecondsRemaining = Math.max(0, (vaultOpensAt - new Date().getTime()));
				if (millisecondsRemaining == 0) {
					if (intervalID) {
						marketplaceSidebar.parentElement.removeChild(vaultCountdownParent);
						clearInterval(intervalID);
					}

					return;
				}

				let s = Math.floor(millisecondsRemaining/86400000) + ":" + (new Date(millisecondsRemaining).toISOString().substring(11, 19)); // https://stackoverflow.com/a/70781722
				vaultCountdown.innerText = s;
				vaultCountdownParent.style.display = "block";
			}

			UpdateVaultTimer();
			intervalID = setInterval(UpdateVaultTimer, 1000);
		})).catch((err) => {
			console.log(err);
		});
		//#endregion
	}

	if (currentPage == PAGE_TWITCH_EXT) {
		//#region Twitch Fix
		// Provide easy access to jkmartindale's Twitch Quest Fixer
		WaitForTrue(() => typeof authToken != "undefined" && typeof clientId != "undefined" && typeof pollDuration != "undefined").then(() => {

			//#region UI
			let twitchFixButton = document.createElement("div");
			twitchFixButton.style.cssText = "color: #fff; cursor: pointer; margin: 8px 16px; padding: 8px 16px; display: inline-block; border: 1px solid white; box-shadow: 2px 2px 0px white;";
			twitchFixButton.innerText = "Enable Twitch Quest Fixer";
			document.body.appendChild(twitchFixButton);

			let twitchFixEnabled = document.createElement("div");
			twitchFixEnabled.style.cssText = "color: lime; display: none; margin: 8px 16px; padding: 8px 16px; border: 1px solid lime; box-shadow: 2px 2px 0px lime;";
			twitchFixEnabled.innerText = "Twitch Quest Fixer Enabled";
			document.body.appendChild(twitchFixEnabled);
			//#endregion

			let TwitchFix = function() {
				// https://github.com/jkmartindale/alienware-arena-fix
				/* Twitch Quest Fixer v3.1 */

				[...document.getElementsByClassName("state")].forEach((el) => {
					el.id = `fix_${el.id}`;
					el.classList.add("fix_state");
					el.classList.remove("state");
				});

				let handlePolling = () => {
					GM_fetch({
						url: "https://alienware.jkmartindale.dev/?url=https://www.alienwarearena.com/twitch/extensions/track",
						method: 'GET',
						responseType: "json",
						headers: {
							'x-extension-jwt': authToken,
							'x-extension-channel': channelId
						}
					})
					.then(response => response.response)
					.then(data => {

						console.log(data);

						[...document.getElementsByClassName("fix_state")].forEach((el) => {
							el.classList.add('hidden');
						})

						if (data.success) {
							document.getElementById('fix_logged_out').classList.add('hidden');
						}

						document.getElementById(`fix_${data.state}`).classList.remove('hidden');
					})
					.catch((err) => {
						console.log(err);
					})
					.finally(() => {
						setTimeout(handlePolling, pollDuration);
					});
				};
				handlePolling()
			}

			twitchFixButton.onclick = () => { 
				twitchFixButton.style.display = "none"; 
				twitchFixEnabled.style.display = "inline-block"; 
				TwitchFix(); 
			};
		});
		//#endregion
	}

	//#region Time on Site Toggle
	// Allow for the possibility to disable Time on Site earnings
	// Time on Site earnings stop for the day after reaching the max, even if you later increase the max
	// So this is useful if you plan on swapping in the Time on Site artifact and want to get the full benefit
	if (currentPage != PAGE_TWITCH_EXT && typeof GM_webRequest == "function") {

		//#region UI
		let tosToggleParent = document.createElement("div");
		tosToggleParent.style.cssText = "position: fixed; bottom: 50px; right: 20px; text-align: center; border: 1px solid";
		document.addEventListener("DOMContentLoaded", function() { document.body.appendChild(tosToggleParent); });

		let tosToggleEnabled = document.createElement("div");
		tosToggleEnabled.innerText = "Time on Site Enabled";
		tosToggleEnabled.style.cssText = "cursor: pointer; color: #fff; display: none; padding: 8px 16px 4px; box-shadow: 2px 2px 0px white;";
		tosToggleParent.appendChild(tosToggleEnabled);

		let tosToggleDisabled = document.createElement("div");
		tosToggleDisabled.innerText = "Time on Site Disabled";
		tosToggleDisabled.style.cssText = "cursor: pointer; color: red; font-weight: bold; display: none; padding: 8px 16px 4px; box-shadow: 2px 2px 0px red;";
		tosToggleParent.appendChild(tosToggleDisabled);

		let tosToggleReload = document.createElement("div");
		tosToggleReload.innerText = "Reload page to enable TOS";
		tosToggleReload.style.cssText = "cursor: pointer; font-weight: bold; color: #fff; display: none; padding: 8px 16px 4px; box-shadow: 2px 2px 0px white;";
		tosToggleParent.appendChild(tosToggleReload);
		//#endregion

		let UpdateTimeOnSiteToggle = function(newState, saveSettings) {
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

		tosToggleEnabled.onclick = () => UpdateTimeOnSiteToggle(true, true);
		tosToggleReload.onclick = () => UpdateTimeOnSiteToggle(true, true);
		tosToggleDisabled.onclick = () => UpdateTimeOnSiteToggle(false, true);

		let tosWasBlocked = false; // Once TOS has been blocked once, the page will need to be reloaded to re-enable it

		let disableTOS;
		UpdateTimeOnSiteToggle(GetSetting(SETTING_DISABLE_TOS));

		setInterval(() => {
			UpdateTimeOnSiteToggle(GetSetting(SETTING_DISABLE_TOS));
		}, 1000);
	}
	//#endregion
})();
