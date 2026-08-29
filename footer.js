/* =========================================================================
   共用頁尾渲染邏輯（footer.js）
   由 index.html / about.html / courses.html / activities.html 共同引入，
   確保全站頁尾的資料來源與渲染規則完全一致，只需維護這一份檔案。

   使用方式：頁面的 <footer> 內需包含以下元素（id 必須一致）：
     <p id="footerEmail">預設 Email 文字</p>
     <p id="footerAddress">預設地址文字</p>
     <div id="social-links-container" class="social-links-row"></div>

   排查提示：若發布後前台仍看不到圖示，請打開瀏覽器開發者工具的 Console，
   這支腳本會印出診斷訊息，可以直接定位問題出在哪一層
   （容器找不到／site-data.json 讀取失敗／socialLinks 是空陣列等）。
   ========================================================================= */
(function () {
  const LOG_PREFIX = "[footer.js]";

  /* -----------------------------------------------------------------------
     渲染頁尾社群連結
     容器與資料結構：
       <div id="social-links-container" class="social-links-row"></div>
     支援兩種 site-data.json 結構，優先讀取頂層 socialLinks，
     若沒有則退回讀取 footer.socialLinks（目前控制台使用的結構）。
     ----------------------------------------------------------------------- */
  function renderSocialLinks(data) {
    const container = document.getElementById("social-links-container");
    if (!container) {
      console.warn(LOG_PREFIX, "找不到 #social-links-container，請確認這個頁面的 <footer> 裡有這個容器元素。");
      return;
    }

    // 判斷 site-data.json 內的 key（支援 socialLinks 或 footer.socialLinks）
    const links = data.socialLinks || (data.footer && data.footer.socialLinks) || [];
    console.info(LOG_PREFIX, `讀到 ${links.length} 筆社群連結。`);

    // 清空原有內容
    container.innerHTML = "";

    if (!Array.isArray(links) || links.length === 0) {
      container.style.display = "none";
      return;
    }
    container.style.display = "";

    // 動態產生社群連結與圖示
    links.forEach(item => {
      if (!item || !item.url) return; // 沒有網址的項目直接跳過，不產生死連結

      const a = document.createElement("a");
      a.href = item.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "social-link-item";
      a.title = item.platform || "";

      // 若有圖示則顯示圖片，載入失敗或無圖示則顯示平台名稱
      if (item.icon) {
        const img = document.createElement("img");
        img.src = item.icon;
        img.alt = item.platform || "Social Link";
        img.loading = "lazy";
        img.onerror = function () {
          // 防錯機制：圖片載入失敗時轉為文字，避免頁尾出現破圖
          console.warn(LOG_PREFIX, "圖示載入失敗，已改用文字顯示：", img.src);
          this.replaceWith(item.platform || "Link");
        };
        a.appendChild(img);
      } else {
        a.textContent = item.platform || "Link";
      }

      container.appendChild(a);
    });
  }

  /* Email / 地址：若欄位為空字串，維持 HTML 中原本寫好的預設文字，不強制清空畫面 */
  function renderContactInfo(data) {
    if (!data.footer) return;
    const emailEl = document.getElementById("footerEmail");
    const addressEl = document.getElementById("footerAddress");
    if (emailEl && data.footer.email) emailEl.textContent = data.footer.email;
    if (addressEl && data.footer.address) addressEl.textContent = data.footer.address;
  }

  // 讀取 site-data.json 並渲染頁尾社群連結
  function loadFooterData() {
    // 加上時間戳查詢字串，避免瀏覽器或 GitHub Pages 邊緣快取吃到舊版 site-data.json
    fetch("site-data.json?t=" + Date.now(), { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        renderContactInfo(data);
        renderSocialLinks(data);
      })
      .catch(err => console.error(LOG_PREFIX, "載入 site-data.json 失敗:", err));
  }

  /* 確保無論 footer.js 是在 <head> 還是 <body> 結尾載入，
     都會在 DOM（含 #social-links-container）就緒後才執行 */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadFooterData);
  } else {
    loadFooterData();
  }
})();
