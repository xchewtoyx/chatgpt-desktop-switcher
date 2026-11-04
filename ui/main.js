// Japanese remains the fallback shown before the script loads. Select English for
// non-Japanese system languages; other translations can be added here.
const translations = {
  "ログイン状態をプロファイルごとに分けて、ChatGPTを同時に起動します。": "Run ChatGPT profiles at the same time, each with its own sign-in.",
  "プロファイルを追加": "Add a profile",
  "初回起動後、そのウインドウで利用するアカウントにログインしてください。": "After the first launch, sign in to the account you want to use in that window.",
  "プロファイル名": "Profile name",
  "例：work": "e.g. work",
  "追加": "Add",
  "プロファイル": "Profiles",
  "更新": "Refresh",
  "操作を完了できませんでした": "The operation could not be completed.",
  "既存のChatGPT環境": "Existing ChatGPT environment",
  "分離プロファイル": "Isolated profile",
  "起動中": "Running",
  "停止中": "Stopped",
  "前面に表示": "Show window",
  "起動": "Launch",
  "終了": "Stop",
  "読み込み中...": "Loading...",
  "プロファイルを読み込めませんでした。": "Could not load profiles.",
  "プロファイルを追加しました": "Profile added.",
  "ホームディレクトリを取得できませんでした": "Could not find the home directory.",
  "プロファイル名を入力してください": "Enter a profile name.",
  "default は既存環境用の予約名です": "The name default is reserved for the existing environment.",
  "プロファイル名は40文字以内にしてください": "Profile names must be 40 characters or fewer.",
  "プロファイル名に使用できない文字が含まれています": "The profile name contains invalid characters.",
  "同じ名前のプロファイルがすでにあります": "A profile with this name already exists.",
  "/Applications/ChatGPT.app が見つかりません": "Could not find /Applications/ChatGPT.app.",
  "プロファイルが見つかりません": "Profile not found.",
  "ChatGPT.appを起動できませんでした": "Could not launch ChatGPT.app.",
  "ChatGPT.appを終了できませんでした": "Could not stop ChatGPT.app.",
  "実行中のChatGPT.appが見つかりません": "Could not find the running ChatGPT.app.",
  "実行中のChatGPT.appを確認できませんでした": "Could not check running ChatGPT.app instances."
};
const isJapanese = (navigator.language || "").toLowerCase().startsWith("ja");
const t = (text) => isJapanese ? text : (translations[text] || text);
document.documentElement.lang = isJapanese ? "ja" : "en";
document.querySelectorAll("[data-i18n]").forEach((element) => {
  element.textContent = t(element.dataset.i18n);
});
document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
  element.placeholder = t(element.dataset.i18nPlaceholder);
});

const { invoke } = window.__TAURI__.core;

const list = document.querySelector("#profile-list");
const form = document.querySelector("#create-form");
const input = document.querySelector("#profile-name");
const refreshButton = document.querySelector("#refresh-button");
const message = document.querySelector("#message");

let messageTimer;
let busy = false;
let renderedProfilesSignature = null;

function showMessage(text, isError = false) {
  window.clearTimeout(messageTimer);
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.hidden = false;
  messageTimer = window.setTimeout(() => {
    message.hidden = true;
  }, 4200);
}

function errorText(error) {
  return typeof error === "string" ? t(error) : t("操作を完了できませんでした");
}

function createButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function profileSignature(profiles) {
  return JSON.stringify(profiles);
}

function renderProfiles(profiles, { animate = true } = {}) {
  renderedProfilesSignature = profileSignature(profiles);
  list.replaceChildren();
  profiles.forEach((profile, index) => {
    const row = document.createElement("article");
    row.className = "profile-row";
    if (animate) {
      row.style.animationDelay = `${index * 28}ms`;
    } else {
      row.style.animation = "none";
    }

    const identity = document.createElement("div");
    identity.className = "profile-identity";
    const name = document.createElement("p");
    name.className = "profile-name";
    name.textContent = profile.name;
    const kind = document.createElement("p");
    kind.className = "profile-kind";
    kind.textContent = profile.isDefault ? t("既存のChatGPT環境") : t("分離プロファイル");
    identity.append(name, kind);

    const status = document.createElement("span");
    status.className = `status${profile.running ? " running" : ""}`;
    status.textContent = profile.running ? t("起動中") : t("停止中");

    const actions = document.createElement("div");
    actions.className = "actions";
    const launchLabel = profile.running ? t("前面に表示") : t("起動");
    actions.append(
      createButton(launchLabel, "action", () => runProfileAction("launch_profile", profile.name)),
    );
    if (profile.running) {
      actions.append(
        createButton(t("終了"), "action stop", () => runProfileAction("stop_profile", profile.name)),
      );
    }
    row.append(identity, status, actions);
    list.append(row);
  });
}

async function loadProfiles({ quiet = false } = {}) {
  if (busy) return;
  if (!quiet && renderedProfilesSignature === null) {
    list.innerHTML = `<p class="loading">${t("読み込み中...")}</p>`;
  }
  try {
    const profiles = await invoke("list_profiles");
    const nextSignature = profileSignature(profiles);
    if (nextSignature !== renderedProfilesSignature) {
      renderProfiles(profiles, { animate: renderedProfilesSignature === null });
    }
  } catch (error) {
    renderedProfilesSignature = null;
    list.innerHTML = `<p class="empty">${t("プロファイルを読み込めませんでした。")}</p>`;
    showMessage(errorText(error), true);
  }
}

async function runProfileAction(command, name) {
  if (busy) return;
  busy = true;
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  try {
    await invoke(command, { name });
    window.setTimeout(() => loadProfiles({ quiet: true }), command === "launch_profile" ? 1300 : 500);
  } catch (error) {
    showMessage(errorText(error), true);
  } finally {
    busy = false;
    document.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const submit = form.querySelector("button");
  submit.disabled = true;
  try {
    const profiles = await invoke("create_profile", { name: input.value });
    input.value = "";
    renderProfiles(profiles);
    showMessage(t("プロファイルを追加しました"));
  } catch (error) {
    showMessage(errorText(error), true);
  } finally {
    busy = false;
    submit.disabled = false;
    input.focus();
  }
});

refreshButton.addEventListener("click", () => loadProfiles());
window.setInterval(() => loadProfiles({ quiet: true }), 4000);
loadProfiles();
