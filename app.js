(function () {
  "use strict";

  var CHAPTERS = {
    1: "医薬品に共通する特性と基本的な知識",
    2: "人体の構造と薬の働き",
    3: "主な医薬品とその作用",
    4: "薬事関係法規・制度",
    5: "医薬品の適正使用・安全対策"
  };
  var STORE_KEY = "touhan-kakomon-v1";
  var CTA_URL = "https://touhanwork.com/lp/mikeiken/?utm_source=kakomon&utm_medium=app";
  var SOURCE_URL = "https://www.kouiki-kansai.jp/koikirengo/jisijimu/shikakumenkyo/touroku/7607.html";
  var SOURCE_URL_HT = "https://www.pref.hokkaido.lg.jp/hf/iyk/iry/yakuji/tourokuhannbaishashikenmondai.html";

  var QUESTIONS = (window.QUESTIONS || []).slice();
  var app = document.getElementById("app");

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* ストレージが使えない環境では記録しない */ }
  }
  var progress = load();

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") el.className = attrs[k];
      else if (k === "onclick") el.addEventListener("click", attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
    [].concat(children == null ? [] : children).forEach(function (c) {
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }
  function render(nodes) {
    app.replaceChildren.apply(app, [].concat(nodes));
    window.scrollTo(0, 0);
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

  function chapterStats(ch) {
    var qs = QUESTIONS.filter(function (q) { return q.chapter === ch; });
    var done = 0, right = 0;
    qs.forEach(function (q) {
      var p = progress[q.id];
      if (p) { done++; if (p.last) right++; }
    });
    return { total: qs.length, done: done, right: right };
  }
  function weakQuestions() {
    return QUESTIONS.filter(function (q) { return progress[q.id] && !progress[q.id].last; });
  }

  function footer() {
    return h("div", { "class": "footer" }, [
      h("p", null, "問題の出典：関西広域連合の登録販売者試験問題（令和4〜8年度）、北海道の登録販売者試験問題（北海道・東北ブロック、令和8年度。CC BY 4.0）を加工して作成。"),
      h("a", { href: SOURCE_URL, target: "_blank", rel: "noopener" }, "出典：関西広域連合ホームページ"),
      h("br"),
      h("a", { href: SOURCE_URL_HT, target: "_blank", rel: "noopener" }, "出典：北海道ホームページ「登録販売者試験問題について」"),
      h("p", null, "解説は登販ワークが作成したものです。本アプリは関西広域連合・北海道とは関係ありません。法令・制度は改正されることがあります。受験する試験の最新情報は、各都道府県の公式発表や厚生労働省の資料でご確認ください。学習の成果や合格を保証するものではありません。")
    ]);
  }

  function ctaCard() {
    return h("div", { "class": "card cta" }, [
      h("strong", null, "合格後のお仕事探しは、登販ワークへ"),
      h("p", { "class": "sub" }, "合格したばかりで実務経験がない方（研修中）の働き方や、求人紹介のご相談を無料で受け付けています。"),
      h("a", { "class": "btn center", href: CTA_URL, target: "_blank", rel: "noopener" }, "合格後の働き方を見る")
    ]);
  }

  function home() {
    var nodes = [
      h("h1", null, "登録販売者 過去問トレーニング"),
      h("p", { "class": "sub" }, "関西広域連合（令和4〜8年度）と北海道・東北ブロック（令和8年度）の過去問から、章ごとに解いて解説で確認できます。登録は不要です。")
    ];
    var all = { done: 0, total: QUESTIONS.length, right: 0 };
    Object.keys(CHAPTERS).forEach(function (k) {
      var s = chapterStats(+k); all.done += s.done; all.right += s.right;
    });
    nodes.push(h("div", { "class": "card" }, [
      h("div", { "class": "stat" }, [h("span", null, "解いた問題"), h("b", null, all.done + " / " + all.total)]),
      h("div", { "class": "stat" }, [h("span", null, "直近の正答率"), h("b", null, all.done ? pct(all.right, all.done) + "%" : "-")])
    ]));

    nodes.push(h("h2", null, "章ごとに解く"));
    Object.keys(CHAPTERS).forEach(function (k) {
      var ch = +k, s = chapterStats(ch);
      if (!s.total) return;
      nodes.push(h("button", { "class": "btn", onclick: function () { startQuiz("第" + ch + "章 " + CHAPTERS[ch], QUESTIONS.filter(function (q) { return q.chapter === ch; })); } }, [
        "第" + ch + "章 " + CHAPTERS[ch],
        h("small", null, s.total + "問 ／ 解答済み " + s.done + "問 ／ 正答 " + s.right + "問")
      ]));
    });

    nodes.push(h("h2", null, "まとめて解く"));
    nodes.push(h("button", { "class": "btn", onclick: function () { startQuiz("全章ランダム10問", shuffle(QUESTIONS).slice(0, 10)); } }, ["全章ランダム10問", h("small", null, "力試しに")]));
    var weak = weakQuestions();
    nodes.push(h("button", { "class": "btn", onclick: function () {
      if (!weak.length) { alert("復習する問題はまだありません。"); return; }
      startQuiz("間違えた問題の復習", shuffle(weak));
    } }, ["間違えた問題の復習", h("small", null, weak.length + "問")]));

    nodes.push(ctaCard());
    nodes.push(h("button", { "class": "btn center", onclick: function () {
      if (confirm("学習記録をすべて消去します。よろしいですか？")) { progress = {}; save(progress); home(); }
    } }, "学習記録をリセット"));
    nodes.push(footer());
    render(nodes);
  }

  function startQuiz(title, list) {
    if (!list.length) { alert("問題がありません。"); return; }
    var state = { title: title, list: list, i: 0, right: 0 };
    question(state);
  }

  function question(state) {
    var q = state.list[state.i];
    var answered = false;
    var nodes = [
      h("div", { "class": "sub" }, state.title + "　" + (state.i + 1) + " / " + state.list.length),
      h("div", { "class": "bar" }, h("i", { style: "width:" + pct(state.i, state.list.length) + "%" })),
      h("div", { "class": "card" }, [
        h("div", { "class": "sub" }, "第" + q.chapter + "章　" + q.source.replace("関西広域連合 ", "関西 ").replace("北海道・東北ブロック ", "北海道・東北 ").replace(" 登録販売者試験", "") + " 問" + q.no),
        h("p", { "class": "stem" }, q.stem)
      ].concat((q.statements || []).map(function (s) {
        return h("div", { "class": "stmt" }, s.label + "　" + s.text);
      })))
    ];

    var optBox = h("div", null);
    var feedback = h("div", null);
    q.options.forEach(function (o) {
      var btn = h("button", { "class": "opt", type: "button", "data-n": String(o.n) }, [h("b", null, String(o.n)), h("span", null, o.text)]);
      btn.addEventListener("click", function () {
        if (answered) return;
        answered = true;
        var ok = o.n === q.answer;
        if (ok) state.right++;
        progress[q.id] = { last: ok, at: Date.now() };
        save(progress);
        [].forEach.call(optBox.children, function (b) {
          b.disabled = true;
          var n = +b.getAttribute("data-n");
          if (n === q.answer) b.classList.add("ok");
          else if (n === o.n) b.classList.add("ng");
        });
        var last = state.i === state.list.length - 1;
        feedback.replaceChildren(
          h("div", { "class": "result " + (ok ? "ok" : "ng") }, ok ? "正解です" : "不正解（正解は " + q.answer + "）"),
          h("div", { "class": "card" }, [
            h("div", null, (q.tags || []).map(function (t) { return h("span", { "class": "tag" }, t); })),
            h("p", { "class": "expl" }, q.explanation)
          ]),
          h("button", { "class": "btn primary", onclick: function () {
            if (last) summary(state); else { state.i++; question(state); }
          } }, last ? "結果を見る" : "次の問題へ")
        );
        feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      optBox.appendChild(btn);
    });
    nodes.push(optBox, feedback);
    nodes.push(h("button", { "class": "btn center", onclick: home }, "ホームに戻る"));
    render(nodes);
  }

  function summary(state) {
    var rate = pct(state.right, state.list.length);
    render([
      h("h1", null, "結果"),
      h("div", { "class": "card" }, [
        h("div", { "class": "stat" }, [h("span", null, state.title), h("b", null, state.right + " / " + state.list.length + "問正解")]),
        h("div", { "class": "stat" }, [h("span", null, "正答率"), h("b", null, rate + "%")])
      ]),
      h("button", { "class": "btn primary", onclick: function () { startQuiz(state.title, shuffle(state.list)); } }, "もう一度解く"),
      h("button", { "class": "btn center", onclick: home }, "ホームに戻る"),
      ctaCard(),
      footer()
    ]);
  }

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  // ホーム画面への追加（PWAインストール）の計測。GoatCounter導入後に有効化される（未導入時は何もしない）。
  function trackInstallEvent(name) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: name, event: true });
      }
    } catch (e) { /* 解析スクリプト未導入でも動作に影響させない */ }
  }
  window.addEventListener("appinstalled", function () { trackInstallEvent("pwa-installed"); });
  try {
    var isStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    var seenKey = "touhan-kakomon-standalone-seen";
    if (isStandalone && !localStorage.getItem(seenKey)) {
      localStorage.setItem(seenKey, "1");
      trackInstallEvent("pwa-first-standalone-launch");
    }
  } catch (e) {}

  if (!QUESTIONS.length) {
    render([h("h1", null, "登録販売者 過去問トレーニング"), h("p", { "class": "sub" }, "問題データがありません。data.js を確認してください。")]);
  } else {
    home();
  }
})();
